"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Skeleton,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  CoffeeOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";

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
    activeTables: 0,
    todayOccupancy: 0,
    currentMonthOccupancy: 0,
  });

  // Fetch restaurant statistics
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint when provided
      const [ordersResponse, tablesResponse] = await Promise.all([
        coreAxios.get("/restaurant/orders"),
        coreAxios.get("/restaurant/tables"),
      ]);

      if (ordersResponse.status === 200 && tablesResponse.status === 200) {
        const orders = Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : (ordersResponse.data?.orders || []);
        
        const tables = Array.isArray(tablesResponse.data) 
          ? tablesResponse.data 
          : (tablesResponse.data?.tables || []);

        const today = dayjs().startOf("day");
        const monthStart = dayjs().startOf("month");
        const monthEnd = dayjs().endOf("month");

        // Calculate today's revenue
        const todayOrders = orders.filter(order => {
          const orderDate = dayjs(order.orderDate || order.createdAt);
          return orderDate.isSame(today, "day");
        });
        const todayRevenue = todayOrders.reduce((sum, order) => 
          sum + (Number(order.totalAmount) || 0), 0
        );

        // Calculate current month revenue
        const monthOrders = orders.filter(order => {
          const orderDate = dayjs(order.orderDate || order.createdAt);
          return orderDate.isSameOrAfter(monthStart) && orderDate.isSameOrBefore(monthEnd);
        });
        const currentMonthRevenue = monthOrders.reduce((sum, order) => 
          sum + (Number(order.totalAmount) || 0), 0
        );

        // Calculate active tables
        const activeTables = tables.filter(table => 
          table.isAvailable === false
        ).length;

        // Calculate occupancy rates
        const totalTables = tables.length;
        const todayOccupancy = totalTables > 0 
          ? Math.round((activeTables / totalTables) * 100) 
          : 0;

        // For month occupancy, we'll use average (simplified)
        const currentMonthOccupancy = todayOccupancy; // Can be enhanced with actual month data

        setStats({
          todayRevenue,
          currentMonthRevenue,
          todayOrders: todayOrders.length,
          activeTables,
          todayOccupancy,
          currentMonthOccupancy,
        });
      }
    } catch (error) {
      console.error("Error fetching restaurant stats:", error);
      // Set default values on error
      setStats({
        todayRevenue: 0,
        currentMonthRevenue: 0,
        todayOrders: 0,
        activeTables: 0,
        todayOccupancy: 0,
        currentMonthOccupancy: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const currentMonthName = dayjs().format("MMMM");

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
      title: "Active Tables",
      value: stats.activeTables.toString(),
      icon: <ShopOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
    },
    {
      title: "Today's Table Occupancy",
      value: `${stats.todayOccupancy}%`,
      icon: <CoffeeOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    },
    {
      title: "Current Month Occupancy",
      value: `${stats.currentMonthOccupancy}%`,
      icon: <CoffeeOutlined className="text-xl" />,
      bgGradient: "linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-3 sm:mb-4">
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
      </div>

      {/* Stats Cards Grid */}
      <Row gutter={[12, 12]}>
        {dashboardCards.map((card, idx) => (
          <Col xs={24} sm={12} md={12} lg={8} key={idx}>
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
    </div>
  );
};

export default RestaurantDashboard;
