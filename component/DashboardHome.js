import { useState, useEffect } from "react";
import { Card, Col, Row, Typography, message, Skeleton, Badge } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { TrendingUp, TrendingDown, Award, Waves } from "lucide-react";

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

// Color lightening function from your second code
const lightenColor = (color, percent) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
};

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [selectedHotelID, setSelectedHotelID] = useState(hotelID);
  const [hotelInfo] = useState(mockHotelInfo);
  const [userTableData] = useState(mockUserTableData);

  // Updated statistics based on the screenshot
  const stats = [
    {
      label: "TODAY'S FTB BOOKINGS",
      value: 0,
      count: 0,
      trend: 0,
      icon: UserOutlined,
      color: "#6366F1", // Indigo
    },
    {
      label: "TODAY'S ALL BOOKINGS",
      value: 0,
      count: 0,
      trend: 0,
      icon: TeamOutlined,
      color: "#10B981", // Emerald
    },
    {
      label: "30 DAYS FTB BOOKINGS",
      value: 671500,
      count: 56,
      trend: 15.3,
      icon: CalendarOutlined,
      color: "#F59E0B", // Amber
    },
    {
      label: "30 DAYS ALL BOOKINGS",
      value: 696000,
      count: 58,
      trend: 12.4,
      icon: DollarOutlined,
      color: "#EF4444", // Red
    },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setLoading(false);
      setLoading2(false);
    }, 1000);
  }, [selectedHotelID]);

  const getCardBackground = (color) => {
    return {
      background: `linear-gradient(135deg, ${color} 0%, ${lightenColor(
        color,
        20
      )} 100%)`,
      color: "white",
    };
  };

  const StatCard = ({ label, value, count, trend, Icon, color }) => (
    <Card
      hoverable
      bordered={false}
      className="rounded-xl overflow-hidden border-0 h-full shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={getCardBackground(color)}
      bodyStyle={{ padding: "20px" }}
    >
      <div className="flex items-start justify-between h-full">
        <div className="w-full">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Text
                className="text-sm uppercase tracking-wider block mb-1"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {label}
              </Text>
            </div>
            {trend !== 0 && (
              <Badge
                count={
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                    {trend > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">
                          {Math.abs(trend)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">
                          {Math.abs(trend)}%
                        </span>
                      </>
                    )}
                  </div>
                }
              />
            )}
          </div>

          <Title
            level={2}
            className="mt-1 mb-2"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "1.75rem",
              color: "white",
            }}
          >
            ৳{value.toLocaleString()}
          </Title>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full bg-white animate-pulse" 
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                }}
              >
                {count} bookings
              </Text>
            </div>
            
            <div className="flex items-center gap-2">
              <div
                className="p-2 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: `1px solid rgba(255,255,255,0.3)`,
                }}
              >
                <Icon style={{ fontSize: "18px" }} />
              </div>
              {trend > 0 ? (
                <RiseOutlined className="text-white text-lg" />
              ) : trend < 0 ? (
                <FallOutlined className="text-white text-lg" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const UserCard = ({ user, rank }) => (
    <Card
      className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: "12px" }}
      bodyStyle={{ padding: "20px" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {rank <= 3 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-white">
                <Award className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <Text className="font-semibold text-gray-800 block">
              {user.username}
            </Text>
            <Text className="text-xs text-gray-500">Rank #{rank}</Text>
          </div>
        </div>
        <Badge
          count={rank}
          style={{
            backgroundColor: rank === 1 ? "#f59e0b" : rank === 2 ? "#94a3b8" : rank === 3 ? "#cd7f32" : "#e5e7eb",
            color: rank <= 3 ? "white" : "#6b7280",
            fontWeight: "bold",
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50">
          <Text className="text-xs text-gray-500 block mb-1">Today</Text>
          <Text className="font-bold text-cyan-600">
            ৳{user.totalBillForTodayByFTB.toLocaleString()}
          </Text>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <Text className="text-xs text-gray-500 block mb-1">Last 7 Days</Text>
          <Text className="font-bold text-purple-600">
            ৳{user.totalBillForUserLast7Days.toLocaleString()}
          </Text>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <Text className="text-xs text-gray-500 block mb-1">Last 30 Days</Text>
          <Text className="font-bold text-orange-600">
            ৳{user.totalBillForLast30DaysByFTB.toLocaleString()}
          </Text>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <Text className="text-xs text-gray-500 block mb-1">Overall</Text>
          <Text className="font-bold text-green-600">
            ৳{user.totalBillOverall.toLocaleString()}
          </Text>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <div>
            <Title level={2} className="m-0 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Overview
            </Title>
            <Text className="text-gray-500">Monitor your hotel performance and bookings</Text>
          </div>
        </div>

        {/* Hotel Info Card */}
        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-gray-600 font-medium block mb-1">Current Hotel:</Text>
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-cyan-500" />
                <Title level={4} className="m-0 text-gray-800">
                  {hotelInfo.find(h => h.hotelID === selectedHotelID)?.hotelName || "Sea Shore Resort"}
                </Title>
              </div>
            </div>
            <div className="text-right">
              <Text className="text-gray-500 text-sm">Hotel ID: {selectedHotelID}</Text>
              <br />
              <Text className="text-gray-500 text-sm">Last updated: Just now</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Statistics Cards - Gradient Design */}
      {loading2 ? (
        <Row gutter={[24, 24]} className="mb-8">
          {[1, 2, 3, 4].map((item) => (
            <Col xs={24} sm={12} lg={6} key={item}>
              <Card 
                hoverable
                bordered={false}
                className="rounded-xl overflow-hidden border-0 h-full"
              >
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[24, 24]} className="mb-8">
          {stats.map((stat, idx) => (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <StatCard
                label={stat.label}
                value={stat.value}
                count={stat.count}
                trend={stat.trend}
                Icon={stat.icon}
                color={stat.color}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* User Performance Section */}
      <Card
        className="border-0 shadow-md"
        style={{
          borderRadius: "12px",
          background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
        }}
        bodyStyle={{ padding: "32px" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Award className="text-white text-xl" />
          </div>
          <div>
            <Title level={3} className="m-0 text-gray-800">
              Top Performers
            </Title>
            <Text className="text-gray-500">User-wise booking overview and rankings</Text>
          </div>
        </div>

        {loading ? (
          <Row gutter={[16, 16]}>
            {[1, 2, 3].map((item) => (
              <Col xs={24} md={12} lg={8} key={item}>
                <Card>
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

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;