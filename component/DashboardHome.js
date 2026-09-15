import { useState, useEffect, useCallback } from "react";
import { Card, Col, Row, Skeleton } from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import { filterVisibleUsers } from "@/utils/systemUsers";
import dayjs from "dayjs";
import "./DashboardHome.css";

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

const DashboardHome = ({ hotelID = 1 }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userHotelID = resolveDashboardHotelId(hotelID, userInfo);

      const params = new URLSearchParams();
      if (userHotelID != null) params.set("hotelID", String(userHotelID));

      const [summaryResponse, usersResponse] = await Promise.all([
        coreAxios.get(`/bookings/dashboard?${params.toString()}`),
        coreAxios.get("/users").catch(() => null),
      ]);

      if (summaryResponse.status === 200) {
        setSummary(summaryResponse.data || null);
      } else {
        setSummary(null);
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
      console.error("Error fetching dashboard summary:", error);
      setSummary(null);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [hotelID]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const kpis = summary?.kpis || {};
  const period = summary?.periodSummary || {};
  const totalRooms = summary?.totalRooms || 0;
  const currentMonthName = dayjs().format("MMMM");

  const summaryCards = [
    {
      title: "Today's FTB Bookings",
      amount: period.todayFtb?.amount || 0,
      count: period.todayFtb?.count || 0,
      accent: "lagoon",
    },
    {
      title: "Today's All Bookings",
      amount: period.todayAll?.amount || 0,
      count: period.todayAll?.count || 0,
      accent: "green",
    },
    {
      title: "30 Days FTB Bookings",
      amount: period.last30Ftb?.amount || 0,
      count: period.last30Ftb?.count || 0,
      accent: "sand",
    },
    {
      title: "30 Days All Bookings",
      amount: period.last30?.amount || 0,
      count: period.last30?.count || 0,
      accent: "ocean",
    },
  ];

  const summaryUserRows = Array.isArray(summary?.userBreakdown)
    ? summary.userBreakdown
    : [];
  const usersFromApi = Array.isArray(users) ? users : [];
  const baseUsers = usersFromApi.map((u) =>
    String(u?.loginID || u?.username || u?._id || "")
  );
  const userRowMap = Object.fromEntries(
    summaryUserRows.map((r) => [String(r.userId), r])
  );
  const mergedUserIds = Array.from(
    new Set([...baseUsers.filter(Boolean), ...Object.keys(userRowMap)])
  );

  const userBookingRows = mergedUserIds
    .map((userId) => {
      const row = userRowMap[userId] || {};
      return {
        userId,
        todayAmount: row.todayAmount || 0,
        sevenAmount: row.sevenAmount || 0,
        thirtyAmount: row.thirtyAmount || 0,
        overallAmount: row.overallAmount || 0,
      };
    })
    .sort((a, b) => b.overallAmount - a.overallAmount);

  const stats = [
    {
      label: "Today's Booking Amount",
      value: kpis.todayBookingAmount || 0,
      isCurrency: true,
      icon: DollarOutlined,
      accent: "ocean",
    },
    {
      label: `Month (${currentMonthName}) Booking Amount`,
      value: kpis.currentMonthBookingAmount || 0,
      isCurrency: true,
      icon: DollarOutlined,
      accent: "lagoon",
    },
    {
      label: "Today's Check-ins",
      value: kpis.todayCheckIns || 0,
      isCurrency: false,
      icon: UserOutlined,
      accent: "soft",
    },
    {
      label: "Today's Check-outs",
      value: kpis.todayCheckOuts || 0,
      isCurrency: false,
      icon: CalendarOutlined,
      accent: "sand",
    },
    {
      label: `Today's Occupancy (${kpis.todayOccupiedRoomsCount || 0}/${totalRooms})`,
      value: kpis.todayOccupancyRate || 0,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "green",
      footnote:
        kpis.todayOccupiedRoomNames?.length
          ? `Rooms: ${kpis.todayOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${kpis.todayOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied today",
    },
    {
      label: "Month Occupancy Rate",
      value: kpis.currentMonthOccupancyRate || 0,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "deep",
    },
    {
      label: `Tomorrow Occupancy (${kpis.tomorrowOccupiedRoomsCount || 0}/${totalRooms})`,
      value: kpis.tomorrowOccupancyRate || 0,
      isCurrency: false,
      isPercentage: true,
      icon: HomeOutlined,
      accent: "ocean",
      footnote:
        kpis.tomorrowOccupiedRoomNames?.length
          ? `Rooms: ${kpis.tomorrowOccupiedRoomNames
              .slice(0, 8)
              .join(", ")}${kpis.tomorrowOccupiedRoomNames.length > 8 ? "..." : ""}`
          : "No rooms occupied tomorrow",
    },
  ];

  const formatValue = (stat) => {
    if (stat.isCurrency) return `৳${stat.value.toLocaleString()}`;
    if (stat.isPercentage) return `${stat.value}%`;
    return stat.value.toLocaleString();
  };

  return (
    <div>
      <div className="hs-dash-intro">
        <h2>Operational Overview</h2>
        <p>Monitor hotel performance and bookings in real time</p>
      </div>

      {loading ? (
        <Row gutter={[10, 10]}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Col xs={24} sm={12} lg={8} key={item}>
              <Card size="small">
                <Skeleton active paragraph={{ rows: 1 }} title={false} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="hs-kpi-grid">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`hs-kpi hs-kpi--${stat.accent}`}>
                <div className="hs-kpi__top">
                  <p className="hs-kpi__label">{stat.label}</p>
                  <span className="hs-kpi__icon">
                    <Icon />
                  </span>
                </div>
                <div>
                  <p className="hs-kpi__value">{formatValue(stat)}</p>
                  {stat.footnote ? (
                    <p className="hs-kpi__meta">{stat.footnote}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="hs-section">
        <div className="hs-section__head">
          <h3>Booking Period Summary</h3>
          <p>FTB vs all bookings</p>
        </div>
        <div
          className="hs-kpi-grid"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {summaryCards.map((item, idx) => (
            <div key={`summary-${idx}`} className={`hs-kpi hs-kpi--${item.accent}`}>
              <div className="hs-kpi__top">
                <p className="hs-kpi__label">{item.title}</p>
              </div>
              <div>
                <p className="hs-kpi__value">৳{item.amount.toLocaleString()}</p>
                <p className="hs-kpi__meta">{item.count} bookings</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hs-section">
        <div className="hs-section__head">
          <h3>User-wise Booking Overview</h3>
          <p>Performance by booking operator</p>
        </div>
        <div className="hs-panel">
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
                {userBookingRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      No user booking data found
                    </td>
                  </tr>
                ) : (
                  userBookingRows.map((row) => (
                    <tr key={row.userId}>
                      <td className="id-cell">{row.userId}</td>
                      <td className="num">৳{row.todayAmount.toLocaleString()}</td>
                      <td className="num">৳{row.sevenAmount.toLocaleString()}</td>
                      <td className="num">৳{row.thirtyAmount.toLocaleString()}</td>
                      <td className="num total-cell">
                        ৳{row.overallAmount.toLocaleString()}
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
  );
};

export default DashboardHome;
