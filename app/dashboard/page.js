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
  Switch,
  Radio,
  Space,
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
  ThunderboltOutlined,
  MenuOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
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
const DashboardCard = ({ title, value, icon, color, bgColor = 'white', gradient, bgGradient }) => (
  <Card 
    className="h-full shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105"
    style={{ 
      background: bgGradient || gradient || "#ffffff",
      borderRadius: '12px',
      overflow: 'hidden',
      border: "none",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      position: "relative",
    }}
    bodyStyle={{ padding: "18px" }}
  >
    {/* Decorative overlay */}
    <div 
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "100px",
        height: "100px",
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "50%",
        transform: "translate(30px, -30px)",
        pointerEvents: "none",
      }}
    />
    <div className="flex items-center justify-between relative z-10">
      <div className="flex-1">
        <Text
          className="text-xs block mb-2"
          style={{ 
            fontSize: "11px", 
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.9)",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          {title}
        </Text>
        <Title
          level={4}
          className="m-0"
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: "1.3",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        >
            {value}
          </Title>
        </div>
      <div
        className="p-2.5 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(10px)",
          minWidth: "48px",
          height: "48px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ fontSize: "20px", color: "#ffffff" }}>
        {icon}
        </div>
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
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [settingsSidebarCollapsed, setSettingsSidebarCollapsed] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [themeColor, setThemeColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('themeColor') || 'golden';
    }
    return 'golden';
  });
  const [cardColorScheme, setCardColorScheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cardColorScheme') || 'gradient';
    }
    return 'gradient';
  });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailModalType, setDetailModalType] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    todayBookingAmount: 0,
    currentMonthBookingAmount: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    todayOccupancyRate: 0,
    currentMonthOccupancyRate: 0,
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
    let todayBookingAmount = 0;
    let currentMonthBookingAmount = 0;
    let todayCheckIns = 0;
    let todayCheckOuts = 0;
    let todayActiveBookings = 0;
    let currentMonthActiveBookings = 0;

    bookingsData.forEach((booking) => {
      // Parse dates properly
      const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
      const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
      
      // Get booking details
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

    // Calculate occupancy rates (assuming max 10 rooms available)
    // TODO: Get from hotel data
    const maxRooms = 10;
    const todayOccupancyRate = todayActiveBookings > 0 
      ? Math.min(100, Math.round((todayActiveBookings / maxRooms) * 100))
      : 0;
    const currentMonthOccupancyRate = currentMonthActiveBookings > 0
      ? Math.min(100, Math.round((currentMonthActiveBookings / maxRooms) * 100))
      : 0;

    setDashboardStats({
      todayBookingAmount,
      currentMonthBookingAmount,
      todayCheckIns,
      todayCheckOuts,
      todayOccupancyRate,
      currentMonthOccupancyRate,
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

  // Handle window resize for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const toggleSettingsSidebar = () => setSettingsSidebarCollapsed(!settingsSidebarCollapsed);

  // Handle dark mode toggle
  const handleDarkModeToggle = (checked) => {
    setDarkMode(checked);
    localStorage.setItem('darkMode', checked.toString());
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle theme color change
  const handleThemeColorChange = (value) => {
    setThemeColor(value);
    localStorage.setItem('themeColor', value);
  };

  // Handle card color scheme change
  const handleCardColorSchemeChange = (value) => {
    setCardColorScheme(value);
    localStorage.setItem('cardColorScheme', value);
  };

  // Initialize dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      // Dashboard View - Only 6 cards
      const currentMonthName = dayjs().format("MMMM");
      
      const dashboardCards = [
        {
          title: "Today's Booking Amount",
          value: `৳${dashboardStats.todayBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
        },
        {
          title: `Current Month (${currentMonthName}) Booking Amount`,
          value: `৳${dashboardStats.currentMonthBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
        },
        {
          title: "Today's Check-ins",
          value: dashboardStats.todayCheckIns.toString(),
          icon: <UserOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%)",
        },
        {
          title: "Today's Check-outs",
          value: dashboardStats.todayCheckOuts.toString(),
          icon: <CalendarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)",
        },
        {
          title: "Today's Occupancy Rate",
          value: `${dashboardStats.todayOccupancyRate}%`,
          icon: <HomeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)",
        },
        {
          title: "Current Month Occupancy Rate",
          value: `${dashboardStats.currentMonthOccupancyRate}%`,
          icon: <HomeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
        },
      ];

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-4">
            <Title
              level={2}
              className={`m-0 mb-1 ${darkMode ? 'text-white' : ''}`}
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: darkMode ? "#ffffff" : "#1f2937",
              }}
            >
              Dashboard
            </Title>
            <Text className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Overview of your hotel's performance
            </Text>
          </div>

          {/* Stats Cards Grid - Only 6 Cards */}
          <Row gutter={[12, 12]}>
            {dashboardCards.map((card, idx) => (
              <Col xs={24} sm={12} md={12} lg={6} key={idx}>
              {bookingsLoading ? (
                  <Card className="h-full shadow-sm border-0" style={{ borderRadius: '8px' }}>
                    <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              ) : (
                <DashboardCard
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    bgGradient={card.bgGradient}
                    gradient={card.gradient}
                />
              )}
            </Col>
            ))}
          </Row>
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
        theme={darkMode ? "dark" : "light"}
        mode="inline"
        inlineCollapsed={isCollapsed}
        selectedKeys={[selectedMenu]}
        onClick={handleMenuClick}
        style={{ 
          background: "transparent",
          borderRight: "none",
          padding: "8px 4px",
        }}
        className={`custom-sidebar-menu ${darkMode ? 'dark-menu' : ''}`}
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
              color: selectedMenu === item.key 
                ? "#ffffff" 
                : darkMode ? "#d1d5db" : "#64748b",
              background: selectedMenu === item.key 
                ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" 
                : "transparent",
            }}
            className={darkMode 
              ? "hover:!bg-gray-700/50 dark:hover:!bg-gray-700/50" 
              : "hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50"}
          >
            {!isCollapsed && (
              <span 
                className="ml-2"
                style={{
                  color: selectedMenu === item.key 
                    ? "#ffffff" 
                    : darkMode ? "#d1d5db" : "#64748b",
                }}
              >
                {item.label}
              </span>
            )}
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
    <Layout className={`min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        breakpoint="lg"
        collapsedWidth={60}
        style={{
          background: darkMode 
            ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
            : "linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)",
          boxShadow: darkMode 
            ? "2px 0 15px rgba(0, 0, 0, 0.3)" 
            : "2px 0 15px rgba(217, 119, 6, 0.1)",
          borderRight: darkMode 
            ? "1px solid rgba(255, 255, 255, 0.1)" 
            : "1px solid rgba(217, 119, 6, 0.08)",
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
        <div className={`flex items-center justify-center py-3 h-14 border-b ${darkMode ? 'border-gray-700' : 'border-amber-100'}`}>
          <img 
            src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
            alt="Hotel Sea Shore Logo" 
            className="h-14 w-auto object-contain"
          />
        </div>

        <div className="py-1 px-0 h-[calc(100vh-56px)] overflow-y-auto">
          {renderMenuItems(collapsed)}
        </div>
      </Sider>

      {/* Main Layout */}
      <Layout 
        className="lg:ml-0"
        style={{ 
          marginLeft: isMobile ? 0 : (collapsed ? 60 : 200),
          marginRight: isMobile ? 0 : (settingsSidebarCollapsed ? 0 : 200),
          transition: "all 0.2s ease",
        minHeight: "100vh",
        }}
      >
        {/* Header */}
        <Header
          className="flex justify-between items-center shadow-sm transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
            padding: "0 12px",
            height: topbarCollapsed ? "40px" : "56px",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            position: "fixed",
            top: 0,
            left: isMobile ? 0 : (collapsed ? 60 : 200),
            right: isMobile ? 0 : (settingsSidebarCollapsed ? 0 : 200),
            zIndex: 99,
            transition: "all 0.3s ease",
            width: isMobile 
              ? "100%"
              : `calc(100% - ${collapsed ? 60 : 200}px - ${settingsSidebarCollapsed ? 0 : 200}px)`,
          }}
        >
          {/* Left side - Mobile Menu Button + User Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <Button
              type="text"
              icon={<MenuOutlined className="text-white text-lg" />}
              onClick={showDrawer}
              className="lg:hidden hover:bg-white/10 p-2"
              style={{ color: "white", minWidth: "auto" }}
            />
            
            {/* Logo on Mobile */}
            <div className="lg:hidden flex items-center">
              <img 
                src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
                alt="Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>

            {/* User Info - Hidden on mobile when topbar collapsed, shown on desktop */}
            {userInfo && !topbarCollapsed && (
              <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                <Avatar
                  size={36}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#d97706",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                />
                <div className="text-left min-w-0">
                  <p className="text-white font-semibold m-0 text-xs lg:text-sm truncate">
                    {userInfo.username || userInfo.name || "User"}
                  </p>
                  <p className="text-amber-100 text-[10px] lg:text-xs m-0 truncate">
                    {userInfo.role?.label || "User"}
                  </p>
                </div>
                <div className="hidden lg:block h-6 w-px bg-white/30 mx-2" />
                <div className="hidden lg:block text-left">
                  <p className="text-white text-xs m-0">Hotel:</p>
                  <p className="text-white font-bold m-0 text-sm">{'Hotel Sea Shore'}</p>
                </div>
              </div>
            )}
            {topbarCollapsed && userInfo && (
              <div className="hidden md:flex items-center gap-2">
                <Avatar
                  size={28}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#d97706",
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
          <div className="flex items-center gap-1 lg:gap-2">
            {!topbarCollapsed && (
              <Button
                type="text"
                icon={<BellOutlined className="text-white text-base" />}
                className="hidden md:flex hover:bg-white/10 relative p-2"
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
                className="hidden lg:flex hover:bg-white/10 p-2"
                style={{ color: "white" }}
              />
            </Tooltip>

            {/* Settings Button - Always visible */}
            <Tooltip title={settingsSidebarCollapsed ? "Open Settings" : "Close Settings"}>
              <Button
                type="text"
                icon={<SettingOutlined className="text-white text-base" />}
                onClick={toggleSettingsSidebar}
                className="hover:bg-white/10 p-2"
                style={{ color: "white" }}
              />
            </Tooltip>

            {/* User Menu - Desktop only when not collapsed */}
            {!topbarCollapsed && (
              <Dropdown
                menu={{
                  items: userMenuItems,
                }}
                placement="bottomRight"
                trigger={['click']}
                className="hidden lg:block"
              >
                <Button
                  type="text"
                  icon={<UserOutlined className="text-white text-base" />}
                  className="hover:bg-white/10 p-2"
                  style={{ color: "white" }}
                />
              </Dropdown>
            )}
          </div>
        </Header>

        {/* Main Content */}
        <Content
          className="responsive-content"
          style={{
            margin: isMobile ? "4px" : "8px",
            marginTop: topbarCollapsed ? "48px" : "56px",
            padding: 0,
            minHeight: "calc(100vh - 70px)",
            transition: "margin-top 0.3s ease",
          }}
        >
          <div className={`p-2 sm:p-3 md:p-4 lg:p-5 rounded-lg shadow-sm border min-h-[calc(100vh-80px)] ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            {renderContent()}
          </div>
        </Content>

        {/* Status Bar */}
        <div className={`px-2 sm:px-3 py-1.5 backdrop-blur-sm border-t flex justify-between items-center ${
          darkMode 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>System Online</span>
          </div>
          <div className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="hidden sm:inline">Hotel Name: </span>
            <span className={`font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{"Hotel Sea Shore"}</span>
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
          background: darkMode 
            ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
            : "linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)",
        }}
        headerStyle={{ 
          padding: "12px",
          background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
          borderBottom: "none"
        }}
        title={
          <div className="flex items-center justify-center">
            <img 
              src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
              alt="Hotel Sea Shore Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>
        }
      >
        {renderMenuItems(false)}
      </Drawer>

      {/* Detail Modal */}
      <DetailModal />

      {/* Settings Sidebar - Desktop */}
      {!settingsSidebarCollapsed && !isMobile && (
        <Sider
          width={200}
          style={{
            background: darkMode 
              ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
              : "linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)",
            boxShadow: darkMode 
              ? "-2px 0 15px rgba(0, 0, 0, 0.3)" 
              : "-2px 0 15px rgba(217, 119, 6, 0.15)",
            borderLeft: darkMode 
              ? "1px solid rgba(255, 255, 255, 0.1)" 
              : "1px solid rgba(217, 119, 6, 0.1)",
            overflow: "hidden",
            height: "100vh",
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
          className="hidden lg:block"
        >
          {/* Header with Gradient */}
          <div 
            className="flex items-center justify-between px-4"
            style={{
              background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)",
              height: "56px",
              padding: "0 16px",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <SettingOutlined className="text-white text-base" />
              </div>
              <span className="text-sm font-bold text-white">Settings</span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined className="text-white" />}
              onClick={toggleSettingsSidebar}
              className="hover:bg-white/20"
              size="small"
              style={{ color: "white" }}
            />
          </div>

          <div className="py-3 px-3 h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {/* Dark Mode Toggle */}
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
                  borderColor: darkMode ? "#4b5563" : "#fef3c7",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(217, 119, 6, 0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-1.5 rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                        boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                      }}
                    >
                      <ThunderboltOutlined className="text-white text-xs" />
                    </div>
                    <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Dark Mode</Text>
                  </div>
                  <Switch
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                    size="small"
                    style={{
                      background: darkMode ? "#d97706" : undefined,
                    }}
                  />
                </div>
                <Text className={`text-[10px] leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle between light and dark theme
                </Text>
              </div>

              {/* Theme Color Selection */}
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
                  borderColor: darkMode ? "#4b5563" : "#fef3c7",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(217, 119, 6, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                    }}
                  >
                    <AppstoreOutlined className="text-white text-xs" />
                  </div>
                  <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Theme Color</Text>
                </div>
                <Radio.Group
                  value={themeColor}
                  onChange={(e) => handleThemeColorChange(e.target.value)}
                  className="w-full"
                >
                  <Space direction="vertical" className="w-full" size={4}>
                    <Radio value="golden" className="w-full !m-0">
                      <div className="flex items-center gap-2 py-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            boxShadow: "0 2px 4px rgba(217, 119, 6, 0.4)",
                          }}
                        ></div>
                        <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Golden</span>
                      </div>
                    </Radio>
                    <Radio value="blue" className="w-full !m-0">
                      <div className="flex items-center gap-2 py-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.4)",
                          }}
                        ></div>
                        <span className="text-[10px] font-medium text-gray-700">Blue</span>
                      </div>
                    </Radio>
                    <Radio value="green" className="w-full !m-0">
                      <div className="flex items-center gap-2 py-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.4)",
                          }}
                        ></div>
                        <span className="text-[10px] font-medium text-gray-700">Green</span>
                      </div>
                    </Radio>
                    <Radio value="purple" className="w-full !m-0">
                      <div className="flex items-center gap-2 py-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                            boxShadow: "0 2px 4px rgba(168, 85, 247, 0.4)",
                          }}
                        ></div>
                        <span className="text-[10px] font-medium text-gray-700">Purple</span>
                      </div>
                    </Radio>
                    <Radio value="red" className="w-full !m-0">
                      <div className="flex items-center gap-2 py-1">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)",
                          }}
                        ></div>
                        <span className="text-[10px] font-medium text-gray-700">Red</span>
                      </div>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              {/* Card Color Scheme */}
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
                  borderColor: darkMode ? "#4b5563" : "#fef3c7",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(217, 119, 6, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                    }}
                  >
                    <BgColorsOutlined className="text-white text-xs" />
                  </div>
                  <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Card Style</Text>
                </div>
                <Radio.Group
                  value={cardColorScheme}
                  onChange={(e) => handleCardColorSchemeChange(e.target.value)}
                  className="w-full"
                >
                  <Space direction="vertical" className="w-full" size={4}>
                    <Radio value="gradient" className="w-full !m-0">
                      <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gradient</span>
                    </Radio>
                    <Radio value="solid" className="w-full !m-0">
                      <span className="text-[10px] font-medium text-gray-700">Solid</span>
                    </Radio>
                    <Radio value="minimal" className="w-full !m-0">
                      <span className="text-[10px] font-medium text-gray-700">Minimal</span>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              {/* Additional Settings */}
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
                  borderColor: darkMode ? "#4b5563" : "#fef3c7",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(217, 119, 6, 0.08)",
                }}
              >
                <Text className={`text-xs font-bold mb-3 block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Preferences</Text>
                <Space direction="vertical" className="w-full" size={6}>
                  <div className="flex items-center justify-between w-full py-1">
                    <Text className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Compact View</Text>
                    <Switch size="small" />
                  </div>
                  <div className="flex items-center justify-between w-full py-1">
                    <Text className="text-[10px] font-medium text-gray-600">Animations</Text>
                    <Switch size="small" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between w-full py-1">
                    <Text className="text-[10px] font-medium text-gray-600">Auto Refresh</Text>
                    <Switch size="small" defaultChecked />
                  </div>
                </Space>
              </div>

              {/* Reset Button */}
              <Button
                type="default"
                block
                onClick={() => {
                  setDarkMode(false);
                  setThemeColor('golden');
                  setCardColorScheme('gradient');
                  localStorage.setItem('darkMode', 'false');
                  localStorage.setItem('themeColor', 'golden');
                  localStorage.setItem('cardColorScheme', 'gradient');
                  document.documentElement.classList.remove('dark');
                }}
                className="mt-2"
                size="small"
                style={{
                  background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
                  border: "none",
                  color: "white",
                  fontWeight: 600,
                  boxShadow: "0 2px 4px rgba(217, 119, 6, 0.3)",
                }}
              >
                Reset Defaults
              </Button>
            </div>
          </div>
        </Sider>
      )}

      {/* Settings Drawer - Mobile */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined className="text-white" />
            <span className="text-base font-semibold text-white">Settings</span>
          </div>
        }
        placement="right"
        onClose={() => setSettingsSidebarCollapsed(true)}
        open={!settingsSidebarCollapsed && isMobile}
        width={280}
        bodyStyle={{ 
          padding: "16px",
          background: darkMode 
            ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
            : "linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)",
        }}
        headerStyle={{ 
          background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
          borderBottom: "none",
        }}
        styles={{
          header: { color: "white" },
        }}
      >
        <div className="space-y-3">
          {/* Dark Mode Toggle */}
          <div 
            className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
            style={{
              background: darkMode 
                ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
              borderColor: darkMode ? "#4b5563" : "#fef3c7",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                : "0 2px 4px rgba(217, 119, 6, 0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                  }}
                >
                  <ThunderboltOutlined className="text-white text-xs" />
                </div>
                <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Dark Mode</Text>
              </div>
              <Switch
                checked={darkMode}
                onChange={handleDarkModeToggle}
                checkedChildren="ON"
                unCheckedChildren="OFF"
                size="small"
                style={{
                  background: darkMode ? "#d97706" : undefined,
                }}
              />
            </div>
            <Text className={`text-[10px] leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Toggle between light and dark theme
            </Text>
          </div>

          {/* Theme Color Selection */}
          <div 
            className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
            style={{
              background: darkMode 
                ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
              borderColor: darkMode ? "#4b5563" : "#fef3c7",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                : "0 2px 4px rgba(217, 119, 6, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                }}
              >
                <AppstoreOutlined className="text-white text-xs" />
              </div>
              <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Theme Color</Text>
            </div>
            <Radio.Group
              value={themeColor}
              onChange={(e) => handleThemeColorChange(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full" size={4}>
                <Radio value="golden" className="w-full !m-0">
                  <div className="flex items-center gap-2 py-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        boxShadow: "0 2px 4px rgba(217, 119, 6, 0.4)",
                      }}
                    ></div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Golden</span>
                  </div>
                </Radio>
                <Radio value="blue" className="w-full !m-0">
                  <div className="flex items-center gap-2 py-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.4)",
                      }}
                    ></div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Blue</span>
                  </div>
                </Radio>
                <Radio value="green" className="w-full !m-0">
                  <div className="flex items-center gap-2 py-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: "0 2px 4px rgba(16, 185, 129, 0.4)",
                      }}
                    ></div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Green</span>
                  </div>
                </Radio>
                <Radio value="purple" className="w-full !m-0">
                  <div className="flex items-center gap-2 py-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                        boxShadow: "0 2px 4px rgba(168, 85, 247, 0.4)",
                      }}
                    ></div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Purple</span>
                  </div>
                </Radio>
                <Radio value="red" className="w-full !m-0">
                  <div className="flex items-center gap-2 py-1">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)",
                      }}
                    ></div>
                    <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Red</span>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* Card Color Scheme */}
          <div 
            className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
            style={{
              background: darkMode 
                ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                : "linear-gradient(135deg, #ffffff 0%, #fef9f3 100%)",
              borderColor: darkMode ? "#4b5563" : "#fef3c7",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                : "0 2px 4px rgba(217, 119, 6, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 2px 4px rgba(251, 191, 36, 0.3)",
                }}
              >
                <BgColorsOutlined className="text-white text-xs" />
              </div>
              <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Card Style</Text>
            </div>
            <Radio.Group
              value={cardColorScheme}
              onChange={(e) => handleCardColorSchemeChange(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full" size={4}>
                <Radio value="gradient" className="w-full !m-0">
                  <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gradient</span>
                </Radio>
                <Radio value="solid" className="w-full !m-0">
                  <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Solid</span>
                </Radio>
                <Radio value="minimal" className="w-full !m-0">
                  <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Minimal</span>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {/* Reset Button */}
          <Button
            type="default"
            block
            onClick={() => {
              setDarkMode(false);
              setThemeColor('golden');
              setCardColorScheme('gradient');
              localStorage.setItem('darkMode', 'false');
              localStorage.setItem('themeColor', 'golden');
              localStorage.setItem('cardColorScheme', 'gradient');
              document.documentElement.classList.remove('dark');
            }}
            className="mt-2"
            size="small"
            style={{
              background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
              border: "none",
              color: "white",
              fontWeight: 600,
              boxShadow: "0 2px 4px rgba(217, 119, 6, 0.3)",
            }}
          >
            Reset Defaults
          </Button>
        </div>
      </Drawer>
    </Layout>
  );
};

const Dashboard = ({ sliders }) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3">
            <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl animate-spin flex items-center justify-center">
              <div className="text-white text-lg font-bold">S</div>
            </div>
          </div>
          <p className="text-sm text-amber-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent sliders={sliders} />
    </Suspense>
  );
};

export default Dashboard;