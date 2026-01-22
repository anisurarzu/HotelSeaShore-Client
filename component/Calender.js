"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Spin,
  Alert,
  Select,
  message,
  Popconfirm,
  Tooltip,
  DatePicker,
  Modal,
  Tag,
  Space,
  Form,
  Input,
  Switch,
  Card,
  Row,
  Col,
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
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";

const { Option } = Select;
const { RangePicker } = DatePicker;

const HotelCalendar = ({ hotelID }) => {
  const router = useRouter();
  const [hotelData, setHotelData] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [roomList, setRoomList] = useState([]);
  const [bookingData, setBookingData] = useState({});
  const [allBookings, setAllBookings] = useState([]);
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

  // Get booking color - green for all bookings
  const getBookingColor = (value) => {
    if (!value) return "#ffffff";
    return "#90EE90"; // Green for all bookings
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
        // Pre-fill with existing booking data
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
          isKitchen: bookingToEdit.isKitchen || false,
          kitchenTotalBill: bookingToEdit.kitchenTotalBill || 0,
          extraBed: bookingToEdit.extraBed || false,
          extraBedTotalBill: bookingToEdit.extraBedTotalBill || 0,
          totalBill: bookingToEdit.totalBill || 0,
          advancePayment: bookingToEdit.advancePayment || 0,
          duePayment: bookingToEdit.duePayment || 0,
          paymentMethod: bookingToEdit.paymentMethod || "",
          transactionId: bookingToEdit.transactionId || "",
          note: bookingToEdit.note || "",
          reference: bookingToEdit.reference || "",
        });
      } else {
        // Pre-fill for new booking
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
          isKitchen: false,
          kitchenTotalBill: 0,
          extraBed: false,
          extraBedTotalBill: 0,
          paymentMethod: "",
          transactionId: "",
          note: "",
          reference: "",
        });
      }
    }, 100);
    
    setBookingModalVisible(true);
  };

  // Show booking history modal
  const handleCellClick = async (roomKey, dateStr) => {
    setSelectedRoomKey(roomKey);
    setSelectedDateStr(dateStr);
    
    // Extract roomNumberID from roomKey (format: "room-{roomNumberID}")
    const roomNumberId = roomKey.replace("room-", "");
    
    // Fetch booking history for this room and date from actual bookings
    const relevantBookings = allBookings.filter(booking => {
      // Check if booking is for this room
      if (booking.roomNumberID !== roomNumberId) return false;
      
      // Check if date falls within booking range
      const checkIn = dayjs(booking.checkInDate);
      const checkOut = dayjs(booking.checkOutDate);
      const selectedDate = dayjs(dateStr);
      
      // Date is within booking range (inclusive of check-in, exclusive of check-out)
      return selectedDate.isSameOrAfter(checkIn, "day") && selectedDate.isBefore(checkOut, "day");
    });
    
    setBookingHistory(relevantBookings);
    setHistoryModalVisible(true);
  };

  // Main columns configuration
  const getColumns = () => {
    const dates = generateDateColumns();
    
    const dateColumns = dates.map((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const dayOfWeek = date.format("ddd");
      const dayNum = date.format("D");
      const isToday = date.isSame(dayjs(), 'day');
      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
      
      return {
        title: (
          <div className="text-center p-0 m-0" style={{ minWidth: '80px' }}>
            <div 
              className={`font-bold ${isToday ? 'text-red-600' : ''} ${isWeekend ? 'text-blue-600' : ''}`}
              style={{ fontSize: '9px', lineHeight: '1.2' }}
            >
              {dayOfWeek.toUpperCase()}
            </div>
            <div 
              className={`font-extrabold ${isToday ? 'text-red-600' : ''}`}
              style={{ fontSize: '12px', lineHeight: '1.2' }}
            >
              {dayNum}
            </div>
            <div 
              className="text-gray-500 font-medium"
              style={{ fontSize: '8px', lineHeight: '1.2' }}
            >
              {calculateDayTotal(dateStr)}
            </div>
          </div>
        ),
        key: dateStr,
        width: 80, // Wider width to show customer name
        align: 'center',
        render: (_, record) => {
          const bookingKey = `${record.key}-${dateStr}`;
          const bookingInfo = bookingData[bookingKey];
          
          // Extract customer name from bookingInfo (format: "bookingNo - fullName")
          let customerName = "";
          let bookingNo = "";
          if (bookingInfo) {
            const parts = bookingInfo.split(" - ");
            if (parts.length >= 2) {
              bookingNo = parts[0];
              customerName = parts.slice(1).join(" - "); // In case name contains " - "
            } else {
              customerName = bookingInfo;
            }
          }
          
          return (
            <Tooltip title={bookingInfo ? `${bookingNo ? `Booking: ${bookingNo}` : ''} ${customerName ? `Customer: ${customerName}` : bookingInfo}` : "Click to view history or add booking"}>
              <div
                className="flex items-center justify-center p-1 relative"
                style={{
                  minHeight: '60px',
                  backgroundColor: getBookingColor(bookingInfo || ''),
                  cursor: 'pointer',
                  border: '1px solid #e8e8e8',
                  fontSize: '9px',
                  padding: '4px',
                }}
                onClick={() => handleCellClick(record.key, dateStr)}
              >
                {bookingInfo ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="flex-grow overflow-hidden text-center">
                      {customerName && (
                        <div className="font-semibold text-gray-800 mb-1" style={{ fontSize: '9px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                          {customerName}
                        </div>
                      )}
                      {bookingNo && (
                        <div className="text-gray-600 font-medium" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                          {bookingNo}
                        </div>
                      )}
                    </div>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined style={{ fontSize: '8px' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record.key, dateStr, bookingInfo, e);
                      }}
                      className="p-0 m-0"
                      style={{ fontSize: '8px', height: '16px', marginTop: '2px' }}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 text-xs mb-1">+</div>
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined style={{ fontSize: '8px' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record.key, dateStr, null, e);
                      }}
                      className="p-0 m-0"
                      style={{ fontSize: '8px', height: '16px' }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </Tooltip>
          );
        },
      };
    });

    return [
      {
        title: (
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm">Room</div>
            <div className="text-xs text-gray-500">No.</div>
          </div>
        ),
        dataIndex: 'flatNo',
        key: 'flatNo',
        fixed: 'left',
        width: 70,
        render: (text, record) => (
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm">{text}</div>
            <div className="text-xs text-gray-500">
              {calculateTotalBooked(record.key)}/{generateDateColumns().length}
            </div>
          </div>
        ),
      },
      ...dateColumns,
    ];
  };

  // Fetch hotels from API
  const fetchHotels = async () => {
    try {
      // Keep loading true - it will be set to false in loadRoomsAndBookings
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      const response = await coreAxios.get("/hotels");

      if (response.status === 200) {
        const responseData = response.data;
        let hotelsData = [];
        
        // Extract hotels array from response
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

        // Filter by userHotelID if user is hoteladmin
        if (userRole === "hoteladmin" && userHotelID) {
          hotelsData = hotelsData.filter(
            (hotel) => hotel && hotel.hotelID === userHotelID
          );
        }

        setHotelData(hotelsData);
        
        // Find Hotel Sea Shore by name or use hotelID = 1 as default
        let defaultHotel = null;
        if (hotelsData.length > 0) {
          // Try to find "Hotel Sea Shore" by name
          defaultHotel = hotelsData.find(
            (hotel) => 
              (hotel.hotelName && hotel.hotelName.toLowerCase().includes("sea shore")) ||
              (hotel.name && hotel.name.toLowerCase().includes("sea shore")) ||
              hotel.hotelID === 1
          );
          
          // If not found, use first hotel
          if (!defaultHotel) {
            defaultHotel = hotelsData[0];
          }
          
          setSelectedHotel(defaultHotel.hotelName || defaultHotel.name);
          setSelectedHotelId(defaultHotel.hotelID);
          // Load rooms and bookings after state is set
          setTimeout(() => {
            loadRoomsAndBookings(defaultHotel.hotelID, hotelsData);
          }, 100);
        } else {
          // No hotels found, stop loading
          setLoading(false);
        }
      } else {
        // Response not successful, stop loading
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      message.error(error.response?.data?.message || "Failed to fetch hotels");
      setHotelData([]);
      setLoading(false); // Stop loading on error
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

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(userHotelID)
          );
        } else if (hotelId) {
          // Filter by selected hotel
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(hotelId)
          );
        }

        // Filter out cancelled bookings (statusID === 255)
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
      // Use provided hotelsArray or fallback to hotelData state
      const hotels = hotelsArray || hotelData;
      const hotel = hotels.find(h => h.hotelID === hotelId);
      
      if (!hotel) {
        setRoomList([]);
        setBookingData({});
        setLoading(false);
        return;
      }

      // Extract all rooms from hotel's roomCategories
      const rooms = [];
      if (hotel.roomCategories && Array.isArray(hotel.roomCategories)) {
        hotel.roomCategories.forEach(category => {
          if (category.roomNumbers && Array.isArray(category.roomNumbers)) {
            category.roomNumbers.forEach(room => {
              rooms.push({
                key: `room-${room._id}`,
                flatNo: room.name || room.roomId || `Room ${room._id}`,
                category: category.name || "Unknown",
                roomNumberID: room._id,
                roomCategoryID: category._id,
                hotelID: hotelId,
        });
      });
          }
        });
      }

      setRoomList(rooms);

      // Fetch bookings for this hotel
      const bookings = await fetchBookings(hotelId);
      
      // Map bookings to calendar cells
      const mappedBookings = {};
      const dates = generateDateColumns();
      
      bookings.forEach(booking => {
        if (!booking.checkInDate || !booking.checkOutDate) return;
        
        const checkIn = dayjs(booking.checkInDate);
        const checkOut = dayjs(booking.checkOutDate);
        const roomKey = `room-${booking.roomNumberID}`;
        
        // Generate all dates between check-in and check-out
        let currentDate = checkIn;
        while (currentDate.isBefore(checkOut, "day")) {
          const dateStr = currentDate.format("YYYY-MM-DD");
          const bookingKey = `${roomKey}-${dateStr}`;
          
          // Use booking number and guest name for display
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
      reference: "",
    },
    onSubmit: async (values) => {
      await handleBookingSubmit(values);
    },
  });

  // Calculate nights
  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const checkInDate = dayjs(checkIn).startOf("day");
      const checkOutDate = dayjs(checkOut).startOf("day");
      const nights = checkOutDate.diff(checkInDate, "day");
      const calculatedNights = nights > 0 ? nights : 0;
      
      formik.setFieldValue("nights", calculatedNights);
      
      const roomPrice = Number(formik.values.roomPrice) || 0;
      const kitchenTotalBill = formik.values.isKitchen ? Number(formik.values.kitchenTotalBill) || 0 : 0;
      const extraBedTotalBill = formik.values.extraBed ? Number(formik.values.extraBedTotalBill) || 0 : 0;
      const totalBill = (calculatedNights * roomPrice) + kitchenTotalBill + extraBedTotalBill;
      const advancePayment = Number(formik.values.advancePayment) || 0;
      const duePayment = Math.max(0, totalBill - advancePayment);
      
      formik.setFieldValue("totalBill", totalBill);
      formik.setFieldValue("duePayment", duePayment);
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
        isKitchen: values.isKitchen || false,
        kitchenTotalBill: values.isKitchen ? Number(values.kitchenTotalBill) : 0,
        extraBed: values.extraBed || false,
        extraBedTotalBill: values.extraBed ? Number(values.extraBedTotalBill) : 0,
        totalBill: Number(values.totalBill) || 0,
        advancePayment: Number(values.advancePayment) || 0,
        duePayment: Number(values.duePayment) || 0,
        paymentMethod: values.paymentMethod || "",
        transactionId: values.transactionId || "",
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
        formik.resetForm();
        
        // Reload bookings and rooms
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

  // Monthly Booking Summary
  const MonthlySummary = () => {
    const dates = generateDateColumns();
    const startDate = dateRange[0] || dayjs().startOf("month");
    const endDate = dateRange[1] || dayjs().endOf("month");
    
    // Filter bookings for the current month
    const monthBookings = allBookings.filter(booking => {
      if (!booking.checkInDate || !booking.checkOutDate) return false;
      const checkIn = dayjs(booking.checkInDate);
      const checkOut = dayjs(booking.checkOutDate);
      
      // Check if booking overlaps with the selected month
      // Booking overlaps if: checkIn <= endDate AND checkOut >= startDate
    return (
        (checkIn.isBefore(endDate, "day") || checkIn.isSame(endDate, "day")) &&
        (checkOut.isAfter(startDate, "day") || checkOut.isSame(startDate, "day"))
      );
    });

    // Calculate statistics
    const totalBookings = monthBookings.length;
    const totalRevenue = monthBookings.reduce((sum, booking) => sum + (Number(booking.totalBill) || 0), 0);
    const totalAdvance = monthBookings.reduce((sum, booking) => sum + (Number(booking.advancePayment) || 0), 0);
    const totalDue = totalRevenue - totalAdvance;
    const totalBookedDays = dates.filter(date => {
      const dateStr = date.format("YYYY-MM-DD");
      return roomList.some(room => bookingData[`${room.key}-${dateStr}`]);
    }).length;
    const totalRooms = roomList.length;
    const occupancyRate = totalRooms > 0 ? ((totalBookedDays / (totalRooms * dates.length)) * 100).toFixed(1) : 0;
                
                return (
      <div className="flex justify-end mt-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3" style={{ minWidth: "280px", maxWidth: "320px" }}>
          <div className="text-xs font-semibold text-gray-700 mb-2 border-b pb-2">
            Summary - {startDate.format("MMM YYYY")}
                    </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Bookings:</span>
              <span className="font-semibold text-gray-800">{totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold text-green-600">৳{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Advance:</span>
              <span className="font-semibold text-yellow-600">৳{totalAdvance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due:</span>
              <span className="font-semibold text-orange-600">৳{totalDue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span className="text-gray-600">Occupancy:</span>
              <span className="font-semibold text-blue-600">{occupancyRate}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-2">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-2 p-2 sm:p-3">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                Booking Calendar ({dateRange[0].format("MMM D, YYYY")} - {dateRange[1].format("MMM D, YYYY")})
              </h1>
            </div>
            
            {/* Navigation Controls - Aligned to the right */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                icon={<LeftOutlined />}
                onClick={goToPreviousMonth}
                size="small"
                className="text-xs"
              >
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">‹</span>
              </Button>
              
              <Button
                onClick={goToToday}
                size="small"
                className="text-xs"
              >
                Today
              </Button>
              
              <Button
                icon={<RightOutlined />}
                onClick={goToNextMonth}
                size="small"
                className="text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </Button>
              
              <Button
                type={showDateRange ? "primary" : "default"}
                icon={<CalendarOutlined />}
                onClick={() => setShowDateRange(!showDateRange)}
                size="small"
                className="text-xs"
              >
                <span className="hidden md:inline">Custom Range</span>
                <span className="md:hidden">Range</span>
              </Button>
            </div>
          </div>

          {/* Date Range Picker */}
          {showDateRange && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="font-semibold text-xs sm:text-sm">Select Date Range:</span>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="MMM D, YYYY"
                  allowClear={false}
                  size="small"
                  className="w-full sm:w-auto"
                />
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    const today = dayjs();
                    setDateRange([
                      today.startOf('month'),
                      today.endOf('month'),
                    ]);
                  }}
                  className="text-xs p-0"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-2">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '10px' }}>
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-center bg-gray-100 border">
                        <Skeleton.Input active size="small" style={{ width: 60, height: 20 }} />
                      </th>
                      {Array.from({ length: 15 }).map((_, idx) => (
                        <th key={idx} className="px-1 py-2 text-center bg-gray-100 border">
                          <Skeleton.Input active size="small" style={{ width: 40, height: 20 }} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="px-2 py-2 text-center border">
                          <Skeleton.Input active size="small" style={{ width: 50, height: 16 }} />
                        </td>
                        {Array.from({ length: 15 }).map((_, colIdx) => (
                          <td key={colIdx} className="px-1 py-2 text-center border" style={{ minHeight: '50px' }}>
                            <Skeleton.Input active size="small" style={{ width: 35, height: 40 }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table
                  columns={getColumns()}
                  dataSource={roomList}
                  pagination={false}
                  bordered
                  size="small"
                  rowKey="key"
                  scroll={{ 
                    x: 1200, // Show approximately 15 days (15 * 80px = 1200px) + room column
                    y: 550 // Height for approximately 10 rows (50px per row + header)
                  }}
                  className="calendar-table"
                  style={{ fontSize: '10px' }}
                  components={{
                    body: {
                      cell: (props) => (
                        <td {...props} style={{ padding: '0 !important' }} />
                      ),
                    },
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Monthly Booking Summary */}
        {/* {!loading && <MonthlySummary />} */}

        {/* Legend and Instructions */}
       
      </div>

      {/* Booking History Modal */}
      <Modal
        title={
          <div>
            <div className="font-semibold text-base sm:text-lg">Booking History</div>
            <div className="text-xs sm:text-sm text-gray-500 font-normal">
              {selectedRoomKey && roomList.find(r => r.key === selectedRoomKey)?.flatNo} - {selectedDateStr && dayjs(selectedDateStr).format("MMM D, YYYY")}
            </div>
          </div>
        }
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedRoomKey(null);
          setSelectedDateStr(null);
          setBookingHistory([]);
        }}
        footer={[
          <Button key="close" size="small" onClick={() => {
            setHistoryModalVisible(false);
            setSelectedRoomKey(null);
            setSelectedDateStr(null);
            setBookingHistory([]);
          }}>
            Close
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              if (selectedRoomKey && selectedDateStr) {
                handleEditClick(selectedRoomKey, selectedDateStr, null);
              }
            }}
          >
            <span className="hidden sm:inline">Add New Booking</span>
            <span className="sm:hidden">Add</span>
          </Button>
        ]}
        width="90%"
        style={{ maxWidth: '800px' }}
      >
        <div className="mt-2 sm:mt-4">
          {bookingHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {bookingHistory.map((booking) => (
                <div
                  key={booking._id}
                  className="border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base text-gray-900">{booking.bookingNo}</div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                        <UserOutlined className="mr-1" />
                        {booking.fullName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                        <PhoneOutlined className="mr-1" />
                        {booking.phone}
                      </div>
                    </div>
                    <Tag color={booking.statusID === 1 ? "green" : "red"} className="text-xs">
                      {booking.statusID === 1 ? "Active" : "Cancelled"}
                    </Tag>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>{" "}
                      <span className="font-medium">
                        {booking.checkInDate ? dayjs(booking.checkInDate).format("MMM D, YYYY") : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>{" "}
                      <span className="font-medium">
                        {booking.checkOutDate ? dayjs(booking.checkOutDate).format("MMM D, YYYY") : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Bill:</span>{" "}
                      <span className="font-medium">৳{booking.totalBill ? booking.totalBill.toLocaleString() : "0"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Advance:</span>{" "}
                      <span className="font-medium text-green-600">
                        ৳{booking.advancePayment ? booking.advancePayment.toLocaleString() : "0"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex justify-end">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setHistoryModalVisible(false);
                        handleEditClick(selectedRoomKey, selectedDateStr, booking, null);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-base sm:text-lg mb-2">No booking history found</div>
              <div className="text-xs sm:text-sm">This room is available for this date</div>
            </div>
          )}
        </div>
      </Modal>

      {/* Booking Create/Edit Modal */}
      <Modal
        title={isEditingBooking ? "Edit Booking" : "Create New Booking"}
        open={bookingModalVisible}
        onCancel={() => {
          setBookingModalVisible(false);
          setIsEditingBooking(false);
          setSelectedBookingForEdit(null);
          formik.resetForm();
        }}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <Form onFinish={formik.handleSubmit} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Full Name" required>
                <Input
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  name="fullName"
                  placeholder="Enter full name"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Phone" required>
                <Input
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  name="phone"
                  placeholder="Enter phone"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Email">
                <Input
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Check In Date" required>
                <DatePicker
                  value={formik.values.checkInDate}
                  onChange={(date) => {
                    formik.setFieldValue("checkInDate", date);
                    calculateNights(date, formik.values.checkOutDate);
                  }}
                  className="w-full"
                  style={{ width: "100%", height: "40px" }}
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Check Out Date" required>
                <DatePicker
                  value={formik.values.checkOutDate}
                  onChange={(date) => {
                    formik.setFieldValue("checkOutDate", date);
                    calculateNights(formik.values.checkInDate, date);
                  }}
                  className="w-full"
                  style={{ width: "100%", height: "40px" }}
                  disabledDate={(current) => current && current <= formik.values.checkInDate}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Nights">
                <Input
                  value={formik.values.nights}
                  readOnly
                  className="bg-gray-50"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Room Price (per night)" required>
                <Input
                  type="number"
                  value={formik.values.roomPrice}
                  onChange={(e) => {
                    formik.setFieldValue("roomPrice", e.target.value);
                    calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                  }}
                  name="roomPrice"
                  placeholder="Price per night"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Total Bill" required>
                <Input
                  value={formik.values.totalBill}
                  readOnly
                  className="bg-gray-50"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Advance Payment" required>
                <Input
                  type="number"
                  value={formik.values.advancePayment}
                  onChange={(e) => {
                    const advance = Number(e.target.value) || 0;
                    formik.setFieldValue("advancePayment", advance);
                    const totalBill = Number(formik.values.totalBill) || 0;
                    formik.setFieldValue("duePayment", Math.max(0, totalBill - advance));
                  }}
                  name="advancePayment"
                  placeholder="Enter advance"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Due Payment">
                <Input
                  value={formik.values.duePayment}
                  readOnly
                  className="bg-gray-50"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Payment Method" required>
                <Select
                  value={formik.values.paymentMethod}
                  onChange={(value) => formik.setFieldValue("paymentMethod", value)}
                  placeholder="Select method"
                  style={{ height: "40px" }}
                >
                  <Select.Option value="BKASH">BKASH</Select.Option>
                  <Select.Option value="NAGAD">NAGAD</Select.Option>
                  <Select.Option value="BANK">BANK</Select.Option>
                  <Select.Option value="CASH">CASH</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Transaction ID" required>
                <Input
                  value={formik.values.transactionId}
                  onChange={formik.handleChange}
                  name="transactionId"
                  placeholder="Enter transaction ID"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Adults">
                <Input
                  type="number"
                  min={1}
                  value={formik.values.adults}
                  onChange={formik.handleChange}
                  name="adults"
                  placeholder="Adults"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Children">
                <Input
                  type="number"
                  min={0}
                  value={formik.values.children}
                  onChange={formik.handleChange}
                  name="children"
                  placeholder="Children"
                  style={{ height: "40px" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Kitchen Service">
                <Switch
                  checked={formik.values.isKitchen}
                  onChange={(checked) => {
                    formik.setFieldValue("isKitchen", checked);
                    if (!checked) {
                      formik.setFieldValue("kitchenTotalBill", 0);
                      calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                    }
                  }}
                />
              </Form.Item>
              {formik.values.isKitchen && (
                <Form.Item label="Kitchen Bill">
                  <Input
                    type="number"
                    min={0}
                    value={formik.values.kitchenTotalBill || ""}
                    onChange={(e) => {
                      formik.setFieldValue("kitchenTotalBill", e.target.value);
                      calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                    }}
                    placeholder="Enter kitchen bill"
                    style={{ height: "40px" }}
                  />
                </Form.Item>
              )}
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Extra Bed">
                <Switch
                  checked={formik.values.extraBed}
                  onChange={(checked) => {
                    formik.setFieldValue("extraBed", checked);
                    if (!checked) {
                      formik.setFieldValue("extraBedTotalBill", 0);
                      calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                    }
                  }}
                />
              </Form.Item>
              {formik.values.extraBed && (
                <Form.Item label="Extra Bed Bill">
                  <Input
                    type="number"
                    min={0}
                    value={formik.values.extraBedTotalBill || ""}
                    onChange={(e) => {
                      formik.setFieldValue("extraBedTotalBill", e.target.value);
                      calculateNights(formik.values.checkInDate, formik.values.checkOutDate);
                    }}
                    placeholder="Enter extra bed bill"
                    style={{ height: "40px" }}
                  />
                </Form.Item>
              )}
            </Col>
            <Col xs={24}>
              <Form.Item label="Note">
                <Input.TextArea
                  value={formik.values.note}
                  onChange={formik.handleChange}
                  name="note"
                  placeholder="Enter any additional notes..."
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button
              onClick={() => {
                setBookingModalVisible(false);
                setIsEditingBooking(false);
                setSelectedBookingForEdit(null);
                formik.resetForm();
              }}
              style={{ height: "40px", padding: "0 24px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              style={{ height: "40px", padding: "0 32px" }}
            >
              {isEditingBooking ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        .calendar-table .ant-table-thead > tr > th {
          padding: 4px 2px !important;
          text-align: center;
          background: #fafafa;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .calendar-table .ant-table-tbody > tr > td {
          padding: 0 !important;
          vertical-align: top;
        }
        
        .calendar-table .ant-table-cell {
          border-right: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .calendar-table .ant-table-row:hover td {
          background: #fafafa !important;
        }
        
        .calendar-table .ant-table-thead > tr > th:first-child {
          z-index: 11;
        }
        
        .calendar-table .ant-table-tbody > tr > td:first-child {
          position: sticky;
          left: 0;
          z-index: 5;
          background: white;
        }
        
        .calendar-table .ant-table-tbody > tr:hover > td:first-child {
          background: #fafafa !important;
        }
        
        .calendar-table .ant-table-body {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        
        @media (max-width: 640px) {
          .calendar-table .ant-table-thead > tr > th {
            padding: 2px 1px !important;
            font-size: 9px !important;
          }
          
          .calendar-table .ant-table-tbody > tr > td {
            font-size: 8px !important;
          }
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HotelCalendar;