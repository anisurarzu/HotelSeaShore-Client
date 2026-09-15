import { useState, useEffect, useCallback } from "react";
import { Card, Col, Row, Skeleton } from "antd";
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
import "./DashboardHome.css";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function resolveDashboardHotelId(urlHotelID, userInfo) {
  const fromUrl =
    urlHotelID != null && String(urlHotelID).trim() !== ""
      ? Number(urlHotelID)
      : NaN;
  if (Number.isFinite(fromUrl) && fromUrl > 0) return fromUrl;
  const fromUser = Number(userInfo?.hotelID ?? userInfo?.hotelId);
  if (Number.isFinite(fromUser) && fromUser > 0) return fromUser;
  return null;
}

function getBookingRoomKey(booking) {
  if (!booking) return null;
  const candidates = [
    booking.roomNumberID,
    booking.roomNumberId,
    booking.roomID,
    booking.roomId,
    booking.roomNumberName,
    booking.roomNumber,
  ];
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s !== "") return s;
  }
  return null;
}

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = resolveDashboardHotelId(hotelID, userInfo);

      const [response, hotelsResponse, hotelByIdResponse, usersResponse] = await Promise.all([
        coreAxios.get("/bookings"),
        // Use the real hotel source that includes roomCategories/roomNumbers.
        // (Backend route: GET /hotel)
        coreAxios.get(`/hotel?page=1&limit=200`).catch(() => null),
        // Fallback: in case the /hotel list doesn't include the current hotel in its first page.
        userHotelID != null
          ? coreAxios.get(`/hotels/${userHotelID}`).catch(() => null)
          : Promise.resolve(null),
        coreAxios.get("/users").catch(() => null),
      ]);

      let bookingsData = [];
      if (response.status === 200) {
        bookingsData = Array.isArray(response.data) ? response.data : [];

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID != null) {
          bookingsData = bookingsData.filter(
            (booking) =>
              booking && Number(booking.hotelID) === userHotelID
          );
        }

        // Filter out cancelled bookings (statusID 255)
        bookingsData = bookingsData.filter((booking) => booking.statusID !== 255);

        setBookings(bookingsData);
      }

      if (usersResponse?.status === 200) {
        const usersPayload =
          usersResponse?.data?.users ||
          usersResponse?.data?.data?.users ||
          usersResponse?.data ||
          [];
        setUsers(Array.isArray(usersPayload) ? usersPayload : []);
      } else {
        setUsers([]);
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

      const distinctRoomsFromBookings = new Set();
      bookingsData.forEach((b) => {
        const rk = getBookingRoomKey(b);
        if (rk) distinctRoomsFromBookings.add(rk);
      });

      const totalRoomsSafe =
        Number.isFinite(totalRoomsFromHotel) && totalRoomsFromHotel > 0
          ? totalRoomsFromHotel
          : 0;

      const finalRoomsCount = Math.max(
        totalRoomsSafe,
        uniqueRoomIds.size,
        fallbackCount,
        distinctRoomsFromBookings.size
      );

      setTotalRooms(finalRoomsCount);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
      setUsers([]);
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
      const roomKey = getBookingRoomKey(booking) || "";
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
        todayActiveRoomsSet.add(roomKey);
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
        tomorrowActiveRoomsSet.add(roomKey);
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
        monthActiveRoomsSets[i].add(roomKey);
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

  const bdNow = dayjs().tz("Asia/Dhaka");
  const bdTodayStart = bdNow.startOf("day");
  const bd7DaysStart = bdTodayStart.subtract(6, "day");
  const bd30DaysStart = bdTodayStart.subtract(29, "day");

  const getBookedById = (booking) =>
    String(booking?.bookedByID || booking?.bookedBy || "UNKNOWN").trim();

  const isFtbUser = (booking) => /FTB/i.test(getBookedById(booking));

  const getCheckInDay = (booking) =>
    dayjs(booking?.checkInDate).tz("Asia/Dhaka").startOf("day");

  const inToday = (booking) => getCheckInDay(booking).isSame(bdTodayStart, "day");
  const inLast7Days = (booking) => {
    const d = getCheckInDay(booking);
    return d.isSameOrAfter(bd7DaysStart, "day") && d.isSameOrBefore(bdTodayStart, "day");
  };
  const inLast30Days = (booking) => {
    const d = getCheckInDay(booking);
    return d.isSameOrAfter(bd30DaysStart, "day") && d.isSameOrBefore(bdTodayStart, "day");
  };

  const sumTotalBill = (list) =>
    list.reduce((sum, b) => sum + (Number(b?.totalBill) || 0), 0);

  const todayAllBookings = bookings.filter(inToday);
  const todayFtbBookings = todayAllBookings.filter(isFtbUser);
  const last30AllBookings = bookings.filter(inLast30Days);
  const last30FtbBookings = last30AllBookings.filter(isFtbUser);

  const summaryCards = [
    {
      title: "Today's FTB Bookings",
      amount: sumTotalBill(todayFtbBookings),
      count: todayFtbBookings.length,
      accent: "lagoon",
    },
    {
      title: "Today's All Bookings",
      amount: sumTotalBill(todayAllBookings),
      count: todayAllBookings.length,
      accent: "green",
    },
    {
      title: "30 Days FTB Bookings",
      amount: sumTotalBill(last30FtbBookings),
      count: last30FtbBookings.length,
      accent: "sand",
    },
    {
      title: "30 Days All Bookings",
      amount: sumTotalBill(last30AllBookings),
      count: last30AllBookings.length,
      accent: "ocean",
    },
  ];

  const bookingUsersMap = {};
  bookings.forEach((booking) => {
    const userId = getBookedById(booking);
    if (!bookingUsersMap[userId]) bookingUsersMap[userId] = [];
    bookingUsersMap[userId].push(booking);
  });

  const usersFromApi = Array.isArray(users) ? users : [];
  const baseUsers = usersFromApi.map((u) => String(u?.loginID || u?.username || u?._id || ""));
  const mergedUserIds = Array.from(
    new Set([...baseUsers.filter(Boolean), ...Object.keys(bookingUsersMap)])
  );

  const userBookingRows = mergedUserIds
    .map((userId) => {
      const userBookings = bookingUsersMap[userId] || [];
      const today = userBookings.filter(inToday);
      const seven = userBookings.filter(inLast7Days);
      const thirty = userBookings.filter(inLast30Days);
      const overall = userBookings;
      return {
        userId,
        todayAmount: sumTotalBill(today),
        sevenAmount: sumTotalBill(seven),
        thirtyAmount: sumTotalBill(thirty),
        overallAmount: sumTotalBill(overall),
      };
    })
    .sort((a, b) => b.overallAmount - a.overallAmount);

  const stats = [
    {
      label: "Today's Booking Amount",
      value: statsData.todayBookingAmount,
      isCurrency: true,
      icon: DollarOutlined,
      accent: "ocean",
    },
    {
      label: `Month (${currentMonthName}) Booking Amount`,
      value: statsData.currentMonthBookingAmount,
      isCurrency: true,
      icon: DollarOutlined,
      accent: "lagoon",
    },
    {
      label: "Today's Check-ins",
      value: statsData.todayCheckIns,
      isCurrency: false,
      icon: UserOutlined,
      accent: "soft",
    },
    {
      label: "Today's Check-outs",
      value: statsData.todayCheckOuts,
      isCurrency: false,
      icon: CalendarOutlined,
      accent: "sand",
    },
    {
      label: `Today's Occupancy (${statsData.todayOccupiedRoomsCount}/${totalRooms})`,
      value: statsData.todayOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "green",
      footnote:
        statsData.todayOccupiedRoomNames?.length
          ? `Rooms: ${statsData.todayOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${statsData.todayOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied today",
    },
    {
      label: "Month Occupancy Rate",
      value: statsData.currentMonthOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "deep",
    },
    {
      label: `Tomorrow Occupancy (${statsData.tomorrowOccupiedRoomsCount}/${totalRooms})`,
      value: statsData.tomorrowOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "ocean",
      footnote:
        statsData.tomorrowOccupiedRoomNames?.length
          ? `Rooms: ${statsData.tomorrowOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${statsData.tomorrowOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied tomorrow",
    },
  ];

  const formatValue = (stat) => {
    if (stat.isCurrency) return `৳${stat.value.toLocaleString()}`;
    if (stat.isPercentage) return `${stat.value}%`;
    return stat.value.toLocaleString();
  };

  return (
    <div>
      <div className="hs-dash-intro">
        <h2>Operational Overview</h2>
        <p>Monitor hotel performance and bookings in real time</p>
      </div>

      {loading ? (
        <Row gutter={[10, 10]}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Col xs={24} sm={12} lg={8} key={item}>
              <Card size="small">
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="hs-kpi-grid">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`hs-kpi hs-kpi--${stat.accent}`}>
                <div className="hs-kpi__top">
                  <p className="hs-kpi__label">{stat.label}</p>
                  <span className="hs-kpi__icon">
                    <Icon />
                  </span>
                </div>
                <div>
                  <p className="hs-kpi__value">{formatValue(stat)}</p>
                  {stat.footnote ? (
                    <p className="hs-kpi__meta">{stat.footnote}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="hs-section">
        <div className="hs-section__head">
          <h3>Booking Period Summary</h3>
          <p>FTB vs all bookings</p>
        </div>
        <div
          className="hs-kpi-grid"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {summaryCards.map((item, idx) => (
            <div key={`summary-${idx}`} className={`hs-kpi hs-kpi--${item.accent}`}>
              <div className="hs-kpi__top">
                <p className="hs-kpi__label">{item.title}</p>
              </div>
              <div>
                <p className="hs-kpi__value">৳{item.amount.toLocaleString()}</p>
                <p className="hs-kpi__meta">{item.count} bookings</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hs-section">
        <div className="hs-section__head">
          <h3>User-wise Booking Overview</h3>
          <p>Performance by booking operator</p>
        </div>
        <div className="hs-panel">
          <div className="hs-table-wrap">
            <table className="hs-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th className="num">Today</th>
                  <th className="num">Last 7 Days</th>
                  <th className="num">Last 30 Days</th>
                  <th className="num">Overall</th>
                </tr>
              </thead>
              <tbody>
                {userBookingRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      No user booking data found
                    </td>
                  </tr>
                ) : (
                  userBookingRows.map((row) => (
                    <tr key={row.userId}>
                      <td className="id-cell">{row.userId}</td>
                      <td className="num">৳{row.todayAmount.toLocaleString()}</td>
                      <td className="num">৳{row.sevenAmount.toLocaleString()}</td>
                      <td className="num">৳{row.thirtyAmount.toLocaleString()}</td>
                      <td className="num total-cell">
                        ৳{row.overallAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;