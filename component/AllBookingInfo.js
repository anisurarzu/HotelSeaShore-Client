"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Select, DatePicker, Button, Spin, Alert, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import coreAxios from "@/utils/axiosInstance";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;

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
        setUsers(Array.isArray(u) ? u : []);
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
      const response = await coreAxios.get("bookings");

      if (response?.status !== 200) {
        setFilteredBookings([]);
        return;
      }

      const raw = toArray(response.data);
      const filtered = raw.filter((b) => b && b.statusID !== 255);

      const dateRange = Array.isArray(dates) && dates.length >= 2 ? dates : [];
      const startDate = dateRange[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null;
      const endDate = dateRange[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null;

      const filteredByCriteria = filtered.filter((booking) => {
        const matchHotel = selectedHotel ? booking.hotelID === selectedHotel : true;
        const matchUser = selectedUser ? booking.bookedByID === selectedUser : true;
        const matchDate =
          startDate && endDate
            ? dayjs(booking.checkInDate).isBetween(startDate, endDate, "day", "[]")
            : true;

        return matchHotel && matchUser && matchDate;
      });

      const sorted = [...filteredByCriteria].sort((a, b) =>
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

  return (
    <div style={{ padding: "20px" }}>
      <h3
        style={{
          color: "#38a169",
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "24px",
          marginBottom: "20px",
        }}
      >
        Booking Information
      </h3>

      <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {/* <Select
          placeholder="Select Hotel"
          style={{ minWidth: 140, flex: "1 1 25%" }}
          value={selectedHotel}
          onChange={(value) => {
            setSelectedHotel(value);
            const selectedHotelObj = hotelsList.find((h) => h.hotelID === value);
            setSelectedHotelName(selectedHotelObj ? selectedHotelObj.hotelName || selectedHotelObj.name : "");
          }}
        >
          {hotelsList.map((hotel) => (
            <Option key={hotel.hotelID} value={hotel.hotelID}>
              {hotel.hotelName || hotel.name}
            </Option>
          ))}
        </Select> */}

        <Select
          placeholder="Select User"
          style={{ minWidth: 120, flex: "1 1 25%" }}
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}
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
          style={{ minWidth: 220, flex: "1 1 40%" }}
        />

        <Button type="primary" onClick={fetchBookings}>
          Apply Filters
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
          disabled={!hasList}
        >
          Export to Excel
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToPDF}
          disabled={!hasList}
        >
          Export to PDF
        </Button>
      </div>

      {loading ? (
        <Spin style={{ marginTop: "20px" }} tip="Loading, please wait...">
          <Alert
            message="Fetching booking data"
            description="This may take a moment, thank you for your patience."
            type="info"
          />
        </Spin>
      ) : (
        <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Booking No</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Full Name</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Check-In</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Check-Out</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Room</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>No. Of Nights</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Method</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>TrxID</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Total Bill</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Advance</th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>Due</th>
            </tr>
          </thead>
          <tbody>
            {hasList ? (
              list.map((booking) => (
                <tr key={booking._id || booking.bookingNo || Math.random()}>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.bookingNo}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.fullName}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.checkInDate ? dayjs(booking.checkInDate).format("DD MMM YYYY") : ""}
                  </td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.checkOutDate ? dayjs(booking.checkOutDate).format("DD MMM YYYY") : ""}
                  </td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.roomCategoryName} ({booking.roomNumberName})
                  </td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.nights}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.paymentMethod}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.transactionId}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.totalBill}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.advancePayment}</td>
                  <td style={{ border: "1px solid black", textAlign: "center" }}>{booking.duePayment}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", border: "1px solid black" }}>
                  No bookings available.
                </td>
              </tr>
            )}

            {hasList && (
              <tr>
                <td
                  colSpan={8}
                  style={{ textAlign: "right", fontWeight: "bold", border: "1px solid black" }}
                >
                  Total:
                </td>
                <td style={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>
                  {totalBillSum.toFixed(2)}
                </td>
                <td style={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>
                  {advanceSum.toFixed(2)}
                </td>
                <td style={{ border: "1px solid black", textAlign: "center", fontWeight: "bold" }}>
                  {dueSum.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllBookingInfo;
