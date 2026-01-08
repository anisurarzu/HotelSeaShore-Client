import { useState, useEffect } from "react";
import { Card, Col, Row, Typography, Skeleton, Divider, Button, Space, Statistic, Tag } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Award, TrendingUp, Users, Bed, Calendar } from "lucide-react";

const { Title, Text } = Typography;

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [selectedHotelID, setSelectedHotelID] = useState(hotelID);
  const [bookings, setBookings] = useState([]);
  const [userTableData, setUserTableData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("daily");

  // Mock data - Replace with your API call
  useEffect(() => {
    const mockBookings = [
      {
        _id: "696003ed4d6b15b2035c8a2e",
        fullName: "Anisur Rahman Arzu",
        hotelID: 1,
        roomPrice: 4500,
        checkInDate: "2026-01-08T00:00:00.000Z",
        checkOutDate: "2026-01-10T00:00:00.000Z",
        nights: 1,
        totalBill: 4500,
        bookedBy: "SystemAdmin",
        bookedByID: "SystemAdmin-FTB",
        source: "FTB",
        statusID: 1,
      },
      {
        _id: "695ffdad4d6b15b2035c798d",
        fullName: "Anisur Rahman Arzu",
        hotelID: 1,
        roomPrice: 4500,
        checkInDate: "2026-01-08T00:00:00.000Z",
        checkOutDate: "2026-01-22T00:00:00.000Z",
        nights: 13,
        totalBill: 58500,
        bookedBy: "SystemAdmin",
        bookedByID: "SystemAdmin-FTB",
        source: "FTB",
        statusID: 1,
      },
      // Add more mock data for variety
      {
        _id: "test1",
        fullName: "John Doe",
        hotelID: 1,
        roomPrice: 3500,
        checkInDate: "2025-12-25T00:00:00.000Z",
        checkOutDate: "2025-12-28T00:00:00.000Z",
        nights: 3,
        totalBill: 10500,
        bookedBy: "Agent_User",
        bookedByID: "Agent-001",
        source: "Agent",
        statusID: 1,
      },
      {
        _id: "test2",
        fullName: "Jane Smith",
        hotelID: 1,
        roomPrice: 4000,
        checkInDate: "2026-01-05T00:00:00.000Z",
        checkOutDate: "2026-01-07T00:00:00.000Z",
        nights: 2,
        totalBill: 8000,
        bookedBy: "Direct_Customer",
        bookedByID: "Direct-002",
        source: "Direct",
        statusID: 1,
      },
    ];

    setTimeout(() => {
      setBookings(mockBookings);
      calculateUserStats(mockBookings);
      setLoading(false);
    }, 500);
  }, [selectedHotelID, hotelID]);

  const calculateUserStats = (bookingsData) => {
    const userStatsMap = new Map();
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    bookingsData.forEach((booking) => {
      const userId = booking.bookedByID;
      if (!userId) return;

      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          username: booking.bookedBy || `User ${userId}`,
          totalBillForTodayByFTB: 0,
          totalBillForUserLast7Days: 0,
          totalBillForLast30DaysByFTB: 0,
          totalBillOverall: 0,
        });
      }

      const userStat = userStatsMap.get(userId);
      const bookingDate = new Date(booking.checkInDate);
      const totalBill = booking.totalBill || 0;
      const isFTB = booking.source === "FTB" || booking.bookingSource === "FTB";

      userStat.totalBillOverall += totalBill;

      if (bookingDate >= thirtyDaysAgo && isFTB) {
        userStat.totalBillForLast30DaysByFTB += totalBill;
      }

      if (bookingDate >= sevenDaysAgo) {
        userStat.totalBillForUserLast7Days += totalBill;
      }

      if (bookingDate.toDateString() === today.toDateString() && isFTB) {
        userStat.totalBillForTodayByFTB += totalBill;
      }
    });

    const userStatsArray = Array.from(userStatsMap.values())
      .map((stat, index) => ({
        key: index + 1,
        ...stat,
      }))
      .sort((a, b) => b.totalBillOverall - a.totalBillOverall)
      .slice(0, 3);

    setUserTableData(userStatsArray);
  };

  const calculateStats = () => {
    if (!bookings || bookings.length === 0) {
      return {
        todayFTB: { value: 0, count: 0 },
        todayAll: { value: 0, count: 0 },
        last30DaysFTB: { value: 0, count: 0 },
        last30DaysAll: { value: 0, count: 0 },
      };
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.checkInDate);
      return bookingDate.toDateString() === today.toDateString();
    });

    const todayFTBBookings = todayBookings.filter(
      (booking) => booking.source === "FTB" || booking.bookingSource === "FTB"
    );

    const last30DaysBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.checkInDate);
      return bookingDate >= thirtyDaysAgo;
    });

    const last30DaysFTBBookings = last30DaysBookings.filter(
      (booking) => booking.source === "FTB" || booking.bookingSource === "FTB"
    );

    return {
      todayFTB: {
        value: todayFTBBookings.reduce((sum, booking) => sum + (booking.totalBill || 0), 0),
        count: todayFTBBookings.length,
      },
      todayAll: {
        value: todayBookings.reduce((sum, booking) => sum + (booking.totalBill || 0), 0),
        count: todayBookings.length,
      },
      last30DaysFTB: {
        value: last30DaysFTBBookings.reduce((sum, booking) => sum + (booking.totalBill || 0), 0),
        count: last30DaysFTBBookings.length,
      },
      last30DaysAll: {
        value: last30DaysBookings.reduce((sum, booking) => sum + (booking.totalBill || 0), 0),
        count: last30DaysBookings.length,
      },
    };
  };

  const statsData = calculateStats();

  const stats = [
    {
      label: "Today's FTB Revenue",
      value: statsData.todayFTB.value,
      count: statsData.todayFTB.count,
      icon: DollarOutlined,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    },
    {
      label: "Today's Total Revenue",
      value: statsData.todayAll.value,
      count: statsData.todayAll.count,
      icon: TeamOutlined,
      color: "#10B981",
      bgColor: "#D1FAE5",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    },
    {
      label: "30 Days FTB Revenue",
      value: statsData.last30DaysFTB.value,
      count: statsData.last30DaysFTB.count,
      icon: CalendarOutlined,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    },
    {
      label: "30 Days Total Revenue",
      value: statsData.last30DaysAll.value,
      count: statsData.last30DaysAll.count,
      icon: TrendingUp,
      color: "#EF4444",
      bgColor: "#FEE2E2",
      gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    },
  ];

  const getSourceDistribution = () => {
    const today = new Date();
    let filteredBookings = bookings;

    if (chartPeriod === "daily") {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.checkInDate);
        return bookingDate >= thirtyDaysAgo;
      });
    } else if (chartPeriod === "monthly") {
      const twelveMonthsAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.checkInDate);
        return bookingDate >= twelveMonthsAgo;
      });
    }

    const sourceMap = new Map();
    filteredBookings.forEach((booking) => {
      const source = booking.source || booking.bookingSource || "Other";
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { count: 0, revenue: 0 });
      }
      const data = sourceMap.get(source);
      data.count += 1;
      data.revenue += booking.totalBill || 0;
      sourceMap.set(source, data);
    });

    return sourceMap;
  };

  const sourceDistribution = getSourceDistribution();

  const StatCard = ({ label, value, count, Icon, color, bgColor, gradient }) => (
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
            ৳{value.toLocaleString()}
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

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <CheckCircleOutlined style={{ color: color, fontSize: "14px" }} />
        <Text className="text-sm font-medium text-gray-600">
          {count} {count === 1 ? "booking" : "bookings"}
        </Text>
      </div>
    </Card>
  );

  const UserCard = ({ user, rank }) => {
    const getRankStyle = () => {
      if (rank === 1) return {
        bg: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
        border: "#F59E0B",
        badge: "#FCD34D",
        text: "#92400E"
      };
      if (rank === 2) return {
        bg: "linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)",
        border: "#9CA3AF",
        badge: "#D1D5DB",
        text: "#374151"
      };
      if (rank === 3) return {
        bg: "linear-gradient(135deg, #FDBA74 0%, #F97316 100%)",
        border: "#F97316",
        badge: "#FDBA74",
        text: "#9A3412"
      };
    };

    const rankStyle = getRankStyle();

    return (
      <Card
        className="user-card"
        hoverable
        style={{
          borderRadius: "16px",
          border: `2px solid ${rankStyle.border}20`,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{
                  background: rankStyle.bg,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-3 border-white shadow-md"
                style={{ backgroundColor: rankStyle.badge }}
              >
                <Award className="w-4 h-4" style={{ color: rankStyle.text }} />
              </div>
            </div>
            <div>
              <Text className="font-bold text-gray-900 block text-lg mb-1">
                {user.username.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
              <Tag color={rankStyle.border} style={{ margin: 0 }}>
                Rank #{rank}
              </Tag>
            </div>
          </div>
        </div>

        <Divider style={{ margin: "20px 0" }} />

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Today", value: user.totalBillForTodayByFTB },
            { label: "Last 7 Days", value: user.totalBillForUserLast7Days },
            { label: "Last 30 Days", value: user.totalBillForLast30DaysByFTB },
            { label: "Overall", value: user.totalBillOverall },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all"
              style={{ backgroundColor: "#FAFAFA" }}
            >
              <Text className="text-xs font-semibold text-gray-500 block mb-2 uppercase">
                {item.label}
              </Text>
              <Text className="font-bold text-lg block" style={{ color: "#1F2937" }}>
                ৳{item.value.toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
      </Card>
    );
  };

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
              background: "linear-gradient(135deg, #1F2937 0%, #4B5563 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Dashboard Overview
          </Title>
          <Text className="text-gray-500 text-base">
            Monitor your hotel's performance and bookings in real-time
          </Text>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((item) => (
                <Col xs={24} sm={12} lg={6} key={item}>
                  <Card style={{ borderRadius: "16px" }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {stats.map((stat, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                  <StatCard {...stat} />
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Source Distribution */}
        <Card
          bordered={false}
          className="mb-8"
          style={{
            borderRadius: "16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <Title level={4} className="m-0 mb-1" style={{ fontSize: "20px", fontWeight: 700 }}>
                Booking Sources
              </Title>
              <Text className="text-gray-500">Distribution across channels</Text>
            </div>
            <Space>
              {["daily", "monthly", "yearly"].map((period) => (
                <Button
                  key={period}
                  type={chartPeriod === period ? "primary" : "default"}
                  onClick={() => setChartPeriod(period)}
                  style={{
                    borderRadius: "8px",
                    ...(chartPeriod === period && {
                      background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      border: "none",
                    }),
                  }}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            {Array.from(sourceDistribution.entries()).map(([source, data]) => {
              const colors = {
                FTB: { color: "#8B5CF6", bg: "#F5F3FF" },
                Direct: { color: "#10B981", bg: "#D1FAE5" },
                Agent: { color: "#F59E0B", bg: "#FEF3C7" },
                Other: { color: "#EF4444", bg: "#FEE2E2" },
              };
              const style = colors[source] || colors.Other;

              return (
                <Col xs={24} sm={12} lg={6} key={source}>
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      background: style.bg,
                      border: `2px solid ${style.color}20`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Text className="font-semibold text-gray-700">{source}</Text>
                      <Bed style={{ color: style.color, fontSize: "20px" }} />
                    </div>
                    <Title level={3} className="m-0 mb-2" style={{ color: style.color }}>
                      {data.count}
                    </Title>
                    <Text className="text-sm text-gray-600">
                      ৳{data.revenue.toLocaleString()}
                    </Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* Top Performers */}
        <Card
          bordered={false}
          style={{
            borderRadius: "16px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
                boxShadow: "0 4px 14px 0 #F59E0B40",
              }}
            >
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <Title level={4} className="m-0 mb-1" style={{ fontSize: "20px", fontWeight: 700 }}>
                Top Performers
              </Title>
              <Text className="text-gray-500">Best performing team members</Text>
            </div>
          </div>

          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map((item) => (
                <Col xs={24} md={12} lg={8} key={item}>
                  <Card style={{ borderRadius: "16px" }}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {userTableData.map((user, index) => (
                <Col xs={24} md={12} lg={8} key={user.key}>
                  <UserCard user={user} rank={index + 1} />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </div>

      <style>{`
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        
        .user-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;