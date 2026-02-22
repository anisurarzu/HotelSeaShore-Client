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
  ShoppingCartOutlined,
  CoffeeOutlined,
  ShopOutlined,
  AppstoreAddOutlined,
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
import DailyStatement from "@/component/DailyStatement";
// Restaurant components
import RestaurantDashboard from "@/component/restaurant/RestaurantDashboard";
import Orders from "@/component/restaurant/Orders";
import RestaurantMenu from "@/component/restaurant/Menu";
import Tables from "@/component/restaurant/Tables";
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

// Hotel menu items
const hotelMenuItems = [
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
    key: "11",
    label: "Daily Statement",
    icon: <FileTextOutlined className="text-base" />,
    component: () => <DailyStatement />,
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

// Restaurant menu items
const restaurantMenuItems = [
  {
    key: "1",
    label: "Dashboard",
    icon: <DashboardOutlined className="text-base" />,
    component: (props) => <RestaurantDashboard {...props} />,
  },
  {
    key: "20",
    label: "Orders",
    icon: <ShoppingCartOutlined className="text-base" />,
    component: () => <Orders />,
  },
  {
    key: "21",
    label: "Menu",
    icon: <AppstoreAddOutlined className="text-base" />,
    component: () => <RestaurantMenu />,
  },
  {
    key: "22",
    label: "Tables",
    icon: <ShopOutlined className="text-base" />,
    component: () => <Tables />,
  },
  {
    key: "23",
    label: "Reports",
    icon: <BarChartOutlined className="text-base" />,
    component: () => <div className="p-6"><h2 className="text-xl font-bold">Restaurant Reports</h2><p>Restaurant reports and analytics will be displayed here.</p></div>,
  },
  {
    key: "101",
    label: "Expense",
    icon: <WalletOutlined className="text-base" />,
    component: () => <ExpenseInfo />,
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
const DashboardCard = ({ title, value, icon, color, bgColor = 'white', gradient, bgGradient }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  return (
    <Card 
      className="h-full shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105"
      style={{ 
        background: bgGradient || gradient || "#ffffff",
        borderRadius: isMobile ? '10px' : '12px',
        overflow: 'hidden',
        border: "none",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        position: "relative",
      }}
      bodyStyle={{ padding: isMobile ? "14px" : "18px" }}
    >
      {/* Decorative overlay */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: isMobile ? "80px" : "100px",
          height: isMobile ? "80px" : "100px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          transform: "translate(30px, -30px)",
          pointerEvents: "none",
        }}
      />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <Text
            className="block mb-1 sm:mb-2"
            style={{ 
              fontSize: isMobile ? "10px" : "11px", 
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.9)",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              lineHeight: "1.3",
            }}
          >
            {title}
          </Text>
          <Title
            level={4}
            className="m-0"
            style={{
              fontSize: isMobile ? "18px" : "22px",
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
          className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(10px)",
            minWidth: isMobile ? "40px" : "48px",
            height: isMobile ? "40px" : "48px",
            padding: isMobile ? "8px" : "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginLeft: "8px",
          }}
        >
          <div style={{ fontSize: isMobile ? "16px" : "20px", color: "#ffffff" }}>
          {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

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
      return localStorage.getItem('themeColor') || 'blue';
    }
    return 'blue';
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

  // Check if restaurant portal
  const [isRestaurant, setIsRestaurant] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isRestaurant') === 'true';
    }
    return false;
  });

  // Get hotelID from URL
  const hotelID = searchParams.get("hotelID");
  const [hotelName, setHotelName] = useState("Sea Shore");

  // Fetch hotel name when hotelID is present (from URL or userInfo)
  useEffect(() => {
    const effectiveHotelID = hotelID || userInfo?.hotelID;
    if (!effectiveHotelID || isRestaurant) return;
    const fetchHotelName = async () => {
      try {
        const response = await coreAxios.get(`/hotels/${effectiveHotelID}`);
        if (response?.status === 200 && response?.data?.success && response?.data?.data) {
          const name = response.data.data.hotelName || response.data.data.name;
          if (name) setHotelName(name);
        }
      } catch (err) {
        console.error("Error fetching hotel name:", err);
      }
    };
    fetchHotelName();
  }, [hotelID, userInfo?.hotelID, isRestaurant]);

  // Get menu items based on portal type
  const menuItems = isRestaurant ? restaurantMenuItems : hotelMenuItems;

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
    router.push("/");
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
        width: isMobile ? 120 : 150,
        render: (text) => <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="font-medium">{text || 'N/A'}</span>,
      },
      {
        title: 'Check-in',
        dataIndex: 'checkInDate',
        key: 'checkInDate',
        width: isMobile ? 80 : 100,
        render: (date) => (
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="text-gray-600">
            {dayjs(date).tz("Asia/Dhaka").format('DD MMM YY')}
          </span>
        ),
      },
      {
        title: 'Check-out',
        dataIndex: 'checkOutDate',
        key: 'checkOutDate',
        width: isMobile ? 80 : 100,
        render: (date) => (
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="text-gray-600">
            {dayjs(date).tz("Asia/Dhaka").format('DD MMM YY')}
          </span>
        ),
      },
      {
        title: 'Nights',
        dataIndex: 'nights',
        key: 'nights',
        width: isMobile ? 50 : 60,
        align: 'center',
        render: (nights) => <span style={{ fontSize: isMobile ? '10px' : '12px' }}>{nights || 1}</span>,
      },
      {
        title: 'Total Bill',
        dataIndex: 'totalBill',
        key: 'totalBill',
        width: isMobile ? 90 : 100,
        align: 'right',
        render: (amount) => (
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="font-semibold text-green-600">
            ৳{Number(amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        title: 'Advance',
        dataIndex: 'advancePayment',
        key: 'advancePayment',
        width: isMobile ? 80 : 90,
        align: 'right',
        render: (amount) => (
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="text-blue-600">
            ৳{Number(amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        title: 'Due',
        dataIndex: 'duePayment',
        key: 'duePayment',
        width: isMobile ? 80 : 90,
        align: 'right',
        render: (amount) => (
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="text-orange-600">
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
        width={isMobile ? '95%' : 900}
        className="detail-modal"
        styles={{
          header: { padding: isMobile ? '10px 12px' : '12px 16px', borderBottom: '1px solid #f0f0f0' },
          body: { padding: isMobile ? '10px 12px' : '12px 16px', maxHeight: isMobile ? '75vh' : '70vh', overflowY: 'auto' },
        }}
      >
        <div className="space-y-4">
          {/* Summary Cards */}
          <Row gutter={isMobile ? [8, 8] : [12, 12]}>
            <Col xs={12} sm={6}>
              <div className="bg-blue-50 p-2 rounded border border-blue-100" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Bookings</p>
                <p className="font-bold text-blue-600" style={{ fontSize: isMobile ? '11px' : '13px' }}>{summary.count}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-green-50 p-2 rounded border border-green-100" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Revenue</p>
                <p className="font-bold text-green-600" style={{ fontSize: isMobile ? '11px' : '13px' }}>৳{summary.totalBill.toLocaleString()}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-blue-50 p-2 rounded border border-blue-100" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Nights</p>
                <p className="font-bold text-blue-600" style={{ fontSize: isMobile ? '11px' : '13px' }}>{summary.totalNights}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-orange-50 p-2 rounded border border-orange-100" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Due Amount</p>
                <p className="font-bold text-orange-600" style={{ fontSize: isMobile ? '11px' : '13px' }}>৳{summary.totalDue.toLocaleString()}</p>
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
              scroll={{ x: isMobile ? 600 : 700 }}
              className="text-xs"
              style={{ fontSize: isMobile ? '10px' : '12px' }}
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
      
      // Restaurant dashboard cards - Light green theme
      const restaurantDashboardCards = [
        {
          title: "Today's Revenue",
          value: `৳${dashboardStats.todayBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
        },
        {
          title: `Current Month (${currentMonthName}) Revenue`,
          value: `৳${dashboardStats.currentMonthBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
        },
        {
          title: "Today's Orders",
          value: dashboardStats.todayCheckIns.toString(),
          icon: <ShoppingCartOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)",
        },
        {
          title: "Active Tables",
          value: dashboardStats.todayCheckOuts.toString(),
          icon: <ShopOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
        },
        {
          title: "Today's Table Occupancy",
          value: `${dashboardStats.todayOccupancyRate}%`,
          icon: <CoffeeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
        },
        {
          title: "Current Month Occupancy",
          value: `${dashboardStats.currentMonthOccupancyRate}%`,
          icon: <CoffeeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
        },
      ];

      // Hotel dashboard cards
      const hotelDashboardCards = [
        {
          title: "Today's Booking Amount",
          value: `৳${dashboardStats.todayBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)",
        },
        {
          title: `Current Month (${currentMonthName}) Booking Amount`,
          value: `৳${dashboardStats.currentMonthBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
        },
        {
          title: "Today's Check-ins",
          value: dashboardStats.todayCheckIns.toString(),
          icon: <UserOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)",
        },
        {
          title: "Today's Check-outs",
          value: dashboardStats.todayCheckOuts.toString(),
          icon: <CalendarOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
        },
        {
          title: "Today's Occupancy Rate",
          value: `${dashboardStats.todayOccupancyRate}%`,
          icon: <HomeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)",
        },
        {
          title: "Current Month Occupancy Rate",
          value: `${dashboardStats.currentMonthOccupancyRate}%`,
          icon: <HomeOutlined className="text-xl" />,
          color: "#ffffff",
          bgGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)",
        },
      ];

      const dashboardCards = isRestaurant ? restaurantDashboardCards : hotelDashboardCards;

      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-3 sm:mb-4">
            <Title
              level={2}
              className={`m-0 mb-1 ${darkMode ? 'text-white' : ''}`}
              style={{
                fontSize: isMobile ? "20px" : "24px",
                fontWeight: 600,
                color: darkMode ? "#ffffff" : "#1f2937",
              }}
            >
              Dashboard
            </Title>
          </div>

          {/* Stats Cards Grid - Only 6 Cards */}
          <Row gutter={isMobile ? [8, 8] : [12, 12]}>
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
              padding: isCollapsed ? "10px 16px" : (isMobile ? "14px 16px" : "12px 16px"),
              fontSize: isMobile ? "14px" : "13px",
              fontWeight: 500,
              height: isMobile ? "48px" : "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              transition: "all 0.3s ease",
              color: selectedMenu === item.key 
                ? "#ffffff" 
                : darkMode ? "#d1d5db" : "#64748b",
              background: selectedMenu === item.key 
                ? (isRestaurant 
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)")
                : "transparent",
            }}
            className={darkMode 
              ? "hover:!bg-gray-700/50 dark:hover:!bg-gray-700/50" 
              : (isRestaurant
                  ? "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                  : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50")}
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
    <Layout className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`}>
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
            : (isRestaurant
                ? "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)"
                : "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)"),
          boxShadow: darkMode 
            ? "2px 0 15px rgba(0, 0, 0, 0.3)" 
            : (isRestaurant
                ? "2px 0 15px rgba(16, 185, 129, 0.1)"
                : "2px 0 15px rgba(59, 130, 246, 0.1)"),
          borderRight: darkMode 
            ? "1px solid rgba(255, 255, 255, 0.1)" 
            : (isRestaurant
                ? "1px solid rgba(16, 185, 129, 0.08)"
                : "1px solid rgba(59, 130, 246, 0.08)"),
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
        <div className={`flex items-center justify-center py-3 h-14 border-b ${darkMode ? 'border-gray-700' : 'border-blue-100'}`}>
          <img 
            src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
            alt="Hotel Sea Shore Logo" 
            className="h-16 w-auto object-contain"
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
            background: isRestaurant 
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            padding: isMobile ? "0 6px" : "0 10px",
            height: isMobile ? (topbarCollapsed ? "40px" : "52px") : (topbarCollapsed ? "36px" : "48px"),
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
              icon={<MenuOutlined className="text-white text-sm" />}
              onClick={showDrawer}
              className="lg:hidden hover:bg-white/10"
              style={{ 
                color: "white", 
                minWidth: "auto",
                padding: isMobile ? "6px" : "4px",
                minHeight: isMobile ? "32px" : "auto"
              }}
            />
            
            {/* Logo on Mobile */}
            <div className="lg:hidden flex items-center">
              <img 
                src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
                alt="Logo" 
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </div>

            {/* User Info - Hidden on mobile when topbar collapsed, shown on desktop */}
            {userInfo && !topbarCollapsed && (
              <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                <Avatar
                  size={32}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#3b82f6",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                />
                <div className="text-left min-w-0">
                  {/* <p className="text-white font-semibold m-0 text-[10px] lg:text-xs truncate">
                    {userInfo.username || userInfo.name || "User"}
                  </p> */}
                  <p className="text-blue-100 text-[9px] lg:text-[10px] m-0 truncate">
                    {userInfo.role?.label || "User"}
                  </p>
                </div>
                <div className="hidden lg:block h-5 w-px bg-white/30 mx-2" />
                <div className="hidden lg:block text-left">
                  <p className="text-white text-[20px] m-0">{isRestaurant ? 'Sea Shore Restaurant' : 'Hotel Sea Shore'}</p>
                
                </div>
              </div>
            )}
            {topbarCollapsed && userInfo && (
              <div className="hidden md:flex items-center gap-2">
                <Avatar
                  size={24}
                  src={userInfo.image}
                  icon={!userInfo.image && <UserOutlined />}
                  style={{ 
                    backgroundColor: "#3b82f6",
                    border: "2px solid white"
                  }}
                />
                <span className="text-white font-medium text-[10px]">
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
                icon={<BellOutlined className="text-white text-sm" />}
                className="hidden md:flex hover:bg-white/10 relative"
                style={{ 
                  color: "white",
                  padding: "4px",
                  minWidth: "28px",
                  minHeight: "28px"
                }}
              >
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
              </Button>
            )}
            
            <Tooltip title={topbarCollapsed ? "Expand Topbar" : "Collapse Topbar"}>
              <Button
                type="text"
                icon={topbarCollapsed ? <DownOutlined className="text-sm" /> : <UpOutlined className="text-sm" />}
                onClick={toggleTopbar}
                className="hidden lg:flex hover:bg-white/10"
                style={{ 
                  color: "white",
                  padding: "4px",
                  minWidth: "28px",
                  minHeight: "28px"
                }}
              />
            </Tooltip>

            {/* Analytics Button - Always visible */}
            <Tooltip title={settingsSidebarCollapsed ? "Open Analytics" : "Close Analytics"}>
              <Button
                type="text"
                icon={<BarChartOutlined className={`text-white ${isMobile ? 'text-xs' : 'text-sm'}`} />}
                onClick={toggleSettingsSidebar}
                className="hover:bg-white/10"
                style={{ 
                  color: "white",
                  padding: isMobile ? "6px" : "4px 8px",
                  minWidth: isMobile ? "28px" : "auto",
                  minHeight: isMobile ? "28px" : "auto"
                }}
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
                  icon={<UserOutlined className="text-white text-sm" />}
                  className="hover:bg-white/10"
                  style={{ 
                    color: "white",
                    padding: "4px",
                    minWidth: "28px",
                    minHeight: "28px"
                  }}
                />
              </Dropdown>
            )}
          </div>
        </Header>

        {/* Main Content */}
        <Content
          className="responsive-content"
          style={{
            margin: isMobile ? "2px" : "8px",
            marginTop: isMobile ? (topbarCollapsed ? "44px" : "56px") : (topbarCollapsed ? "40px" : "52px"),
            padding: 0,
            minHeight: isMobile ? "calc(100vh - 80px)" : "calc(100vh - 70px)",
            transition: "margin-top 0.3s ease",
          }}
        >
          <div className={`rounded-lg shadow-sm border min-h-[calc(100vh-80px)] ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}
          style={{
            padding: isMobile ? "12px 8px" : "16px 20px"
          }}
          >
            {renderContent()}
          </div>
        </Content>

        {/* Status Bar */}
        <div className={`backdrop-blur-sm border-t flex justify-between items-center ${
          darkMode 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-gray-100'
        }`}
        style={{
          padding: isMobile ? '8px 12px' : '12px 16px',
          fontSize: isMobile ? '10px' : '12px'
        }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>System Online</span>
          </div>
          <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            <span className="hidden sm:inline">{isRestaurant ? 'Restaurant: ' : 'Hotel Name: '}</span>
            <span className={`font-semibold ${darkMode ? (isRestaurant ? 'text-emerald-400' : 'text-blue-400') : (isRestaurant ? 'text-emerald-600' : 'text-blue-600')}`}>
              {isRestaurant ? "Sea Shore Restaurant" : hotelName}
            </span>
          </div>
        </div>
      </Layout>

      {/* Mobile Drawer */}
      <Drawer
        open={drawerVisible}
        onClose={closeDrawer}
        placement="left"
        width={isMobile ? 280 : 240}
        bodyStyle={{ 
          padding: 0,
          background: darkMode 
            ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
            : "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
        }}
        headerStyle={{ 
          padding: isMobile ? "16px" : "12px",
          background: isRestaurant
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          borderBottom: "none"
        }}
        title={
          <div className="flex items-center justify-center">
            <img 
              src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
              alt="Hotel Sea Shore Logo" 
              className="h-16 w-auto object-contain"
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
              : (isRestaurant
                  ? "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)"
                  : "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)"),
            boxShadow: darkMode 
              ? "-2px 0 15px rgba(0, 0, 0, 0.3)" 
              : (isRestaurant
                  ? "-2px 0 15px rgba(16, 185, 129, 0.15)"
                  : "-2px 0 15px rgba(217, 119, 6, 0.15)"),
            borderLeft: darkMode 
              ? "1px solid rgba(255, 255, 255, 0.1)" 
              : (isRestaurant
                  ? "1px solid rgba(16, 185, 129, 0.1)"
                  : "1px solid rgba(217, 119, 6, 0.1)"),
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
              background: isRestaurant
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              boxShadow: isRestaurant
                ? "0 2px 8px rgba(16, 185, 129, 0.2)"
                : "0 2px 8px rgba(59, 130, 246, 0.2)",
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
                <BarChartOutlined className="text-white text-base" />
              </div>
              <span className="text-sm font-bold text-white">Analytics</span>
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
                    : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                  borderColor: darkMode ? "#4b5563" : "#dbeafe",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(59, 130, 246, 0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-1.5 rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
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
                      background: darkMode ? "#3b82f6" : undefined,
                    }}
                  />
                </div>
                <Text className={`text-[10px] leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle between light and dark theme
                </Text>
              </div>

              {/* Booking Statistics Pie Chart */}
              {(() => {
                const today = dayjs().tz("Asia/Dhaka");
                const todayStart = today.startOf("day");
                const todayEnd = today.endOf("day");
                
                const activeBookings = bookings.filter(booking => {
                  const checkIn = dayjs(booking.checkInDate).tz("Asia/Dhaka");
                  const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
                  return checkIn.isSameOrBefore(todayEnd, "day") && checkOut.isSameOrAfter(todayStart, "day");
                }).length;
                
                const upcomingBookings = bookings.filter(booking => {
                  const checkIn = dayjs(booking.checkInDate).tz("Asia/Dhaka");
                  return checkIn.isAfter(todayEnd, "day");
                }).length;
                
                const completedBookings = bookings.filter(booking => {
                  const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
                  return checkOut.isBefore(todayStart, "day");
                }).length;
                
                const totalBookings = bookings.length;
                
                const pieData = [
                  { type: 'Active', value: activeBookings, color: '#3b82f6' },
                  { type: 'Upcoming', value: upcomingBookings, color: '#10b981' },
                  { type: 'Completed', value: completedBookings, color: '#6366f1' },
                ].filter(item => item.value > 0);
                
                const pieConfig = {
                  data: pieData,
                  angleField: 'value',
                  colorField: 'type',
                  radius: 0.7,
                  innerRadius: 0.5,
                  label: false,
                  legend: false,
                  interactions: [{ type: 'element-active' }],
                  statistic: {
                    title: {
                      content: 'Total',
                      style: {
                        fontSize: '12px',
                        color: darkMode ? '#d1d5db' : '#666',
                      },
                    },
                    content: {
                      content: totalBookings.toString(),
                      style: {
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: darkMode ? '#ffffff' : '#1f2937',
                      },
                    },
                  },
                  color: pieData.map(d => d.color),
                  height: 180,
                  padding: [10, 10, 10, 10],
                };
                
                return (
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                        : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                      borderColor: darkMode ? "#4b5563" : "#dbeafe",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(59, 130, 246, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                        <BarChartOutlined className="text-white text-xs" />
                  </div>
                      <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Booking Status</Text>
                </div>
                    {bookingsLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} />
                    ) : (
                      <>
                        <Pie {...pieConfig} />
                        <div className="mt-3 space-y-1.5">
                          {pieData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <Text className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {item.type}
                                </Text>
                      </div>
                              <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {item.value}
                              </Text>
                      </div>
                          ))}
                      </div>
                      </>
                    )}
                      </div>
                );
              })()}

              {/* Booking Statistics */}
              {(() => {
                const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalBill) || 0), 0);
                const totalAdvance = bookings.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0);
                const totalDue = bookings.reduce((sum, b) => sum + (Number(b.duePayment) || 0), 0);
                const totalNights = bookings.reduce((sum, b) => sum + (Number(b.nights) || 1), 0);
                
                return (
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                        : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                      borderColor: darkMode ? "#4b5563" : "#dbeafe",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(59, 130, 246, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                        <DollarOutlined className="text-white text-xs" />
                  </div>
                      <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Statistics</Text>
                </div>
                    {bookingsLoading ? (
                      <Skeleton active paragraph={{ rows: 4 }} />
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bookings</Text>
                          <Text className={`text-[10px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {bookings.length}
                          </Text>
              </div>
                        <div className="flex items-center justify-between">
                          <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</Text>
                          <Text className={`text-[10px] font-bold text-green-600`}>
                            ৳{totalRevenue.toLocaleString()}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Advance</Text>
                          <Text className={`text-[10px] font-bold text-blue-600`}>
                            ৳{totalAdvance.toLocaleString()}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Due</Text>
                          <Text className={`text-[10px] font-bold text-orange-600`}>
                            ৳{totalDue.toLocaleString()}
                          </Text>
                        </div>
                        <div className="flex items-center justify-between">
                          <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Nights</Text>
                          <Text className={`text-[10px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {totalNights}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* BookedBy Users Details */}
              {(() => {
                const userBookingsMap = {};
                bookings.forEach(booking => {
                  const userId = booking.bookedByID || booking.bookedBy || 'Unknown';
                  const userName = booking.bookedByName || booking.bookedBy || `User ${userId}`;
                  
                  if (!userBookingsMap[userId]) {
                    userBookingsMap[userId] = {
                      name: userName,
                      count: 0,
                      revenue: 0,
                    };
                  }
                  
                  userBookingsMap[userId].count++;
                  userBookingsMap[userId].revenue += Number(booking.totalBill) || 0;
                });
                
                const userStats = Object.values(userBookingsMap)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);
                
                return (
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                        : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                      borderColor: darkMode ? "#4b5563" : "#dbeafe",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(59, 130, 246, 0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div 
                        className="p-1.5 rounded-lg"
                        style={{
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <TeamOutlined className="text-white text-xs" />
                  </div>
                      <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Top Users</Text>
                  </div>
                    {bookingsLoading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : userStats.length === 0 ? (
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No booking data available
                      </Text>
                    ) : (
                      <div className="space-y-2">
                        {userStats.map((user, idx) => (
                          <div 
                            key={idx}
                            className="p-2 rounded-lg"
                style={{
                              background: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {user.name}
                              </Text>
                              <Text className={`text-[10px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                {user.count} bookings
                              </Text>
                            </div>
                            <Text className={`text-[9px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Revenue: ৳{user.revenue.toLocaleString()}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </Sider>
      )}

      {/* Analytics Drawer - Mobile */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-white" />
            <span className="text-sm sm:text-base font-semibold text-white">Analytics</span>
          </div>
        }
        placement="right"
        onClose={() => setSettingsSidebarCollapsed(true)}
        open={!settingsSidebarCollapsed && isMobile}
        width={isMobile ? '85%' : 280}
        bodyStyle={{ 
          padding: isMobile ? "12px" : "16px",
          background: darkMode 
            ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)" 
            : "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
        }}
        headerStyle={{ 
          padding: isMobile ? "12px 16px" : "16px",
          background: isRestaurant
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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
                : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              borderColor: darkMode ? "#4b5563" : "#dbeafe",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                : "0 2px 4px rgba(59, 130, 246, 0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
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
                  background: darkMode ? "#3b82f6" : undefined,
                }}
              />
            </div>
            <Text className={`text-[10px] leading-tight ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Toggle between light and dark theme
            </Text>
          </div>

          {/* Booking Statistics Pie Chart - Same as desktop */}
          {(() => {
            const today = dayjs().tz("Asia/Dhaka");
            const todayStart = today.startOf("day");
            const todayEnd = today.endOf("day");
            
            const activeBookings = bookings.filter(booking => {
              const checkIn = dayjs(booking.checkInDate).tz("Asia/Dhaka");
              const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
              return checkIn.isSameOrBefore(todayEnd, "day") && checkOut.isSameOrAfter(todayStart, "day");
            }).length;
            
            const upcomingBookings = bookings.filter(booking => {
              const checkIn = dayjs(booking.checkInDate).tz("Asia/Dhaka");
              return checkIn.isAfter(todayEnd, "day");
            }).length;
            
            const completedBookings = bookings.filter(booking => {
              const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
              return checkOut.isBefore(todayStart, "day");
            }).length;
            
            const totalBookings = bookings.length;
            
            const pieData = [
              { type: 'Active', value: activeBookings, color: '#3b82f6' },
              { type: 'Upcoming', value: upcomingBookings, color: '#10b981' },
              { type: 'Completed', value: completedBookings, color: '#6366f1' },
            ].filter(item => item.value > 0);
            
            const pieConfig = {
              data: pieData,
              angleField: 'value',
              colorField: 'type',
              radius: 0.7,
              innerRadius: 0.5,
              label: false,
              legend: false,
              interactions: [{ type: 'element-active' }],
              statistic: {
                title: {
                  content: 'Total',
                  style: {
                    fontSize: '12px',
                    color: darkMode ? '#d1d5db' : '#666',
                  },
                },
                content: {
                  content: totalBookings.toString(),
                  style: {
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: darkMode ? '#ffffff' : '#1f2937',
                  },
                },
              },
              color: pieData.map(d => d.color),
              height: 180,
              padding: [10, 10, 10, 10],
            };
            
            return (
          <div 
            className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
            style={{
              background: darkMode 
                ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                  borderColor: darkMode ? "#4b5563" : "#dbeafe",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(59, 130, 246, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                }}
              >
                    <BarChartOutlined className="text-white text-xs" />
              </div>
                  <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Booking Status</Text>
            </div>
                {bookingsLoading ? (
                  <Skeleton active paragraph={{ rows: 3 }} />
                ) : (
                  <>
                    <Pie {...pieConfig} />
                    <div className="mt-3 space-y-1.5">
                      {pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <Text className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {item.type}
                            </Text>
                  </div>
                          <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.value}
                          </Text>
                  </div>
                      ))}
                  </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Booking Statistics - Same as desktop */}
          {(() => {
            const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalBill) || 0), 0);
            const totalAdvance = bookings.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0);
            const totalDue = bookings.reduce((sum, b) => sum + (Number(b.duePayment) || 0), 0);
            const totalNights = bookings.reduce((sum, b) => sum + (Number(b.nights) || 1), 0);
            
            return (
              <div 
                className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
                      style={{
                  background: darkMode 
                    ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                  borderColor: darkMode ? "#4b5563" : "#dbeafe",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(59, 130, 246, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                      style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                      }}
                  >
                    <DollarOutlined className="text-white text-xs" />
                  </div>
                  <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Statistics</Text>
          </div>
                {bookingsLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bookings</Text>
                      <Text className={`text-[10px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {bookings.length}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</Text>
                      <Text className={`text-[10px] font-bold text-green-600`}>
                        ৳{totalRevenue.toLocaleString()}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Advance</Text>
                      <Text className={`text-[10px] font-bold text-blue-600`}>
                        ৳{totalAdvance.toLocaleString()}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Due</Text>
                      <Text className={`text-[10px] font-bold text-orange-600`}>
                        ৳{totalDue.toLocaleString()}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Nights</Text>
                      <Text className={`text-[10px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {totalNights}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* BookedBy Users Details - Same as desktop */}
          {(() => {
            const userBookingsMap = {};
            bookings.forEach(booking => {
              const userId = booking.bookedByID || booking.bookedBy || 'Unknown';
              const userName = booking.bookedByName || booking.bookedBy || `User ${userId}`;
              
              if (!userBookingsMap[userId]) {
                userBookingsMap[userId] = {
                  name: userName,
                  count: 0,
                  revenue: 0,
                };
              }
              
              userBookingsMap[userId].count++;
              userBookingsMap[userId].revenue += Number(booking.totalBill) || 0;
            });
            
            const userStats = Object.values(userBookingsMap)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);
            
            return (
          <div 
            className="p-3.5 rounded-xl border transition-all duration-300 hover:shadow-md"
            style={{
              background: darkMode 
                ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)" 
                    : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                  borderColor: darkMode ? "#4b5563" : "#dbeafe",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(59, 130, 246, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                }}
              >
                    <TeamOutlined className="text-white text-xs" />
              </div>
                  <Text className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Top Users</Text>
            </div>
                {bookingsLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : userStats.length === 0 ? (
                  <Text className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No booking data available
                  </Text>
                ) : (
                  <div className="space-y-2">
                    {userStats.map((user, idx) => (
                      <div 
                        key={idx}
                        className="p-2 rounded-lg"
            style={{
                          background: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.name}
                          </Text>
                          <Text className={`text-[10px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {user.count} bookings
                          </Text>
                        </div>
                        <Text className={`text-[9px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Revenue: ৳{user.revenue.toLocaleString()}
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </Drawer>

      {/* Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .responsive-content {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .ant-layout-header {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          
          .ant-card-body {
            padding: 14px !important;
          }
          
          .ant-menu-item {
            min-height: 48px !important;
            line-height: 48px !important;
          }
          
          .ant-drawer-body {
            padding: 12px !important;
          }
          
          .ant-modal {
            margin: 8px !important;
            max-width: calc(100% - 16px) !important;
          }
          
          .ant-table {
            font-size: 11px !important;
          }
          
          .ant-table-thead > tr > th {
            padding: 8px 4px !important;
            font-size: 10px !important;
          }
          
          .ant-table-tbody > tr > td {
            padding: 8px 4px !important;
            font-size: 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .ant-card-body {
            padding: 12px !important;
          }
          
          .ant-table {
            font-size: 10px !important;
          }
          
          .ant-table-thead > tr > th {
            padding: 6px 3px !important;
            font-size: 9px !important;
          }
          
          .ant-table-tbody > tr > td {
            padding: 6px 3px !important;
            font-size: 9px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

const Dashboard = ({ sliders }) => {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3">
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl animate-spin flex items-center justify-center">
              <div className="text-white text-lg font-bold">S</div>
            </div>
          </div>
            <p className="text-sm text-blue-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent sliders={sliders} />
    </Suspense>
  );
};

export default Dashboard;