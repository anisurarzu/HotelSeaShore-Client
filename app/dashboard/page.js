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
import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
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
import { filterVisibleUsers } from "@/utils/systemUsers";
import { PermissionProvider, useResolvedPermission } from "@/context/PermissionContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "@/component/DashboardShell.css";
import "@/component/DashboardHome.css";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/** `Number(null)` is 0 — breaks hotel lookup and forces roomsCount=0 → 0% occupancy. */
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
    key: "11",
    label: "Daily Statement",
    icon: <FileTextOutlined className="text-base" />,
    component: (props) => <DailyStatement {...props} />,
  },
  {
    key: "101",
    label: "Daily Expense",
    icon: <WalletOutlined className="text-base" />,
    component: (props) => <ExpenseInfo {...props} />,
  },
  {
    key: "10",
    label: "Report Dashboard",
    icon: <BarChartOutlined className="text-base" />,
    component: (props) => <AllBookingInfo hotelID={props?.hotelID || 1} contentPermissions={props?.contentPermissions} />,
  },
  {
    key: "5",
    label: "Hotel Info",
    icon: <BankOutlined className="text-base" />,
    component: (props) => <HotelInformation {...props} />,
  },
  {
    key: "2",
    label: "Users",
    icon: <TeamOutlined className="text-base" />,
    component: (props) => <AgentInformation {...props} />,
  },
  {
    key: "8",
    label: "Settings",
    icon: <SettingOutlined className="text-base" />,
    component: (props) => <PermissionManagement {...props} />,
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

// Standard KPI tile (SAP-style)
const DashboardCard = ({ title, value, icon, accent = "ocean" }) => {
  return (
    <div className={`hs-kpi hs-kpi--${accent}`}>
      <div className="hs-kpi__top">
        <p className="hs-kpi__label">{title}</p>
        {icon ? <span className="hs-kpi__icon">{icon}</span> : null}
      </div>
      <p className="hs-kpi__value">{value}</p>
    </div>
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
  const [collapsed, setCollapsed] = useState(false);
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
  const [users, setUsers] = useState([]);
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
  const allMenuItems = isRestaurant ? restaurantMenuItems : hotelMenuItems;
  // Role-based & page-wise: filter menu by allowed pages
  const { allowedPageKeys, getContentPermission } = useResolvedPermission(userInfo, isRestaurant);
  const menuItems = useMemo(
    () => allMenuItems.filter((item) => allowedPageKeys.includes(item.key)),
    [allMenuItems, allowedPageKeys]
  );

  // Calculate dashboard statistics from bookings API data
  const calculateDashboardStats = useCallback((bookingsData, maxRoomsParam) => {
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
    const todayActiveRoomsSet = new Set();

    const daysCount = monthEnd.diff(monthStart, "day") + 1;
    const monthActiveRoomsSets =
      daysCount > 0
        ? Array.from({ length: daysCount }, () => new Set())
        : [];

    bookingsData.forEach((booking) => {
      // Parse dates properly
      const checkInDate = dayjs(booking.checkInDate).tz("Asia/Dhaka");
      const checkOutDate = dayjs(booking.checkOutDate).tz("Asia/Dhaka");
      if (!checkInDate.isValid() || !checkOutDate.isValid()) return;

      // Get booking details
      const totalBill = parseFloat(booking.totalBill) || 0;
      const roomKey = getBookingRoomKey(booking);

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
      // active on "day" if check-in <= day AND check-out > day
      const isActiveToday =
        checkInDate.startOf("day").isSameOrBefore(todayStart, "day") &&
        checkOutDate.startOf("day").isAfter(todayStart, "day");
      if (isActiveToday && roomKey) todayActiveRoomsSet.add(roomKey);

      // Used for current month occupancy: count active rooms per day (exclusive checkout)
      const isActiveInMonth =
        checkInDate.startOf("day").isSameOrBefore(monthEnd, "day") &&
        checkOutDate.startOf("day").isAfter(monthStart, "day");
      if (!isActiveInMonth) return;
      if (!roomKey) return;

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

    const maxRooms = Number(maxRoomsParam) || 0;
    const todayActiveRoomsCount = todayActiveRoomsSet.size;

    const todayOccupancyRate =
      maxRooms > 0
        ? Math.min(
            100,
            Math.round((todayActiveRoomsCount / maxRooms) * 100)
          )
        : 0;

    // Average daily occupancy across the month (room-based)
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
            Math.round((sumActiveRoomsByDay / (maxRooms * daysCount)) * 100)
          )
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
      const userHotelID = resolveDashboardHotelId(hotelID, userInfo);

      const [response, hotelsResponse, hotelByIdResponse, usersResponse] = await Promise.all([
        coreAxios.get("/bookings"),
        // Use the real hotel source that includes roomCategories/roomNumbers.
        // (Backend route: GET /hotel)
        coreAxios.get(`/hotel?page=1&limit=200`).catch(() => null),
        // Fallback: if the /hotel list doesn't include the current hotel in its first page.
        userHotelID != null
          ? coreAxios.get(`/hotels/${userHotelID}`).catch(() => null)
          : Promise.resolve(null),
        coreAxios.get("/users").catch(() => null),
      ]);

      if (response.status === 200) {
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID != null) {
          bookingsData = bookingsData.filter(
            (booking) =>
              booking && Number(booking.hotelID) === userHotelID
          );
        }

        // Filter out cancelled bookings (statusID 255)
        bookingsData = bookingsData.filter((booking) => booking.statusID !== 255);

        // Compute room capacity from real hotel data (used for occupancy rate)
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

        // Prefer backend-provided totalRooms. If missing, compute unique rooms.
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

        const totalRoomsNum = Number(hotel?.totalRooms);
        const totalRoomsSafe =
          Number.isFinite(totalRoomsNum) && totalRoomsNum > 0 ? totalRoomsNum : 0;

        const roomsCount = Math.max(
          totalRoomsSafe,
          uniqueRoomIds.size,
          fallbackCount,
          distinctRoomsFromBookings.size
        );

        setBookings(bookingsData);
        calculateDashboardStats(bookingsData, roomsCount);
      }

      if (usersResponse?.status === 200) {
        const usersPayload =
          usersResponse?.data?.users ||
          usersResponse?.data?.data?.users ||
          usersResponse?.data ||
          [];
        setUsers(filterVisibleUsers(Array.isArray(usersPayload) ? usersPayload : []));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
      setUsers([]);
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

  // When allowed pages change, ensure selected menu is still allowed
  useEffect(() => {
    if (menuItems.length > 0 && !menuItems.some((item) => item.key === selectedMenu)) {
      const firstKey = menuItems[0]?.key || "1";
      setSelectedMenu(firstKey);
      const params = new URLSearchParams(searchParams.toString());
      params.set("menu", firstKey);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [menuItems, selectedMenu]);

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
          <span style={{ fontSize: isMobile ? '10px' : '12px' }} className="text-hs-ocean">
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
              <div className="bg-[#e8f4f3] p-2 rounded border border-[#d5e0e1]" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Bookings</p>
                <p className="font-bold text-hs-ocean" style={{ fontSize: isMobile ? '11px' : '13px' }}>{summary.count}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-green-50 p-2 rounded border border-green-100" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Revenue</p>
                <p className="font-bold text-green-600" style={{ fontSize: isMobile ? '11px' : '13px' }}>৳{summary.totalBill.toLocaleString()}</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div className="bg-[#e8f4f3] p-2 rounded border border-[#d5e0e1]" style={{ padding: isMobile ? '8px' : '12px' }}>
                <p className="text-gray-500 mb-0.5 font-medium" style={{ fontSize: isMobile ? '9px' : '10px' }}>Total Nights</p>
                <p className="font-bold text-hs-ocean" style={{ fontSize: isMobile ? '11px' : '13px' }}>{summary.totalNights}</p>
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
      
      // Restaurant dashboard cards
      const restaurantDashboardCards = [
        {
          title: "Today's Revenue",
          value: `৳${dashboardStats.todayBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined />,
          accent: "green",
        },
        {
          title: `Month (${currentMonthName}) Revenue`,
          value: `৳${dashboardStats.currentMonthBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined />,
          accent: "lagoon",
        },
        {
          title: "Today's Orders",
          value: dashboardStats.todayCheckIns.toString(),
          icon: <ShoppingCartOutlined />,
          accent: "ocean",
        },
        {
          title: "Active Tables",
          value: dashboardStats.todayCheckOuts.toString(),
          icon: <ShopOutlined />,
          accent: "soft",
        },
        {
          title: "Today's Table Occupancy",
          value: `${dashboardStats.todayOccupancyRate}%`,
          icon: <CoffeeOutlined />,
          accent: "sand",
        },
        {
          title: "Month Occupancy",
          value: `${dashboardStats.currentMonthOccupancyRate}%`,
          icon: <CoffeeOutlined />,
          accent: "deep",
        },
      ];

      // Hotel KPI tiles
      const hotelDashboardCards = [
        {
          title: "Today's Booking Amount",
          value: `৳${dashboardStats.todayBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined />,
          accent: "ocean",
        },
        {
          title: `Month (${currentMonthName}) Booking`,
          value: `৳${dashboardStats.currentMonthBookingAmount.toLocaleString()}`,
          icon: <DollarOutlined />,
          accent: "lagoon",
        },
        {
          title: "Today's Check-ins",
          value: dashboardStats.todayCheckIns.toString(),
          icon: <UserOutlined />,
          accent: "soft",
        },
        {
          title: "Today's Check-outs",
          value: dashboardStats.todayCheckOuts.toString(),
          icon: <CalendarOutlined />,
          accent: "sand",
        },
        {
          title: "Today's Occupancy",
          value: `${dashboardStats.todayOccupancyRate}%`,
          icon: <HomeOutlined />,
          accent: "green",
        },
        {
          title: "Month Occupancy",
          value: `${dashboardStats.currentMonthOccupancyRate}%`,
          icon: <HomeOutlined />,
          accent: "deep",
        },
      ];

      const dashboardCards = isRestaurant ? restaurantDashboardCards : hotelDashboardCards;

      const today = dayjs().tz("Asia/Dhaka").startOf("day");
      const last7Start = today.subtract(6, "day");
      const last30Start = today.subtract(29, "day");
      const getCheckInDay = (b) => dayjs(b?.checkInDate).tz("Asia/Dhaka").startOf("day");
      const getBookedById = (b) => String(b?.bookedByID || b?.bookedBy || "Unknown").trim();
      const inToday = (b) => getCheckInDay(b).isSame(today, "day");
      const inLast30 = (b) => {
        const d = getCheckInDay(b);
        return d.isSameOrAfter(last30Start, "day") && d.isSameOrBefore(today, "day");
      };
      const inLast7 = (b) => {
        const d = getCheckInDay(b);
        return d.isSameOrAfter(last7Start, "day") && d.isSameOrBefore(today, "day");
      };
      const sumBill = (arr) => arr.reduce((s, b) => s + (Number(b?.totalBill) || 0), 0);

      const todayAll = bookings.filter(inToday);
      const monthAll = bookings.filter(inLast30);
      const weekAll = bookings.filter(inLast7);

      const overviewCards = [
        {
          title: "Last 7 Days Bookings",
          amount: sumBill(weekAll),
          count: weekAll.length,
          accent: "lagoon",
        },
        {
          title: "Last 30 Days Bookings",
          amount: sumBill(monthAll),
          count: monthAll.length,
          accent: "ocean",
        },
      ];

      const bookingUsersMap = {};
      bookings.forEach((b) => {
        const uid = getBookedById(b);
        if (!bookingUsersMap[uid]) bookingUsersMap[uid] = [];
        bookingUsersMap[uid].push(b);
      });
      const apiUserIds = (Array.isArray(users) ? users : []).map((u) =>
        String(u?.loginID || u?.username || u?._id || "")
      );
      const mergedUserIds = Array.from(
        new Set([...apiUserIds.filter(Boolean), ...Object.keys(bookingUsersMap)])
      );
      const userRows = mergedUserIds
        .map((uid) => {
          const rows = bookingUsersMap[uid] || [];
          return {
            id: uid,
            today: sumBill(rows.filter(inToday)),
            seven: sumBill(rows.filter(inLast7)),
            thirty: sumBill(rows.filter(inLast30)),
            overall: sumBill(rows),
          };
        })
        .sort((a, b) => b.overall - a.overall);

      return (
        <div>
          <div className="hs-dash-intro">
            <h2>Operational Overview</h2>
            <p>Key performance indicators for today and the current period</p>
          </div>

          {bookingsLoading ? (
            <Row gutter={[10, 10]}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Col xs={24} sm={12} lg={4} key={item}>
                  <Card size="small">
                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="hs-kpi-grid">
              {dashboardCards.map((card, idx) => (
                <DashboardCard
                  key={idx}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  accent={card.accent}
                />
              ))}
            </div>
          )}

          {!isRestaurant && (
            <div className="hs-section">
              <div className="hs-section__head">
                <h3>Booking Period Summary</h3>
                <p>Aggregated booking amounts</p>
              </div>
              {bookingsLoading ? (
                <Row gutter={[10, 10]}>
                  {[1, 2].map((item) => (
                    <Col xs={24} sm={12} key={item}>
                      <Card size="small">
                        <Skeleton active paragraph={{ rows: 1 }} title={false} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div
                  className="hs-kpi-grid"
                  style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
                >
                  {overviewCards.map((card, idx) => (
                    <div key={`ov-${idx}`} className={`hs-kpi hs-kpi--${card.accent}`}>
                      <div className="hs-kpi__top">
                        <p className="hs-kpi__label">{card.title}</p>
                        <span className="hs-kpi__icon">
                          <BarChartOutlined />
                        </span>
                      </div>
                      <div>
                        <p className="hs-kpi__value">
                          ৳{card.amount.toLocaleString()}
                        </p>
                        <p className="hs-kpi__meta">{card.count} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isRestaurant && (
            <div className="hs-section">
              <div className="hs-section__head">
                <h3>User-wise Booking Overview</h3>
                <p>Performance by booking operator</p>
              </div>
              <div className="hs-panel">
                <div className="hs-panel__body">
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
                        {userRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="empty">
                              No user booking data found
                            </td>
                          </tr>
                        ) : (
                          userRows.map((r) => (
                            <tr key={r.id}>
                              <td className="id-cell">{r.id}</td>
                              <td className="num">৳{r.today.toLocaleString()}</td>
                              <td className="num">৳{r.seven.toLocaleString()}</td>
                              <td className="num">৳{r.thirty.toLocaleString()}</td>
                              <td className="num total-cell">
                                ৳{r.overall.toLocaleString()}
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
          )}
        </div>
      );
    }

    const selectedItem = menuItems.find((item) => item.key === selectedMenu);
    if (selectedItem) {
      const cp = getContentPermission(selectedMenu);
      const contentPermissions = {
        view: cp.view,
        insert: cp.insert,
        edit: cp.edit,
        delete: cp.delete,
        viewAccess: cp.view,
        insertAccess: cp.insert,
        editAccess: cp.edit,
        deleteAccess: cp.delete,
      };
      return selectedItem.component({ hotelID, contentPermissions });
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
        selectedKeys={[selectedMenu]}
        onClick={handleMenuClick}
        className={`custom-sidebar-menu ${darkMode ? "dark-menu" : ""}`}
        items={menuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          title: item.label,
        }))}
      />
    );
  };

  const currentPageLabel =
    menuItems.find((item) => item.key === selectedMenu)?.label || "Dashboard";
  const productName = isRestaurant ? "Sea Shore Restaurant" : "Hotel Sea Shore";
  const navWidth = collapsed ? 56 : 196;
  const asideWidth = settingsSidebarCollapsed ? 0 : 280;

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
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
    <PermissionProvider userInfo={userInfo} isRestaurant={isRestaurant}>
      <Layout className={`hs-shell min-h-screen ${darkMode ? "hs-shell--dark dark" : ""}`}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={196}
          breakpoint="lg"
          collapsedWidth={56}
          className="hs-shell__sider hidden lg:block"
          style={{
            overflow: "hidden",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <div className="hs-shell__brand">
            <img
              src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg"
              alt="Hotel Sea Shore"
              className="hs-shell__brand-logo"
            />
            {!collapsed && (
              <div className="hs-shell__brand-text">
                <strong>Sea Shore</strong>
                <span>{isRestaurant ? "Restaurant" : "Starter · Hotel"}</span>
              </div>
            )}
          </div>
          <div className="hs-shell__nav">
            {!collapsed && <div className="hs-shell__nav-label">Navigation</div>}
            {renderMenuItems(collapsed)}
          </div>
        </Sider>

        <Layout
          style={{
            marginLeft: isMobile ? 0 : navWidth,
            marginRight: isMobile ? 0 : asideWidth,
            transition: "margin 0.2s ease",
            minHeight: "100vh",
            background: "transparent",
          }}
        >
          <Header
            className="hs-shell__header"
            style={{
              position: "fixed",
              top: 0,
              left: isMobile ? 0 : navWidth,
              right: isMobile ? 0 : asideWidth,
              zIndex: 99,
              width: isMobile
                ? "100%"
                : `calc(100% - ${navWidth}px - ${asideWidth}px)`,
              transition: "left 0.2s ease, right 0.2s ease, width 0.2s ease",
            }}
          >
            <div className="hs-shell__header-left">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={showDrawer}
                className="hs-shell__icon-btn lg:hidden"
              />
              <div className="hs-shell__product">
                <p className="hs-shell__product-name">{productName} Starter</p>
                <p className="hs-shell__product-meta">
                  {userInfo?.role?.label || "User"} · Enterprise Console · v2.0
                </p>
              </div>
              <span className="hs-shell__demo-chip hidden sm:inline-flex">Starter v2.0</span>
            </div>

            <div className="hs-shell__header-right">
              <Tooltip title={settingsSidebarCollapsed ? "Open Analytics" : "Close Analytics"}>
                <Button
                  type="text"
                  icon={<BarChartOutlined />}
                  onClick={toggleSettingsSidebar}
                  className="hs-shell__icon-btn"
                />
              </Tooltip>

              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div className="hs-shell__user">
                  <Avatar
                    size={28}
                    src={userInfo?.image}
                    icon={!userInfo?.image && <UserOutlined />}
                    style={{ backgroundColor: "#14919b" }}
                  />
                  <div className="hs-shell__user-meta hidden md:block">
                    <strong>{userInfo?.username || userInfo?.name || "User"}</strong>
                    <span>{userInfo?.role?.label || "Operator"}</span>
                  </div>
                </div>
              </Dropdown>
            </div>
          </Header>

          <div
            style={{
              marginTop: 48,
              display: "flex",
              flexDirection: "column",
              minHeight: "calc(100vh - 48px)",
            }}
          >
            <div className="hs-shell__titlebar">
              <div className="hs-shell__titlebar-main">
                <h1>{currentPageLabel}</h1>
                <span className="hs-shell__breadcrumb">
                  Home / <strong>{currentPageLabel}</strong>
                </span>
              </div>
            </div>

            <Content className="hs-shell__content responsive-content">
              <div className="hs-shell__workspace">{renderContent()}</div>
            </Content>

            <div className="hs-shell__footer">
              <div className="flex items-center gap-2">
                <span className="hs-shell__status-dot" />
                <span>System Online · v2.0</span>
              </div>
              <div>
                {isRestaurant ? "Restaurant" : "Hotel"}:{" "}
                <strong>{isRestaurant ? "Sea Shore Restaurant" : hotelName}</strong>
                {" · "}
                <span>Cox Web Solutions</span>
              </div>
            </div>
          </div>
        </Layout>

        <Drawer
          open={drawerVisible}
          onClose={closeDrawer}
          placement="left"
          width={280}
          className="hs-shell-drawer"
          title={
            <div className="flex items-center gap-2">
              <img
                src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg"
                alt="Logo"
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }}
              />
              <span style={{ color: "#fff", fontWeight: 650 }}>{productName} Starter</span>
            </div>
          }
        >
          <div className="hs-shell__nav-label">Navigation</div>
          {renderMenuItems(false)}
        </Drawer>

      {/* Detail Modal */}
      <DetailModal />

      {/* Settings Sidebar - Desktop */}
      {!settingsSidebarCollapsed && !isMobile && (
        <Sider
          width={280}
          className="hs-shell__aside hidden lg:block"
          style={{
            overflow: "hidden",
            height: "100vh",
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          <div className="hs-shell__aside-head">
            <h2>Analytics</h2>
            <Button type="text" icon={<CloseOutlined />} onClick={toggleSettingsSidebar} size="small" />
          </div>
          <div className="py-3 px-3 h-[calc(100vh-48px)] overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {/* Dark Mode Toggle */}
              <div 
                className="hs-shell__panel"
                style={{
                  background: darkMode ? "#273039" : "#f7fbfb",
                  borderColor: darkMode ? "#3a4550" : "#d5e0e1",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(11, 92, 102, 0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-1.5 rounded-lg"
                      style={{
                        background: "#0b5c66",
                        
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
                      background: darkMode ? "#14919b" : undefined,
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
                  { type: 'Active', value: activeBookings, color: '#14919b' },
                  { type: 'Upcoming', value: upcomingBookings, color: '#10b981' },
                  { type: 'Completed', value: completedBookings, color: '#0d6b74' },
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
                className="hs-shell__panel"
                style={{
                  background: darkMode ? "#273039" : "#f7fbfb",
                      borderColor: darkMode ? "#3a4550" : "#d5e0e1",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(11, 92, 102, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                          background: "#0b5c66",
                          
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
                className="hs-shell__panel"
                style={{
                  background: darkMode ? "#273039" : "#f7fbfb",
                      borderColor: darkMode ? "#3a4550" : "#d5e0e1",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(11, 92, 102, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{
                          background: "#0b5c66",
                          
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
                          <Text className={`text-[10px] font-bold text-hs-ocean`}>
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
                className="hs-shell__panel"
                style={{
                  background: darkMode ? "#273039" : "#f7fbfb",
                      borderColor: darkMode ? "#3a4550" : "#d5e0e1",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 4px rgba(11, 92, 102, 0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div 
                        className="p-1.5 rounded-lg"
                        style={{
                          background: "#0b5c66",
                          
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
                              background: darkMode ? "rgba(20,145,155,0.12)" : "#e8f4f3",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {user.name}
                              </Text>
                              <Text className={`text-[10px] font-bold ${darkMode ? 'text-hs-soft' : 'text-hs-ocean'}`}>
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
        title="Analytics"
        placement="right"
        onClose={() => setSettingsSidebarCollapsed(true)}
        open={!settingsSidebarCollapsed && isMobile}
        width={isMobile ? "85%" : 280}
        className="hs-shell-drawer"
        styles={{ body: { padding: 12, background: "var(--shell-bg, #f5f6f7)" } }}
      >
        <div className="space-y-3">
          {/* Dark Mode Toggle */}
          <div 
            className="hs-shell__panel"
            style={{
              background: darkMode ? "#273039" : "#f7fbfb",
              borderColor: darkMode ? "#3a4550" : "#d5e0e1",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                : "0 2px 4px rgba(11, 92, 102, 0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-1.5 rounded-lg"
                  style={{
                    background: "#0b5c66",
                    
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
                  background: darkMode ? "#14919b" : undefined,
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
              { type: 'Active', value: activeBookings, color: '#14919b' },
              { type: 'Upcoming', value: upcomingBookings, color: '#10b981' },
              { type: 'Completed', value: completedBookings, color: '#0d6b74' },
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
            className="hs-shell__panel"
            style={{
              background: darkMode ? "#273039" : "#f7fbfb",
                  borderColor: darkMode ? "#3a4550" : "#d5e0e1",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(11, 92, 102, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                      background: "#0b5c66",
                      
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
                className="hs-shell__panel"
                      style={{
                  background: darkMode ? "#273039" : "#f7fbfb",
                  borderColor: darkMode ? "#3a4550" : "#d5e0e1",
                  boxShadow: darkMode 
                    ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(11, 92, 102, 0.08)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div 
                    className="p-1.5 rounded-lg"
                      style={{
                      background: "#0b5c66",
                      
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
                      <Text className={`text-[10px] font-bold text-hs-ocean`}>
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
            className="hs-shell__panel"
            style={{
              background: darkMode ? "#273039" : "#f7fbfb",
                  borderColor: darkMode ? "#3a4550" : "#d5e0e1",
              boxShadow: darkMode 
                ? "0 2px 4px rgba(0, 0, 0, 0.2)" 
                    : "0 2px 4px rgba(11, 92, 102, 0.08)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div 
                className="p-1.5 rounded-lg"
                style={{
                      background: "#0b5c66",
                      
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
                          background: darkMode ? "rgba(20,145,155,0.12)" : "#e8f4f3",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Text className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {user.name}
                          </Text>
                          <Text className={`text-[10px] font-bold ${darkMode ? 'text-hs-soft' : 'text-hs-ocean'}`}>
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


      </Layout>
    </PermissionProvider>
  );
};

const Dashboard = ({ sliders }) => {
  return (
    <Suspense fallback={
      <div className="hs-shell min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-hs-ocean border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-hs-ocean font-medium">Loading console...</p>
        </div>
      </div>
    }>
      <DashboardContent sliders={sliders} />
    </Suspense>
  );
};

export default Dashboard;