"use client";

import {
  Layout,
  Menu,
  Button,
  Drawer,
  Avatar,
  Skeleton,
  theme,
  Dropdown,
  Tooltip,
  Typography,
  Card,
  Row,
  Col,
  Modal,
  Table,
  Divider,
} from "antd";
import {
  DashboardOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  HomeOutlined,
  BankOutlined,
  DollarOutlined,
  BarChartOutlined,
  WalletOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  UpOutlined,
  EyeOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useCallback } from "react";
import { Pie } from "@ant-design/charts";
import DashboardHome from "@/component/DashboardHome";
import AgentInformation from "@/component/AgentInformation";
import HotelInformation from "@/component/HotelInformation";
import BookingInfo from "@/component/BookingInfo";
import Calender from "@/component/Calender";
import RoomAvailabilityPage from "@/component/RoomSearchPage";
import AllBookingInfo from "@/component/AllBookingInfo";
import ExpenseInfo from "@/component/Expense/ExpenseInfo";
import PermissionManagement from "@/component/Permission/PermissionManagement";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { useToken } = theme;

// Menu items with appropriate icons
const menuItems = [
  {
    key: "1",
    label: "Dashboard",
    icon: <DashboardOutlined className="text-base" />,
    component: (props) => <DashboardHome {...props} />,
  },
  {
    key: "7",
    label: "Calendar",
    icon: <CalendarOutlined className="text-base" />,
    component: (props) => <Calender {...props} />,
  },
  // {
  //   key: "9",
  //   label: "Room Availability",
  //   icon: <CheckSquareOutlined className="text-base" />,
  //   component: (props) => <RoomAvailabilityPage {...props} />,
  // },
  {
    key: "6",
    label: "Booking Info",
    icon: <FileTextOutlined className="text-base" />,
    component: (props) => <BookingInfo {...props} />,
  },
  {
    key: "10",
    label: "Report Dashboard",
    icon: <BarChartOutlined className="text-base" />,
    component: (props) => <AllBookingInfo hotelID={props?.hotelID || 1} />,
  },
  {
    key: "101",
    label: "Expense",
    icon: <WalletOutlined className="text-base" />,
    component: () => <ExpenseInfo />,
  },
  {
    key: "5",
    label: "Hotel Info",
    icon: <BankOutlined className="text-base" />,
    component: () => <HotelInformation />,
  },
  {
    key: "2",
    label: "Users",
    icon: <TeamOutlined className="text-base" />,
    component: () => <AgentInformation />,
  },
  {
    key: "8",
    label: "Settings",
    icon: <SettingOutlined className="text-base" />,
    component: () => <PermissionManagement />,
  },
];

// Pie chart data
const PIE_CHART_DATA = [
  { type: 'Occupied', value: 45, color: '#0ea5e9' },
  { type: 'Available', value: 30, color: '#10b981' },
  { type: 'Reserved', value: 15, color: '#f59e0b' },
  { type: 'Maintenance', value: 10, color: '#ef4444' },
];

