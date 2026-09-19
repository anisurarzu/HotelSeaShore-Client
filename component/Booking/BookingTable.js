"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Table,
  message,
  Popconfirm,
  Spin,
  Input,
  Select,
  Pagination,
  Alert,
  Modal,
  Tooltip,
  DatePicker,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyOutlined } from "@ant-design/icons";
import Link from "next/link";
import coreAxios from "@/utils/axiosInstance";
import { buildBookingsPath, unwrapBookings } from "@/utils/bookingsApi";
import {
  isCancelledBooking,
  isDeletedBooking,
  isOccupyingBooking,
} from "@/utils/bookingStatus";

import BookingForm from "./BookingForm";
import NoPermissionBanner from "../Permission/NoPermissionBanner";

const { RangePicker } = DatePicker;

const BookingTable = ({ hotelID }) => {
  const userInfo2 = JSON.parse(localStorage.getItem("userInfo"));
  const userHotelID = hotelID;
  const permission = userInfo2?.permission?.permissions;
  const bookingPermissions =
    permission?.find((perm) => perm.pageName === "Booking") || {};

  const [bookings, setBookings] = useState([]);
  const [hotelInfo, setHotelInfo] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [currentBooking, setCurrentBooking] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  // Form related states
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [prevData, setPrevData] = useState();

  const fetchHotelInfo = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const response = await coreAxios.get("hotel");
      if (Array.isArray(response.data)) {
        let hotelData = response.data;
        if (userRole !== "superAdmin" && userHotelID) {
          hotelData = hotelData.filter(
            (hotel) => hotel.hotelID === userHotelID
          );
        }
        setHotelInfo(hotelData);
      } else {
        setHotelInfo([]);
      }
    } catch (error) {
      message.error("Failed to fetch hotel information.");
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = hotelID;
      const { buildBookingsPath, unwrapBookings } = await import("@/utils/bookingsApi");

      const response = await coreAxios.get(
        buildBookingsPath({
          hotelID:
            userRole === "hoteladmin" && userHotelID
              ? Number(userHotelID)
              : undefined,
          startDate: dayjs().subtract(6, "month").format("YYYY-MM-DD"),
          endDate: dayjs().add(3, "month").format("YYYY-MM-DD"),
          mode: "overlap",
          excludeCancelled: 1,
          fields: "light",
          page: 1,
          limit: 500,
        })
      );
      if (response.status === 200) {
        let bookingsData = unwrapBookings(response?.data).filter(
          (booking) => booking && !isDeletedBooking(booking)
        );
        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking.hotelID === Number(userHotelID)
          );
        }
        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
      }
    } catch (error) {
      message.error("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleHotelChange = (hotelID) => {
    setLoading(true);
    const selectedHotel = hotelInfo.find((hotel) => hotel.hotelID === hotelID);
    const filteredData = bookings.filter(
      (booking) => booking.hotelID === hotelID
    );
    setFilteredBookings(filteredData);
    setPagination({ ...pagination, current: 1 });
    setLoading(false);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = bookings.filter(
      (r) =>
        r.bookingNo.toLowerCase().includes(value) ||
        r.bookedByID.toLowerCase().includes(value) ||
        r.fullName.toLowerCase().includes(value) ||
        r.roomCategoryName.toLowerCase().includes(value) ||
        r.roomNumberName.toLowerCase().includes(value) ||
        r.hotelName.toLowerCase().includes(value) ||
        r.phone.toLowerCase().includes(value)
    );

    // Apply date filter if date range is selected
    if (dateRange.length === 2) {
      const startDate = dayjs(dateRange[0]).startOf("day");
      const endDate = dayjs(dateRange[1]).endOf("day");

      const dateFilteredData = filteredData.filter((booking) => {
        const checkInDate = dayjs(booking.checkInDate);
        return checkInDate.isAfter(startDate) && checkInDate.isBefore(endDate);
      });
      setFilteredBookings(dateFilteredData);
    } else {
      setFilteredBookings(filteredData);
    }

    setPagination({ ...pagination, current: 1 });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (!dates || dates.length === 0) {
      // If date range is cleared, show all bookings
      setFilteredBookings(bookings);
      return;
    }

    const startDate = dayjs(dates[0]).startOf("day");
    const endDate = dayjs(dates[1]).endOf("day");

    const filteredData = bookings.filter((booking) => {
      const checkInDate = dayjs(booking.checkInDate);
      return checkInDate.isAfter(startDate) && checkInDate.isBefore(endDate);
    });

    setFilteredBookings(filteredData);
    setPagination({ ...pagination, current: 1 });
  };

  const getAllDatesBetween = (startDate, endDate) => {
    const dates = [];
    let currentDate = dayjs(startDate);
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }
    if (dayjs(startDate).date() !== 1) {
      dates.pop();
    }
    return dates;
  };

  const handleDelete2 = async (key) => {
    setLoading(true);
    try {
      const canceledBy = userInfo2?.loginID;
      const res = await coreAxios.put(`/booking/soft/${key}`, {
        canceledBy: canceledBy,
        reason: cancellationReason,
      });
      if (res.status === 200) {
        fetchBookings();
        message.success("Booking cancelled successfully.");
        setIsModalVisible(false);
        setCancellationReason("");
      }
    } catch (error) {
      message.error("Failed to cancel booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleSoftHideDelete = async (booking) => {
    if (!booking?._id) return;
    setLoading(true);
    try {
      const deletedBy = userInfo2?.loginID || userInfo2?.username || "admin";
      const res = await coreAxios.delete(`/booking/${booking._id}`, {
        data: { deletedBy, reason: "Removed from system by user" },
      });
      if (res.status === 200) {
        fetchBookings();
        message.success("Booking removed from system.");
      }
    } catch (error) {
      message.error("Failed to delete booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReasonChange = (e) => {
    setCancellationReason(e.target.value);
  };

  const showModal = (booking) => {
    setCurrentBooking(booking);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (!cancellationReason.trim()) {
      message.error("Please provide a reason for cancellation.");
      return;
    }

    setLoading(true);
    try {
      const deleteResponse = await coreAxios.delete("/bookings/delete", {
        data: {
          hotelID: currentBooking?.hotelID,
          categoryName: currentBooking?.roomCategoryName,
          roomName: currentBooking?.roomNumberName,
          bookingID: currentBooking?.bookingID,
          datesToDelete: getAllDatesBetween(
            currentBooking?.checkInDate,
            currentBooking?.checkOutDate
          ),
        },
      });
      if (deleteResponse.status === 200) {
        handleDelete2(currentBooking?._id);
      }
    } catch (error) {
      message.error("Failed to delete booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDelete = (booking) => {
    showModal(booking);
  };

  useEffect(() => {
    fetchHotelInfo();
    fetchBookings();
  }, []);

  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const handleEdit = (record) => {
    console.log("editeddata", record);
    setEditingKey(record?._id);
    setPrevData(record);
    // formik.setValues(record);
    fetchHotelCategories(record?.hotelID);
    fetchRoomNumbers(record?.roomCategoryID);

    const checkInDate = dayjs(record.checkInDate);
    const checkOutDate = dayjs(record.checkOutDate);
    if (record) {
      formik.setValues({
        ...formik.values,
        bookedBy: record?.username,
        isKitchen: record?.isKitchen,
        kitchenTotalBill: record?.kitchenTotalBill,
        extraBed: record?.extraBed,
        extraBedTotalBill: record?.extraBedTotalBill,
        bookedByID: record?.loginID,
        updatedByID: userInfo ? userInfo?.loginID : "",
        fullName: record.fullName,
        nidPassport: record.nidPassport,
        address: record.address,
        phone: record.phone,
        email: record.email,
        hotelID: record.hotelID,
        hotelName: record.hotelName,
        roomCategoryName: record.roomCategoryName,
        roomNumberID: record.roomNumberID,
        roomNumberName: record?.roomNumberName,
        roomPrice: record.roomPrice,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: record.adults,
        children: record.children,
        nights: record.nights,
        totalBill: record.totalBill,
        advancePayment: record.advancePayment,
        duePayment: record.duePayment,
        paymentMethod: record.paymentMethod,
        transactionId: record.transactionId,
        note: record.note,
      });
    }
    setVisible(true);
    setIsEditing(true);
  };

  return (
    <div>
      {bookingPermissions.viewAccess ? (
        <>
          <div>
            {loading ? (
              <Spin tip="Loading...">
                <Alert
                  message="Alert message title"
                  description="Further details about the context of this alert."
                  type="info"
                />
              </Spin>
            ) : (
              <div className="">
                <div className="flex justify-between ">
                  {bookingPermissions?.insertAccess && (
                    <Button
                      type="primary"
                      onClick={() => {
                        setVisible(true);
                        setIsEditing(false);
                      }}
                      className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white"
                    >
                      Add New Booking
                    </Button>
                  )}
                  <div className="flex items-center gap-4">
                    <Select
                      name="hotelName2"
                      placeholder="Select a Hotel"
                      style={{ width: 200 }}
                      onChange={handleHotelChange}
                    >
                      {hotelInfo.map((hotel) => (
                        <Select.Option
                          key={hotel.hotelID}
                          value={hotel.hotelID}
                        >
                          {hotel.hotelName}
                        </Select.Option>
                      ))}
                    </Select>
                    <RangePicker
                      style={{ width: 250 }}
                      onChange={handleDateRangeChange}
                      placeholder={["Start Date", "End Date"]}
                      format="YYYY-MM-DD"
                    />
                    <Input
                      placeholder="Search bookings..."
                      value={searchText}
                      onChange={handleSearch}
                      style={{ width: 250 }}
                    />
                  </div>
                </div>

                <div className="relative overflow-x-auto shadow-md mt-2">
                  <div style={{ overflowX: "auto" }}>
                    <table className="w-full text-xs text-left rtl:text-right  dark:text-gray-400">
                      {/* Table Header */}
                      <thead className="text-xs  uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="border border-tableBorder text-center p-2">
                            Booking No.
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Invoice No.
                          </th>

                          <th className="border border-tableBorder text-center p-2">
                            Guest Name
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Phone
                          </th>
                          {/* <th className="border border-tableBorder text-center p-2">
                      Hotel
                    </th> */}
                          <th className="border border-tableBorder text-center p-2">
                            Flat Type
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Flat No/Unit
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Booking Date
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Check In
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Check Out
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Nights
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Advance
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Total
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Status
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Confirm/Cancel By
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Updated By
                          </th>
                          <th className="border border-tableBorder text-center p-2">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody>
                        {paginatedBookings?.map((booking, idx) => {
                          const isCanceled = isCancelledBooking(booking);
                          return (
                          <tr
                            key={booking._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            style={{
                              backgroundColor: isCanceled
                                ? "rgba(253, 162, 155, 0.55)"
                                : "",
                            }}
                          >
                            <td className="border border-tableBorder text-center p-2">
                              {booking?.serialNo}
                            </td>
                            {/* Booking No with Link and Copy Feature */}

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
                                  href={`/dashboard/${booking.bookingNo}`}
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
                            {/* Booked By */}
                            {/* Guest Name */}
                            <td className="border border-tableBorder text-center p-2">
                              {booking.fullName}
                            </td>
                            <td className="border border-tableBorder text-center p-2">
                              {booking.phone}
                            </td>
                            {/* Hotel Name */}
                            {/* <td className="border border-tableBorder text-center p-2">
                        {booking.hotelName}
                      </td> */}
                            {/* Flat Type */}
                            <td className="border border-tableBorder text-center p-2">
                              {booking.roomCategoryName}
                            </td>
                            {/* Flat No/Unit */}
                            <td className="border border-tableBorder text-center p-2">
                              {booking.roomNumberName}
                            </td>
                            {/* Check In */}
                            <td className="border border-tableBorder text-center p-2">
                              {moment(booking.createTime).format("D MMM YYYY")}
                            </td>
                            {/* Check In */}
                            <td className="border border-tableBorder text-center p-2">
                              {moment(booking.checkInDate).format("D MMM YYYY")}
                            </td>
                            {/* Check Out */}
                            <td className="border border-tableBorder text-center p-2">
                              {moment(booking.checkOutDate).format(
                                "D MMM YYYY"
                              )}
                            </td>
                            {/* Nights */}
                            <td className="border border-tableBorder text-center p-2">
                              {booking.nights}
                            </td>
                            <td className="border border-tableBorder text-center p-2">
                              {booking.advancePayment}
                            </td>
                            {/* Total Bill */}
                            <td className="border border-tableBorder text-center p-2 font-bold text-green-900">
                              {booking.totalBill}
                            </td>
                            {/* Booking Status */}
                            <td
                              className="border border-tableBorder text-center p-2 font-bold"
                              style={{
                                color: isCanceled ? "red" : "green",
                              }}
                            >
                              {isCanceled ? <p>Cancelled</p> : "Confirmed"}
                            </td>
                            <td className="border border-tableBorder text-center p-2  text-green-900">
                              <p className="font-semibold">
                                {isCanceled
                                  ? booking?.canceledBy
                                  : booking?.bookedByID}
                              </p>
                              {booking?.reason && (
                                <p className="text-[7px]">
                                  [{booking?.reason}]
                                </p>
                              )}
                            </td>

                            <td className="border  border-tableBorder text-center   text-hs-deep">
                              {booking?.updatedByID}{" "}
                              {booking?.updatedByID &&
                                dayjs(booking?.updatedAt).format(
                                  "D MMM, YYYY (h:mm a)"
                                )}
                            </td>

                            {/* Actions */}
                            <td className="border border-tableBorder text-center p-2">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {!isCanceled && bookingPermissions?.editAccess && (
                                  <Button onClick={() => handleEdit(booking)}>
                                    Edit
                                  </Button>
                                )}
                                {!isCanceled && (
                                  <Button
                                    type="link"
                                    danger
                                    onClick={() => handleDelete(booking)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                {bookingPermissions?.deleteAccess && (
                                  <Popconfirm
                                    title="Remove from system? It will not show anywhere (kept in DB)."
                                    onConfirm={() => handleSoftHideDelete(booking)}
                                  >
                                    <Button type="link" danger>
                                      Delete
                                    </Button>
                                  </Popconfirm>
                                )}
                              </div>

                              {/* Cancellation Modal */}
                              <Modal
                                title="Cancel Booking"
                                open={isModalVisible}
                                onOk={handleOk}
                                onCancel={handleCancel}
                                confirmLoading={loading}
                                okText="Confirm Cancellation"
                                cancelText="Close"
                                destroyOnClose
                              >
                                <div>
                                  <label
                                    htmlFor="reason"
                                    className="font-medium"
                                  >
                                    Cancellation Reason:
                                  </label>
                                  <Input
                                    type="text"
                                    id="reason"
                                    value={cancellationReason}
                                    onChange={handleCancelReasonChange}
                                    placeholder="Enter cancellation reason"
                                    autoFocus
                                  />
                                </div>
                              </Modal>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination (commented out) */}

                  <div className="flex justify-center p-2">
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={filteredBookings?.length}
                      onChange={(page, pageSize) =>
                        setPagination({ current: page, pageSize })
                      } // Update both current page and pageSize
                      className="mt-4"
                    />
                  </div>
                </div>

                <BookingForm
                  visible={visible}
                  setVisible={setVisible}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  editingKey={editingKey}
                  setEditingKey={setEditingKey}
                  fetchBookings={fetchBookings}
                  fetchHotelInfo={fetchHotelInfo}
                  hotelInfo={hotelInfo}
                  prevData={prevData}
                  setPrevData={setPrevData}
                  userInfo={userInfo2}
                />

                <Modal
                  title="Cancel Booking"
                  visible={isModalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  confirmLoading={loading}
                  okText="Confirm Cancellation"
                  cancelText="Cancel"
                  className="custom-modal"
                  destroyOnClose={true}
                >
                  <div>
                    <label htmlFor="reason" className="font-medium">
                      Cancellation Reason:
                    </label>
                    <Input
                      type="text"
                      id="reason"
                      value={cancellationReason}
                      onChange={handleCancelReasonChange}
                      placeholder="Enter cancellation reason"
                      autoFocus
                    />
                  </div>
                </Modal>
              </div>
            )}
          </div>
        </>
      ) : (
        <NoPermissionBanner />
      )}
    </div>
  );
};

export default BookingTable;
