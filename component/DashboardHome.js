import { useState, useEffect, useCallback } from "react";
import { Card, Col, Row, Typography, Skeleton } from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const [response, hotelsResponse, hotelByIdResponse] = await Promise.all([
        coreAxios.get("/bookings"),
        // Use the real hotel source that includes roomCategories/roomNumbers.
        // (Backend route: GET /hotel)
        coreAxios.get(`/hotel?page=1&limit=200`).catch(() => null),
        // Fallback: in case the /hotel list doesn't include the current hotel in its first page.
        userHotelID
          ? coreAxios.get(`/hotels/${userHotelID}`).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (response.status === 200) {
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(userHotelID)
          );
        }

        // Filter out cancelled bookings (statusID 255)
        bookingsData = bookingsData.filter((booking) => booking.statusID !== 255);

        setBookings(bookingsData);
      }

      // Compute room capacity from the real hotel data (used for occupancy rate)
      const hotelsList =
        hotelsResponse?.data?.data?.hotels ||
        hotelsResponse?.data?.hotels ||
        [];

      const hotel =
        hotelsList.find((h) => Number(h?.hotelID) === userHotelID) ||
        hotelsList.find((h) => String(h?._id) === String(userHotelID)) ||
        hotelByIdResponse?.data?.data ||
        null;

      const categories = hotel?.roomCategories || hotel?.categories || [];
      const fallbackCount = Array.isArray(categories)
        ? categories.reduce((sum, c) => {
            const roomNumbers = Array.isArray(c?.roomNumbers)
              ? c.roomNumbers
              : Array.isArray(c?.rooms)
                ? c.rooms
                : [];
            return sum + roomNumbers.length;
          }, 0)
        : 0;

      // Prefer backend-provided totalRooms when available.
      const totalRoomsFromHotel = Number(hotel?.totalRooms) || 0;

      // Unique room count (prevents wrong occupancy when API duplicates/overlaps)
      const uniqueRoomIds = new Set();
      if (Array.isArray(categories)) {
        categories.forEach((c) => {
          const roomNumbers = Array.isArray(c?.roomNumbers)
            ? c.roomNumbers
            : Array.isArray(c?.rooms)
              ? c.rooms
              : [];
          (roomNumbers || []).forEach((r) => {
            const id =
              r?._id ??
              r?.roomId ??
              r?.id ??
              r?.name ??
              r?.roomNumberID ??
              r?.roomNumber ??
              null;
            if (id !== null && id !== undefined && String(id).trim() !== "") {
              uniqueRoomIds.add(String(id));
            }
          });
        });
      }

      const finalRoomsCount =
        totalRoomsFromHotel ||
        (uniqueRoomIds.size > 0 ? uniqueRoomIds.size : fallbackCount);

      setTotalRooms(finalRoomsCount);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
      setTotalRooms(0);
    } finally {
      setLoading(false);
    }
  }, [hotelID]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Calculate dashboard statistics
  const calculateStats = () => {
    if (!bookings || bookings.length === 0) {
      return {
        todayBookingAmount: 0,
        currentMonthBookingAmount: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
        todayOccupancyRate: 0,
        todayOccupiedRoomsCount: 0,
        todayOccupiedRoomNames: [],
        tomorrowOccupancyRate: 0,
        tomorrowOccupiedRoomsCount: 0,
        tomorrowOccupiedRoomNames: [],
        currentMonthOccupancyRate: 0,
      };
    }

    const today = dayjs().tz("Asia/Dhaka");
    const todayStart = today.startOf("day");
    const todayEnd = today.endOf("day");
    const monthStart = today.startOf("month");
    const monthEnd = today.endOf("month");

    let todayBookingAmount = 0;
    let currentMonthBookingAmount = 0;
    let todayCheckIns = 0;
    let todayCheckOuts = 0;
    let todayActiveRoomsCount = 0;
    const todayActiveRoomsSet = new Set();
    const todayActiveRoomNamesSet = new Set();

    const daysCount = monthEnd.diff(monthStart, "day") + 1;
    const monthActiveRoomsSets =
      daysCount > 0
        ? Array.from({ length: daysCount }, () => new Set())
        : [];

    const tomorrowStart = todayStart.add(1, "day");
    const tomorrowActiveRoomsSet = new Set();
    const tomorrowActiveRoomNamesSet = new Set();

    bookings.forEach((booking) => {
      const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
      const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
      if (!checkInDate.isValid() || !checkOutDate.isValid()) return;
      const totalBill = parseFloat(booking.totalBill) || 0;
      const roomKey =
        booking.roomNumberID ||
        booking.roomNumberId ||
        booking.roomNumberName ||
        booking.roomNumber ||
        "";
      const roomNameKey = booking.roomNumberName || booking.roomNumber || "";

      // Today's Booking Amount (bookings with check-in date today)
      if (checkInDate.isSame(todayStart, "day")) {
        todayBookingAmount += totalBill;
        todayCheckIns++;
      }

      // Current Month Booking Amount (bookings with check-in date in current month)
      if (checkInDate.isSameOrAfter(monthStart, "day") && 
          checkInDate.isSameOrBefore(monthEnd, "day")) {
        currentMonthBookingAmount += totalBill;
      }

      // Today's Check-outs
      if (checkOutDate.isSame(todayStart, "day")) {
        todayCheckOuts++;
      }

      // Today's Occupancy (exclusive checkout):
      // room active on "day" if check-in <= day AND check-out > day
      const isActiveToday =
        checkInDate.startOf("day").isSameOrBefore(todayStart, "day") &&
        checkOutDate.startOf("day").isAfter(todayStart, "day");
      if (isActiveToday && roomKey) {
        todayActiveRoomsSet.add(String(roomKey));
        if (roomNameKey) todayActiveRoomNamesSet.add(String(roomNameKey));
      }

      // Used for month occupancy: count active rooms per day (exclusive checkout)
      const isActiveInMonth =
        checkInDate.startOf("day").isSameOrBefore(monthEnd, "day") &&
        checkOutDate.startOf("day").isAfter(monthStart, "day");
      if (!isActiveInMonth) return;
      if (!roomKey) return;

      // Tomorrow occupancy (exclusive checkout)
      const isActiveTomorrow =
        checkInDate.startOf("day").isSameOrBefore(tomorrowStart, "day") &&
        checkOutDate.startOf("day").isAfter(tomorrowStart, "day");
      if (isActiveTomorrow) {
        tomorrowActiveRoomsSet.add(String(roomKey));
        if (roomNameKey) tomorrowActiveRoomNamesSet.add(String(roomNameKey));
      }

      const startIndex = Math.max(
        0,
        checkInDate.startOf("day").diff(monthStart, "day")
      );
      // End at checkoutDayIndex - 1 (room not active on checkout date)
      const endIndex = Math.min(
        daysCount - 1,
        checkOutDate.startOf("day").diff(monthStart, "day") - 1
      );
      for (let i = startIndex; i <= endIndex; i++) {
        monthActiveRoomsSets[i].add(String(roomKey));
      }
    });

    const maxRooms = Number(totalRooms) || 0;
    todayActiveRoomsCount = todayActiveRoomsSet.size;
    const todayOccupiedRoomsCount = todayActiveRoomsCount;
    const todayOccupiedRoomNames = [...todayActiveRoomNamesSet];
    const tomorrowOccupiedRoomsCount = tomorrowActiveRoomsSet.size;
    const tomorrowOccupiedRoomNames = [...tomorrowActiveRoomNamesSet];
    const todayOccupancyRate =
      maxRooms > 0
        ? Math.min(100, Math.round((todayActiveRoomsCount / maxRooms) * 100))
        : 0;

    // Current Month Occupancy (average daily occupancy across the whole month)
    let sumActiveRoomsByDay = 0;
    if (maxRooms > 0 && daysCount > 0 && monthActiveRoomsSets.length > 0) {
      for (let i = 0; i < daysCount; i++) {
        sumActiveRoomsByDay += monthActiveRoomsSets[i]?.size || 0;
      }
    }
    const currentMonthOccupancyRate =
      maxRooms > 0 && daysCount > 0
        ? Math.min(
            100,
            Math.round(
              (sumActiveRoomsByDay / (maxRooms * daysCount)) * 100
            )
          )
        : 0;

    const tomorrowOccupancyRate =
      maxRooms > 0
        ? Math.min(
            100,
            Math.round((tomorrowOccupiedRoomsCount / maxRooms) * 100)
          )
        : 0;

    return {
      todayBookingAmount,
      currentMonthBookingAmount,
      todayCheckIns,
      todayCheckOuts,
      todayOccupancyRate,
      todayOccupiedRoomsCount,
      todayOccupiedRoomNames,
      tomorrowOccupancyRate,
      tomorrowOccupiedRoomsCount,
      tomorrowOccupiedRoomNames,
      currentMonthOccupancyRate,
    };
  };

  const statsData = calculateStats();
  const currentMonthName = dayjs().format("MMMM");

  const stats = [
    {
      label: "Today's Booking Amount",
      value: statsData.todayBookingAmount,
      isCurrency: true,
      icon: DollarOutlined,
      color: "#b45309",
      bgColor: "#fffbeb",
      gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    },
    {
      label: `Current Month (${currentMonthName}) Booking Amount`,
      value: statsData.currentMonthBookingAmount,
      isCurrency: true,
      icon: DollarOutlined,
      color: "#92400e",
      bgColor: "#fef3c7",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    {
      label: "Today's Check-ins",
      value: statsData.todayCheckIns,
      isCurrency: false,
      icon: UserOutlined,
      color: "#b45309",
      bgColor: "#fffbeb",
      gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    },
    {
      label: "Today's Check-outs",
      value: statsData.todayCheckOuts,
      isCurrency: false,
      icon: CalendarOutlined,
      color: "#92400e",
      bgColor: "#fef3c7",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    {
      label: `Today's Occupancy Rate (${statsData.todayOccupiedRoomsCount}/${totalRooms} rooms)`,
      value: statsData.todayOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      color: "#b45309",
      bgColor: "#fffbeb",
      gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      footnote:
        statsData.todayOccupiedRoomNames?.length
          ? `Rooms: ${statsData.todayOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${statsData.todayOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied today",
    },
    {
      label: "Current Month Occupancy Rate",
      value: statsData.currentMonthOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      color: "#92400e",
      bgColor: "#fef3c7",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    },
    {
      label: `Tomorrow Occupancy Rate (${statsData.tomorrowOccupiedRoomsCount}/${totalRooms} rooms)`,
      value: statsData.tomorrowOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      color: "#92400e",
      bgColor: "#fef3c7",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      footnote:
        statsData.tomorrowOccupiedRoomNames?.length
          ? `Rooms: ${statsData.tomorrowOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${statsData.tomorrowOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied tomorrow",
    },
  ];

  const StatCard = ({ label, value, isCurrency, isPercentage, icon: Icon, color, bgColor, gradient, footnote }) => (
    <Card
      hoverable
      bordered={false}
      className="stat-card"
      style={{
        borderRadius: "16px",
        background: "#ffffff",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid #F3F4F6",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
      bodyStyle={{ padding: "20px" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Text
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3"
            style={{ letterSpacing: "0.05em" }}
          >
            {label}
          </Text>
          <Title
            level={3}
            className="m-0"
            style={{
              fontSize: "28px",
              fontWeight: 700,
              background: gradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: "1.2",
            }}
          >
            {isCurrency ? `৳${value.toLocaleString()}` : isPercentage ? `${value}%` : value.toLocaleString()}
          </Title>
          {footnote ? (
            <Text className="text-[11px] text-gray-500 mt-1 block">
              {footnote}
            </Text>
          ) : null}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{
            background: gradient,
            boxShadow: `0 4px 14px 0 ${color}40`,
          }}
        >
          <Icon style={{ fontSize: "24px", color: "#ffffff" }} />
        </div>
      </div>
    </Card>
  );


  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #F9FAFB, #FFFFFF)", padding: "16px" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Title
            level={1}
            className="m-0 mb-2"
            style={{
              fontSize: "32px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Hotel Dashboard
          </Title>
          <Text className="text-gray-500 text-base">
            Monitor your hotel's performance and bookings in real-time
          </Text>
        </div>

        {/* Stats Grid */}
        <div>
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Col xs={24} sm={12} lg={8} key={item}>
                  <Card style={{ borderRadius: "16px" }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {stats.map((stat, idx) => (
                <Col xs={24} sm={12} lg={8} key={idx}>
                  <StatCard {...stat} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>

      <style>{`
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;