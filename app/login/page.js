"use client";

import { useState } from "react";
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
  Row,
  Col,
  InputNumber,
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
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Option } = Select;

// Mock data
const mockBookings = [
  {
    _id: "1",
    bookingNo: "FTB-0001",
    serialNo: "2024-001",
    fullName: "John Doe",
    phone: "+8801712345678",
    roomCategoryName: "Deluxe Suite",
    roomNumberName: "Room 101",
    roomPrice: 5000,
    checkInDate: "2024-01-20",
    checkOutDate: "2024-01-25",
    nights: 5,
    advancePayment: 10000,
    totalBill: 25000,
    statusID: 1,
    adults: 2,
    children: 1,
    paymentMethod: "BKASH",
    transactionId: "TRX001",
    note: "Early check-in requested",
  },
  {
    _id: "2",
    bookingNo: "FTB-0002",
    serialNo: "2024-002",
    fullName: "Jane Smith",
    phone: "+8801723456789",
    roomCategoryName: "Standard Room",
    roomNumberName: "Room 102",
    roomPrice: 3000,
    checkInDate: "2024-01-22",
    checkOutDate: "2024-01-24",
    nights: 2,
    advancePayment: 3000,
    totalBill: 6000,
    statusID: 1,
    adults: 1,
    children: 0,
    paymentMethod: "CASH",
    transactionId: "TRX002",
    note: "",
  },
  {
    _id: "3",
    bookingNo: "FTB-0003",
    serialNo: "2024-003",
    fullName: "Mike Wilson",
    phone: "+8801734567890",
    roomCategoryName: "Family Suite",
    roomNumberName: "Room 201",
    roomPrice: 8000,
    checkInDate: "2024-01-18",
    checkOutDate: "2024-01-20",
    nights: 2,
    advancePayment: 10000,
    totalBill: 16000,
    statusID: 255,
    adults: 4,
    children: 2,
    paymentMethod: "BANK",
    transactionId: "TRX003",
    note: "",
    canceledBy: "admin",
    reason: "Guest requested cancellation",
  },
];

const roomCategories = [
  { _id: 1, name: "Deluxe Suite", roomNumbers: [101, 102, 103] },
  { _id: 2, name: "Standard Room", roomNumbers: [201, 202, 203] },
  { _id: 3, name: "Family Suite", roomNumbers: [301, 302, 303] },
];

