import { useState, useEffect } from "react";
import { Card, Col, Row, Typography, Skeleton, Badge, Divider, Button, Space } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Line } from "@ant-design/charts";
import { Award } from "lucide-react";

const { Title, Text } = Typography;

// Mock data for demonstration
const mockHotelInfo = [
  { hotelID: 1, hotelName: "Sea Shore Resort" },
  { hotelID: 2, hotelName: "Beach Paradise Hotel" },
  { hotelID: 3, hotelName: "Coastal Retreat" },
];

const mockUserTableData = [
  {
    key: 1,
    username: "john_doe",
    totalBillForTodayByFTB: 15000,
    totalBillForUserLast7Days: 85000,
    totalBillForLast30DaysByFTB: 320000,
    totalBillOverall: 1250000,
  },
  {
    key: 2,
    username: "jane_smith",
    totalBillForTodayByFTB: 22000,
    totalBillForUserLast7Days: 95000,
    totalBillForLast30DaysByFTB: 380000,
    totalBillOverall: 1450000,
  },
  {
    key: 3,
    username: "mike_wilson",
    totalBillForTodayByFTB: 18000,
    totalBillForUserLast7Days: 72000,
    totalBillForLast30DaysByFTB: 290000,
    totalBillOverall: 980000,
  },
];

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [selectedHotelID, setSelectedHotelID] = useState(hotelID);
  const [hotelInfo] = useState(mockHotelInfo);
  const [userTableData] = useState(mockUserTableData);
  const [chartPeriod, setChartPeriod] = useState("daily"); // daily, monthly, yearly

  // Professional statistics configuration
  const stats = [
    {
      label: "Today's FTB Bookings",
      value: 0,
      count: 0,
      trend: 0,
      icon: UserOutlined,
      color: "#4F46E5",
      bgColor: "#EEF2FF",
    },
    {
      label: "Today's All Bookings",
      value: 0,
      count: 0,
      trend: 0,
      icon: TeamOutlined,
      color: "#059669",
      bgColor: "#ECFDF5",
    },
    {
      label: "30 Days FTB Bookings",
      value: 671500,
      count: 56,
      trend: 15.3,
      icon: CalendarOutlined,
      color: "#D97706",
      bgColor: "#FFFBEB",
    },
    {
      label: "30 Days All Bookings",
      value: 696000,
      count: 58,
      trend: 12.4,
      icon: DollarOutlined,
      color: "#DC2626",
      bgColor: "#FEF2F2",
    },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setLoading(false);
      setLoading2(false);
    }, 1000);
  }, [selectedHotelID]);

  // Chart data based on period
  const getChartData = () => {
    if (chartPeriod === "daily") {
      // Last 30 days data
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          bookings: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 50000) + 10000,
        };
      });
    } else if (chartPeriod === "monthly") {
      // Last 12 months data
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          date: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          bookings: Math.floor(Math.random() * 100) + 30,
          revenue: Math.floor(Math.random() * 200000) + 50000,
        };
      });
    } else {
      // Last 5 years data
      return Array.from({ length: 5 }, (_, i) => {
        const year = new Date().getFullYear() - (4 - i);
        return {
          date: year.toString(),
          bookings: Math.floor(Math.random() * 500) + 200,
          revenue: Math.floor(Math.random() * 2000000) + 500000,
        };
      });
    }
  };

  const chartData = getChartData();

  const StatCard = ({ label, value, count, trend, Icon, color, bgColor }) => (
    <Card
      hoverable
      bordered
      className="h-full transition-all duration-200 hover:shadow-md"
      style={{
        borderColor: "#E5E7EB",
        borderRadius: "8px",
      }}
      bodyStyle={{ padding: "24px" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Text
            className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-3"
            style={{ letterSpacing: "0.5px" }}
          >
            {label}
          </Text>
          <Title
            level={2}
            className="m-0 mb-3"
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: "1.2",
            }}
          >
            ৳{value.toLocaleString()}
          </Title>
        </div>
        <div
          className="p-3 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: bgColor,
            color: color,
          }}
        >
          <Icon style={{ fontSize: "24px" }} />
        </div>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <Text className="text-sm text-gray-600">
            {count} {count === 1 ? "booking" : "bookings"}
          </Text>
        </div>
        {trend !== 0 && (
          <div className="flex items-center gap-1">
            {trend > 0 ? (
              <>
                <RiseOutlined style={{ color: "#059669", fontSize: "14px" }} />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: "#059669" }}
                >
                  +{Math.abs(trend)}%
                </Text>
              </>
            ) : (
              <>
                <FallOutlined style={{ color: "#DC2626", fontSize: "14px" }} />
                <Text
                  className="text-sm font-semibold"
                  style={{ color: "#DC2626" }}
                >
                  {Math.abs(trend)}%
                </Text>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  const UserCard = ({ user, rank }) => {
    const getRankColor = () => {
      if (rank === 1) return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
      if (rank === 2) return { bg: "#E5E7EB", text: "#374151", border: "#9CA3AF" };
      if (rank === 3) return { bg: "#FED7AA", text: "#9A3412", border: "#FB923C" };
      return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
    };

    const rankStyle = getRankColor();

    return (
      <Card
        className="h-full transition-all duration-200 hover:shadow-md"
        bordered
        style={{
          borderColor: "#E5E7EB",
          borderRadius: "8px",
        }}
        bodyStyle={{ padding: "20px" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${rankStyle.border} 0%, ${rankStyle.text} 100%)`,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              {rank <= 3 && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  style={{ backgroundColor: rankStyle.border }}
                >
                  <Award className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <Text className="font-semibold text-gray-900 block text-base">
                {user.username.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
              <Text className="text-xs text-gray-500">Rank #{rank}</Text>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full font-bold text-sm"
            style={{
              backgroundColor: rankStyle.bg,
              color: rankStyle.text,
              border: `1px solid ${rankStyle.border}`,
            }}
          >
            #{rank}
          </div>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
            <Text className="text-xs font-medium text-gray-500 block mb-2">Today</Text>
            <Text className="font-bold text-base" style={{ color: "#1F2937" }}>
              ৳{user.totalBillForTodayByFTB.toLocaleString()}
            </Text>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
            <Text className="text-xs font-medium text-gray-500 block mb-2">Last 7 Days</Text>
            <Text className="font-bold text-base" style={{ color: "#1F2937" }}>
              ৳{user.totalBillForUserLast7Days.toLocaleString()}
            </Text>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
            <Text className="text-xs font-medium text-gray-500 block mb-2">Last 30 Days</Text>
            <Text className="font-bold text-base" style={{ color: "#1F2937" }}>
              ৳{user.totalBillForLast30DaysByFTB.toLocaleString()}
            </Text>
          </div>
          <div className="p-3 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
            <Text className="text-xs font-medium text-gray-500 block mb-2">Overall</Text>
            <Text className="font-bold text-base" style={{ color: "#1F2937" }}>
              ৳{user.totalBillOverall.toLocaleString()}
            </Text>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-6">
            <Title
              level={1}
              className="m-0 mb-2"
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Dashboard Overview
            </Title>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 sm:mb-8">
          {loading2 ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map((item) => (
                <Col xs={24} sm={12} lg={6} key={item}>
                  <Card bordered style={{ borderColor: "#E5E7EB", borderRadius: "8px" }}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {stats.map((stat, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                  <StatCard
                    label={stat.label}
                    value={stat.value}
                    count={stat.count}
                    trend={stat.trend}
                    Icon={stat.icon}
                    color={stat.color}
                    bgColor={stat.bgColor}
                  />
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Booking Metrics Chart */}
        <Card
          bordered
          className="shadow-sm mb-6 sm:mb-8"
          style={{
            borderRadius: "8px",
            borderColor: "#E5E7EB",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <Title
                level={3}
                className="m-0"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Booking Metrics
              </Title>
              <Text className="text-gray-500 text-sm">
                Track booking trends and revenue over time
              </Text>
            </div>
            <Space>
              <Button
                type={chartPeriod === "daily" ? "primary" : "default"}
                size="small"
                onClick={() => setChartPeriod("daily")}
              >
                Daily
              </Button>
              <Button
                type={chartPeriod === "monthly" ? "primary" : "default"}
                size="small"
                onClick={() => setChartPeriod("monthly")}
              >
                Monthly
              </Button>
              <Button
                type={chartPeriod === "yearly" ? "primary" : "default"}
                size="small"
                onClick={() => setChartPeriod("yearly")}
              >
                Yearly
              </Button>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#4F46E5" }}
                  />
                  <Text className="text-sm font-medium text-gray-700">Number of Bookings</Text>
                </div>
                <div style={{ height: "300px" }}>
                  <Line
                    data={chartData}
                    xField="date"
                    yField="bookings"
                    point={{
                      size: 4,
                      shape: "circle",
                    }}
                    smooth={true}
                    animation={{
                      appear: {
                        animation: "path-in",
                        duration: 1000,
                      },
                    }}
                    color="#4F46E5"
                    style={{
                      lineWidth: 3,
                    }}
                    tooltip={{
                      formatter: (datum) => {
                        return {
                          name: "Bookings",
                          value: `${datum.bookings}`,
                        };
                      },
                    }}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#059669" }}
                  />
                  <Text className="text-sm font-medium text-gray-700">Revenue (৳)</Text>
                </div>
                <div style={{ height: "300px" }}>
                  <Line
                    data={chartData}
                    xField="date"
                    yField="revenue"
                    point={{
                      size: 4,
                      shape: "circle",
                    }}
                    smooth={true}
                    animation={{
                      appear: {
                        animation: "path-in",
                        duration: 1000,
                      },
                    }}
                    color="#059669"
                    style={{
                      lineWidth: 3,
                    }}
                    yAxis={{
                      label: {
                        formatter: (value) => `৳${(value / 1000).toFixed(0)}k`,
                      },
                    }}
                    tooltip={{
                      formatter: (datum) => {
                        return {
                          name: "Revenue",
                          value: `৳${datum.revenue.toLocaleString()}`,
                        };
                      },
                    }}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* User Performance Section */}
        <Card
          bordered
          className="shadow-sm"
          style={{
            borderRadius: "8px",
            borderColor: "#E5E7EB",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="p-2.5 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: "#FEF3C7",
                color: "#92400E",
              }}
            >
              <Award className="w-5 h-5" />
            </div>
            <div>
              <Title
                level={3}
                className="m-0"
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Top Performers
              </Title>
              <Text className="text-gray-500 text-sm">
                User-wise booking performance and rankings
              </Text>
            </div>
          </div>

          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map((item) => (
                <Col xs={24} md={12} lg={8} key={item}>
                  <Card bordered style={{ borderColor: "#E5E7EB", borderRadius: "8px" }}>
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
    </div>
  );
};

export default DashboardHome;