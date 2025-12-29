"use client";

import {
  Layout,
  Menu,
  Button,
  Spin,
  Drawer,
  Avatar,
  Skeleton,
  theme,
  Dropdown,
  Space,
} from "antd";
import {
  DashboardOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  MenuOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  DownOutlined,
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import DashboardHome from "@/component/DashboardHome";
import AgentInformation from "@/component/AgentInformation";
import HotelInformation from "@/component/HotelInformation";
import BookingInfo from "@/component/BookingInfo";
import Calender from "@/component/Calender";
import RoomAvailabilityPage from "@/component/RoomSearchPage";
import AllBookingInfo from "@/component/AllBookingInfo";
import ExpenseInfo from "@/component/Expense/ExpenseInfo";
import DailyStatement from "@/component/DailyStatement";
import PermissionManagement from "@/component/Permission/PermissionManagement";
import Commission from "@/component/Booking/Commission";
import { Waves, Sun, Moon, Hotel, Home, BarChart3, CreditCard, Calendar } from "lucide-react";

const { Header, Sider, Content } = Layout;
const { useToken } = theme;

const rolePermissions = {
  superadmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      lucidIcon: <Home className="w-4 h-4" />,
      component: (props) => <DashboardHome {...props} />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      lucidIcon: <Calendar className="w-4 h-4" />,
      component: (props) => <Calender {...props} />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: (props) => <RoomAvailabilityPage {...props} />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      lucidIcon: <FileTextOutlined />,
      component: (props) => <BookingInfo {...props} />,
    },
    {
      key: "12",
      label: "Daily Statement",
      icon: <InfoCircleOutlined />,
      lucidIcon: <BarChart3 className="w-4 h-4" />,
      component: (props) => <DailyStatement {...props} />,
    },
    {
      key: "10",
      label: "Report Dashboard",
      icon: <InfoCircleOutlined />,
      lucidIcon: <BarChart3 className="w-4 h-4" />,
      component: (props) => <AllBookingInfo {...props} />,
    },
    {
      key: "100",
      label: "Commission",
      icon: <InfoCircleOutlined />,
      lucidIcon: <CreditCard className="w-4 h-4" />,
      component: (props) => <Commission {...props} />,
    },
    {
      key: "101",
      label: "Expense",
      icon: <InfoCircleOutlined />,
      lucidIcon: <CreditCard className="w-4 h-4" />,
      component: <ExpenseInfo />,
    },
    {
      key: "5",
      label: "Hotel Info",
      icon: <FileTextOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: <HotelInformation />,
    },
    {
      key: "2",
      label: "Users",
      icon: <UsergroupAddOutlined />,
      lucidIcon: <UsergroupAddOutlined />,
      component: <AgentInformation />,
    },
    {
      key: "8",
      label: "Settings",
      icon: <SettingOutlined />,
      lucidIcon: <SettingOutlined />,
      component: <PermissionManagement />,
    },
  ],
  agentadmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      lucidIcon: <Home className="w-4 h-4" />,
      component: (props) => <DashboardHome {...props} />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      lucidIcon: <Calendar className="w-4 h-4" />,
      component: (props) => <Calender {...props} />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: (props) => <RoomAvailabilityPage {...props} />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      lucidIcon: <FileTextOutlined />,
      component: (props) => <BookingInfo {...props} />,
    },
  ],
  hoteladmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      lucidIcon: <Home className="w-4 h-4" />,
      component: (props) => <DashboardHome {...props} />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      lucidIcon: <Calendar className="w-4 h-4" />,
      component: (props) => <Calender {...props} />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: (props) => <RoomAvailabilityPage {...props} />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      lucidIcon: <FileTextOutlined />,
      component: (props) => <BookingInfo {...props} />,
    },
  ],
  admin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      lucidIcon: <Home className="w-4 h-4" />,
      component: (props) => <DashboardHome {...props} />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: (props) => <RoomAvailabilityPage {...props} />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      lucidIcon: <Calendar className="w-4 h-4" />,
      component: (props) => <Calender {...props} />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <SettingOutlined />,
      lucidIcon: <FileTextOutlined />,
      component: (props) => <BookingInfo {...props} />,
    },
    {
      key: "10",
      label: "Report Dashboard",
      icon: <InfoCircleOutlined />,
      lucidIcon: <BarChart3 className="w-4 h-4" />,
      component: (props) => <AllBookingInfo {...props} />,
    },
    {
      key: "5",
      label: "Hotel Info",
      icon: <FileTextOutlined />,
      lucidIcon: <Hotel className="w-4 h-4" />,
      component: <HotelInformation />,
    },
    {
      key: "2",
      label: "Users",
      icon: <UsergroupAddOutlined />,
      lucidIcon: <UsergroupAddOutlined />,
      component: <AgentInformation />,
    },
  ],
};