// Standard Dashboard Card Component
const DashboardCard = ({ title, value, icon, color, trend, bgColor = 'white', onViewDetails }) => (
  <Card 
    className="h-full shadow-sm border-0 hover:shadow-md transition-all duration-300"
    style={{ 
      background: bgColor,
      borderRadius: '12px',
      overflow: 'hidden'
    }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
        <Text className="text-gray-500 text-sm font-medium">{title}</Text>
          {onViewDetails && (
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                // icon={<EyeOutlined className="text-xs" />}
                onClick={onViewDetails}
                className="!text-gray-400 hover:!text-gray-600 !p-1 !h-auto"
                style={{ fontSize: '10px' }}
              />
            </Tooltip>
          )}
        </div>
        <div className="mt-2">
          <Title level={3} className="!mb-1 !text-2xl font-bold" style={{ color: color }}>
            {value}
          </Title>
          {trend && (
            <Text className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </Text>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
    </div>
  </Card>
);

// Compact Pie Chart Component using Ant Design Charts
const CompactPieChart = () => {
  const config = {
    data: PIE_CHART_DATA,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: false,
    legend: {
      position: 'bottom',
      itemSpacing: 8,
      marker: {
        symbol: 'circle',
        style: {
          r: 6,
        },
      },
      itemName: {
        style: {
          fontSize: 12,
        },
      },
    },
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
    statistic: {
      title: {
        content: 'Total',
        style: {
          fontSize: '14px',
          color: '#666',
        },
      },
      content: {
        content: '75%',
        style: {
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0ea5e9',
        },
      },
    },
    color: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'],
    height: 220,
    padding: [10, 10, 40, 10],
  };

  return <Pie {...config} />;
};

const DashboardContent = ({ sliders }) => {
  const { token } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(true);
  const [topbarCollapsed, setTopbarCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailModalType, setDetailModalType] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    occupancyRate: 0,
    activeBookings: 0,
    pendingCheckIns: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalNights: 0,
    todayNights: 0,
    thisMonthNights: 0,
  });

  // Get hotelID from URL
  const hotelID = searchParams.get("hotelID");

  // Calculate dashboard statistics from bookings API data
  const calculateDashboardStats = useCallback((bookingsData) => {
    const today = dayjs().tz("Asia/Dhaka");
    const todayStart = today.startOf("day");
    const todayEnd = today.endOf("day");
    const monthStart = today.startOf("month");
    const monthEnd = today.endOf("month");

    // Initialize counters
    let totalRevenue = 0;
    let todayRevenue = 0;
    let thisMonthRevenue = 0;
    let totalNights = 0;
    let todayNights = 0;
    let thisMonthNights = 0;
    let activeBookings = 0;
    let pendingCheckIns = 0;
    let todayCheckIns = 0;
    let todayCheckOuts = 0;

    bookingsData.forEach((booking) => {
      // Parse dates properly
      const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
      const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
      
      // Get booking details
      const nights = parseInt(booking.nights) || 1;
      const totalBill = parseFloat(booking.totalBill) || 0;
      const advancePayment = parseFloat(booking.advancePayment) || 0;
      const duePayment = parseFloat(booking.duePayment) || 0;

      // Add to total revenue (only count completed payments or all bills depending on your logic)
      // Here we count totalBill as revenue
      totalRevenue += totalBill;
      totalNights += nights;

      // Check if check-in date is today
      if (checkInDate.isSame(todayStart, "day")) {
        todayRevenue += totalBill;
        todayNights += nights;
        todayCheckIns++;
      }

      // Check if check-in date is within current month
      if (checkInDate.isSameOrAfter(monthStart, "day") && 
          checkInDate.isSameOrBefore(monthEnd, "day")) {
        thisMonthRevenue += totalBill;
        thisMonthNights += nights;
      }

      // Check if check-out date is today
      if (checkOutDate.isSame(todayStart, "day")) {
        todayCheckOuts++;
      }

      // Determine if booking is active (check-in date is today or in the past AND check-out date is in the future or today)
      const isActive = checkInDate.isSameOrBefore(todayEnd, "day") && 
                       checkOutDate.isSameOrAfter(todayStart, "day");
      
      if (isActive) {
        activeBookings++;
      }

      // Count pending check-ins (check-in date is in the future)
      if (checkInDate.isAfter(todayStart, "day")) {
        pendingCheckIns++;
      }
    });

    // Calculate occupancy rate (simplified - assuming max 10 rooms available)
    // You should replace this with actual hotel room count from your API
    const maxRooms = 10; // This should come from your hotel data
    const occupancyRate = activeBookings > 0 
      ? Math.min(100, Math.round((activeBookings / maxRooms) * 100))
      : 0;

    setDashboardStats({
      totalRevenue,
      todayRevenue,
      thisMonthRevenue,
      occupancyRate,
      activeBookings,
      pendingCheckIns,
      todayCheckIns,
      todayCheckOuts,
      totalNights,
      todayNights,
      thisMonthNights,
    });
  }, []);

  // Fetch bookings data
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
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
        calculateDashboardStats(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, [hotelID, calculateDashboardStats]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }

    // Get initial menu from URL or default to dashboard
    const menuFromUrl = searchParams.get("menu");
    if (menuFromUrl && menuItems.some(item => item.key === menuFromUrl)) {
      setSelectedMenu(menuFromUrl);
    }

    // Fetch bookings data
    fetchBookings();

    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [router, searchParams, fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const toggleTopbar = () => {
    setTopbarCollapsed(!topbarCollapsed);
  };

  const handleMenuClick = (e) => {
    const menuKey = String(e.key);
    setSelectedMenu(menuKey);
    closeDrawer();
    
    // Update URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('menu', menuKey);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle view details for cards
  const handleViewDetails = (type) => {
    setDetailModalType(type);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setDetailModalType(null);
  };

  // Get filtered bookings based on card type
  const getFilteredBookings = (type) => {
    const today = dayjs().tz("Asia/Dhaka");
    const todayStart = today.startOf("day");
    const monthStart = today.startOf("month");
    const monthEnd = today.endOf("month");

    switch (type) {
      case 'totalRevenue':
        return bookings;
      case 'todayRevenue':
        return bookings.filter(booking => 
          dayjs(booking.checkInDate).tz("Asia/Dhaka").isSame(todayStart, "day")
        );
      case 'thisMonthRevenue':
        return bookings.filter(booking => {
          const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
          return checkInDate.isSameOrAfter(monthStart, "day") && 
                 checkInDate.isSameOrBefore(monthEnd, "day");
        });
      case 'activeBookings':
        return bookings.filter(booking => {
          const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
          const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
          return checkInDate.isSameOrBefore(today.endOf("day"), "day") && 
                 checkOutDate.isSameOrAfter(todayStart, "day");
        });
      case 'pendingCheckIns':
        return bookings.filter(booking => 
          dayjs(booking.checkInDate).tz("Asia/Dhaka").isAfter(todayStart, "day")
        );
      case 'todayCheckIns':
        return bookings.filter(booking => 
          dayjs(booking.checkInDate).tz("Asia/Dhaka").isSame(todayStart, "day")
        );
      case 'todayCheckOuts':
        return bookings.filter(booking => 
          dayjs(booking.checkOutDate).tz("Asia/Dhaka").isSame(todayStart, "day")
        );
      case 'totalNights':
        return bookings;
      case 'todayNights':
        return bookings.filter(booking => 
          dayjs(booking.checkInDate).tz("Asia/Dhaka").isSame(todayStart, "day")
        );
      case 'thisMonthNights':
        return bookings.filter(booking => {
          const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
          return checkInDate.isSameOrAfter(monthStart, "day") && 
                 checkInDate.isSameOrBefore(monthEnd, "day");
        });
      case 'totalBookings':
        return bookings;
      default:
        return [];
    }
  };

  // Detail Modal Component
  const DetailModal = () => {
    const filteredBookings = getFilteredBookings(detailModalType);
    
    const getModalTitle = () => {
      const titles = {
        'totalRevenue': 'Total Revenue Details',
        'todayRevenue': "Today's Revenue Details",
        'thisMonthRevenue': "This Month's Revenue Details",
        'activeBookings': 'Active Bookings Details',
        'pendingCheckIns': 'Pending Check-ins Details',
        'todayCheckIns': "Today's Check-ins Details",
        'todayCheckOuts': "Today's Check-outs Details",
        'totalNights': 'Total Nights Details',
        'todayNights': "Today's Nights Details",
        'thisMonthNights': "This Month's Nights Details",
        'totalBookings': 'Total Bookings Details',
      };
      return titles[detailModalType] || 'Details';
    };

    const columns = [
      {
        title: 'Guest Name',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 150,
        render: (text) => <span className="text-xs font-medium">{text || 'N/A'}</span>,
      },
      {
        title: 'Check-in',
        dataIndex: 'checkInDate',
        key: 'checkInDate',
        width: 100,
        render: (date) => (
          <span className="text-xs text-gray-600">
            {dayjs(date).tz("Asia/Dhaka").format('DD MMM YY')}
          </span>
        ),
      },
      {
        title: 'Check-out',
        dataIndex: 'checkOutDate',
        key: 'checkOutDate',
        width: 100,
        render: (date) => (
          <span className="text-xs text-gray-600">
            {dayjs(date).tz("Asia/Dhaka").format('DD MMM YY')}
          </span>
        ),
      },
      {
        title: 'Nights',
        dataIndex: 'nights',
        key: 'nights',
        width: 60,
        align: 'center',
        render: (nights) => <span className="text-xs">{nights || 1}</span>,
      },
      {
        title: 'Total Bill',
        dataIndex: 'totalBill',
        key: 'totalBill',
        width: 100,
        align: 'right',
        render: (amount) => (
          <span className="text-xs font-semibold text-green-600">
            ৳{Number(amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        title: 'Advance',
        dataIndex: 'advancePayment',
        key: 'advancePayment',
        width: 90,
        align: 'right',
        render: (amount) => (
          <span className="text-xs text-blue-600">
            ৳{Number(amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        title: 'Due',
        dataIndex: 'duePayment',
        key: 'duePayment',
        width: 90,
        align: 'right',
        render: (amount) => (
          <span className="text-xs text-orange-600">
            ৳{Number(amount || 0).toLocaleString()}
          </span>
        ),
      },
    ];

    const calculateSummary = () => {
      const totalBill = filteredBookings.reduce((sum, b) => sum + (Number(b.totalBill) || 0), 0);
      const totalAdvance = filteredBookings.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0);
      const totalDue = filteredBookings.reduce((sum, b) => sum + (Number(b.duePayment) || 0), 0);
      const totalNights = filteredBookings.reduce((sum, b) => sum + (Number(b.nights) || 1), 0);
      
      return { totalBill, totalAdvance, totalDue, totalNights, count: filteredBookings.length };
    };

    const summary = calculateSummary();

    return (
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">{getModalTitle()}</span>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined className="text-xs" />}
              onClick={closeDetailModal}
              className="!text-gray-400 hover:!text-gray-600 !h-6 !w-6 !p-0"
            />
          </div>
        }
        open={detailModalVisible}
        onCancel={closeDetailModal}
        footer={null}
        width={900}
        className="detail-modal"
        styles={{
          header: { padding: '12px 16px', borderBottom: '1px solid #f0f0f0' },
          body: { padding: '12px 16px', maxHeight: '70vh', overflowY: 'auto' },
        }}
      >
        <div className="space-y-4">
          {/* Summary Cards */}
          <Row gutter={[12, 12]}>
            <Col xs={12} sm={6}>
              <div className="bg-blue-50 p-2 rounded border border-blue-100">
                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">Total Bookings</p>
                <p className="text-xs font-bold text-blue-600">{summary.count}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-green-50 p-2 rounded border border-green-100">
                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">Total Revenue</p>
                <p className="text-xs font-bold text-green-600">৳{summary.totalBill.toLocaleString()}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-amber-50 p-2 rounded border border-amber-100">
                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">Total Nights</p>
                <p className="text-xs font-bold text-amber-600">{summary.totalNights}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-orange-50 p-2 rounded border border-orange-100">
                <p className="text-[9px] text-gray-500 mb-0.5 font-medium">Due Amount</p>
                <p className="text-xs font-bold text-orange-600">৳{summary.totalDue.toLocaleString()}</p>
              </div>
            </Col>
          </Row>

          <Divider className="!my-2" style={{ margin: '8px 0' }} />

          {/* Bookings Table */}
          <div>
            <p className="text-[10px] text-gray-600 mb-1.5 font-semibold uppercase tracking-wide">Booking Details</p>
            <Table
              columns={columns}
              dataSource={filteredBookings}
              rowKey={(record) => record._id || record.bookingID || Math.random()}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `Total: ${total}`,
                size: 'small',
              }}
              size="small"
              scroll={{ x: 700 }}
              className="text-xs"
            />
          </div>
        </div>
      </Modal>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-6">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      );
    }

    if (selectedMenu === "1") {
      // Dashboard View with improved layout
      return (
        <div className="space-y-6">
          {/* Stats Cards Grid - Using Bookings API Data */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
              <DashboardCard
                title="Total Revenue"
                  value={`৳${dashboardStats.totalRevenue.toLocaleString()}`}
                icon={<DollarOutlined className="text-xl text-green-500" />}
                color="#10b981"
                bgColor="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                  onViewDetails={() => handleViewDetails('totalRevenue')}
              />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
              <DashboardCard
                  title="Today's Revenue"
                  value={`৳${dashboardStats.todayRevenue.toLocaleString()}`}
                  icon={<DollarOutlined className="text-xl text-blue-500" />}
                color="#0ea5e9"
                bgColor="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                  onViewDetails={() => handleViewDetails('todayRevenue')}
              />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
              <DashboardCard
                title="Active Bookings"
                  value={dashboardStats.activeBookings.toString()}
                icon={<CalendarOutlined className="text-xl text-purple-500" />}
                color="#8b5cf6"
                bgColor="linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                  onViewDetails={() => handleViewDetails('activeBookings')}
              />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
              <DashboardCard
                title="Pending Check-ins"
                  value={dashboardStats.pendingCheckIns.toString()}
                icon={<UserOutlined className="text-xl text-orange-500" />}
                color="#f59e0b"
                bgColor="linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                  onViewDetails={() => handleViewDetails('pendingCheckIns')}
                />
              )}
            </Col>
          </Row>

          {/* Additional Stats Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="This Month Revenue"
                  value={`৳${dashboardStats.thisMonthRevenue.toLocaleString()}`}
                  icon={<DollarOutlined className="text-xl text-indigo-500" />}
                  color="#6366f1"
                  bgColor="linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)"
                  onViewDetails={() => handleViewDetails('thisMonthRevenue')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Today's Check-ins"
                  value={dashboardStats.todayCheckIns.toString()}
                  icon={<CalendarOutlined className="text-xl text-teal-500" />}
                  color="#14b8a6"
                  bgColor="linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)"
                  onViewDetails={() => handleViewDetails('todayCheckIns')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Today's Check-outs"
                  value={dashboardStats.todayCheckOuts.toString()}
                  icon={<CalendarOutlined className="text-xl text-pink-500" />}
                  color="#ec4899"
                  bgColor="linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
                  onViewDetails={() => handleViewDetails('todayCheckOuts')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Occupancy Rate"
                  value={`${dashboardStats.occupancyRate}%`}
                  icon={<HomeOutlined className="text-xl text-cyan-500" />}
                  color="#06b6d4"
                  bgColor="linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)"
                />
              )}
            </Col>
          </Row>

          {/* Additional Stats Row - Nights and Other Metrics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Total Nights"
                  value={dashboardStats.totalNights.toString()}
                  icon={<CalendarOutlined className="text-xl text-amber-500" />}
                  color="#f59e0b"
                  bgColor="linear-gradient(135deg, #fef3c7 0%, #fef3c7 100%)"
                  onViewDetails={() => handleViewDetails('totalNights')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Today Nights"
                  value={dashboardStats.todayNights.toString()}
                  icon={<CalendarOutlined className="text-xl text-emerald-500" />}
                  color="#10b981"
                  bgColor="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                  onViewDetails={() => handleViewDetails('todayNights')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="This Month Nights"
                  value={dashboardStats.thisMonthNights.toString()}
                  icon={<CalendarOutlined className="text-xl text-violet-500" />}
                  color="#8b5cf6"
                  bgColor="linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)"
                  onViewDetails={() => handleViewDetails('thisMonthNights')}
                />
              )}
            </Col>
            <Col xs={24} sm={12} lg={6}>
              {bookingsLoading ? (
                <Card className="h-full shadow-sm border-0" style={{ borderRadius: '12px' }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ) : (
                <DashboardCard
                  title="Total Bookings"
                  value={bookings.length.toString()}
                  icon={<FileTextOutlined className="text-xl text-rose-500" />}
                  color="#ef4444"
                  bgColor="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
                  onViewDetails={() => handleViewDetails('totalBookings')}
                />
              )}
            </Col>
          </Row>

          {/* Charts and Metrics Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title="Room Distribution" 
                className="h-full shadow-sm border-0"
                style={{ borderRadius: '12px' }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-full">
                    <CompactPieChart />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-md">
                    {PIE_CHART_DATA.map((item) => (
                      <div key={item.type} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-700">{item.type}</span>
                        <span className="ml-auto text-sm font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="Quick Actions" 
                className="h-full shadow-sm border-0"
                style={{ borderRadius: '12px' }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'New Booking', icon: <FileTextOutlined />, color: '#0ea5e9' },
                    { label: 'Check-in', icon: <UserOutlined />, color: '#10b981' },
                    { label: 'Room Service', icon: <HomeOutlined />, color: '#f59e0b' },
                    { label: 'Generate Report', icon: <BarChartOutlined />, color: '#8b5cf6' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-cyan-200 hover:shadow-md transition-all duration-300 group"
                    >
                      <div 
                        className="p-3 rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <div style={{ color: action.color, fontSize: '20px' }}>
                          {action.icon}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Recent Bookings Section */}
          <Card 
            title="Recent Bookings" 
            className="h-full shadow-sm border-0 mt-6"
            style={{ borderRadius: '12px' }}
          >
            {bookingsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarOutlined className="text-4xl text-gray-300 mb-2" />
                <p className="text-gray-500">No bookings found</p>
              </div>
            ) : (
            <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    <div>
                      <p className="font-medium text-gray-800">{booking.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(booking.checkInDate).format('DD MMM YYYY')} - {dayjs(booking.checkOutDate).format('DD MMM YYYY')}
                      </p>
                  </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">৳{booking.totalBill?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{booking.nights} night{booking.nights > 1 ? 's' : ''}</p>
                    </div>
                </div>
              ))}
            </div>
            )}
          </Card>
        </div>
      );
    }

    const selectedItem = menuItems.find((item) => item.key === selectedMenu);
    if (selectedItem) {
      return selectedItem.component({ hotelID });
    }

    // Fallback to dashboard
    return (
      <div className="p-6">
        <h2>Page not found</h2>
        <p>The requested page could not be loaded.</p>
      </div>
    );
  };

  const renderMenuItems = (isCollapsed = false) => {
    return (
      <Menu
        theme="light"
        mode="inline"
        inlineCollapsed={isCollapsed}
        selectedKeys={[selectedMenu]}
        onClick={handleMenuClick}
        style={{ 
          background: "transparent",
          borderRight: "none",
          padding: "8px 4px",
        }}
        className="custom-sidebar-menu"
      >
        {menuItems.map((item) => (
          <Menu.Item
            key={item.key}
            icon={item.icon}
            title={isCollapsed ? item.label : undefined}
            style={{
              margin: "4px 0",
              borderRadius: "8px",
              padding: isCollapsed ? "10px 16px" : "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              transition: "all 0.3s ease",
              color: selectedMenu === item.key ? "#ffffff" : "#64748b",
              background: selectedMenu === item.key 
                ? "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)" 
                : "transparent",
            }}
            className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50"
          >
            {!isCollapsed && <span className="ml-2">{item.label}</span>}
          </Menu.Item>
        ))}
      </Menu>
    );
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'help',
      label: 'Help & Support',
      icon: <QuestionCircleOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        breakpoint="lg"
        collapsedWidth={60}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8fcff 100%)",
          boxShadow: "2px 0 15px rgba(14, 165, 233, 0.1)",
          borderRight: "1px solid rgba(14, 165, 233, 0.08)",
          overflow: "hidden",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="hidden lg:block"
      >
        <div className="flex items-center justify-center py-3 h-14 border-b border-cyan-100">
          <div className={`transition-all duration-200 ${collapsed ? 'w-8' : 'w-36'}`}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <div className="text-white text-sm font-bold">S</div>
              </div>
              {!collapsed && (
                <div className="text-left">
                  <h2 className="text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Sea Shore
                  </h2>
                  <p className="text-[10px] text-gray-400 leading-none">Hotel</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="py-1 px-0 h-[calc(100vh-56px)] overflow-y-auto">
          {renderMenuItems(collapsed)}
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout style={{ 
        marginLeft: collapsed ? 60 : 200,
        transition: "margin-left 0.2s ease",
        minHeight: "100vh",
      }}>
        {/* Header */}
        <Header
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
            padding: "0 16px",
            height: topbarCollapsed ? "40px" : "56px",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            position: "fixed",
            top: 0,
            left: collapsed ? 60 : 200,
            right: 0,
            zIndex: 99,
            transition: "all 0.3s ease",
          }}
          className="flex justify-between items-center shadow-sm transition-all duration-300"
        >
          {/* Left side */}
          <div className="flex items-center justify-center flex-1">
            {userInfo && !topbarCollapsed && (
              <div className="flex items-center gap-3">
                <Avatar
                  size={36}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#0ea5e9",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                />
                <div className="text-left">
                  <p className="text-white font-semibold m-0 text-sm">
                    {userInfo.username || userInfo.name || "User"}
                  </p>
                  <p className="text-cyan-100 text-xs m-0">
                    {userInfo.role?.label || "User"}
                  </p>
                </div>
                <div className="h-6 w-px bg-white/30 mx-2" />
                <div className="text-left">
                  <p className="text-white text-xs m-0">Hotel:</p>
                  <p className="text-white font-bold m-0 text-sm">{'Hotel Sea Shore'}</p>
                </div>
              </div>
            )}
            {topbarCollapsed && userInfo && (
              <div className="flex items-center gap-2">
                <Avatar
                  size={28}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#0ea5e9",
                    border: "2px solid white"
                  }}
                />
                <span className="text-white font-medium text-xs">
                  {userInfo.username || "User"}
                </span>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!topbarCollapsed && (
              <Button
                type="text"
                icon={<BellOutlined className="text-white text-base" />}
                className="hover:bg-white/10 relative p-2"
                style={{ color: "white" }}
              >
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
              </Button>
            )}
            
            <Tooltip title={topbarCollapsed ? "Expand Topbar" : "Collapse Topbar"}>
              <Button
                type="text"
                icon={topbarCollapsed ? <DownOutlined /> : <UpOutlined />}
                onClick={toggleTopbar}
                className="hover:bg-white/10 p-2"
                style={{ color: "white" }}
              />
            </Tooltip>

            {!topbarCollapsed && (
              <Dropdown
                menu={{
                  items: userMenuItems,
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="text"
                  icon={<SettingOutlined className="text-white text-base" />}
                  className="hover:bg-white/10 p-2"
                  style={{ color: "white" }}
                />
              </Dropdown>
            )}
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: "8px",
            marginTop: topbarCollapsed ? "48px" : "64px",
            padding: 0,
            minHeight: "calc(100vh - 90px)",
            transition: "margin-top 0.3s ease",
          }}
          className="responsive-content"
        >
          <div className="p-3 sm:p-4 md:p-5 bg-white rounded-lg shadow-sm border border-gray-100 min-h-[calc(100vh-110px)]">
            {renderContent()}
          </div>
        </Content>

        {/* Status Bar */}
        <div className="px-2 sm:px-3 py-1.5 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] sm:text-xs text-gray-600">System Online</span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500">
            <span className="hidden sm:inline">Hotel Name: </span>
            <span className="font-semibold text-cyan-600">{"Hotel Sea Shore"}</span>
          </div>
        </div>
      </Layout>

      {/* Mobile Drawer */}
      <Drawer
        open={drawerVisible}
        onClose={closeDrawer}
        placement="left"
        width={240}
        bodyStyle={{ 
          padding: 0,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fcff 100%)",
        }}
        headerStyle={{ 
          padding: "12px",
          background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
          borderBottom: "none"
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <div className="text-white text-base font-bold">S</div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white m-0">Sea Shore</h2>
              <p className="text-xs text-cyan-100 m-0">Hotel Management</p>
            </div>
          </div>
        }
      >
        {renderMenuItems(false)}
      </Drawer>

      {/* Detail Modal */}
      <DetailModal />
    </Layout>
  );
};

const Dashboard = ({ sliders }) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl animate-spin flex items-center justify-center">
              <div className="text-white text-lg font-bold">S</div>
            </div>
          </div>
          <p className="text-sm text-cyan-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent sliders={sliders} />
    </Suspense>
  );
};

export default Dashboard;