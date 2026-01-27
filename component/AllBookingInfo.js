"use client";
import React, { useState, useEffect } from "react";
import { Select, DatePicker, Button, Spin, Alert, message, Table } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import coreAxios from "@/utils/axiosInstance";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { Option } = Select;

const AllBookingInfo = ({ hotelID }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    fetchHotelInformation();
    fetchUsers();
  }, []);

  const fetchHotelInformation = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      // Fetch hotels using API - same structure as BookingInfo
      const response = await coreAxios.get("/hotels");

      if (response.status === 200) {
        const responseData = response.data;
        let hotelsData = [];
        
        // Extract hotels array from response - same pattern as BookingInfo
        if (responseData?.hotels && Array.isArray(responseData.hotels)) {
          hotelsData = responseData.hotels;
        } else if (responseData?.success && responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          hotelsData = responseData.data.hotels;
        } else if (responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          hotelsData = responseData.data.hotels;
        } else if (Array.isArray(responseData?.data)) {
          hotelsData = responseData.data;
        } else if (Array.isArray(responseData)) {
          hotelsData = responseData;
        }

        // Ensure it's an array
        if (!Array.isArray(hotelsData)) {
          hotelsData = [];
        }

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID) {
          hotelsData = hotelsData.filter(
            (hotel) => hotel && hotel.hotelID === userHotelID
          );
        }

        setHotels(hotelsData);
      }
    } catch (error) {
      console.error("Failed to fetch hotel data", error);
      message.error(error.response?.data?.message || "Failed to load hotels. Please try again.");
      setHotels([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await coreAxios.get("auth/users");
      if (response.status === 200) {
        setUsers(response.data?.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("Failed to load users. Please try again.");
    }
  };

  const fetchBookings = async () => {
    setTableLoading(true);
    try {
      // Fetch bookings from API - same structure as BookingInfo
      const response = await coreAxios.get("/bookings");

      if (response.status === 200) {
        // API returns direct array of bookings
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        // Filter out statusID 255 (cancelled/deleted)
        bookingsData = bookingsData.filter((data) => data.statusID !== 255);

        // Apply filters based on the provided criteria
        const [startDate, endDate] = dates.length > 0 
          ? dates.map((date) => dayjs(date).format("YYYY-MM-DD"))
          : [null, null];

        const filteredByCriteria = bookingsData.filter((booking) => {
          const matchHotel = selectedHotel
            ? booking.hotelID === selectedHotel
            : true;
          const matchUser = selectedUser
            ? booking.bookedByID === selectedUser
            : true;
          const matchDate =
            startDate && endDate
              ? dayjs(booking.checkInDate).isSameOrAfter(startDate, "day") &&
                dayjs(booking.checkInDate).isSameOrBefore(endDate, "day")
              : true;

          return matchHotel && matchUser && matchDate;
        });

        // Sort the bookings by checkInDate (sequential order)
        const sortedBookings = filteredByCriteria.sort((a, b) =>
          dayjs(a.checkInDate).isBefore(dayjs(b.checkInDate)) ? -1 : 1
        );

        setBookings(sortedBookings);
        setFilteredBookings(sortedBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(error.response?.data?.message || "Failed to fetch bookings.");
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setTableLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredBookings.length) {
      message.error("No data to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, `Bookings_${dayjs().format("YYYYMMDD")}.xlsx`);
    message.success("Excel file exported successfully!");
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
    doc.text("Booking Information", 14, 15);

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

    // Table Rows
    const rows = filteredBookings.map((booking) => [
      booking.bookingNo,
      booking.fullName,
      dayjs(booking.checkInDate).format("DD MMM YYYY"),
      dayjs(booking.checkOutDate).format("DD MMM YYYY"),
      booking.nights,
      `${booking.roomCategoryName || ""} (${booking.roomNumberName || ""})`,
      booking.paymentMethod || "",
      booking.transactionId || "",
      (booking.totalBill || 0).toFixed(2),
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
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        halign: "center",
      },
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

    // Totals Row
    const totals = {
      totalBill: filteredBookings
        .reduce((acc, b) => acc + (b.totalBill || 0), 0)
        .toFixed(2),
      advancePayment: filteredBookings
        .reduce((acc, b) => acc + (b.advancePayment || 0), 0)
        .toFixed(2),
      duePayment: filteredBookings
        .reduce((acc, b) => acc + (b.duePayment || 0), 0)
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

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    const timestamp = dayjs().format("DD MMM YYYY HH:mm:ss");
    doc.text(`Generated on: ${timestamp}`, 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 190, pageHeight - 10, { align: "right" });

    // Save the file
    const fileName =
      `${hotelName}_${userName}_${startDate}_to_${endDate}_Bookings.pdf`.replace(
        /\s+/g,
        "_"
      );
    doc.save(fileName);
    message.success("PDF file exported successfully!");
  };

  // Table columns configuration
  const columns = [
    {
      title: "Booking No",
      dataIndex: "bookingNo",
      key: "bookingNo",
      responsive: ["md"],
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Check-In",
      dataIndex: "checkInDate",
      key: "checkInDate",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
      responsive: ["md"],
    },
    {
      title: "Check-Out",
      dataIndex: "checkOutDate",
      key: "checkOutDate",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
      responsive: ["md"],
    },
    {
      title: "Room",
      key: "room",
      render: (_, record) =>
        `${record.roomCategoryName || ""} (${record.roomNumberName || ""})`,
      responsive: ["lg"],
    },
    {
      title: "Nights",
      dataIndex: "nights",
      key: "nights",
      responsive: ["sm"],
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      responsive: ["md"],
    },
    {
      title: "TrxID",
      dataIndex: "transactionId",
      key: "transactionId",
      responsive: ["lg"],
    },
    {
      title: "Total Bill",
      dataIndex: "totalBill",
      key: "totalBill",
      render: (value) => (value || 0).toFixed(2),
      responsive: ["sm"],
    },
    {
      title: "Advance",
      dataIndex: "advancePayment",
      key: "advancePayment",
      render: (value) => (value || 0).toFixed(2),
      responsive: ["md"],
    },
    {
      title: "Due",
      dataIndex: "duePayment",
      key: "duePayment",
      render: (value) => (value || 0).toFixed(2),
      responsive: ["md"],
    },
  ];

  // Calculate totals
  const totals = {
    totalBill: filteredBookings.reduce((acc, b) => acc + (b.totalBill || 0), 0),
    advancePayment: filteredBookings.reduce((acc, b) => acc + (b.advancePayment || 0), 0),
    duePayment: filteredBookings.reduce((acc, b) => acc + (b.duePayment || 0), 0),
  };

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6" style={{ color: "#38a169" }}>
        Booking Information
      </h3>

      {/* Filters Section - Responsive */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          <Select
            placeholder="Select Hotel"
            className="w-full sm:w-auto sm:flex-1 min-w-[150px]"
            value={selectedHotel}
            onChange={(value) => {
              setSelectedHotel(value);
              const selectedHotelObj = hotels.find(
                (hotel) => hotel.hotelID === value
              );
              setSelectedHotelName(
                selectedHotelObj ? selectedHotelObj.hotelName || selectedHotelObj.name : ""
              );
            }}
            allowClear
          >
            {hotels.map((hotel) => (
              <Option key={hotel.hotelID} value={hotel.hotelID}>
                {hotel.hotelName || hotel.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Select User"
            className="w-full sm:w-auto sm:flex-1 min-w-[150px]"
            value={selectedUser}
            onChange={(value) => setSelectedUser(value)}
            allowClear
          >
            {users.map((user) => (
              <Option key={user.id || user._id} value={user.loginID}>
                {user.loginID || user.username}
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dates}
            onChange={(dates) => setDates(dates || [])}
            className="w-full sm:w-auto sm:flex-1"
            format="MMM D, YYYY"
          />

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <Button 
              type="primary" 
              onClick={fetchBookings}
              className="w-full sm:w-auto"
              loading={tableLoading}
            >
              Apply Filters
            </Button>

            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-2">
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
                disabled={!filteredBookings.length}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                disabled={!filteredBookings.length}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {tableLoading ? (
        <Spin tip="Loading bookings..." size="large">
          <div style={{ minHeight: "200px" }} />
        </Spin>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredBookings}
              rowKey={(record) => record._id || record.bookingNo}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} bookings`,
              }}
              scroll={{ x: "max-content" }}
              loading={tableLoading}
              locale={{
                emptyText: "No bookings available.",
              }}
              summary={() => (
                filteredBookings.length > 0 ? (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={8} align="right">
                        <strong>Total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={8} align="center">
                        <strong>{totals.totalBill.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={9} align="center">
                        <strong>{totals.advancePayment.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={10} align="center">
                        <strong>{totals.duePayment.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                ) : null
              )}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AllBookingInfo;