const BookingInfo = () => {
  // State
  const [bookings, setBookings] = useState(mockBookings);
  const [filteredBookings, setFilteredBookings] = useState(mockBookings);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Formik
  const formik = useFormik({
    initialValues: {
      fullName: "",
      phone: "",
      email: "",
      nidPassport: "",
      address: "",
      roomCategory: "",
      roomNumber: "",
      roomPrice: "",
      checkInDate: dayjs(),
      checkOutDate: dayjs().add(1, "day"),
      adults: 1,
      children: 0,
      isKitchen: false,
      kitchenTotalBill: 0,
      extraBed: false,
      extraBedTotalBill: 0,
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      paymentMethod: "",
      transactionId: "",
      note: "",
    },
    onSubmit: (values) => {
      const newBooking = {
        _id: isEditing ? editingId : uuidv4(),
        bookingNo: `FTB-${String(bookings.length + 1001).padStart(4, '0')}`,
        serialNo: `2024-${String(bookings.length + 1001).padStart(3, '0')}`,
        ...values,
        checkInDate: dayjs(values.checkInDate).format("YYYY-MM-DD"),
        checkOutDate: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
        roomCategoryName: roomCategories.find(c => c._id === values.roomCategory)?.name || "",
        roomNumberName: `Room ${values.roomNumber}`,
        nights: dayjs(values.checkOutDate).diff(dayjs(values.checkInDate), 'day'),
        statusID: 1,
        createdAt: new Date().toISOString(),
      };

      if (isEditing) {
        setBookings(bookings.map(b => b._id === editingId ? newBooking : b));
        message.success("Booking updated successfully!");
      } else {
        setBookings([newBooking, ...bookings]);
        message.success("Booking created successfully!");
      }

      handleCloseModal();
      applyFilters(searchText);
    },
  });

  // Handlers
  const handleEdit = (booking) => {
    formik.setValues({
      ...booking,
      checkInDate: dayjs(booking.checkInDate),
      checkOutDate: dayjs(booking.checkOutDate),
      roomCategory: roomCategories.find(c => c.name === booking.roomCategoryName)?._id,
      roomNumber: parseInt(booking.roomNumberName.replace("Room ", "")),
    });
    setEditingId(booking._id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setViewModalVisible(true);
  };

  const handleDelete = (booking) => {
    setSelectedBooking(booking);
    setCancelModalVisible(true);
  };

  const confirmDelete = () => {
    if (!cancellationReason.trim()) {
      message.error("Please provide a reason for cancellation.");
      return;
    }

    setBookings(bookings.map(b => 
      b._id === selectedBooking._id 
        ? { ...b, statusID: 255, reason: cancellationReason }
        : b
    ));
    message.success("Booking cancelled successfully!");
    setCancelModalVisible(false);
    setCancellationReason("");
    applyFilters(searchText);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setEditingId(null);
    formik.resetForm();
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    applyFilters(value);
  };

  const applyFilters = (searchValue) => {
    const filtered = bookings.filter(booking =>
      booking.bookingNo.toLowerCase().includes(searchValue) ||
      booking.fullName.toLowerCase().includes(searchValue) ||
      booking.phone.toLowerCase().includes(searchValue)
    );
    setFilteredBookings(filtered);
  };

  const calculateTotalBill = () => {
    const nights = dayjs(formik.values.checkOutDate).diff(dayjs(formik.values.checkInDate), 'day');
    const roomPrice = Number(formik.values.roomPrice) || 0;
    const kitchenBill = formik.values.isKitchen ? Number(formik.values.kitchenTotalBill) : 0;
    const extraBedBill = formik.values.extraBed ? Number(formik.values.extraBedTotalBill) : 0;
    const total = (roomPrice * nights) + kitchenBill + extraBedBill;
    
    formik.setFieldValue("totalBill", total);
    const due = total - (Number(formik.values.advancePayment) || 0);
    formik.setFieldValue("duePayment", due > 0 ? due : 0);
  };

  // Pagination
  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
            <p className="text-gray-600">Manage all bookings</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            className="w-full md:w-auto"
          >
            Create Booking
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search by booking no, name, or phone..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          className="w-full md:w-96"
          allowClear
        />
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.bookingNo}</div>
                        <div className="text-xs text-gray-500">#{booking.serialNo}</div>
                      </div>
                      <Tooltip title="Copy">
                        <CopyToClipboard text={booking.bookingNo} onCopy={() => message.success("Copied!")}>
                          <CopyOutlined className="ml-2 text-gray-400 hover:text-blue-500 cursor-pointer" />
                        </CopyToClipboard>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{booking.fullName}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <PhoneOutlined className="mr-1" /> {booking.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{booking.roomCategoryName}</div>
                    <div className="text-xs text-gray-500">{booking.roomNumberName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <CalendarOutlined className="mr-1 text-gray-400" />
                        {dayjs(booking.checkInDate).format("D MMM")} - {dayjs(booking.checkOutDate).format("D MMM")}
                      </div>
                      <div className="text-xs text-gray-500">{booking.nights} nights</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">৳{booking.totalBill.toLocaleString()}</div>
                    <div className="text-xs text-green-600">Adv: ৳{booking.advancePayment.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    {booking.statusID === 1 ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Confirmed</Tag>
                    ) : (
                      <Tag color="red" icon={<CloseCircleOutlined />}>Canceled</Tag>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Space>
                      <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(booking)} />
                      {booking.statusID === 1 && (
                        <>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(booking)} />
                          <Popconfirm
                            title="Cancel booking?"
                            onConfirm={() => handleDelete(booking)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button size="small" icon={<DeleteOutlined />} danger />
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

        {/* Empty State */}
        {paginatedBookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bookings found
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-gray-500">
            Showing {paginatedBookings.length} of {filteredBookings.length} bookings
          </div>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={filteredBookings.length}
            onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
            showSizeChanger
            showQuickJumper
          />
        </div>
      </Card>

      {/* Create/Edit Booking Modal */}
      <Modal
        title={isEditing ? "Edit Booking" : "Create New Booking"}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form onFinish={formik.handleSubmit} layout="vertical">
          {/* Section 1: Guest Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">Guest Information</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Full Name" required>
                  <Input
                    name="fullName"
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    placeholder="Enter name"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Phone" required>
                  <Input
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    placeholder="Enter phone"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Email">
                  <Input
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    placeholder="Enter email"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="NID/Passport">
                  <Input
                    name="nidPassport"
                    value={formik.values.nidPassport}
                    onChange={formik.handleChange}
                    placeholder="Enter NID/Passport"
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
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
            <h3 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">Booking Details</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Check-in Date" required>
                  <DatePicker
                    value={formik.values.checkInDate}
                    onChange={(date) => {
                      formik.setFieldValue("checkInDate", date);
                      calculateTotalBill();
                    }}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Check-out Date" required>
                  <DatePicker
                    value={formik.values.checkOutDate}
                    onChange={(date) => {
                      formik.setFieldValue("checkOutDate", date);
                      calculateTotalBill();
                    }}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Room Category" required>
                  <Select
                    value={formik.values.roomCategory}
                    onChange={(value) => formik.setFieldValue("roomCategory", value)}
                    placeholder="Select category"
                  >
                    {roomCategories.map(cat => (
                      <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Room Number" required>
                  <Select
                    value={formik.values.roomNumber}
                    onChange={(value) => formik.setFieldValue("roomNumber", value)}
                    placeholder="Select room"
                    disabled={!formik.values.roomCategory}
                  >
                    {formik.values.roomCategory && roomCategories
                      .find(c => c._id === formik.values.roomCategory)
                      ?.roomNumbers.map(num => (
                        <Option key={num} value={num}>Room {num}</Option>
                      ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Room Price (per night)" required>
                  <InputNumber
                    value={formik.values.roomPrice}
                    onChange={(value) => {
                      formik.setFieldValue("roomPrice", value);
                      calculateTotalBill();
                    }}
                    className="w-full"
                    placeholder="Enter price"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Adults">
                  <InputNumber
                    value={formik.values.adults}
                    onChange={(value) => formik.setFieldValue("adults", value)}
                    min={1}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Children">
                  <InputNumber
                    value={formik.values.children}
                    onChange={(value) => formik.setFieldValue("children", value)}
                    min={0}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 3: Additional Services */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">Additional Services</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Kitchen Service">
                  <Switch
                    checked={formik.values.isKitchen}
                    onChange={(checked) => {
                      formik.setFieldValue("isKitchen", checked);
                      if (!checked) formik.setFieldValue("kitchenTotalBill", 0);
                      calculateTotalBill();
                    }}
                  />
                </Form.Item>
              </Col>
              {formik.values.isKitchen && (
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="Kitchen Bill">
                    <InputNumber
                      value={formik.values.kitchenTotalBill}
                      onChange={(value) => {
                        formik.setFieldValue("kitchenTotalBill", value);
                        calculateTotalBill();
                      }}
                      className="w-full"
                      placeholder="Enter amount"
                    />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Extra Bed">
                  <Switch
                    checked={formik.values.extraBed}
                    onChange={(checked) => {
                      formik.setFieldValue("extraBed", checked);
                      if (!checked) formik.setFieldValue("extraBedTotalBill", 0);
                      calculateTotalBill();
                    }}
                  />
                </Form.Item>
              </Col>
              {formik.values.extraBed && (
                <Col xs={24} sm={12} md={6}>
                  <Form.Item label="Extra Bed Bill">
                    <InputNumber
                      value={formik.values.extraBedTotalBill}
                      onChange={(value) => {
                        formik.setFieldValue("extraBedTotalBill", value);
                        calculateTotalBill();
                      }}
                      className="w-full"
                      placeholder="Enter amount"
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </div>

          {/* Section 4: Payment Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">Payment Information</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Total Bill" required>
                  <InputNumber
                    value={formik.values.totalBill}
                    readOnly
                    className="w-full"
                    formatter={value => `৳ ${value}`}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Advance Payment" required>
                  <InputNumber
                    value={formik.values.advancePayment}
                    onChange={(value) => {
                      formik.setFieldValue("advancePayment", value);
                      calculateTotalBill();
                    }}
                    className="w-full"
                    placeholder="Enter amount"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Due Payment">
                  <InputNumber
                    value={formik.values.duePayment}
                    readOnly
                    className="w-full"
                    formatter={value => `৳ ${value}`}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Payment Method" required>
                  <Select
                    value={formik.values.paymentMethod}
                    onChange={(value) => formik.setFieldValue("paymentMethod", value)}
                    placeholder="Select method"
                  >
                    <Option value="BKASH">bKash</Option>
                    <Option value="NAGAD">Nagad</Option>
                    <Option value="BANK">Bank</Option>
                    <Option value="CASH">Cash</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Transaction ID" required>
                  <Input
                    value={formik.values.transactionId}
                    onChange={formik.handleChange}
                    name="transactionId"
                    placeholder="Enter transaction ID"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 5: Notes */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700 border-b pb-2">Additional Information</h3>
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item label="Notes">
                  <Input.TextArea
                    value={formik.values.note}
                    onChange={formik.handleChange}
                    name="note"
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Booking Modal */}
      <Modal
        title="Booking Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>Close</Button>
        ]}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="font-medium text-gray-600">Booking No:</div>
                <div className="font-semibold">{selectedBooking.bookingNo}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Status:</div>
                {selectedBooking.statusID === 1 ? (
                  <Tag color="green">Confirmed</Tag>
                ) : (
                  <Tag color="red">Canceled</Tag>
                )}
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Guest:</div>
                <div>{selectedBooking.fullName}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Phone:</div>
                <div>{selectedBooking.phone}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Room:</div>
                <div>{selectedBooking.roomCategoryName} - {selectedBooking.roomNumberName}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Room Price:</div>
                <div>৳{selectedBooking.roomPrice}/night</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Check-in:</div>
                <div>{dayjs(selectedBooking.checkInDate).format("D MMM YYYY")}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Check-out:</div>
                <div>{dayjs(selectedBooking.checkOutDate).format("D MMM YYYY")}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Nights:</div>
                <div>{selectedBooking.nights}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Total Bill:</div>
                <div className="font-bold">৳{selectedBooking.totalBill}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Advance:</div>
                <div className="text-green-600">৳{selectedBooking.advancePayment}</div>
              </Col>
              <Col span={12}>
                <div className="font-medium text-gray-600">Due:</div>
                <div>৳{selectedBooking.totalBill - selectedBooking.advancePayment}</div>
              </Col>
              {selectedBooking.note && (
                <Col span={24}>
                  <div className="font-medium text-gray-600">Notes:</div>
                  <div className="bg-gray-50 p-2 rounded">{selectedBooking.note}</div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancellationReason("");
        }}
        okText="Confirm Cancellation"
        cancelText="Cancel"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <p>Are you sure you want to cancel booking <strong>{selectedBooking.bookingNo}</strong>?</p>
              <p className="text-sm text-gray-600">Guest: {selectedBooking.fullName} | Room: {selectedBooking.roomNumberName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cancellation Reason *</label>
              <Input.TextArea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingInfo;