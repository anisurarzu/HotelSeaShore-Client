"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Select, DatePicker, Button, Skeleton, message } from "antd";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import coreAxios from "@/utils/axiosInstance";
import { filterVisibleUsers } from "@/utils/systemUsers";
import "./AdminOps.css";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** Always return an array. Never return a non-array. */
function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val !== "object") return [];
  if (Array.isArray(val.bookings)) return val.bookings;
  if (Array.isArray(val.data)) return val.data;
  if (val.data && Array.isArray(val.data.bookings)) return val.data.bookings;
  if (Array.isArray(val.list)) return val.list;
  return [];
}

const AllBookingInfo = ({ hotelID }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  /** Display list: only ever a real array, used for table/export to avoid any .forEach errors */
  const [displayList, setDisplayList] = useState(() => []);

  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const hotelsList = useMemo(() => (Array.isArray(hotels) ? hotels : []), [hotels]);
  const usersList = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  useEffect(() => {
    const next = Array.isArray(filteredBookings) ? filteredBookings.slice() : [];
    setDisplayList(next);
  }, [filteredBookings]);

  useEffect(() => {
    fetchHotelInformation();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (hotelsList.length > 0 && selectedHotel == null) {
      const first = hotelsList[0];
      if (first) {
        setSelectedHotel(first.hotelID);
        setSelectedHotelName(first.hotelName || first.name || "");
      }
    }
  }, [hotelsList.length]);

  const fetchHotelInformation = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const res = await coreAxios.get("hotel");
      setLoading(false);

      if (res?.status !== 200) {
        setHotels([]);
        return;
      }

      const raw = toArray(res?.data);
      let hotelData = Array.isArray(raw) ? raw : [];

      if (userRole === "hoteladmin" && userHotelID) {
        hotelData = hotelData.filter((hotel) => hotel && hotel.hotelID === userHotelID);
      }

      setHotels(hotelData);
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch hotel data", error);
      message.error("Failed to load hotels. Please try again.");
      setHotels([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await coreAxios.get("auth/users");
      if (response?.status === 200) {
        const u = response.data?.users;
        setUsers(filterVisibleUsers(Array.isArray(u) ? u : []));
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("Failed to load users. Please try again.");
      setUsers([]);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { buildBookingsPath, unwrapBookings } = await import("@/utils/bookingsApi");
      const dateRange = Array.isArray(dates) && dates.length >= 2 ? dates : [];
      const startDate = dateRange[0]
        ? dayjs(dateRange[0]).format("YYYY-MM-DD")
        : dayjs().subtract(3, "month").format("YYYY-MM-DD");
      const endDate = dateRange[1]
        ? dayjs(dateRange[1]).format("YYYY-MM-DD")
        : dayjs().add(1, "month").format("YYYY-MM-DD");

      const response = await coreAxios.get(
        buildBookingsPath({
          hotelID: selectedHotel || hotelID || undefined,
          startDate,
          endDate,
          mode: "checkIn",
          excludeCancelled: 1,
          fields: "light",
          bookedByID: selectedUser || undefined,
          page: 1,
          limit: 1000,
        })
      );

      if (response?.status !== 200) {
        setFilteredBookings([]);
        return;
      }

      const filtered = unwrapBookings(response.data).filter(
        (b) => b && b.statusID !== 255
      );

      const sorted = [...filtered].sort((a, b) =>
        dayjs(a.checkInDate).isBefore(dayjs(b.checkInDate)) ? -1 : 1
      );

      setBookings(sorted);
      setFilteredBookings(Array.isArray(sorted) ? sorted : []);
    } catch (error) {
      message.error("Failed to fetch bookings.");
      console.error(error);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const list = displayList;
    if (!Array.isArray(list) || list.length === 0) {
      message.error("No data to export.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(list);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, `Hotel_Sea_Shore_Bookings_${dayjs().format("YYYYMMDD")}.xlsx`);
    message.success("Excel exported.");
  };

  const exportToPDF = () => {
    const list = displayList;
    if (!Array.isArray(list) || list.length === 0) {
      message.error("No data to export.");
      return;
    }

    const doc = new jsPDF();
    const startDate = dates.length > 0 ? dayjs(dates[0]).format("DD MMM YYYY") : "N/A";
    const endDate = dates.length > 1 ? dayjs(dates[1]).format("DD MMM YYYY") : "N/A";
    const userName = selectedUser
      ? (usersList.find((u) => u.loginID === selectedUser)?.username || "N/A")
      : "All Users";
    const hotelName = "Hotel Sea Shore";

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Booking Information", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Hotel: ${hotelName}`, 14, 22);
    doc.text(`User: ${userName}`, 14, 27);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);
    doc.setLineWidth(0.3);
    doc.line(14, 35, 196, 35);

    const columns = [
      "Booking No",
      "Full Name",
      "Check-In",
      "Check-Out",
      "No Of Nights",
      "Room",
      "Method",
      "TrxID",
      "Total Bill",
    ];

    const rows = list.map((booking) => [
      booking.bookingNo,
      booking.fullName,
      dayjs(booking.checkInDate).format("DD MMM YYYY"),
      dayjs(booking.checkOutDate).format("DD MMM YYYY"),
      booking.nights,
      `${booking.roomCategoryName || ""} (${booking.roomNumberName || ""})`,
      booking.paymentMethod || "",
      booking.transactionId || "",
      (booking.totalBill != null ? Number(booking.totalBill) : 0).toFixed(2),
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 38,
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, halign: "center" },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        7: {
          fontSize: 6,
          cellWidth: 40,
          halign: "center",
          textColor: [0, 0, 0],
          valign: "middle",
          overflow: "linebreak",
        },
      },
      margin: { top: 10, bottom: 10 },
    });

    const totals = {
      totalBill: list.reduce((acc, b) => acc + (Number(b.totalBill) || 0), 0).toFixed(2),
      advancePayment: list.reduce((acc, b) => acc + (Number(b.advancePayment) || 0), 0).toFixed(2),
      duePayment: list.reduce((acc, b) => acc + (Number(b.duePayment) || 0), 0).toFixed(2),
    };

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const finalY = doc.lastAutoTable.finalY + 7;
    doc.text("Summary", 14, finalY);
    doc.autoTable({
      body: [
        [
          "",
          "",
          "",
          "",
          "",
          "Totals:",
          `Total Bill: ${totals.totalBill}`,
          `Advance Payment: ${totals.advancePayment}`,
          `Due Payment: ${totals.duePayment}`,
        ],
      ],
      startY: finalY + 4,
      styles: {
        fillColor: [240, 240, 240],
        fontSize: 9,
        halign: "center",
        textColor: [0, 0, 0],
      },
      columnStyles: { 5: { fontStyle: "bold" } },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Generated on: ${dayjs().format("DD MMM YYYY HH:mm:ss")}`, 14, pageHeight - 10);
    doc.text("Page 1 of 1", 190, pageHeight - 10, { align: "right" });
    doc.save(
      `Hotel_Sea_Shore_${userName}_${startDate}_to_${endDate}_Bookings.pdf`.replace(/\s+/g, "_")
    );
    message.success("PDF exported.");
  };

  const list = displayList;
  const hasList = Array.isArray(list) && list.length > 0;

  const totalBillSum = hasList ? list.reduce((sum, b) => sum + (Number(b.totalBill) || 0), 0) : 0;
  const advanceSum = hasList ? list.reduce((sum, b) => sum + (Number(b.advancePayment) || 0), 0) : 0;
  const dueSum = hasList ? list.reduce((sum, b) => sum + (Number(b.duePayment) || 0), 0) : 0;

  const dateLabel =
    Array.isArray(dates) && dates[0] && dates[1]
      ? `${dayjs(dates[0]).format("D MMM YYYY")} – ${dayjs(dates[1]).format("D MMM YYYY")}`
      : "All dates";

  return (
    <div className="hs-ab">
      <div className="hs-ab__toolbar">
        <div className="hs-ab__title-block">
          <p className="hs-ab__eyebrow">Analytics</p>
          <h2 className="hs-ab__title">Report Dashboard</h2>
          <p className="hs-ab__meta">
            Booking ledger · {dateLabel}
            {selectedUser ? ` · ${selectedUser}` : ""}
          </p>
        </div>
        <div className="hs-ab__controls">
          <Select
            placeholder="Select user"
            allowClear
            value={selectedUser}
            onChange={(value) => setSelectedUser(value)}
            style={{ minWidth: 150 }}
          >
            {usersList.map((user) => (
              <Option key={user.id || user._id || user.loginID} value={user.loginID}>
                {user.loginID || user.username}
              </Option>
            ))}
          </Select>
          <RangePicker
            value={dates}
            onChange={(d) => setDates(Array.isArray(d) ? d : [])}
            format="DD MMM YYYY"
          />
          <Button type="primary" onClick={fetchBookings}>
            Apply
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
            disabled={!hasList}
          >
            Excel
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            disabled={!hasList}
          >
            PDF
          </Button>
        </div>
      </div>

      <div className="hs-ab__kpis">
        <div className="hs-ab__kpi">
          <p className="hs-ab__kpi-label">Bookings</p>
          <p className="hs-ab__kpi-value">{hasList ? list.length : 0}</p>
        </div>
        <div className="hs-ab__kpi hs-ab__kpi--soft">
          <p className="hs-ab__kpi-label">Total bill</p>
          <p className="hs-ab__kpi-value">৳{fmt(totalBillSum)}</p>
        </div>
        <div className="hs-ab__kpi hs-ab__kpi--sand">
          <p className="hs-ab__kpi-label">Advance paid</p>
          <p className="hs-ab__kpi-value">৳{fmt(advanceSum)}</p>
        </div>
        <div className="hs-ab__kpi hs-ab__kpi--due">
          <p className="hs-ab__kpi-label">Due</p>
          <p className="hs-ab__kpi-value is-due">৳{fmt(dueSum)}</p>
        </div>
      </div>

      <div className="hs-ab__panel">
        <div className="hs-ab__panel-head">
          <h3>Booking report</h3>
          <span>{hasList ? `${list.length} rows` : "No data"}</span>
        </div>
        {loading ? (
          <div className="hs-ab__loading">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <div className="hs-ab__scroll">
            <table className="hs-ab__table">
              <thead>
                <tr>
                  <th>Booking no</th>
                  <th>Guest</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Room</th>
                  <th className="is-center">Nights</th>
                  <th>Method</th>
                  <th>Trx ID</th>
                  <th className="is-num">Total</th>
                  <th className="is-num">Advance</th>
                  <th className="is-num is-due">Due</th>
                </tr>
              </thead>
              <tbody>
                {hasList ? (
                  list.map((booking) => (
                    <tr key={booking._id || booking.bookingNo}>
                      <td>
                        <span className="hs-ab__invoice">
                          {booking.bookingNo || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="hs-ab__guest" title={booking.fullName || ""}>
                          {booking.fullName || "—"}
                        </div>
                      </td>
                      <td>
                        {booking.checkInDate
                          ? dayjs(booking.checkInDate).format("DD MMM YYYY")
                          : "—"}
                      </td>
                      <td>
                        {booking.checkOutDate
                          ? dayjs(booking.checkOutDate).format("DD MMM YYYY")
                          : "—"}
                      </td>
                      <td>
                        <div>
                          {booking.roomNumberName || "—"}
                          <div className="hs-ab__room">
                            {booking.roomCategoryName || ""}
                          </div>
                        </div>
                      </td>
                      <td className="is-center">{booking.nights ?? "—"}</td>
                      <td>{booking.paymentMethod || "—"}</td>
                      <td>{booking.transactionId || "—"}</td>
                      <td className="is-num">{fmt(booking.totalBill)}</td>
                      <td className="is-num">{fmt(booking.advancePayment)}</td>
                      <td className="is-num is-due">{fmt(booking.duePayment)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="hs-ab__empty">
                      No bookings for the selected filters. Apply user and date range, then click Apply.
                    </td>
                  </tr>
                )}
              </tbody>
              {hasList && (
                <tfoot>
                  <tr>
                    <td colSpan={8} className="is-num">
                      Total
                    </td>
                    <td className="is-num">{fmt(totalBillSum)}</td>
                    <td className="is-num">{fmt(advanceSum)}</td>
                    <td className="is-num is-due">{fmt(dueSum)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBookingInfo;
