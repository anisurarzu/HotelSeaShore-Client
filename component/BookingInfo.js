"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  message,
  Popconfirm,
  Form,
  Input,
  DatePicker,
  Tooltip,
  Select,
  Pagination,
  Switch,
  Badge,
  Tag,
  Card,
  Space,
  Divider,
  Row,
  Col,
  Tabs,
} from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { v4 as uuidv4 } from "uuid";
import {
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { TabPane } = Tabs;

// Mock data for the component
const mockBookings = [
  {
    _id: "1",
    bookingNo: "FTB-0001",
    serialNo: "2024-001",
    fullName: "John Doe",
    phone: "+8801712345678",
    hotelName: "Sea Shore Resort",
    hotelID: 1,
    roomCategoryName: "Deluxe Suite",
    roomNumberName: "Room 101",
    roomNumberID: 101,
    roomCategoryID: 1,
    roomPrice: 5000,
    checkInDate: "2024-01-20",
    checkOutDate: "2024-01-25",
    createTime: "2024-01-15T10:30:00Z",
    nights: 5,
    advancePayment: 10000,
    totalBill: 25000,
    statusID: 1,
    bookedByID: "user1",
    updatedByID: "user1",
    updatedAt: "2024-01-15T10:30:00Z",
    adults: 2,
    children: 1,
    nidPassport: "AB1234567",
    address: "Dhaka, Bangladesh",
    email: "john@example.com",
    paymentMethod: "BKASH",
    transactionId: "TRX001",
    note: "Early check-in requested",
    isKitchen: true,
    kitchenTotalBill: 2000,
    extraBed: false,
    extraBedTotalBill: 0,
    canceledBy: "",
    reason: "",
  },
  {
    _id: "2",
    bookingNo: "FTB-0002",
    serialNo: "2024-002",
    fullName: "Jane Smith",
    phone: "+8801723456789",
    hotelName: "Sea Shore Resort",
    hotelID: 1,
    roomCategoryName: "Standard Room",
    roomNumberName: "Room 102",
    roomNumberID: 102,
    roomCategoryID: 2,
    roomPrice: 3000,
    checkInDate: "2024-01-22",
    checkOutDate: "2024-01-24",
    createTime: "2024-01-16T14:20:00Z",
    nights: 2,
    advancePayment: 3000,
    totalBill: 6000,
    statusID: 1,
    bookedByID: "user2",
    updatedByID: "user2",
    updatedAt: "2024-01-16T14:20:00Z",
    adults: 1,
    children: 0,
    nidPassport: "CD2345678",
    address: "Chittagong, Bangladesh",
    email: "jane@example.com",
    paymentMethod: "CASH",
    transactionId: "TRX002",
    note: "",
    isKitchen: false,
    kitchenTotalBill: 0,
    extraBed: true,
    extraBedTotalBill: 1000,
    canceledBy: "",
    reason: "",
  },
  {
    _id: "3",
    bookingNo: "FTB-0003",
    serialNo: "2024-003",
    fullName: "Mike Wilson",
    phone: "+8801734567890",
    hotelName: "Sea Shore Resort",
    hotelID: 1,
    roomCategoryName: "Family Suite",
    roomNumberName: "Room 201",
    roomNumberID: 201,
    roomCategoryID: 3,
    roomPrice: 8000,
    checkInDate: "2024-01-18",
    checkOutDate: "2024-01-20",
    createTime: "2024-01-17T09:15:00Z",
    nights: 2,
    advancePayment: 10000,
    totalBill: 16000,
    statusID: 255,
    bookedByID: "user1",
    updatedByID: "admin",
    updatedAt: "2024-01-17T16:45:00Z",
    adults: 4,
    children: 2,
    nidPassport: "EF3456789",
    address: "Sylhet, Bangladesh",
    email: "mike@example.com",
    paymentMethod: "BANK",
    transactionId: "TRX003",
    note: "",
    isKitchen: true,
    kitchenTotalBill: 3000,
    extraBed: true,
    extraBedTotalBill: 1500,
    canceledBy: "admin",
    reason: "Guest requested cancellation",
  },
];

const mockHotels = [
  {
    hotelID: 1,
    hotelName: "Sea Shore Resort",
    roomCategories: [
      {
        _id: 1,
        name: "Deluxe Suite",
        roomNumbers: [
          { _id: 101, name: "Room 101", bookedDates: [] },
          { _id: 102, name: "Room 102", bookedDates: [] },
          { _id: 103, name: "Room 103", bookedDates: [] },
        ],
      },
      {
        _id: 2,
        name: "Standard Room",
        roomNumbers: [
          { _id: 201, name: "Room 201", bookedDates: [] },
          { _id: 202, name: "Room 202", bookedDates: [] },
        ],
      },
      {
        _id: 3,
        name: "Family Suite",
        roomNumbers: [
          { _id: 301, name: "Room 301", bookedDates: [] },
          { _id: 302, name: "Room 302", bookedDates: [] },
        ],
      },
    ],
  },
];

const BookingInfo = () => {
  // State variables
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [bookings, setBookings] = useState(mockBookings);
  const [filteredBookings, setFilteredBookings] = useState(mockBookings);
  const [loading, setLoading] = useState(false);
  const [roomCategories, setRoomCategories] = useState(mockHotels[0]?.roomCategories || []);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [checkInFilterDate, setCheckInFilterDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [currentBooking, setCurrentBooking] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // User info mock
  const userInfo = {
    username: "admin",
    loginID: "admin",
  };

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      fullName: "",
      nidPassport: "",
      address: "",
      phone: "",
      email: "",
      hotelID: 1,
      hotelName: "Sea Shore Resort",
      isKitchen: false,
      kitchenTotalBill: 0,
      extraBedTotalBill: 0,
      extraBed: false,
      roomCategoryID: 0,
      roomCategoryName: "",
      roomNumberID: 0,
      roomNumberName: "",
      roomPrice: 0,
      checkInDate: dayjs(),
      checkOutDate: dayjs().add(1, "day"),
      nights: 1,
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      paymentMethod: "",
      transactionId: "",
      note: "",
      bookedBy: userInfo?.username || "",
      bookedByID: userInfo?.loginID || "",
      updatedByID: "",
      reference: "",
      adults: 1,
      children: 0,
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        
        // Generate new booking data
        const newBooking = {
          _id: isEditing ? editingKey : uuidv4(),
          bookingNo: `FTB-${String(bookings.length + 1001).padStart(4, '0')}`,
          serialNo: `2024-${String(bookings.length + 1001).padStart(3, '0')}`,
          ...values,
          checkInDate: dayjs(values.checkInDate).format("YYYY-MM-DD"),
          checkOutDate: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
          createTime: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusID: 1,
          bookedByID: userInfo?.loginID || "",
          updatedByID: userInfo?.loginID || "",
          canceledBy: "",
          reason: "",
        };

        if (isEditing) {
          // Update existing booking
          setBookings(prev => prev.map(booking => 
            booking._id === editingKey ? newBooking : booking
          ));
          message.success("Booking updated successfully!");
        } else {
          // Add new booking
          setBookings(prev => [newBooking, ...prev]);
          message.success("Booking created successfully!");
        }

        // Reset form and close modal
        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        
        // Apply current filters to the updated list
        applyFilters(searchText, checkInFilterDate);
      } catch (error) {
        message.error("Failed to save booking.");
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch room numbers based on category
  const fetchRoomNumbers = (categoryId) => {
    const category = roomCategories.find(cat => cat._id === categoryId);
    if (category && category.roomNumbers) {
      setRoomNumbers(category.roomNumbers);
    } else {
      setRoomNumbers([]);
    }
  };

  // Handle edit booking
  const handleEdit = (record) => {
    setEditingKey(record._id);
    fetchRoomNumbers(record.roomCategoryID);
    
    formik.setValues({
      ...formik.values,
      fullName: record.fullName,
      nidPassport: record.nidPassport,
      address: record.address,
      phone: record.phone,
      email: record.email,
      hotelID: record.hotelID,
      hotelName: record.hotelName,
      roomCategoryID: record.roomCategoryID,
      roomCategoryName: record.roomCategoryName,
      roomNumberID: record.roomNumberID,
      roomNumberName: record.roomNumberName,
      roomPrice: record.roomPrice,
      checkInDate: dayjs(record.checkInDate),
      checkOutDate: dayjs(record.checkOutDate),
      adults: record.adults,
      children: record.children,
      nights: record.nights,
      totalBill: record.totalBill,
      advancePayment: record.advancePayment,
      duePayment: record.duePayment,
      paymentMethod: record.paymentMethod,
      transactionId: record.transactionId,
      note: record.note,
      isKitchen: record.isKitchen,
      kitchenTotalBill: record.kitchenTotalBill,
      extraBed: record.extraBed,
      extraBedTotalBill: record.extraBedTotalBill,
    });
    
    setVisible(true);
    setIsEditing(true);
  };

  // Handle view booking details
  const handleView = (record) => {
    setSelectedBooking(record);
    setViewModalVisible(true);
  };

  // Handle delete/cancel booking
  const handleDelete = (booking) => {
    setCurrentBooking(booking);
    setIsModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!cancellationReason.trim()) {
      message.error("Please provide a reason for cancellation.");
      return;
    }

    setLoading(true);
    try {
      // Update booking status to canceled
      const updatedBooking = {
        ...currentBooking,
        statusID: 255,
        canceledBy: userInfo?.loginID,
        reason: cancellationReason,
        updatedAt: new Date().toISOString(),
        updatedByID: userInfo?.loginID,
      };

      setBookings(prev => prev.map(booking => 
        booking._id === currentBooking._id ? updatedBooking : booking
      ));

      message.success("Booking canceled successfully!");
      setIsModalVisible(false);
      setCancellationReason("");
      setCurrentBooking(null);
      
      // Apply current filters to the updated list
      applyFilters(searchText, checkInFilterDate);
    } catch (error) {
      message.error("Failed to cancel booking.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate nights when dates change
  const handleCheckInChange = (date) => {
    formik.setFieldValue("checkInDate", date);
    if (formik.values.checkOutDate) {
      const nights = date.diff(formik.values.checkOutDate, 'day');
      formik.setFieldValue("nights", Math.abs(nights));
    }
  };

  const handleCheckOutChange = (date) => {
    formik.setFieldValue("checkOutDate", date);
    if (formik.values.checkInDate) {
      const nights = formik.values.checkInDate.diff(date, 'day');
      formik.setFieldValue("nights", Math.abs(nights));
    }
  };

  // Handle advance payment change
  const handleAdvancePaymentChange = (e) => {
    const advancePayment = parseFloat(e.target.value) || 0;
    const totalBill = formik.values.totalBill;
    const duePayment = totalBill - advancePayment;
    
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
  };

  // Handle room category change
  const handleRoomCategoryChange = (value) => {
    const category = roomCategories.find(cat => cat._id === value);
    formik.setFieldValue("roomCategoryID", value);
    formik.setFieldValue("roomCategoryName", category?.name || "");
    formik.setFieldValue("roomNumberID", 0);
    formik.setFieldValue("roomNumberName", "");
    fetchRoomNumbers(value);
  };

  // Handle room number change
  const handleRoomNumberChange = (value) => {
    const room = roomNumbers.find(room => room._id === value);
    formik.setFieldValue("roomNumberID", value);
    formik.setFieldValue("roomNumberName", room?.name || "");
  };

  // Apply filters for search and date
  const applyFilters = (searchValue, checkInDate) => {
    let filteredData = bookings;

    // Apply text search filter
    if (searchValue) {
      filteredData = filteredData.filter(
        (r) =>
          r.bookingNo.toLowerCase().includes(searchValue) ||
          r.fullName.toLowerCase().includes(searchValue) ||
          r.phone.toLowerCase().includes(searchValue) ||
          r.roomCategoryName.toLowerCase().includes(searchValue) ||
          r.roomNumberName.toLowerCase().includes(searchValue)
      );
    }

    // Apply check-in date filter
    if (checkInDate) {
      const filterDate = dayjs(checkInDate).format("YYYY-MM-DD");
      filteredData = filteredData.filter(
        (booking) => dayjs(booking.checkInDate).format("YYYY-MM-DD") === filterDate
      );
    }

    // Apply tab filter
    if (activeTab === "active") {
      filteredData = filteredData.filter(b => b.statusID === 1);
    } else if (activeTab === "canceled") {
      filteredData = filteredData.filter(b => b.statusID === 255);
    }

    setFilteredBookings(filteredData);
    setPagination({ ...pagination, current: 1 });
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    applyFilters(value, checkInFilterDate);
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    applyFilters(searchText, checkInFilterDate);
  };

  // Handle check-in date filter
  const handleCheckInFilterChange = (date) => {
    setCheckInFilterDate(date);
    applyFilters(searchText, date);
  };

  // Clear check-in filter
  const clearCheckInFilter = () => {
    setCheckInFilterDate(null);
    applyFilters(searchText, null);
  };

  // Paginate data
  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  // Stats for tabs
  const stats = {
    all: bookings.length,
    active: bookings.filter(b => b.statusID === 1).length,
    canceled: bookings.filter(b => b.statusID === 255).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>
            <p className="text-gray-600">Manage bookings for Sea Shore Resort</p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              formik.resetForm();
              setVisible(true);
              setIsEditing(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 border-0"
          >
            Create Booking
          </Button>
        </div>

        {/* Tabs for filtering */}
        <Card className="mb-6">
          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  All Bookings
                  <Badge count={stats.all} showZero style={{ marginLeft: 8 }} />
                </span>
              }
              key="all"
            />
            <TabPane
              tab={
                <span>
                  <CheckCircleOutlined />
                  Active
                  <Badge count={stats.active} showZero style={{ marginLeft: 8 }} />
                </span>
              }
              key="active"
            />
            <TabPane
              tab={
                <span>
                  <CloseCircleOutlined />
                  Canceled
                  <Badge count={stats.canceled} showZero style={{ marginLeft: 8 }} />
                </span>
              }
              key="canceled"
            />
          </Tabs>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <Input
              placeholder="Search bookings..."
              value={searchText}
              onChange={handleSearch}
              prefix={<SearchOutlined />}
              className="w-full md:w-80"
              allowClear
            />
            <div className="flex items-center gap-2">
              <DatePicker
                value={checkInFilterDate}
                onChange={handleCheckInFilterChange}
                format="YYYY-MM-DD"
                placeholder="Filter by check-in date"
                className="w-full md:w-auto"
              />
              {checkInFilterDate && (
                <Button onClick={clearCheckInFilter} size="small">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates & Nights
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <tr 
                  key={booking._id}
                  className={`hover:bg-gray-50 ${
                    booking.statusID === 255 ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingNo}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{booking.serialNo}
                        </div>
                      </div>
                      <Tooltip title="Copy Booking No">
                        <CopyToClipboard
                          text={booking.bookingNo}
                          onCopy={() => message.success("Copied!")}
                        >
                          <CopyOutlined className="text-gray-400 hover:text-blue-500 cursor-pointer ml-2" />
                        </CopyToClipboard>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.fullName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <PhoneOutlined className="text-xs" />
                        {booking.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm text-gray-900">
                        {booking.roomCategoryName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.roomNumberName}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarOutlined className="text-xs text-gray-400" />
                        <span className="text-gray-900">
                          {dayjs(booking.checkInDate).format("D MMM")}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-900">
                          {dayjs(booking.checkOutDate).format("D MMM")}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ৳{booking.totalBill.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600">
                        Adv: ৳{booking.advancePayment.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {booking.statusID === 1 ? (
                      <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs">
                        Confirmed
                      </Tag>
                    ) : (
                      <Tag color="red" icon={<CloseCircleOutlined />} className="text-xs">
                        Canceled
                      </Tag>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(booking)}
                        className="text-blue-500 hover:text-blue-700"
                      />
                      {booking.statusID === 1 && (
                        <>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(booking)}
                            className="text-yellow-500 hover:text-yellow-700"
                          />
                          <Popconfirm
                            title="Cancel this booking?"
                            description="Are you sure you want to cancel this booking?"
                            onConfirm={() => handleDelete(booking)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              className="text-red-500 hover:text-red-700"
                            />
                          </Popconfirm>
                        </>
                      )}
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedBookings.length === 0 && (
          <div className="text-center py-8">
            <InfoCircleOutlined className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-500">
            Showing {Math.min(paginatedBookings.length, pagination.pageSize)} of{" "}
            {filteredBookings.length} bookings
          </div>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={filteredBookings.length}
            onChange={(page, pageSize) =>
              setPagination({ current: page, pageSize })
            }
            showSizeChanger
            showQuickJumper
          />
        </div>
      </Card>

      {/* Create/Edit Booking Modal */}
      <Modal
        title={
          <div className="text-lg font-semibold">
            {isEditing ? "Edit Booking" : "Create New Booking"}
          </div>
        }
        open={visible}
        onCancel={() => {
          setVisible(false);
          formik.resetForm();
          setIsEditing(false);
          setEditingKey(null);
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form onFinish={formik.handleSubmit} layout="vertical">
          {/* Section 1: Guest Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">
              Guest Information
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Full Name" required>
                  <Input
                    name="fullName"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    placeholder="Enter guest name"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Phone Number" required>
                  <Input
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Email">
                  <Input
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    placeholder="Enter email"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="NID/Passport">
                  <Input
                    name="nidPassport"
                    value={formik.values.nidPassport}
                    onChange={formik.handleChange}
                    placeholder="Enter NID/Passport"
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="Address">
                  <Input
                    name="address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    placeholder="Enter address"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Booking Details */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">
              Booking Details
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Check-in Date" required>
                  <DatePicker
                    name="checkInDate"
                    value={formik.values.checkInDate}
                    onChange={handleCheckInChange}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Check-out Date" required>
                  <DatePicker
                    name="checkOutDate"
                    value={formik.values.checkOutDate}
                    onChange={handleCheckOutChange}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Nights">
                  <Input
                    name="nights"
                    value={formik.values.nights}
                    readOnly
                    className="bg-gray-50"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Room Category" required>
                  <Select
                    value={formik.values.roomCategoryID}
                    onChange={handleRoomCategoryChange}
                    placeholder="Select room category"
                  >
                    {roomCategories.map((category) => (
                      <Option key={category._id} value={category._id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Room Number" required>
                  <Select
                    value={formik.values.roomNumberID}
                    onChange={handleRoomNumberChange}
                    placeholder="Select room number"
                    disabled={!formik.values.roomCategoryID}
                  >
                    {roomNumbers.map((room) => (
                      <Option key={room._id} value={room._id}>
                        {room.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Room Price (per night)" required>
                  <Input
                    name="roomPrice"
                    type="number"
                    value={formik.values.roomPrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const nights = formik.values.nights || 0;
                      const total = price * nights;
                      formik.setFieldValue("roomPrice", price);
                      formik.setFieldValue("totalBill", total);
                    }}
                    placeholder="Enter room price"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 3: Guest Count & Additional Services */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">
              Guest Count & Additional Services
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Adults">
                  <Input
                    name="adults"
                    type="number"
                    value={formik.values.adults}
                    onChange={formik.handleChange}
                    min={1}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Children">
                  <Input
                    name="children"
                    type="number"
                    value={formik.values.children}
                    onChange={formik.handleChange}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Kitchen Service">
                  <Switch
                    checked={formik.values.isKitchen}
                    onChange={(checked) => {
                      formik.setFieldValue("isKitchen", checked);
                      if (!checked) formik.setFieldValue("kitchenTotalBill", 0);
                    }}
                  />
                </Form.Item>
              </Col>
              {formik.values.isKitchen && (
                <Col span={8}>
                  <Form.Item label="Kitchen Bill">
                    <Input
                      name="kitchenTotalBill"
                      type="number"
                      value={formik.values.kitchenTotalBill}
                      onChange={(e) => {
                        const kitchenBill = parseFloat(e.target.value) || 0;
                        const roomPrice = formik.values.roomPrice || 0;
                        const nights = formik.values.nights || 0;
                        const extraBedBill = formik.values.extraBedTotalBill || 0;
                        const total = (roomPrice * nights) + kitchenBill + extraBedBill;
                        formik.setFieldValue("kitchenTotalBill", kitchenBill);
                        formik.setFieldValue("totalBill", total);
                      }}
                      placeholder="Enter kitchen bill"
                    />
                  </Form.Item>
                </Col>
              )}
              <Col span={8}>
                <Form.Item label="Extra Bed">
                  <Switch
                    checked={formik.values.extraBed}
                    onChange={(checked) => {
                      formik.setFieldValue("extraBed", checked);
                      if (!checked) formik.setFieldValue("extraBedTotalBill", 0);
                    }}
                  />
                </Form.Item>
              </Col>
              {formik.values.extraBed && (
                <Col span={8}>
                  <Form.Item label="Extra Bed Bill">
                    <Input
                      name="extraBedTotalBill"
                      type="number"
                      value={formik.values.extraBedTotalBill}
                      onChange={(e) => {
                        const extraBedBill = parseFloat(e.target.value) || 0;
                        const roomPrice = formik.values.roomPrice || 0;
                        const nights = formik.values.nights || 0;
                        const kitchenBill = formik.values.kitchenTotalBill || 0;
                        const total = (roomPrice * nights) + kitchenBill + extraBedBill;
                        formik.setFieldValue("extraBedTotalBill", extraBedBill);
                        formik.setFieldValue("totalBill", total);
                      }}
                      placeholder="Enter extra bed bill"
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </div>

          {/* Section 4: Payment Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">
              Payment Information
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="Total Bill" required>
                  <Input
                    name="totalBill"
                    value={formik.values.totalBill}
                    readOnly
                    className="bg-gray-50 font-semibold"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Advance Payment" required>
                  <Input
                    name="advancePayment"
                    type="number"
                    value={formik.values.advancePayment}
                    onChange={handleAdvancePaymentChange}
                    placeholder="Enter advance amount"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Due Payment">
                  <Input
                    name="duePayment"
                    value={formik.values.duePayment}
                    readOnly
                    className="bg-gray-50"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Payment Method" required>
                  <Select
                    value={formik.values.paymentMethod}
                    onChange={(value) => formik.setFieldValue("paymentMethod", value)}
                    placeholder="Select payment method"
                  >
                    <Option value="BKASH">bKash</Option>
                    <Option value="NAGAD">Nagad</Option>
                    <Option value="BANK">Bank Transfer</Option>
                    <Option value="CASH">Cash</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Transaction ID" required>
                  <Input
                    name="transactionId"
                    value={formik.values.transactionId}
                    onChange={formik.handleChange}
                    placeholder="Enter transaction ID"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 5: Notes */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">
              Additional Information
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item label="Notes">
                  <Input.TextArea
                    name="note"
                    value={formik.values.note}
                    onChange={formik.handleChange}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setVisible(false);
                formik.resetForm();
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 border-0"
              icon={isEditing ? <EditOutlined /> : <PlusOutlined />}
            >
              {isEditing ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="font-medium text-gray-700">Booking No:</div>
                <div className="font-semibold">{selectedBooking.bookingNo}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Status:</div>
                {selectedBooking.statusID === 1 ? (
                  <Tag color="green">Confirmed</Tag>
                ) : (
                  <Tag color="red">Canceled</Tag>
                )}
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Guest Name:</div>
                <div>{selectedBooking.fullName}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Phone:</div>
                <div>{selectedBooking.phone}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Room:</div>
                <div>{selectedBooking.roomCategoryName} - {selectedBooking.roomNumberName}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Room Price:</div>
                <div>৳{selectedBooking.roomPrice}/night</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Check-in:</div>
                <div>{dayjs(selectedBooking.checkInDate).format("D MMM YYYY")}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Check-out:</div>
                <div>{dayjs(selectedBooking.checkOutDate).format("D MMM YYYY")}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Nights:</div>
                <div>{selectedBooking.nights}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Guests:</div>
                <div>{selectedBooking.adults} Adult(s), {selectedBooking.children} Child(ren)</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Total Bill:</div>
                <div className="font-bold">৳{selectedBooking.totalBill}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Advance Payment:</div>
                <div className="text-green-600">৳{selectedBooking.advancePayment}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Due Payment:</div>
                <div>৳{selectedBooking.totalBill - selectedBooking.advancePayment}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-700">Payment Method:</div>
                <div>{selectedBooking.paymentMethod}</div>
              </Col>
              {selectedBooking.isKitchen && (
                <Col span={12}>
                  <div className="font-medium text-gray-700">Kitchen Bill:</div>
                  <div>৳{selectedBooking.kitchenTotalBill}</div>
                </Col>
              )}
              {selectedBooking.extraBed && (
                <Col span={12}>
                  <div className="font-medium text-gray-700">Extra Bed Bill:</div>
                  <div>৳{selectedBooking.extraBedTotalBill}</div>
                </Col>
              )}
              {selectedBooking.note && (
                <Col span={24}>
                  <div className="font-medium text-gray-700">Notes:</div>
                  <div className="text-gray-600 bg-gray-50 p-3 rounded">{selectedBooking.note}</div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        title="Cancel Booking"
        open={isModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setIsModalVisible(false);
          setCancellationReason("");
          setCurrentBooking(null);
        }}
        confirmLoading={loading}
        okText="Confirm Cancellation"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          {currentBooking && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="font-semibold">Booking: {currentBooking.bookingNo}</p>
              <p className="text-sm text-gray-600">
                Guest: {currentBooking.fullName} • Room: {currentBooking.roomNumberName}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason *
            </label>
            <Input.TextArea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows={3}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingInfo;