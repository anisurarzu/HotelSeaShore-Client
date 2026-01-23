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

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const response = await coreAxios.get("/bookings");

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
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
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
    let todayActiveBookings = 0;
    let currentMonthActiveBookings = 0;

    bookings.forEach((booking) => {
      const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
      const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
      const totalBill = parseFloat(booking.totalBill) || 0;

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

      // Today's Occupancy (active bookings today)
      const isActiveToday = checkInDate.isSameOrBefore(todayEnd, "day") && 
                           checkOutDate.isSameOrAfter(todayStart, "day");
      if (isActiveToday) {
        todayActiveBookings++;
      }

      // Current Month Occupancy (active bookings in current month)
      const isActiveInMonth = checkInDate.isSameOrBefore(monthEnd, "day") && 
                             checkOutDate.isSameOrAfter(monthStart, "day");
      if (isActiveInMonth) {
        currentMonthActiveBookings++;
      }
    });

    // Calculate occupancy rates (assuming max 10 rooms - should come from hotel data)
    const maxRooms = 10; // TODO: Get from hotel data
    const todayOccupancyRate = todayActiveBookings > 0 
      ? Math.min(100, Math.round((todayActiveBookings / maxRooms) * 100))
      : 0;
    const currentMonthOccupancyRate = currentMonthActiveBookings > 0
      ? Math.min(100, Math.round((currentMonthActiveBookings / maxRooms) * 100))
      : 0;

    return {
      todayBookingAmount,
      currentMonthBookingAmount,
      todayCheckIns,
      todayCheckOuts,
      todayOccupancyRate,
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
      label: "Today's Occupancy Rate",
      value: statsData.todayOccupancyRate,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      color: "#b45309",
      bgColor: "#fffbeb",
      gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
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
  ];

  const StatCard = ({ label, value, isCurrency, isPercentage, Icon, color, bgColor, gradient }) => (
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