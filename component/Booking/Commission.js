"use client";
import React, { useState, useEffect } from "react";
import {
  Select,
  DatePicker,
  Button,
  Spin,
  Alert,
  message,
  Tooltip,
} from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import coreAxios from "@/utils/axiosInstance";
import Link from "next/link";
import CopyToClipboard from "react-copy-to-clipboard";

const { RangePicker } = DatePicker;
const { Option } = Select;

const CommissionPage = ({ hotelID }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHotelInformation();
    fetchUsers();
  }, []);

  const fetchHotelInformation = async () => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = hotelID;

      const res = await coreAxios.get(`hotel`);
      setLoading(false);

      if (res?.status === 200) {
        let hotelData = res?.data;

        if (userRole === "hoteladmin" && userHotelID) {
          hotelData = hotelData.filter(
            (hotel) => hotel.hotelID === userHotelID
          );
        }

        setHotels(hotelData);
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch hotel data", error);
      message.error("Failed to load hotels. Please try again.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await coreAxios.get("auth/users");
      if (response.status === 200) {
        setUsers(response.data?.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("Failed to load users. Please try again.");
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const userLoginID = selectedUser;

      // Fetch bookings from API
      const response = await coreAxios.get("bookings");

      if (response.status === 200) {
        const filtered = response.data.filter((data) => data.statusID !== 255);

        const [startDate, endDate] = dates.map((date) =>
          dayjs(date).format("YYYY-MM-DD")
        );

        // Apply filters based on the provided criteria
        const filteredByCriteria = filtered.filter((booking) => {
          const matchHotel = selectedHotel
            ? booking.hotelID === selectedHotel
            : true;
          const matchUser = selectedUser
            ? booking.bookedByID === selectedUser
            : true;
          const matchLoginID = userLoginID
            ? booking.bookedByID === userLoginID
            : true;
          const matchDate =
            dates.length > 0
              ? dayjs(booking.checkInDate).isBetween(
                  startDate,
                  endDate,
                  "day",
                  "[]"
                )
              : true;

          return matchHotel && matchUser && matchLoginID && matchDate;
        });

        // Sort the bookings by checkInDate (sequential order)
        const sortedBookings = filteredByCriteria.sort((a, b) =>
          dayjs(a.checkInDate).isBefore(dayjs(b.checkInDate)) ? -1 : 1
        );

        // Calculate commissions for each booking
        const bookingsWithCommissions = sortedBookings.map((booking) => {
          const ftbCommission = booking.totalBill * 0.2; // 20% of total bill

          // Calculate cash commission: advancePayment - ftbCommission
          const cashCommission = ftbCommission - booking.advancePayment;

          return {
            ...booking,
            ftbCommission,
            cashCommission,
          };
        });

        setFilteredBookings(bookingsWithCommissions);
      }
    } catch (error) {
      message.error("Failed to fetch bookings.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredBookings.length) {
      message.error("No data to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commissions");
    XLSX.writeFile(workbook, `Commissions_${dayjs().format("YYYYMMDD")}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredBookings.length) {
      message.error("No data to export.");
      return;
    }

    const doc = new jsPDF();

    // Prepare header data
    const startDate =
      dates.length > 0 ? dayjs(dates[0]).format("DD MMM YYYY") : "N/A";
    const endDate =
      dates.length > 1 ? dayjs(dates[1]).format("DD MMM YYYY") : "N/A";
    const userName = selectedUser
      ? users.find((user) => user.loginID === selectedUser)?.username || "N/A"
      : "All Users";
    const hotelName = selectedHotelName || "All Hotels";

    // Header Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Commission Report", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Hotel: ${hotelName}`, 14, 22);
    doc.text(`User: ${userName}`, 14, 27);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);

    // Add line break
    doc.setLineWidth(0.3);
    doc.line(14, 35, 196, 35);

    // Table Columns
    const columns = [
      "Invoice No.",
      "Guest Name",
      "Check-In",
      "Check-Out",
      "Nights",
      "Total Bill",
      "Transaction ID",
      "bKash",
      "Bank",
      "FTB Commission",
      "Cash Commission",
    ];

    // Table Rows
    const rows = filteredBookings.map((booking) => [
      booking.bookingNo,
      booking.fullName,
      dayjs(booking.checkInDate).format("DD MMM YYYY"),
      dayjs(booking.checkOutDate).format("DD MMM YYYY"),
      booking.nights,
      booking.totalBill.toFixed(2),
      booking.transactionId,
      booking.paymentMethod === "BKASH"
        ? booking.advancePayment.toFixed(2)
        : "-",
      booking.paymentMethod === "BANK"
        ? booking.advancePayment.toFixed(2)
        : "-",
      booking.ftbCommission.toFixed(2),
      booking.cashCommission.toFixed(2),
    ]);

    // Auto table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 38,
      theme: "grid",
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 7,
        halign: "center",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 10, bottom: 10 },
    });

    // Totals
    const totals = {
      totalBill: filteredBookings
        .reduce((acc, b) => acc + b.totalBill, 0)
        .toFixed(2),
      bkash: filteredBookings
        .filter((b) => b.paymentMethod === "BKASH")
        .reduce((acc, b) => acc + b.advancePayment, 0)
        .toFixed(2),
      bank: filteredBookings
        .filter((b) => b.paymentMethod === "BANK")
        .reduce((acc, b) => acc + b.advancePayment, 0)
        .toFixed(2),
      ftbCommission: filteredBookings
        .reduce((acc, b) => acc + b.ftbCommission, 0)
        .toFixed(2),
      cashCommission: filteredBookings
        .reduce((acc, b) => acc + b.cashCommission, 0)
        .toFixed(2),
    };

    // Add Totals Section
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const finalY = doc.lastAutoTable.finalY + 7;

    doc.text(`Summary`, 14, finalY);
    doc.autoTable({
      body: [
        [
          "",
          "",
          "",
          "",
          "",
          `Total Bill: ${totals.totalBill}`,
          "",
          `bKash: ${totals.bkash}`,
          `Bank: ${totals.bank}`,
          `FTB Commission: ${totals.ftbCommission}`,
          `Cash Commission: ${totals.cashCommission}`,
        ],
      ],
      startY: finalY + 4,
      styles: {
        fillColor: [240, 240, 240],
        fontSize: 8,
        halign: "center",
        textColor: [0, 0, 0],
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    const timestamp = dayjs().format("DD MMM YYYY HH:mm:ss");
    doc.text(`Generated on: ${timestamp}`, 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 190, pageHeight - 10, { align: "right" });

    // Save the file
    const fileName =
      `${hotelName}_${userName}_${startDate}_to_${endDate}_Commissions.pdf`.replace(
        /\s+/g,
        "_"
      );
    doc.save(fileName);
  };

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
        Commission Report
      </h3>

      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <Select
          placeholder="Select Hotel"
          style={{ width: "20%", minWidth: "180px" }}
          value={selectedHotel}
          onChange={(value) => {
            setSelectedHotel(value);
            const selectedHotelObj = hotels.find(
              (hotel) => hotel.hotelID === value
            );
            setSelectedHotelName(
              selectedHotelObj ? selectedHotelObj.hotelName : ""
            );
          }}
        >
          {hotels.map((hotel) => (
            <Option key={hotel.hotelID} value={hotel.hotelID}>
              {hotel.hotelName}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Select User"
          style={{ width: "20%", minWidth: "180px" }}
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}
        >
          {users.map((user) => (
            <Option key={user.id} value={user.loginID}>
              {user.loginID}
            </Option>
          ))}
        </Select>

        <RangePicker
          value={dates}
          onChange={(dates) => setDates(dates || [])}
          style={{ width: "30%", minWidth: "250px" }}
        />

        <Button type="primary" onClick={fetchBookings}>
          Apply Filters
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
          disabled={!filteredBookings.length}
        >
          Export to Excel
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToPDF}
          disabled={!filteredBookings.length}
        >
          Export to PDF
        </Button>
      </div>

      {loading ? (
        <Spin style={{ marginTop: "20px" }} tip="Loading, please wait...">
          <Alert
            message="Fetching commission data"
            description="This may take a moment, thank you for your patience."
            type="info"
          />
        </Spin>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              minWidth: "1300px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Invoice No.
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Guest Name
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Check-In
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Check-Out
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Nights
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Total Bill
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Transaction ID
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                    backgroundColor: "#e6f7ff",
                  }}
                >
                  bKash
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                    backgroundColor: "#f6ffed",
                  }}
                >
                  Bank
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  FTB Commission
                </th>
                <th
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    padding: "8px",
                  }}
                >
                  Cash Commission
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length ? (
                filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="border border-tableBorder text-center p-2">
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Link
                          target="_blank"
                          href={`/newInvoice/${booking.bookingNo}`}
                          passHref
                        >
                          <p
                            style={{
                              color: "#1890ff",
                              cursor: "pointer",
                              marginRight: 8,
                            }}
                          >
                            {booking.bookingNo}
                          </p>
                        </Link>
                        <Tooltip title="Click to copy">
                          <CopyToClipboard
                            text={booking.bookingNo}
                            onCopy={() => message.success("Copied!")}
                          >
                            <CopyOutlined
                              style={{
                                cursor: "pointer",
                                color: "#1890ff",
                              }}
                            />
                          </CopyToClipboard>
                        </Tooltip>
                      </span>
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {booking.fullName}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {dayjs(booking.checkInDate).format("DD MMM YYYY")}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {dayjs(booking.checkOutDate).format("DD MMM YYYY")}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {booking.nights}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {booking.totalBill.toFixed(2)}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {booking.transactionId}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                        backgroundColor:
                          booking.paymentMethod === "BKASH"
                            ? "#e6f7ff"
                            : "transparent",
                      }}
                    >
                      {booking.paymentMethod === "BKASH"
                        ? booking.advancePayment.toFixed(2)
                        : "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                        backgroundColor:
                          booking.paymentMethod === "BANK"
                            ? "#f6ffed"
                            : "transparent",
                      }}
                    >
                      {booking.paymentMethod === "BANK"
                        ? booking.advancePayment.toFixed(2)
                        : "-"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                      }}
                    >
                      {booking.ftbCommission.toFixed(2)}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        textAlign: "center",
                        padding: "8px",
                        color: booking.cashCommission < 0 ? "red" : "green",
                        fontWeight:
                          booking.cashCommission < 0 ? "bold" : "bold",
                      }}
                    >
                      {booking.cashCommission.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="11"
                    style={{
                      textAlign: "center",
                      border: "1px solid black",
                      padding: "20px",
                    }}
                  >
                    No commission data available.
                  </td>
                </tr>
              )}

              {/* Summary Row for Totals */}
              {filteredBookings.length > 0 && (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      border: "1px solid black",
                      padding: "8px",
                    }}
                  >
                    Total:
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                    }}
                  >
                    {filteredBookings
                      .reduce((sum, booking) => sum + booking.totalBill, 0)
                      .toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                    }}
                  >
                    -
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                      backgroundColor: "#e6f7ff",
                    }}
                  >
                    {filteredBookings
                      .filter((b) => b.paymentMethod === "BKASH")
                      .reduce((sum, booking) => sum + booking.advancePayment, 0)
                      .toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                      backgroundColor: "#f6ffed",
                    }}
                  >
                    {filteredBookings
                      .filter((b) => b.paymentMethod === "BANK")
                      .reduce((sum, booking) => sum + booking.advancePayment, 0)
                      .toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                    }}
                  >
                    {filteredBookings
                      .reduce((sum, booking) => sum + booking.ftbCommission, 0)
                      .toFixed(2)}
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      textAlign: "center",
                      fontWeight: "bold",
                      padding: "8px",
                      color:
                        filteredBookings.reduce(
                          (sum, booking) => sum + booking.cashCommission,
                          0
                        ) < 0
                          ? "red"
                          : "black",
                    }}
                  >
                    {filteredBookings
                      .reduce((sum, booking) => sum + booking.cashCommission, 0)
                      .toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommissionPage;
