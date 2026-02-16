"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Skeleton,
  Table,
  Tag,
  Statistic,
  Divider,
  message,
  Button,
  Progress,
  Empty,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CoffeeOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { Pie, Column } from "@ant-design/charts";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import moment from "moment";

const { Title, Text } = Typography;

// Dashboard Card Component
const DashboardCard = ({ title, value, icon, bgGradient }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  return (
    <Card 
      className="h-full shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105"
      style={{ 
        background: bgGradient || "#ffffff",
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

const RestaurantDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    currentMonthRevenue: 0,
    todayOrders: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    paidOrders: 0,
    partiallyPaidOrders: 0,
    activeTables: 0,
    totalTables: 0,
    availableTables: 0,
    totalMenuItems: 0,
    availableMenuItems: 0,
    menuCategories: 0,
    todayOccupancy: 0,
    averageOrderValue: 0,
    recentOrders: [],
    orderStatusData: [],
    paymentStatusData: [],
    tableStatusData: [],
    revenueByDay: [],
  });

  // Fetch restaurant statistics
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel with proper error handling
      const [ordersResponse, tablesResponse, menuResponse] = await Promise.allSettled([
        coreAxios.get("/restaurant/order"),
        coreAxios.get("/restaurant/tables"),
        coreAxios.get("/restaurant/menu"),
      ]);

      // Process orders data - handle different response structures
      let orders = [];
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value?.status === 200) {
        const response = ordersResponse.value;
        const ordersData = response.data?.data || response.data;
        if (Array.isArray(ordersData)) {
          orders = ordersData;
        } else if (ordersData?.orders && Array.isArray(ordersData.orders)) {
          orders = ordersData.orders;
        } else if (ordersData?.data?.orders && Array.isArray(ordersData.data.orders)) {
          orders = ordersData.data.orders;
        }
      } else {
        console.error("Error fetching orders:", ordersResponse.reason);
      }
      
      // Process tables data
      let tables = [];
      if (tablesResponse.status === 'fulfilled' && tablesResponse.value?.status === 200) {
        const response = tablesResponse.value;
        const tablesData = response.data?.data || response.data;
        if (Array.isArray(tablesData)) {
          tables = tablesData;
        } else if (tablesData?.tables && Array.isArray(tablesData.tables)) {
          tables = tablesData.tables;
        } else if (tablesData?.data?.tables && Array.isArray(tablesData.data.tables)) {
          tables = tablesData.data.tables;
        }
      } else {
        console.error("Error fetching tables:", tablesResponse.reason);
      }
      
      // Process menu data
      let menuItems = [];
      if (menuResponse.status === 'fulfilled' && menuResponse.value?.status === 200) {
        const response = menuResponse.value;
        const menuData = response.data?.data || response.data;
        if (Array.isArray(menuData)) {
          menuItems = menuData;
        } else if (menuData?.menuItems && Array.isArray(menuData.menuItems)) {
          menuItems = menuData.menuItems;
        } else if (menuData?.data?.menuItems && Array.isArray(menuData.data.menuItems)) {
          menuItems = menuData.data.menuItems;
        }
      } else {
        console.error("Error fetching menu:", menuResponse.reason);
      }

      // Date calculations
      const today = dayjs().startOf("day");
      const todayEnd = dayjs().endOf("day");
      const monthStart = dayjs().startOf("month");
      const monthEnd = dayjs().endOf("month");

      // Calculate today's orders and revenue
      const todayOrders = orders.filter(order => {
        if (!order.createdAt && !order.orderDate) return false;
        try {
          const orderDate = dayjs(order.createdAt || order.orderDate);
          return orderDate.isSameOrAfter(today) && orderDate.isSameOrBefore(todayEnd);
        } catch (e) {
          console.warn("Invalid date for order:", order.id || order._id);
          return false;
        }
      });
      
      const todayRevenue = todayOrders.reduce((sum, order) => {
        const total = Number(order.total) || Number(order.totalAmount) || 0;
        return sum + total;
      }, 0);

      // Calculate current month revenue
      const monthOrders = orders.filter(order => {
        if (!order.createdAt && !order.orderDate) return false;
        try {
          const orderDate = dayjs(order.createdAt || order.orderDate);
          return orderDate.isSameOrAfter(monthStart) && orderDate.isSameOrBefore(monthEnd);
        } catch (e) {
          console.warn("Invalid date for order:", order.id || order._id);
          return false;
        }
      });
      
      const currentMonthRevenue = monthOrders.reduce((sum, order) => {
        const total = Number(order.total) || Number(order.totalAmount) || 0;
        return sum + total;
      }, 0);

      // Calculate order statuses (all orders, not just today)
      const pendingOrders = orders.filter(order => {
        const status = (order.orderStatus || "").toLowerCase();
        return status === "pending";
      }).length;
      
      const confirmedOrders = orders.filter(order => {
        const status = (order.orderStatus || "").toLowerCase();
        return status === "confirmed" || status === "confirm";
      }).length;
      
      const paidOrders = orders.filter(order => {
        const status = (order.paymentStatus || "").toLowerCase();
        return status === "paid";
      }).length;

      const partiallyPaidOrders = orders.filter(order => {
        const status = (order.paymentStatus || "").toLowerCase();
        return status === "partially_paid";
      }).length;

      // Order status data for pie chart
      const orderStatusData = [
        { type: 'Pending', value: pendingOrders, color: '#f59e0b' },
        { type: 'Confirmed', value: confirmedOrders, color: '#3b82f6' },
      ].filter(item => item.value > 0);

      // Payment status data for pie chart
      const paymentStatusData = [
        { type: 'Paid', value: paidOrders, color: '#22c55e' },
        { type: 'Pending', value: orders.filter(o => (o.paymentStatus || "").toLowerCase() === "pending").length, color: '#f59e0b' },
        { type: 'Partially Paid', value: partiallyPaidOrders, color: '#3b82f6' },
      ].filter(item => item.value > 0);

      // Calculate tables
      const totalTables = tables.length;
      const activeTables = tables.filter(table => {
        // Check multiple possible fields for table status
        return table.isAvailable === false || 
               table.status === "occupied" || 
               table.status === "active" ||
               (table.availability && table.availability === "occupied");
      }).length;
      
      const availableTables = tables.filter(table => {
        return table.isAvailable === true || 
               table.status === "available" ||
               (table.availability && table.availability === "available");
      }).length;
      
      const todayOccupancy = totalTables > 0 
        ? Math.round((activeTables / totalTables) * 100) 
        : 0;

      // Table status data for pie chart
      const tableStatusData = [
        { type: 'Active', value: activeTables, color: '#ef4444' },
        { type: 'Available', value: availableTables, color: '#22c55e' },
      ].filter(item => item.value > 0);

      // Calculate menu items
      const totalMenuItems = menuItems.length;
      const availableMenuItems = menuItems.filter(item => {
        const availability = (item.availability || "").toLowerCase();
        const statusID = item.statusID;
        return availability === "available" && 
               (statusID === undefined || statusID !== 255);
      }).length;

      // Calculate unique menu categories
      const uniqueCategories = new Set(
        menuItems
          .map(item => item.categoryID || item.category || item.categoryName)
          .filter(Boolean)
      );
      const menuCategories = uniqueCategories.size;

      // Calculate revenue by day for last 7 days (for chart)
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day');
        const dayStart = date.startOf('day');
        const dayEnd = date.endOf('day');
        
        const dayOrders = orders.filter(order => {
          if (!order.createdAt && !order.orderDate) return false;
          try {
            const orderDate = dayjs(order.createdAt || order.orderDate);
            return orderDate.isSameOrAfter(dayStart) && orderDate.isSameOrBefore(dayEnd);
          } catch (e) {
            return false;
          }
        });
        
        const dayRevenue = dayOrders.reduce((sum, order) => {
          const total = Number(order.total) || Number(order.totalAmount) || 0;
          return sum + total;
        }, 0);
        
        revenueByDay.push({
          date: date.format('MMM DD'),
          revenue: Math.round(dayRevenue * 100) / 100,
        });
      }

      // Calculate average order value (from all orders with valid totals)
      const ordersWithTotals = orders.filter(order => {
        const total = Number(order.total) || Number(order.totalAmount) || 0;
        return total > 0;
      });
      
      const averageOrderValue = ordersWithTotals.length > 0
        ? ordersWithTotals.reduce((sum, order) => {
            const total = Number(order.total) || Number(order.totalAmount) || 0;
            return sum + total;
          }, 0) / ordersWithTotals.length
        : 0;

      // Get recent orders (last 5) - sorted by date
      const recentOrders = orders
        .filter(order => order.createdAt || order.orderDate)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.orderDate || 0);
          const dateB = new Date(b.createdAt || b.orderDate || 0);
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(order => ({
          key: order.id || order._id || Math.random(),
          orderNumber: order.orderNumber || order.invoiceNo || `ORD-${order.id || order._id || 'N/A'}`,
          customerName: order.customerName || "Walk-in Customer",
          total: Number(order.total) || Number(order.totalAmount) || 0,
          orderStatus: order.orderStatus || "pending",
          paymentStatus: order.paymentStatus || "pending",
          createdAt: order.createdAt || order.orderDate,
        }));

      // Update stats with calculated values
      setStats({
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        currentMonthRevenue: Math.round(currentMonthRevenue * 100) / 100,
        todayOrders: todayOrders.length,
        totalOrders: orders.length,
        pendingOrders,
        confirmedOrders,
        paidOrders,
        partiallyPaidOrders,
        activeTables,
        totalTables,
        availableTables,
        totalMenuItems,
        availableMenuItems,
        menuCategories,
        todayOccupancy,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        recentOrders,
        orderStatusData,
        paymentStatusData,
        tableStatusData,
        revenueByDay,
      });
    } catch (error) {
      console.error("Error fetching restaurant stats:", error);
      message.error("Failed to load dashboard data. Please try again.");
      // Keep existing stats on error instead of resetting to 0
      // This prevents flickering when there's a temporary network issue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - fetchStats is stable

  const currentMonthName = dayjs().format("MMMM");

  // Get order status color
  const getOrderStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "pending") return "orange";
    if (statusLower === "confirmed" || statusLower === "confirm") return "blue";
    return "default";
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "paid") return "green";
    if (statusLower === "pending") return "orange";
    if (statusLower === "partially_paid") return "blue";
    return "default";
  };

  const dashboardCards = [
    {
      title: "Today's Revenue",
      value: `৳${stats.todayRevenue.toLocaleString()}`,
      icon: <DollarOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    },
    {
      title: `Current Month (${currentMonthName}) Revenue`,
      value: `৳${stats.currentMonthRevenue.toLocaleString()}`,
      icon: <DollarOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: <ShoppingCartOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: <ShoppingCartOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: <ClockCircleOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
    },
    {
      title: "Confirmed Orders",
      value: stats.confirmedOrders.toString(),
      icon: <CheckCircleOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
    },
    {
      title: "Paid Orders",
      value: stats.paidOrders.toString(),
      icon: <CheckCircleOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
    },
    {
      title: "Total Tables",
      value: stats.totalTables.toString(),
      icon: <ShopOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)",
    },
    {
      title: "Active Tables",
      value: `${stats.activeTables}/${stats.totalTables}`,
      icon: <ShopOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
    },
    {
      title: "Available Tables",
      value: stats.availableTables.toString(),
      icon: <ShopOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
    },
    {
      title: "Table Occupancy",
      value: `${stats.todayOccupancy}%`,
      icon: <CoffeeOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    },
    {
      title: "Total Menu Items",
      value: stats.totalMenuItems.toString(),
      icon: <AppstoreOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
    },
    {
      title: "Available Menu Items",
      value: stats.availableMenuItems.toString(),
      icon: <AppstoreOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)",
    },
    {
      title: "Menu Categories",
      value: stats.menuCategories.toString(),
      icon: <FileTextOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)",
    },
    {
      title: "Average Order Value",
      value: `৳${Math.round(stats.averageOrderValue).toLocaleString()}`,
      icon: <DollarOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)",
    },
  ];

  const recentOrdersColumns = [
    {
      title: "Order No.",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 120,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "total",
      key: "total",
      width: 100,
      align: "right",
      render: (amount) => (
        <span className="font-semibold text-green-600">
          ৳{Number(amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 100,
      render: (status) => (
        <Tag color={getOrderStatusColor(status)}>
          {(status || "Pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 100,
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {(status || "Pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => date ? moment(date).format("D MMM YY, hh:mm A") : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <Title
          level={2}
          className="m-0 mb-1"
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1f2937",
          }}
        >
          Restaurant Dashboard
        </Title>
        <Button
          onClick={() => {
            fetchStats();
            message.info("Refreshing dashboard data...");
          }}
          loading={loading}
          icon={<ReloadOutlined />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
        >
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Key Metrics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md border-0">
            <Statistic
              title="Today's Revenue"
              value={stats.todayRevenue}
              prefix="৳"
              valueStyle={{ color: "#10b981", fontSize: "24px", fontWeight: 700 }}
              suffix={
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  {stats.todayOrders > 0 ? `(${stats.todayOrders} orders)` : ""}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md border-0">
            <Statistic
              title="Month Revenue"
              value={stats.currentMonthRevenue}
              prefix="৳"
              valueStyle={{ color: "#34d399", fontSize: "24px", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md border-0">
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              valueStyle={{ color: "#3b82f6", fontSize: "24px", fontWeight: 700 }}
              suffix={
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  ({stats.paidOrders} paid)
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-md border-0">
            <Statistic
              title="Menu Items"
              value={stats.availableMenuItems}
              suffix={`/ ${stats.totalMenuItems}`}
              valueStyle={{ color: "#8b5cf6", fontSize: "24px", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Stats Cards Grid */}
      <Row gutter={[12, 12]}>
        {dashboardCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={idx}>
            {loading ? (
              <Card className="h-full shadow-sm border-0" style={{ borderRadius: '8px' }}>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            ) : (
              <DashboardCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                bgGradient={card.bgGradient}
              />
            )}
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        {/* Revenue Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined />
                <span>Revenue Trend (Last 7 Days)</span>
              </div>
            }
            className="shadow-md border-0"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : stats.revenueByDay.length > 0 ? (
              <Column
                data={stats.revenueByDay}
                xField="date"
                yField="revenue"
                height={300}
                color="#10b981"
                columnStyle={{
                  radius: [4, 4, 0, 0],
                }}
                label={{
                  position: 'top',
                  formatter: (datum) => `৳${datum.revenue.toLocaleString()}`,
                }}
                xAxis={{
                  label: {
                    style: {
                      fontSize: 12,
                    },
                  },
                }}
                yAxis={{
                  label: {
                    formatter: (text) => `৳${text}`,
                    style: {
                      fontSize: 12,
                    },
                  },
                }}
              />
            ) : (
              <Empty description="No revenue data available" />
            )}
          </Card>
        </Col>

        {/* Order Status Pie Chart */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <ShoppingCartOutlined />
                <span>Order Status</span>
              </div>
            }
            className="shadow-md border-0"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : stats.orderStatusData.length > 0 ? (
              <Pie
                data={stats.orderStatusData}
                angleField="value"
                colorField="type"
                radius={0.8}
                innerRadius={0.5}
                label={false}
                legend={{
                  position: 'bottom',
                  itemSpacing: 8,
                }}
                statistic={{
                  title: {
                    content: 'Total Orders',
                    style: { fontSize: '14px', color: '#666' },
                  },
                  content: {
                    content: stats.totalOrders.toString(),
                    style: { fontSize: '24px', fontWeight: 'bold', color: '#1f2937' },
                  },
                }}
                color={stats.orderStatusData.map(d => d.color)}
                height={300}
              />
            ) : (
              <Empty description="No order data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Second Row Charts */}
      <Row gutter={[16, 16]}>
        {/* Payment Status Chart */}
        <Col xs={24} sm={12} lg={8}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <DollarOutlined />
                <span>Payment Status</span>
              </div>
            }
            className="shadow-md border-0"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : stats.paymentStatusData.length > 0 ? (
              <Pie
                data={stats.paymentStatusData}
                angleField="value"
                colorField="type"
                radius={0.8}
                innerRadius={0.5}
                label={false}
                legend={{
                  position: 'bottom',
                  itemSpacing: 8,
                }}
                statistic={{
                  title: {
                    content: 'Total Orders',
                    style: { fontSize: '14px', color: '#666' },
                  },
                  content: {
                    content: stats.totalOrders.toString(),
                    style: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937' },
                  },
                }}
                color={stats.paymentStatusData.map(d => d.color)}
                height={250}
              />
            ) : (
              <Empty description="No payment data available" />
            )}
          </Card>
        </Col>

        {/* Table Status Chart */}
        <Col xs={24} sm={12} lg={8}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <ShopOutlined />
                <span>Table Status</span>
              </div>
            }
            className="shadow-md border-0"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : stats.tableStatusData.length > 0 ? (
              <div>
                <Pie
                  data={stats.tableStatusData}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  innerRadius={0.5}
                  label={false}
                  legend={{
                    position: 'bottom',
                    itemSpacing: 8,
                  }}
                  statistic={{
                    title: {
                      content: 'Total Tables',
                      style: { fontSize: '14px', color: '#666' },
                    },
                    content: {
                      content: stats.totalTables.toString(),
                      style: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937' },
                    },
                  }}
                  color={stats.tableStatusData.map(d => d.color)}
                  height={200}
                />
                <div className="mt-4 text-center">
                  <Progress
                    type="circle"
                    percent={stats.todayOccupancy}
                    format={(percent) => `${percent}%`}
                    strokeColor={{
                      '0%': '#10b981',
                      '100%': '#059669',
                    }}
                    size={80}
                  />
                  <p className="mt-2 text-sm text-gray-600">Occupancy Rate</p>
                </div>
              </div>
            ) : (
              <Empty description="No table data available" />
            )}
          </Card>
        </Col>

        {/* Menu Overview */}
        <Col xs={24} sm={12} lg={8}>
          <Card 
            title={
              <div className="flex items-center gap-2">
                <AppstoreOutlined />
                <span>Menu Overview</span>
              </div>
            }
            className="shadow-md border-0"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-bold text-lg">{stats.totalMenuItems}</span>
                  </div>
                  <Progress
                    percent={stats.totalMenuItems > 0 ? Math.round((stats.availableMenuItems / stats.totalMenuItems) * 100) : 0}
                    strokeColor="#10b981"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Available Items</span>
                    <span className="font-bold text-lg text-green-600">{stats.availableMenuItems}</span>
                  </div>
                  <Progress
                    percent={stats.totalMenuItems > 0 ? Math.round((stats.availableMenuItems / stats.totalMenuItems) * 100) : 0}
                    strokeColor="#22c55e"
                    showInfo={false}
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Categories</span>
                    <span className="font-bold text-xl text-purple-600">{stats.menuCategories}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined />
            <span>Recent Orders</span>
          </div>
        }
        className="shadow-md border-0"
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : stats.recentOrders.length > 0 ? (
          <Table
            columns={recentOrdersColumns}
            dataSource={stats.recentOrders}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCartOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
            <p>No orders found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RestaurantDashboard;