const DashboardContent = ({ sliders }) => {
  const { token } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Get hotelID from URL
  const hotelID = searchParams.get("hotelID");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [router, selectedMenu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-6">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      );
    }

    const userRole = userInfo?.role?.value;
    const allowedPages = rolePermissions[userRole] || [];
    const selectedPage = allowedPages.find((page) => page.key === selectedMenu);

    if (selectedPage) {
      if (typeof selectedPage.component === "function") {
        return selectedPage.component({ hotelID });
      }
      return selectedPage.component;
    }

    return <div>Access Denied</div>;
  };

  const renderMenuItems = () => {
    if (!userInfo) return null;

    const userRole = userInfo?.role?.value;
    const allowedPages = rolePermissions[userRole] || [];

    return (
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedMenu]}
        onClick={(e) => setSelectedMenu(e.key)}
        style={{ 
          background: "transparent",
          borderRight: "none",
        }}
        className="sidebar-menu"
      >
        {allowedPages.map((page) => (
          <Menu.Item
            key={page.key}
            icon={collapsed ? page.icon : page.lucidIcon}
            style={{
              margin: "6px 12px",
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              height: "48px",
              display: "flex",
              alignItems: "center",
              transition: "all 0.3s ease",
              color: selectedMenu === page.key ? "#ffffff" : "#64748b",
              background: selectedMenu === page.key 
                ? "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)" 
                : "transparent",
              borderLeft: selectedMenu === page.key ? "4px solid #0ea5e9" : "4px solid transparent",
            }}
            className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50"
          >
            {!collapsed && <span>{page.label}</span>}
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
    <Layout className={`min-h-screen ${darkMode ? 'dark:bg-gray-900' : 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50'}`}>
      {/* Slim Sidebar with Beach Theme */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)",
          boxShadow: "4px 0 20px rgba(14, 165, 233, 0.1)",
          borderRight: "1px solid rgba(14, 165, 233, 0.1)",
        }}
        className="hidden lg:block"
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center py-6 h-20 border-b border-cyan-100">
          <div className={`transition-all duration-300 ${collapsed ? 'w-12' : 'w-40'}`}>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Waves className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div className="text-left">
                  <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Sea Shore
                  </h2>
                  <p className="text-xs text-gray-400">Hotel Management</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="py-4 px-2">
          {renderMenuItems()}
        </div>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Hotel Sea Shore</p>
              <p className="text-xs text-gray-400">© 2026 All rights reserved</p>
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        {/* Header with Beach Theme */}
        <Header
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
            padding: "0 24px",
            height: "70px",
            lineHeight: "70px",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          className="flex justify-between items-center shadow-lg"
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={
                <MenuOutlined style={{ color: "white", fontSize: "18px" }} />
              }
              onClick={showDrawer}
              className="lg:hidden"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white m-0">
                  Hotel Sea Shore
                </h1>
                <p className="text-xs text-cyan-100 m-0">
                  Management Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <Button
              type="text"
              icon={darkMode ? 
                <Sun className="w-4 h-4 text-white" /> : 
                <Moon className="w-4 h-4 text-white" />
              }
              onClick={toggleDarkMode}
              className="hover:bg-white/10"
            />

            {/* Notifications */}
            <Button
              type="text"
              icon={<BellOutlined className="text-white" />}
              className="hover:bg-white/10 relative"
            >
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Profile Dropdown */}
            {userInfo && (
              <Dropdown
                menu={{
                  items: userMenuItems,
                }}
                placement="bottomRight"
              >
                <Space className="cursor-pointer hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="large"
                      src={userInfo.image}
                      icon={!userInfo.image && <UserOutlined />}
                      style={{ 
                        backgroundColor: "#0ea5e9",
                        border: "2px solid white"
                      }}
                    />
                    <div className="hidden md:block text-left">
                      <p className="text-white font-medium m-0 text-sm">
                        {userInfo.username || userInfo.name}
                      </p>
                      <p className="text-cyan-100 text-xs m-0">
                        {userInfo.role?.label || "User"}
                      </p>
                    </div>
                    <DownOutlined className="text-white" />
                  </div>
                </Space>
              </Dropdown>
            )}
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            margin: "20px",
            padding: 0,
            minHeight: "calc(100vh - 110px)",
          }}
        >
          <div className={`p-6 ${darkMode ? 'dark:bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl border border-gray-100 min-h-[calc(100vh-140px)]`}>
            {renderContent()}
          </div>
        </Content>

        {/* Bottom Status Bar */}
        <div className="px-6 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">System Online</span>
          </div>
          <div className="text-sm text-gray-500">
            Hotel ID: <span className="font-semibold text-cyan-600">{hotelID || "21"}</span>
          </div>
        </div>
      </Layout>

      {/* Mobile Drawer */}
      <Drawer
        open={visible}
        onClose={onClose}
        placement="left"
        width={280}
        bodyStyle={{ 
          padding: 0,
          background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)",
        }}
        headerStyle={{ 
          padding: "16px",
          background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
          borderBottom: "none"
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white m-0">Sea Shore</h2>
              <p className="text-xs text-cyan-100 m-0">Hotel Management</p>
            </div>
          </div>
        }
      >
        {renderMenuItems()}
      </Drawer>

      {/* Global Styles */}
      <style jsx>{`
        .sidebar-menu .ant-menu-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-menu .ant-menu-item:hover {
          transform: translateX(5px);
        }
        
        .sidebar-menu .ant-menu-item-selected {
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
        }
        
        .ant-layout-sider-trigger {
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .ant-drawer-header {
          border-bottom: none !important;
        }
        
        .ant-drawer-title {
          color: white !important;
        }
        
        .ant-drawer-close {
          color: white !important;
        }
        
        .ant-dropdown-menu {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(14, 165, 233, 0.15) !important;
          border: 1px solid rgba(14, 165, 233, 0.1) !important;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .ant-dropdown-menu-item {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </Layout>
  );
};

const Dashboard = ({ sliders }) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl animate-spin flex items-center justify-center">
              <Waves className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-cyan-600 font-medium">Loading Sea Shore Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent sliders={sliders} />
    </Suspense>
  );
};

export default Dashboard;