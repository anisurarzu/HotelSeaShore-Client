"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Table,
  Spin,
  Alert,
  Select,
  message,
  Popconfirm,
  DatePicker,
  Modal,
  Form,
  Input,
  Switch,
  Skeleton,
} from "antd";
import {
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";
import NoPermissionBanner from "./Permission/NoPermissionBanner";
import { getPagePermissionFromStorage, normalizeContentPermissions } from "@/utils/pagePermission";
import "./Calender.css";
import "./Booking/BookingForm.css";

const { Option } = Select;
const { RangePicker } = DatePicker;

const HotelCalendar = ({ hotelID, contentPermissions: contentPermissionsFromProps }) => {
  const contentPermissions = contentPermissionsFromProps
    ? normalizeContentPermissions(contentPermissionsFromProps)
    : getPagePermissionFromStorage(["Calendar"]);
  const canView = contentPermissions.viewAccess;
  const canInsert = contentPermissions.insertAccess;
  const canEdit = contentPermissions.editAccess;
  const canDelete = contentPermissions.deleteAccess;
  const router = useRouter();
  const [hotelData, setHotelData] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [roomList, setRoomList] = useState([]);
  const [bookingData, setBookingData] = useState({});
  const [allBookings, setAllBookings] = useState([]);
  const calendarWrapperRef = useRef(null);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRoomKey, setSelectedRoomKey] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState(null);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [initialPaymentCount, setInitialPaymentCount] = useState(0);

  const userInfo = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userInfo") || "{}") : {};

  // Generate dates for the selected month
  const generateDateColumns = () => {
    const dates = [];
    const startDate = dateRange[0] || dayjs().startOf("month");
    const endDate = dateRange[1] || dayjs().endOf("month");
    
    // Calculate the number of days in the month
    const daysInMonth = endDate.diff(startDate, "day") + 1;
    
    // Generate all dates from start to end
    let currentDate = startDate;
    for (let i = 0; i < daysInMonth; i++) {
      dates.push(currentDate);
      currentDate = currentDate.add(1, "day");
    }
    return dates;
  };

  const scrollToTodayColumn = () => {
    try {
      const wrapper = calendarWrapperRef.current;
      if (!wrapper) return;
      const body =
        wrapper.querySelector(".ant-table-body") ||
        wrapper.querySelector(".ant-table-container .ant-table-body");
      if (!body) return;

      const dates = generateDateColumns();
      const today = dayjs();
      const todayIdx = dates.findIndex((d) => d.isSame(today, "day"));

      // Date columns width is configured as `width: 76` in getColumns()
      const cellWidth = 76;
      const target = todayIdx >= 0 ? todayIdx * cellWidth : 0;
      body.scrollLeft = Math.max(0, target);
    } catch (_) {}
  };

  // Calculate total booked days for a room
  const calculateTotalBooked = (roomKey) => {
    const dates = generateDateColumns();
    return dates.filter(date => {
      const dateStr = date.format("YYYY-MM-DD");
      return bookingData[`${roomKey}-${dateStr}`];
    }).length;
  };

  // Calculate day total bookings
  const calculateDayTotal = (dateStr) => {
    return roomList.filter(room => {
      return bookingData[`${room.key}-${dateStr}`];
    }).length;
  };

  // Calculate total booking amount for a date
  const calculateDayTotalAmount = (dateStr) => {
    const selectedDate = dayjs(dateStr);
    return allBookings
      .filter(booking => {
        if (!booking.checkInDate || !booking.checkOutDate) return false;
        const checkIn = dayjs(booking.checkInDate);
        const checkOut = dayjs(booking.checkOutDate);
        return selectedDate.isSameOrAfter(checkIn, "day") && selectedDate.isBefore(checkOut, "day");
      })
      .reduce((sum, booking) => sum + (Number(booking.totalBill) || 0), 0);
  };

  // Calculate paid amount for a date
  const calculateDayPaidAmount = (dateStr) => {
    const selectedDate = dayjs(dateStr);
    return allBookings
      .filter(booking => {
        if (!booking.checkInDate || !booking.checkOutDate) return false;
        const checkIn = dayjs(booking.checkInDate);
        const checkOut = dayjs(booking.checkOutDate);
        return selectedDate.isSameOrAfter(checkIn, "day") && selectedDate.isBefore(checkOut, "day");
      })
      .reduce((sum, booking) => sum + (Number(booking.advancePayment) || 0), 0);
  };

  // Calculate due amount for a date
  const calculateDayDueAmount = (dateStr) => {
    const selectedDate = dayjs(dateStr);
    return allBookings
      .filter(booking => {
        if (!booking.checkInDate || !booking.checkOutDate) return false;
        const checkIn = dayjs(booking.checkInDate);
        const checkOut = dayjs(booking.checkOutDate);
        return selectedDate.isSameOrAfter(checkIn, "day") && selectedDate.isBefore(checkOut, "day");
      })
      .reduce((sum, booking) => sum + (Number(booking.duePayment) || 0), 0);
  };

  // Open booking modal for Add or Edit
  const handleEditClick = async (roomKey, dateStr, bookingInfo, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Extract roomNumberID from roomKey (format: "room-{roomNumberID}")
    const roomNumberId = roomKey.replace("room-", "");
    
    // Find the room details
    const room = roomList.find(r => r.key === roomKey);
    if (!room) {
      message.error("Room not found");
      return;
    }
    
    // Find hotel
    const hotel = hotelData.find(h => h.hotelID === selectedHotelId);
    if (!hotel) {
      message.error("Hotel not found");
      return;
    }
    
    // Find category and room details
    let foundCategory = null;
    let foundRoom = null;
    
    if (hotel.roomCategories && Array.isArray(hotel.roomCategories)) {
      for (const category of hotel.roomCategories) {
        if (category.roomNumbers && Array.isArray(category.roomNumbers)) {
          foundRoom = category.roomNumbers.find(r => r._id === roomNumberId);
          if (foundRoom) {
            foundCategory = category;
            break;
          }
        }
      }
    }
    
    if (!foundRoom || !foundCategory) {
      message.error("Room details not found");
      return;
    }
    
    // If editing, find the booking
    let bookingToEdit = null;
    if (bookingInfo) {
      bookingToEdit = allBookings.find(b => {
        const checkIn = dayjs(b.checkInDate);
        const checkOut = dayjs(b.checkOutDate);
        const selectedDate = dayjs(dateStr);
        return (
          b.roomNumberID === roomNumberId &&
          (selectedDate.isSameOrAfter(checkIn, "day") && selectedDate.isBefore(checkOut, "day"))
        );
      });
    }
    
    if (bookingToEdit) {
      setSelectedBookingForEdit(bookingToEdit);
      setIsEditingBooking(true);
    } else {
      setSelectedBookingForEdit(null);
      setIsEditingBooking(false);
    }
    
    // Set room categories
    setRoomCategories(hotel.roomCategories || []);
    setRoomNumbers(foundCategory.roomNumbers || []);
    
    // Pre-fill form values - use setTimeout to ensure formik is ready
    setTimeout(() => {
      const checkInDate = dayjs(dateStr);
      const checkOutDate = checkInDate.add(1, "day");
      
      if (bookingToEdit) {
        const payments =
          Array.isArray(bookingToEdit.payments) && bookingToEdit.payments.length > 0
            ? bookingToEdit.payments.map((p) => ({
                paymentMethod: p.paymentMethod || p.method || "",
                amount: Number(p.amount) || 0,
                transactionId: p.transactionId || "",
              }))
            : [{ paymentMethod: bookingToEdit.paymentMethod || "", amount: Number(bookingToEdit.advancePayment) || 0, transactionId: bookingToEdit.transactionId || "" }];
        const totalFromPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        setInitialPaymentCount(payments.length);
        formik.setValues({
          hotelID: hotel.hotelID,
          hotelName: hotel.hotelName || hotel.name,
          roomCategoryID: foundCategory._id,
          roomCategoryName: foundCategory.name,
          roomNumberID: foundRoom._id,
          roomNumberName: foundRoom.name || foundRoom.roomId,
          roomPrice: bookingToEdit.roomPrice || foundRoom.price || 0,
          checkInDate: dayjs(bookingToEdit.checkInDate),
          checkOutDate: dayjs(bookingToEdit.checkOutDate),
          nights: bookingToEdit.nights || 1,
          fullName: bookingToEdit.fullName || "",
          phone: bookingToEdit.phone || "",
          email: bookingToEdit.email || "",
          nidPassport: bookingToEdit.nidPassport || "",
          address: bookingToEdit.address || "",
          adults: bookingToEdit.adults || 1,
          children: bookingToEdit.children || 0,
          isBreakfast: bookingToEdit.isBreakfast || false,
          breakfastTotalBill:
            bookingToEdit.breakfastTotalBill ??
            ((Number(bookingToEdit.kitchenTotalBill) || 0) +
              (Number(bookingToEdit.extraBedTotalBill) || 0)),
          totalBill: bookingToEdit.totalBill || 0,
          advancePayment: totalFromPayments,
          duePayment: Math.max(0, (Number(bookingToEdit.totalBill) || 0) - totalFromPayments),
          paymentMethod: "",
          transactionId: "",
          payments,
          note: bookingToEdit.note || "",
          reference: bookingToEdit.reference || "",
        });
      } else {
        setInitialPaymentCount(0);
        const roomPrice = foundRoom.price || foundCategory.basePrice || 0;
        formik.setValues({
          hotelID: hotel.hotelID,
          hotelName: hotel.hotelName || hotel.name,
          roomCategoryID: foundCategory._id,
          roomCategoryName: foundCategory.name,
          roomNumberID: foundRoom._id,
          roomNumberName: foundRoom.name || foundRoom.roomId,
          roomPrice: roomPrice,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          nights: 1,
          totalBill: roomPrice,
          advancePayment: 0,
          duePayment: roomPrice,
          fullName: "",
          phone: "",
          email: "",
          nidPassport: "",
          address: "",
          adults: 1,
          children: 0,
          isBreakfast: false,
          breakfastTotalBill: 0,
          paymentMethod: "",
          transactionId: "",
          payments: [{ paymentMethod: "", amount: 0, transactionId: "" }],
          note: "",
          reference: "",
        });
      }
    }, 100);
    
    setBookingModalVisible(true);
  };

  // Show booking history modal for a room + date
  const handleCellClick = async (roomKey, dateStr) => {
    setSelectedRoomKey(roomKey);
    setSelectedDateStr(dateStr);

    const roomNumberId = roomKey.replace("room-", "");

    const relevantBookings = allBookings.filter((booking) => {
      if (booking.roomNumberID !== roomNumberId) return false;
      const checkIn = dayjs(booking.checkInDate);
      const checkOut = dayjs(booking.checkOutDate);
      const selectedDate = dayjs(dateStr);
      return (
        selectedDate.isSameOrAfter(checkIn, "day") &&
        selectedDate.isBefore(checkOut, "day")
      );
    });

    setBookingHistory(relevantBookings);
    setHistoryModalVisible(true);
  };

  // Day column overview — all rooms for that date
  const handleDayHeaderClick = (dateStr) => {
    setSelectedRoomKey(null);
    setSelectedDateStr(dateStr);
    const selectedDate = dayjs(dateStr);
    const relevantBookings = allBookings.filter((booking) => {
      if (booking.statusID === 255) return false;
      const checkIn = dayjs(booking.checkInDate);
      const checkOut = dayjs(booking.checkOutDate);
      return (
        selectedDate.isSameOrAfter(checkIn, "day") &&
        selectedDate.isBefore(checkOut, "day")
      );
    });
    setBookingHistory(relevantBookings);
    setHistoryModalVisible(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
    setSelectedRoomKey(null);
    setSelectedDateStr(null);
    setBookingHistory([]);
  };

  const selectedRoom = selectedRoomKey
    ? roomList.find((r) => r.key === selectedRoomKey)
    : null;
  const isRoomAvailable =
    (selectedRoom?.roomStatus || "available") === "available";
  const isDayOverview = historyModalVisible && !selectedRoomKey;

  // Main columns configuration
  const getColumns = () => {
    const dates = generateDateColumns();
    const roomNoColumnBg = "#04343a";

    const roomNoColumn = {
      title: (
        <div className="hs-cal__room-head">
          Room
          <span>No.</span>
        </div>
      ),
      dataIndex: "flatNo",
      key: "flatNo",
      fixed: "left",
      width: 76,
      onHeaderCell: () => ({
        style: {
          background: roomNoColumnBg,
          color: "white",
          borderColor: "rgba(255,255,255,0.12)",
          position: "sticky",
          left: 0,
          zIndex: 19,
        },
      }),
      onCell: () => ({
        style: {
          background: roomNoColumnBg,
          position: "sticky",
          left: 0,
          zIndex: 14,
          padding: 0,
        },
      }),
      render: (text, record) => (
        <div className="hs-cal__room-cell">
          <div className="hs-cal__room-no">{text}</div>
          {record?.category && (
            <div className="hs-cal__room-cat">{record.category}</div>
          )}
          <div className="hs-cal__room-ratio">
            {calculateTotalBooked(record.key)}/{generateDateColumns().length}
          </div>
        </div>
      ),
    };

    const dateColumns = dates.map((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const dayOfWeek = date.format("ddd");
      const dayNum = date.format("D");
      const isToday = date.isSame(dayjs(), "day");
      const isWeekend = dayOfWeek === "Fri" || dayOfWeek === "Sat";

      return {
        title: (
          <button
            type="button"
            className={[
              "hs-cal__day-head",
              "hs-cal__day-head--btn",
              isToday ? "hs-cal__day-head--today" : "",
              isWeekend ? "hs-cal__day-head--weekend" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              handleDayHeaderClick(dateStr);
            }}
            title={`View ${date.format("DD MMM YYYY")}`}
          >
            <span className="hs-cal__day-dow">{dayOfWeek.toUpperCase()}</span>
            <span className="hs-cal__day-num">{dayNum}</span>
            <EyeOutlined className="hs-cal__day-eye" />
          </button>
        ),
        key: dateStr,
        width: 76,
        align: "center",
        onHeaderCell: () => ({
          className: [
            isToday ? "hs-cal__th--today" : "",
            isWeekend ? "hs-cal__th--weekend" : "",
          ]
            .filter(Boolean)
            .join(" "),
        }),
        render: (_, record) => {
          const bookingKey = `${record.key}-${dateStr}`;
          const bookingInfo = bookingData[bookingKey];
          const roomStatus = record.roomStatus || "available";
          const isRoomAvailable = roomStatus === "available";

          let customerName = "";
          let bookingNo = "";
          if (bookingInfo) {
            const parts = bookingInfo.split(" - ");
            if (parts.length >= 2) {
              bookingNo = parts[0];
              customerName = parts.slice(1).join(" - ");
            } else {
              customerName = bookingInfo;
            }
          }

          return (
            <div
              className={[
                "hs-cal__cell",
                bookingInfo ? "hs-cal__cell--booked" : "hs-cal__cell--available",
                isWeekend ? "hs-cal__cell--weekend" : "",
                isToday ? "hs-cal__cell--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleCellClick(record.key, dateStr)}
            >
              <div className="hs-cal__cell-inner">
                {bookingInfo ? (
                  <>
                    {customerName && (
                      <div className="hs-cal__guest">{customerName}</div>
                    )}
                    {bookingNo && (
                      <div className="hs-cal__booking-no">{bookingNo}</div>
                    )}
                    {canEdit && isRoomAvailable && (
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined style={{ fontSize: 8 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(record.key, dateStr, bookingInfo, e);
                        }}
                        className="hs-cal__edit-btn"
                      >
                        Edit
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="hs-cal__status">{roomStatus}</div>
                    {canInsert && isRoomAvailable && (
                      <>
                        <div className="hs-cal__plus">+</div>
                        <Button
                          type="link"
                          size="small"
                          icon={<PlusOutlined style={{ fontSize: 8 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(record.key, dateStr, null, e);
                          }}
                          className="hs-cal__add-btn"
                        >
                          Add
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        },
      };
    });

    return [roomNoColumn, ...dateColumns];
  };

  // Fetch hotels from API
  const fetchHotels = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const response = await coreAxios.get("/hotels");

      if (response.status === 200) {
        const responseData = response.data;
        let hotelsData = [];
        
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

        if (!Array.isArray(hotelsData)) {
          hotelsData = [];
        }

        if (userRole === "hoteladmin" && userHotelID) {
          hotelsData = hotelsData.filter(
            (hotel) => hotel && hotel.hotelID === userHotelID
          );
        }

        setHotelData(hotelsData);
        
        let defaultHotel = null;
        if (hotelsData.length > 0) {
          defaultHotel = hotelsData.find(
            (hotel) => 
              (hotel.hotelName && hotel.hotelName.toLowerCase().includes("sea shore")) ||
              (hotel.name && hotel.name.toLowerCase().includes("sea shore")) ||
              hotel.hotelID === 1
          );
          
          if (!defaultHotel) {
            defaultHotel = hotelsData[0];
          }
          
          setSelectedHotel(defaultHotel.hotelName || defaultHotel.name);
          setSelectedHotelId(defaultHotel.hotelID);
          setTimeout(() => {
            loadRoomsAndBookings(defaultHotel.hotelID, hotelsData);
          }, 100);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      message.error(error.response?.data?.message || "Failed to fetch hotels");
      setHotelData([]);
      setLoading(false);
    }
  };

  // Fetch bookings from API
  const fetchBookings = async (hotelId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const response = await coreAxios.get("/bookings");

      if (response.status === 200) {
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(userHotelID)
          );
        } else if (hotelId) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(hotelId)
          );
        }

        bookingsData = bookingsData.filter(
          (booking) => booking.statusID !== 255
        );

        setAllBookings(bookingsData);
        return bookingsData;
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(error.response?.data?.message || "Failed to fetch bookings");
      return [];
    }
  };

  // Load rooms from hotel data and map bookings
  const loadRoomsAndBookings = async (hotelId, hotelsArray = null) => {
    setLoading(true);
    try {
      const hotels = hotelsArray || hotelData;
      const hotel = hotels.find(h => h.hotelID === hotelId);
      
      if (!hotel) {
        setRoomList([]);
        setBookingData({});
        setLoading(false);
        return;
      }

      const rooms = [];
      if (hotel.roomCategories && Array.isArray(hotel.roomCategories)) {
        hotel.roomCategories.forEach(category => {
          if (category.isActive === false) return;
          if (category.roomNumbers && Array.isArray(category.roomNumbers)) {
            category.roomNumbers.forEach(room => {
              const roomStatus = room.status || "available";
              rooms.push({
                key: `room-${room._id}`,
                flatNo: room.name || room.roomId || `Room ${room._id}`,
                category: category.name || "Unknown",
                roomNumberID: room._id,
                roomCategoryID: category._id,
                hotelID: hotelId,
                roomStatus,
              });
            });
          }
        });
      }

      setRoomList(rooms);

      const bookings = await fetchBookings(hotelId);
      
      const mappedBookings = {};
      const dates = generateDateColumns();
      
      bookings.forEach(booking => {
        if (!booking.checkInDate || !booking.checkOutDate) return;
        
        const checkIn = dayjs(booking.checkInDate);
        const checkOut = dayjs(booking.checkOutDate);
        const roomKey = `room-${booking.roomNumberID}`;
        
        let currentDate = checkIn;
        while (currentDate.isBefore(checkOut, "day")) {
          const dateStr = currentDate.format("YYYY-MM-DD");
          const bookingKey = `${roomKey}-${dateStr}`;
          
          const displayText = `${booking.bookingNo || "N/A"} - ${booking.fullName || "Guest"}`;
          mappedBookings[bookingKey] = displayText;
          
          currentDate = currentDate.add(1, "day");
        }
      });

      setBookingData(mappedBookings);
    } catch (error) {
      console.error("Error loading rooms and bookings:", error);
      message.error("Failed to load rooms and bookings");
    } finally {
      setLoading(false);
    }
  };

  // Handle hotel selection change
  const handleHotelChange = async (hotelName) => {
    const hotel = hotelData.find(h => (h.hotelName || h.name) === hotelName);
    if (hotel) {
      setSelectedHotel(hotelName);
      setSelectedHotelId(hotel.hotelID);
      await loadRoomsAndBookings(hotel.hotelID, hotelData);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchHotels();
  }, []);

  // Reload bookings when date range changes
  useEffect(() => {
    if (selectedHotelId && hotelData.length > 0) {
      loadRoomsAndBookings(selectedHotelId, hotelData);
    }
  }, [dateRange]);

  // Formik form for booking
  const formik = useFormik({
    initialValues: {
      fullName: "",
      phone: "",
      email: "",
      nidPassport: "",
      address: "",
      hotelID: 0,
      hotelName: "",
      roomCategoryID: "",
      roomCategoryName: "",
      roomNumberID: "",
      roomNumberName: "",
      roomPrice: 0,
      checkInDate: dayjs(),
      checkOutDate: dayjs().add(1, "day"),
      nights: 1,
      adults: 1,
      children: 0,
      isBreakfast: false,
      breakfastTotalBill: 0,
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      paymentMethod: "",
      transactionId: "",
      payments: [{ paymentMethod: "", amount: 0, transactionId: "" }],
      note: "",
      reference: "",
    },
    onSubmit: async (values) => {
      await handleBookingSubmit(values);
    },
  });

  const syncAdvanceFromPayments = (paymentsList) => {
    const totalBill = Number(formik.values.totalBill) || 0;
    const sum = (paymentsList || formik.values.payments || []).reduce(
      (s, p) => s + (Number(p.amount) || 0),
      0
    );
    const capped = sum > totalBill ? totalBill : sum;
    formik.setFieldValue("advancePayment", capped);
    formik.setFieldValue("duePayment", Math.max(0, totalBill - capped));
  };

  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const checkInDate = dayjs(checkIn).startOf("day");
      const checkOutDate = dayjs(checkOut).startOf("day");
      const nights = checkOutDate.diff(checkInDate, "day");
      const calculatedNights = nights > 0 ? nights : 0;
      formik.setFieldValue("nights", calculatedNights);
      const roomPrice = Number(formik.values.roomPrice) || 0;
      const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
      const totalBill = calculatedNights * roomPrice + breakfastTotalBill;
      formik.setFieldValue("totalBill", totalBill);
      syncAdvanceFromPayments(formik.values.payments);
    }
  };

  // Handle booking submit
  const handleBookingSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const checkIn = dayjs(values.checkInDate).startOf("day");
      const checkOut = dayjs(values.checkOutDate).startOf("day");
      const nights = checkOut.diff(checkIn, "day");

      if (nights <= 0) {
        message.error("Check-out date must be after check-in date");
        setSubmitLoading(false);
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const bookedBy = userInfo?.username || userInfo?.loginID || "admin";
      const bookedByID = userInfo?.loginID || userInfo?.id || userInfo?._id || "";

      const totalBill = Number(values.totalBill) || 0;
      const paymentsList = Array.isArray(values.payments) ? values.payments : [{ paymentMethod: "", amount: 0, transactionId: "" }];
      let advancePayment = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (advancePayment > totalBill) advancePayment = totalBill;
      const duePayment = Math.max(0, totalBill - advancePayment);
      const payments = paymentsList
        .filter((p) => (Number(p.amount) || 0) > 0)
        .map((p) => ({
          paymentMethod: (p.paymentMethod || "CASH").trim() || "CASH",
          amount: Number(p.amount) || 0,
          transactionId: p.transactionId != null ? String(p.transactionId).trim() : "",
        }));
      if (payments.length === 0 && advancePayment > 0) {
        payments.push({ paymentMethod: "CASH", amount: advancePayment, transactionId: "" });
      }

      const bookingData = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        nidPassport: values.nidPassport || undefined,
        address: values.address || undefined,
        hotelID: values.hotelID,
        hotelName: values.hotelName,
        roomCategoryID: values.roomCategoryID,
        roomCategoryName: values.roomCategoryName,
        roomNumberID: values.roomNumberID,
        roomNumberName: values.roomNumberName,
        roomPrice: Number(values.roomPrice) || 0,
        checkInDate: dayjs(values.checkInDate).format("YYYY-MM-DD"),
        checkOutDate: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
        nights: nights,
        adults: Number(values.adults) || 1,
        children: Number(values.children) || 0,
        isBreakfast: values.isBreakfast || false,
        breakfastTotalBill: values.isBreakfast ? Number(values.breakfastTotalBill) || 0 : 0,
        totalBill,
        advancePayment,
        duePayment,
        paymentMethod: values.paymentMethod || "",
        transactionId: values.transactionId || "",
        payments,
        note: values.note || undefined,
        reference: values.reference || undefined,
        bookedBy: bookedBy,
        bookedByID: bookedByID,
        updatedByID: isEditingBooking ? (userInfo?.loginID || userInfo?.id || "") : "Not Updated",
      };

      let response;
      if (isEditingBooking && selectedBookingForEdit?._id) {
        response = await coreAxios.put(`/booking/${selectedBookingForEdit._id}`, bookingData);
      } else {
        response = await coreAxios.post("/booking", bookingData);
      }

      if (response.status === 200) {
        message.success(isEditingBooking ? "Booking updated successfully!" : "Booking created successfully!");
        setBookingModalVisible(false);
        setIsEditingBooking(false);
        setSelectedBookingForEdit(null);
        setInitialPaymentCount(0);
        formik.resetForm();

        if (selectedHotelId && hotelData.length > 0) {
          await loadRoomsAndBookings(selectedHotelId, hotelData);
        }
      } else {
        message.error(response.data?.message || response.data?.error || "Failed to save booking.");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "An error occurred while saving the booking.";
      message.error(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Navigation
  const goToPreviousMonth = () => {
    const newStart = dateRange[0].subtract(1, 'month').startOf('month');
    setDateRange([
      newStart,
      newStart.endOf('month'),
    ]);
  };

  const goToNextMonth = () => {
    const newStart = dateRange[0].add(1, 'month').startOf('month');
    setDateRange([
      newStart,
      newStart.endOf('month'),
    ]);
  };

  const goToToday = () => {
    const today = dayjs();
    setDateRange([
      today.startOf('month'),
      today.endOf('month'),
    ]);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    }
  };

  // When table is ready (rooms loaded / dateRange changed), start view from today.
  useEffect(() => {
    if (loading) return;
    // Wait a tick so antd renders tbody before we scroll.
    const t = setTimeout(() => {
      scrollToTodayColumn();
    }, 0);
    return () => clearTimeout(t);
  }, [loading, dateRange]);

  // Extra safety: after room list updates, antd sometimes re-renders table body and resets scroll.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      scrollToTodayColumn();
    }, 50);
    return () => clearTimeout(t);
  }, [roomList.length, dateRange, loading]);

  if (!canView) {
    return <NoPermissionBanner />;
  }

  return (
    <div className="hs-cal">
      <div className="hs-cal__toolbar">
        <div className="hs-cal__toolbar-row">
          <div className="hs-cal__title-block">
            <div className="hs-cal__title-line">
              <p className="hs-cal__eyebrow">Operations</p>
              {selectedHotel && (
                <span className="hs-cal__hotel-chip">{selectedHotel}</span>
              )}
            </div>
            <h1 className="hs-cal__title">
              <span className="hidden sm:inline">Booking Calendar · </span>
              {dateRange[0].format("MMM D")} – {dateRange[1].format("D MMM, YYYY")}
            </h1>
          </div>

          <div className="hs-cal__nav">
            <Button icon={<LeftOutlined />} onClick={goToPreviousMonth} size="small">
              <span className="hidden sm:inline">Prev</span>
            </Button>
            <Button onClick={goToToday} size="small" type="primary">
              Today
            </Button>
            <Button icon={<RightOutlined />} onClick={goToNextMonth} size="small">
              <span className="hidden sm:inline">Next</span>
            </Button>
            <Button
              type={showDateRange ? "primary" : "default"}
              icon={<CalendarOutlined />}
              onClick={() => setShowDateRange(!showDateRange)}
              size="small"
              className="hidden sm:inline-flex"
            >
              Range
            </Button>
          </div>
        </div>

        {showDateRange && (
          <div className="hs-cal__range">
            <span className="hs-cal__range-label">Custom range</span>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              allowClear={false}
              size="small"
              className="w-full sm:w-auto"
            />
            <Button
              type="link"
              size="small"
              onClick={() => {
                const today = dayjs();
                setDateRange([today.startOf("month"), today.endOf("month")]);
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      <div className="hs-cal__legend">
        <span className="hs-cal__legend-item">
          <span className="hs-cal__swatch hs-cal__swatch--booked" /> Booked
        </span>
        <span className="hs-cal__legend-item">
          <span className="hs-cal__swatch hs-cal__swatch--available" /> Available
        </span>
        <span className="hs-cal__legend-item">
          <span className="hs-cal__swatch hs-cal__swatch--today" /> Today
        </span>
        <span className="hs-cal__legend-item">
          <span className="hs-cal__swatch hs-cal__swatch--weekend" /> Weekend
        </span>
      </div>

      <div className="hs-cal__panel">
        {loading ? (
          <div className="p-3">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 10 }}>
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-center border" style={{ background: "#f3f8f8" }}>
                      <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                    </th>
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <th key={idx} className="px-1 py-2 text-center border" style={{ background: "#f3f8f8" }}>
                        <Skeleton.Input active size="small" style={{ width: 36, height: 20 }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="px-2 py-2 text-center border">
                        <Skeleton.Input active size="small" style={{ width: 50, height: 16 }} />
                      </td>
                      {Array.from({ length: 12 }).map((_, colIdx) => (
                        <td key={colIdx} className="px-1 py-2 text-center border" style={{ minHeight: 48 }}>
                          <Skeleton.Input active size="small" style={{ width: 32, height: 36 }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div ref={calendarWrapperRef} className="hs-cal__scroll">
            <Table
              columns={getColumns()}
              dataSource={roomList}
              pagination={false}
              bordered
              size="small"
              rowKey="key"
              scroll={{
                x: 1200,
                y: 550,
                scrollToFirstRowOnChange: true,
              }}
              className="calendar-table"
              sticky={{ offsetHeader: 0 }}
              summary={() => {
                const dates = generateDateColumns();
                return (
                  <Table.Summary fixed="bottom">
                    <Table.Summary.Row className="hs-cal__occ-row">
                      <Table.Summary.Cell
                        index={0}
                        className="hs-cal__foot-label hs-cal__occ-label"
                      >
                        Occupancy
                      </Table.Summary.Cell>
                      {dates.map((date, idx) => {
                        const dateStr = date.format("YYYY-MM-DD");
                        const bookedQty = calculateDayTotal(dateStr);
                        const totalRooms = roomList.length;
                        const ratio =
                          totalRooms > 0
                            ? `${bookedQty}/${totalRooms}`
                            : "0/0";
                        const dayOfWeek = date.format("ddd");
                        const isWeekend =
                          dayOfWeek === "Fri" || dayOfWeek === "Sat";
                        const isToday = date.isSame(dayjs(), "day");
                        const pct =
                          totalRooms > 0
                            ? Math.round((bookedQty / totalRooms) * 100)
                            : 0;
                        return (
                          <Table.Summary.Cell
                            key={`occ-${dateStr}`}
                            index={idx + 1}
                            className={[
                              "hs-cal__foot-cell",
                              "hs-cal__occ-cell",
                              isWeekend ? "hs-cal__occ-cell--weekend" : "",
                              isToday ? "hs-cal__occ-cell--today" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className="hs-cal__foot-ratio">{ratio}</div>
                            <div className="hs-cal__occ-pct">{pct}%</div>
                          </Table.Summary.Cell>
                        );
                      })}
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
              components={{
                body: {
                  cell: (props) => (
                    <td {...props} style={{ padding: 0 }} />
                  ),
                },
              }}
            />
          </div>
        )}
      </div>

      {/* Day / room booking view */}
      <Modal
        className="hs-booking-modal hs-cal-dayview"
        wrapClassName="hs-cal-dayview-wrap"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">
              {isDayOverview ? "Day overview" : "Room · date view"}
            </p>
            <h2 className="hs-booking-modal__title">
              {selectedDateStr
                ? dayjs(selectedDateStr).format("dddd, D MMMM YYYY")
                : "Booking view"}
            </h2>
            <p className="hs-booking-modal__sub">
              {isDayOverview
                ? `${bookingHistory.length} booking${bookingHistory.length === 1 ? "" : "s"} across rooms`
                : `${selectedRoom?.flatNo || "Room"}${
                    selectedRoom?.category ? ` · ${selectedRoom.category}` : ""
                  } · ${bookingHistory.length} record${
                    bookingHistory.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>
        }
        open={historyModalVisible}
        onCancel={closeHistoryModal}
        footer={
          <div className="hs-cal-dayview__footer">
            <Button onClick={closeHistoryModal}>Close</Button>
            {canInsert &&
              !isDayOverview &&
              isRoomAvailable &&
              selectedRoomKey &&
              selectedDateStr && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    handleEditClick(selectedRoomKey, selectedDateStr, null)
                  }
                >
                  Add booking
                </Button>
              )}
          </div>
        }
        width={720}
        centered
        destroyOnClose
      >
        <div className="hs-cal-dayview__body">
          <div className="hs-cal-dayview__kpis">
            <div className="hs-cal-dayview__kpi">
              <p className="hs-cal-dayview__kpi-label">
                {isDayOverview ? "Rooms booked" : "Status"}
              </p>
              <p className="hs-cal-dayview__kpi-value">
                {isDayOverview
                  ? bookingHistory.length
                  : bookingHistory.length > 0
                    ? "Occupied"
                    : isRoomAvailable
                      ? "Available"
                      : selectedRoom?.roomStatus || "—"}
              </p>
            </div>
            <div className="hs-cal-dayview__kpi hs-cal-dayview__kpi--soft">
              <p className="hs-cal-dayview__kpi-label">Active</p>
              <p className="hs-cal-dayview__kpi-value">
                {bookingHistory.filter((b) => b.statusID === 1).length}
              </p>
            </div>
            <div className="hs-cal-dayview__kpi hs-cal-dayview__kpi--sand">
              <p className="hs-cal-dayview__kpi-label">Total bill</p>
              <p className="hs-cal-dayview__kpi-value">
                ৳
                {bookingHistory
                  .reduce((s, b) => s + (Number(b.totalBill) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="hs-cal-dayview__kpi hs-cal-dayview__kpi--due">
              <p className="hs-cal-dayview__kpi-label">Due</p>
              <p className="hs-cal-dayview__kpi-value is-due">
                ৳
                {bookingHistory
                  .reduce((s, b) => s + (Number(b.duePayment) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>

          {bookingHistory.length > 0 ? (
            <div className="hs-cal-dayview__list">
              {bookingHistory.map((booking) => {
                const isActive = booking.statusID === 1;
                const paid =
                  Number(booking.advancePayment) ||
                  (Array.isArray(booking.payments)
                    ? booking.payments.reduce(
                        (s, p) => s + (Number(p.amount) || 0),
                        0
                      )
                    : 0);
                return (
                  <article
                    key={booking._id}
                    className={`hs-cal-dayview__card${
                      isActive ? "" : " hs-cal-dayview__card--cancelled"
                    }`}
                  >
                    <div className="hs-cal-dayview__card-top">
                      <div className="hs-cal-dayview__identity">
                        <div className="hs-cal-dayview__invoice-row">
                          <span className="hs-cal-dayview__invoice">
                            {booking.bookingNo || "—"}
                          </span>
                          <span
                            className={`hs-cal-dayview__badge${
                              isActive
                                ? " hs-cal-dayview__badge--ok"
                                : " hs-cal-dayview__badge--bad"
                            }`}
                          >
                            {isActive ? "Active" : "Cancelled"}
                          </span>
                        </div>
                        <h4 className="hs-cal-dayview__guest">
                          <UserOutlined /> {booking.fullName || "Guest"}
                        </h4>
                        <p className="hs-cal-dayview__contact">
                          <PhoneOutlined /> {booking.phone || "—"}
                          {booking.email ? ` · ${booking.email}` : ""}
                        </p>
                        {(isDayOverview ||
                          booking.roomNumberName ||
                          booking.roomCategoryName) && (
                          <p className="hs-cal-dayview__roomline">
                            {[
                              booking.roomNumberName,
                              booking.roomCategoryName,
                              booking.hotelName,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      {canEdit &&
                        !isDayOverview &&
                        isRoomAvailable &&
                        selectedRoomKey && (
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              closeHistoryModal();
                              handleEditClick(
                                selectedRoomKey,
                                selectedDateStr,
                                booking,
                                null
                              );
                            }}
                          >
                            Edit
                          </Button>
                        )}
                    </div>

                    <div className="hs-cal-dayview__attrs">
                      <div className="hs-cal-dayview__attr">
                        <label>Check-in</label>
                        <p>
                          {booking.checkInDate
                            ? dayjs(booking.checkInDate).format("DD MMM YYYY")
                            : "—"}
                        </p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Check-out</label>
                        <p>
                          {booking.checkOutDate
                            ? dayjs(booking.checkOutDate).format("DD MMM YYYY")
                            : "—"}
                        </p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Nights</label>
                        <p>{booking.nights || 1}</p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Guests</label>
                        <p>
                          {booking.adults || 1}A / {booking.children || 0}C
                        </p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Total</label>
                        <p className="is-money">
                          ৳{(Number(booking.totalBill) || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Paid</label>
                        <p className="is-paid">৳{paid.toLocaleString()}</p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Due</label>
                        <p className="is-due">
                          ৳{(Number(booking.duePayment) || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="hs-cal-dayview__attr">
                        <label>Method</label>
                        <p>{booking.paymentMethod || "—"}</p>
                      </div>
                    </div>

                    {(booking.nidPassport ||
                      booking.address ||
                      booking.bookedBy ||
                      booking.note ||
                      booking.reference ||
                      booking.breakfastTotalBill ||
                      booking.transactionId) && (
                      <div className="hs-cal-dayview__extra">
                        {booking.nidPassport && (
                          <span>
                            <em>ID</em> {booking.nidPassport}
                          </span>
                        )}
                        {booking.bookedBy && (
                          <span>
                            <em>Booked by</em> {booking.bookedBy}
                          </span>
                        )}
                        {booking.transactionId && (
                          <span>
                            <em>Trx</em> {booking.transactionId}
                          </span>
                        )}
                        {(booking.breakfastTotalBill ||
                          booking.kitchenTotalBill ||
                          booking.extraBedTotalBill) && (
                          <span>
                            <em>Extras</em> ৳
                            {(
                              booking.breakfastTotalBill ??
                              (Number(booking.kitchenTotalBill) || 0) +
                                (Number(booking.extraBedTotalBill) || 0)
                            ).toLocaleString()}
                          </span>
                        )}
                        {booking.address && (
                          <span className="is-full">
                            <em>Address</em> {booking.address}
                          </span>
                        )}
                        {booking.note && (
                          <span className="is-full">
                            <em>Note</em> {booking.note}
                          </span>
                        )}
                        {booking.reference && (
                          <span className="is-full">
                            <em>Ref</em> {booking.reference}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="hs-cal-dayview__empty">
              <CalendarOutlined />
              <p className="hs-cal-dayview__empty-title">No booking found</p>
              <p className="hs-cal-dayview__empty-sub">
                {isDayOverview
                  ? "No rooms are occupied on this date"
                  : isRoomAvailable
                    ? "This room is free for the selected date"
                    : "Add / edit is disabled for this room status"}
              </p>
              {canInsert &&
                !isDayOverview &&
                isRoomAvailable &&
                selectedRoomKey &&
                selectedDateStr && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      handleEditClick(selectedRoomKey, selectedDateStr, null)
                    }
                  >
                    Create booking
                  </Button>
                )}
            </div>
          )}
        </div>
      </Modal>

      {/* Booking Create/Edit Modal */}
      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">
              {isEditingBooking ? "Update record" : "New reservation"}
            </p>
            <h2 className="hs-booking-modal__title">
              {isEditingBooking ? "Edit Booking" : "Create Booking"}
            </h2>
            <p className="hs-booking-modal__sub">
              {formik.values.roomNumberName
                ? `${formik.values.roomNumberName} · ${formik.values.roomCategoryName || "Room"}`
                : "Guest, stay dates and payment"}
            </p>
          </div>
        }
        open={bookingModalVisible}
        onCancel={() => {
          setBookingModalVisible(false);
          setIsEditingBooking(false);
          setSelectedBookingForEdit(null);
          formik.resetForm();
        }}
        footer={null}
        width={960}
        centered
        destroyOnClose
      >
        <Form onFinish={formik.handleSubmit} layout="vertical" className="hs-bf booking-form" requiredMark="optional">
          <div className="hs-bf__summary">
            <div className="hs-bf__kpi">
              <p className="hs-bf__kpi-label">Total bill</p>
              <p className="hs-bf__kpi-value">
                ৳{Number(formik.values.totalBill || 0).toLocaleString()}
              </p>
            </div>
            <div className="hs-bf__kpi hs-bf__kpi--paid">
              <p className="hs-bf__kpi-label">Advance paid</p>
              <p className="hs-bf__kpi-value">
                ৳
                {Number(
                  Array.isArray(formik.values.payments)
                    ? formik.values.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
                    : formik.values.advancePayment || 0
                ).toLocaleString()}
              </p>
            </div>
            <div className="hs-bf__kpi hs-bf__kpi--due">
              <p className="hs-bf__kpi-label">Due</p>
              <p className="hs-bf__kpi-value">
                ৳{Number(formik.values.duePayment || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Guest information</h3>
              <p className="hs-bf__section-hint">Primary guest contact</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__guest-grid">
                <Form.Item label="Full name" required>
                  <Input
                    value={formik.values.fullName}
                    onChange={formik.handleChange}
                    name="fullName"
                    placeholder="Guest full name"
                  />
                </Form.Item>
                <Form.Item label="Phone" required>
                  <Input
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    name="phone"
                    placeholder="01XXXXXXXXX"
                  />
                </Form.Item>
                <Form.Item label="Email">
                  <Input
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    name="email"
                    type="email"
                    placeholder="Optional email"
                  />
                </Form.Item>
                <Form.Item label="Room">
                  <Input
                    value={
                      [formik.values.roomNumberName, formik.values.roomCategoryName]
                        .filter(Boolean)
                        .join(" · ") || "—"
                    }
                    disabled
                  />
                </Form.Item>
              </div>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Stay details</h3>
              <p className="hs-bf__section-hint">Dates · nights · rate</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__dates-grid">
                <Form.Item label="Check-in" required>
                  <DatePicker
                    value={formik.values.checkInDate}
                    onChange={(date) => {
                      formik.setFieldValue("checkInDate", date);
                      calculateNights(date, formik.values.checkOutDate);
                    }}
                    format="DD/MM/YYYY"
                    className="w-full"
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                  />
                </Form.Item>
                <Form.Item label="Check-out" required>
                  <DatePicker
                    value={formik.values.checkOutDate}
                    onChange={(date) => {
                      formik.setFieldValue("checkOutDate", date);
                      calculateNights(formik.values.checkInDate, date);
                    }}
                    format="DD/MM/YYYY"
                    className="w-full"
                    disabledDate={(current) => current && current <= formik.values.checkInDate}
                  />
                </Form.Item>
                <Form.Item label="Nights">
                  <Input value={formik.values.nights} readOnly />
                </Form.Item>
                <Form.Item label="Room price / night" required>
                  <Input
                    type="number"
                    value={formik.values.roomPrice}
                    onChange={(e) => {
                      formik.setFieldValue("roomPrice", e.target.value);
                      calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                    }}
                    name="roomPrice"
                    placeholder="Price per night"
                    prefix="৳"
                  />
                </Form.Item>
              </div>
              <div className="hs-bf__dates-grid" style={{ marginTop: 4 }}>
                <Form.Item label="Adults">
                  <Input
                    type="number"
                    min={1}
                    value={formik.values.adults}
                    onChange={formik.handleChange}
                    name="adults"
                    placeholder="Adults"
                  />
                </Form.Item>
                <Form.Item label="Children">
                  <Input
                    type="number"
                    min={0}
                    value={formik.values.children}
                    onChange={formik.handleChange}
                    name="children"
                    placeholder="Children"
                  />
                </Form.Item>
              </div>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Payment</h3>
              <p className="hs-bf__section-hint">Totals update from payment rows</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__pay-totals">
                <Form.Item label="Total bill" required>
                  <Input value={formik.values.totalBill} readOnly prefix="৳" />
                </Form.Item>
                <Form.Item label="Advance (total)">
                  <Input
                    type="number"
                    value={
                      Array.isArray(formik.values.payments)
                        ? formik.values.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
                        : formik.values.advancePayment
                    }
                    readOnly
                    prefix="৳"
                  />
                </Form.Item>
                <Form.Item label="Due payment">
                  <Input value={formik.values.duePayment} readOnly prefix="৳" />
                </Form.Item>
              </div>

              {(Array.isArray(formik.values.payments) ? formik.values.payments : []).map((_, index) => {
                const isExistingPayment = isEditingBooking && index < initialPaymentCount;
                const usedMethods = !isEditingBooking
                  ? (formik.values.payments || [])
                      .map((p, i) =>
                        i !== index && (p.paymentMethod || "").trim() ? p.paymentMethod : null
                      )
                      .filter(Boolean)
                  : [];
                return (
                  <div className="hs-bf__pay-row" key={index} style={{ gridTemplateColumns: "1.2fr 1fr 1.4fr auto" }}>
                    <Form.Item label={index === 0 ? "Method" : " "}>
                      <Select
                        value={formik.values.payments[index]?.paymentMethod ?? ""}
                        onChange={(value) => {
                          const next = [...(formik.values.payments || [])];
                          if (!next[index]) next[index] = { paymentMethod: "", amount: 0, transactionId: "" };
                          next[index].paymentMethod = value ?? "";
                          formik.setFieldValue("payments", next);
                          syncAdvanceFromPayments(next);
                        }}
                        placeholder="Method"
                        disabled={isExistingPayment}
                        allowClear
                      >
                        <Select.Option value="BKASH" disabled={usedMethods.includes("BKASH")}>BKASH</Select.Option>
                        <Select.Option value="NAGAD" disabled={usedMethods.includes("NAGAD")}>NAGAD</Select.Option>
                        <Select.Option value="BANK" disabled={usedMethods.includes("BANK")}>BANK</Select.Option>
                        <Select.Option value="CASH" disabled={usedMethods.includes("CASH")}>CASH</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label={index === 0 ? "Amount" : " "}>
                      <Input
                        type="number"
                        min={0}
                        value={formik.values.payments[index]?.amount ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const totalBill = Number(formik.values.totalBill) || 0;
                          const next = [...(formik.values.payments || [])];
                          if (!next[index]) next[index] = { paymentMethod: "", amount: 0, transactionId: "" };
                          next[index].amount = val > totalBill ? totalBill : val;
                          formik.setFieldValue("payments", next);
                          syncAdvanceFromPayments(next);
                        }}
                        placeholder="Amount"
                        prefix="৳"
                        disabled={isExistingPayment}
                      />
                    </Form.Item>
                    <Form.Item label={index === 0 ? "Transaction ID" : " "}>
                      <Input
                        value={formik.values.payments[index]?.transactionId ?? ""}
                        onChange={(e) => {
                          const next = [...(formik.values.payments || [])];
                          if (!next[index]) next[index] = { paymentMethod: "", amount: 0, transactionId: "" };
                          next[index].transactionId = e.target.value;
                          formik.setFieldValue("payments", next);
                        }}
                        placeholder="Optional"
                        disabled={isExistingPayment}
                      />
                    </Form.Item>
                    <div className="hs-bf__pay-actions">
                      {formik.values.payments.length > 1 &&
                      (!isEditingBooking || index >= initialPaymentCount) ? (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => {
                            const next = (formik.values.payments || []).filter((_, i) => i !== index);
                            if (next.length === 0)
                              next.push({ paymentMethod: "", amount: 0, transactionId: "" });
                            formik.setFieldValue("payments", next);
                            syncAdvanceFromPayments(next);
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                className="hs-bf__add-pay"
                onClick={() => {
                  const next = [
                    ...(formik.values.payments || []),
                    { paymentMethod: "", amount: 0, transactionId: "" },
                  ];
                  formik.setFieldValue("payments", next);
                }}
              >
                Add payment method
              </Button>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Extras & notes</h3>
              <p className="hs-bf__section-hint">Optional services</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__extra-grid">
                <div className="hs-bf__breakfast">
                  <div className="hs-bf__breakfast-top">
                    <div>
                      <div className="hs-bf__breakfast-label">Breakfast</div>
                      <div className="hs-bf__breakfast-hint">Include breakfast with this stay</div>
                    </div>
                    <Switch
                      checked={formik.values.isBreakfast}
                      onChange={(checked) => {
                        formik.setFieldValue("isBreakfast", checked);
                        if (!checked) {
                          formik.setFieldValue("breakfastTotalBill", 0);
                          calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                        }
                      }}
                    />
                  </div>
                  {formik.values.isBreakfast && (
                    <Form.Item label="Breakfast bill" style={{ marginBottom: 0 }}>
                      <Input
                        type="number"
                        min={0}
                        value={formik.values.breakfastTotalBill || ""}
                        onChange={(e) => {
                          formik.setFieldValue("breakfastTotalBill", e.target.value);
                          calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                        }}
                        placeholder="Breakfast amount"
                        prefix="৳"
                      />
                    </Form.Item>
                  )}
                </div>
                <Form.Item label="Internal note">
                  <Input.TextArea
                    value={formik.values.note}
                    onChange={formik.handleChange}
                    name="note"
                    placeholder="Special requests, arrival time, remarks…"
                    rows={4}
                  />
                </Form.Item>
              </div>
            </div>
          </section>

          <div className="hs-bf__footer">
            <Button
              onClick={() => {
                setBookingModalVisible(false);
                setIsEditingBooking(false);
                setSelectedBookingForEdit(null);
                setInitialPaymentCount(0);
                formik.resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              {isEditingBooking ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelCalendar;