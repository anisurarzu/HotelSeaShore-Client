"use client";

import { useState, useEffect, useRef } from "react";
import {
  Button,
  Modal,
  message,
  Popconfirm,
  Spin,
  Form,
  Input,
  DatePicker,
  Tooltip,
  Select,
  Pagination,
  Alert,
  Switch,
  Card,
  Row,
  Col,
  Space,
  Skeleton,
} from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import moment from "moment";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined, ReloadOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import NoPermissionBanner from "./Permission/NoPermissionBanner";

const BookingInfo = ({ hotelID }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userInfo2 = JSON.parse(localStorage.getItem("userInfo"));
  const userHotelID = hotelID;
  const permission = userInfo2?.permission?.permissions;
  const bookingPermissions =
    permission?.find((perm) => perm.pageName === "Booking") || {};

  const [visible, setVisible] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [hotelInfo, setHotelInfo] = useState([]);
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings for conflict checking
  const [tableLoading, setTableLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [prevData, setPrevData] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [currentBooking, setCurrentBooking] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [checkInDate, setCheckInDate] = useState(null);
  const [isHotelFromReference, setIsHotelFromReference] = useState(false);

  // Ref to track if we've already handled query params (prevent duplicate modal opens)
  const hasHandledQueryParams = useRef(false);

  // Fetch hotels list
  const fetchHotelInfo = async () => {
    try {
      // No loading for hotel fetch - happens in background
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = Number(hotelID);

      // Fetch hotels using API
      const response = await coreAxios.get("/hotels");

      if (response.status === 200) {
        const responseData = response.data;
        let hotelsData = [];
        
        // Extract hotels array from response
        // Expected structure: { hotels: [...], pagination: {...} }
        if (responseData?.hotels && Array.isArray(responseData.hotels)) {
          hotelsData = responseData.hotels;
        } else if (responseData?.success && responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          // Alternative: { success: true, data: { hotels: [...], pagination: {...} } }
          hotelsData = responseData.data.hotels;
        } else if (responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          // Alternative: { data: { hotels: [...], pagination: {...} } }
          hotelsData = responseData.data.hotels;
        } else if (Array.isArray(responseData?.data)) {
          // Alternative: { data: [...] }
          hotelsData = responseData.data;
        } else if (Array.isArray(responseData)) {
          // Direct array response
          hotelsData = responseData;
        }

        // Ensure it's an array
        if (!Array.isArray(hotelsData)) {
          hotelsData = [];
        }

        // Store hotels in state (without pagination)
        // Note: We show all hotels in the dropdown for booking creation
        setHotelInfo(hotelsData);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch hotels");
      setHotelInfo([]);
    }
  };

  // Extract categories from hotel data
  const extractHotelCategories = (hotel) => {
    if (!hotel) {
      setRoomCategories([]);
      setRoomNumbers([]);
      return;
    }

    // Extract roomCategories from hotel data
    const categories = hotel.roomCategories || [];
    setRoomCategories(Array.isArray(categories) ? categories : []);
    
    // Reset room numbers when hotel changes
    setRoomNumbers([]);
    formik.setFieldValue("roomCategoryID", "");
    formik.setFieldValue("roomCategoryName", "");
    formik.setFieldValue("roomNumberID", "");
    formik.setFieldValue("roomNumberName", "");
  };

  // Function to check if a room is available for given dates
  const isRoomAvailable = (roomId, categoryId, hotelId, checkIn, checkOut, excludeBookingId = null) => {
    if (!checkIn || !checkOut) return true; // If dates not selected, show all rooms

    const checkInDate = dayjs(checkIn);
    const checkOutDate = dayjs(checkOut);

    // Check against all existing bookings
    const conflictingBooking = allBookings.find((booking) => {
      // Skip if this is the booking being edited
      if (excludeBookingId && booking._id === excludeBookingId) return false;
      
      // Skip cancelled bookings
      if (booking.statusID === 255) return false;

      // Check if same hotel, category, and room
      if (
        booking.hotelID !== hotelId ||
        booking.roomCategoryID !== categoryId ||
        booking.roomNumberID !== roomId
      ) {
        return false;
      }

      // Check for date overlap: existing.checkInDate < newCheckOut AND newCheckIn < existing.checkOutDate
      const existingCheckIn = dayjs(booking.checkInDate);
      const existingCheckOut = dayjs(booking.checkOutDate);

      return existingCheckIn.isBefore(checkOutDate, "day") && checkInDate.isBefore(existingCheckOut, "day");
    });

    return !conflictingBooking;
  };

  // Function to extract rooms from a specific category
  const extractRoomNumbers = (categoryId) => {
    if (!categoryId || !selectedHotelId) {
      setRoomNumbers([]);
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      return;
    }

    // Find the selected hotel
    const selectedHotel = hotelInfo.find(hotel => hotel.hotelID === selectedHotelId);
    if (!selectedHotel) {
      setRoomNumbers([]);
      return;
    }

    // Find the selected category
    const selectedCategory = selectedHotel.roomCategories?.find(
      category => category._id === categoryId
    );

    if (!selectedCategory || !selectedCategory.roomNumbers) {
      setRoomNumbers([]);
      return;
    }

    let rooms = selectedCategory.roomNumbers || [];

    // Filter available rooms based on check-in/check-out dates and existing bookings
    if (formik.values.checkInDate && formik.values.checkOutDate) {
      const excludeBookingId = isEditing ? editingKey : null;
      
      rooms = rooms.filter((roomNumber) => {
        return isRoomAvailable(
          roomNumber._id,
          categoryId,
          selectedHotelId,
          formik.values.checkInDate,
          formik.values.checkOutDate,
          excludeBookingId
        );
      });
    }

    setRoomNumbers(Array.isArray(rooms) ? rooms : []);
    
    // Show message if no rooms available due to date conflicts
    if (formik.values.checkInDate && formik.values.checkOutDate && rooms.length === 0 && selectedCategory?.roomNumbers?.length > 0) {
      message.warning("No rooms available for the selected dates. Please choose different dates.", 4);
    }
  };


  // Retrieve the userInfo from localStorage
  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  // Function to check for booking conflicts before submission
  const checkBookingConflict = async (values, excludeBookingId = null) => {
    try {
      const checkInDate = dayjs(values.checkInDate).format("YYYY-MM-DD");
      const checkOutDate = dayjs(values.checkOutDate).format("YYYY-MM-DD");

      // Check against existing bookings
      const conflictingBooking = allBookings.find((booking) => {
        // Skip if this is the booking being edited
        if (excludeBookingId && booking._id === excludeBookingId) return false;
        
        // Skip cancelled bookings
        if (booking.statusID === 255) return false;

        // Check if same hotel, category, and room
        if (
          booking.hotelID !== values.hotelID ||
          booking.roomCategoryID !== values.roomCategoryID ||
          booking.roomNumberID !== values.roomNumberID
        ) {
          return false;
        }

        // Check for date overlap
        const existingCheckIn = dayjs(booking.checkInDate);
        const existingCheckOut = dayjs(booking.checkOutDate);
        const newCheckIn = dayjs(checkInDate);
        const newCheckOut = dayjs(checkOutDate);

        return existingCheckIn.isBefore(newCheckOut, "day") && newCheckIn.isBefore(existingCheckOut, "day");
      });

      return conflictingBooking;
    } catch (error) {
      console.error("Error checking booking conflict:", error);
      return null;
    }
  };

  const updateRoomBookingStatus = async (values) => {
    setSubmitLoading(true);

    try {
      // Validate dates
      if (!values.checkInDate || !values.checkOutDate) {
        message.error("Please select both check-in and check-out dates");
        setSubmitLoading(false);
        return;
      }

      // Calculate nights accurately
      const checkIn = dayjs(values.checkInDate).startOf("day");
      const checkOut = dayjs(values.checkOutDate).startOf("day");
      const nights = checkOut.diff(checkIn, "day");

      if (nights <= 0) {
        message.error("Check-out date must be after check-in date");
        setSubmitLoading(false);
        return;
      }

      // Check for booking conflicts before submission
      const excludeBookingId = isEditing ? editingKey : null;
      const conflictingBooking = await checkBookingConflict(values, excludeBookingId);

      if (conflictingBooking) {
        const conflictMsg = `Room is already booked! Existing Booking: ${conflictingBooking.bookingNo}, Guest: ${conflictingBooking.fullName}, Dates: ${dayjs(conflictingBooking.checkInDate).format("D MMM YYYY")} - ${dayjs(conflictingBooking.checkOutDate).format("D MMM YYYY")}`;
        message.error(conflictMsg, 6);
        setSubmitLoading(false);
        return;
      }

      // Get user info
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const bookedBy = userInfo?.username || userInfo?.loginID || "admin";
      const bookedByID = userInfo?.loginID || userInfo?.id || userInfo?._id || "";

      // Prepare booking data for API
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
        breakfastTotalBill: values.isBreakfast ? Number(values.breakfastTotalBill) : 0,
        totalBill: Number(values.totalBill) || 0,
        advancePayment: Number(values.advancePayment) || 0,
        duePayment: Number(values.duePayment) || 0,
        paymentMethod: values.paymentMethod || "",
        transactionId: values.transactionId || "",
        note: values.note || undefined,
        reference: values.reference || undefined,
        bookedBy: bookedBy,
        bookedByID: bookedByID,
        updatedByID: isEditing ? (userInfo?.loginID || userInfo?.id || "") : "Not Updated",
      };

      // Use the correct API endpoints based on backend routes
      let response;
      if (isEditing && editingKey) {
        // Update existing booking: PUT /api/bookings/booking/:id
        response = await coreAxios.put(`/booking/${editingKey}`, bookingData);
      } else {
        // Create new booking: POST /api/bookings/booking
        response = await coreAxios.post("/booking", bookingData);
      }

      if (response.status === 200) {
        const successMsg = response.data?.message || (isEditing ? "Booking updated successfully!" : "Booking created successfully!");
        message.success(successMsg, 3);
        
        // Clean up after successful save
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        setPrevData(null);
        setIsHotelFromReference(false);
        formik.resetForm();
        
        // Clear URL query params if they exist
        if (searchParams.get("room") || searchParams.get("date")) {
          router.replace("/dashboard?menu=6");
        }
        
        // Refresh bookings list to update availability
        await fetchBookings();
      } else {
        message.error(response.data?.message || response.data?.error || "Failed to save booking.");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      
      // Handle conflict error from backend
      if (error.response?.status === 409) {
        const errorData = error.response?.data;
        const existingBooking = errorData?.details?.existingBooking;
        
        let conflictMsg = errorData?.error || "Room is already booked!";
        if (existingBooking) {
          conflictMsg += ` Booking No: ${existingBooking.bookingNo}, Guest: ${existingBooking.guestName}, Dates: ${dayjs(existingBooking.checkInDate).format("D MMM YYYY")} - ${dayjs(existingBooking.checkOutDate).format("D MMM YYYY")}`;
        }
        message.error(conflictMsg, 6);
      } else {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "An error occurred while saving the booking.";
        message.error(errorMessage);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: "",
      nidPassport: "",
      address: "",
      phone: "",
      email: "",
      hotelID: 0,
      hotelName: "",
      isBreakfast: false,
      breakfastTotalBill: 0,
      roomCategoryID: "",
      roomCategoryName: "",
      roomNumberID: "",
      roomNumberName: "",
      roomPrice: 0,
      checkInDate: dayjs(),
      checkOutDate: dayjs().add(1, "day"),
      nights: 1, // Default 1 night for initial dates (today to tomorrow)
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      paymentMethod: "",
      transactionId: "",
      note: "",
      bookedBy: userInfo ? userInfo?.username : "",
      bookedByID: userInfo ? userInfo?.loginID : "",
      updatedByID: "Not Updated",
      reference: "",
      adults: 1,
      children: 0,
    },

    onSubmit: async (values, { resetForm }) => {
      try {
        await updateRoomBookingStatus(values);
        resetForm();
      } catch (error) {
        message.error("Failed to add/update booking.");
      }
    },
  });

  const fetchBookings = async () => {
    setTableLoading(true);
    try {
      // Retrieve user information from local storage
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = hotelID;

      // Fetch the bookings data using the new API
      const response = await coreAxios.get("/bookings");

      if (response.status === 200) {
        // API returns direct array of bookings
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        // Filter bookings if the role is "hoteladmin"
        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(userHotelID)
          );
        }

        // Sort by createdAt descending (most recent first)
        bookingsData = bookingsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.createTime || 0);
          const dateB = new Date(b.createdAt || b.createTime || 0);
          return dateB - dateA;
        });

        setBookings(bookingsData);
        // Show all bookings without filtering
        setFilteredBookings(bookingsData);
        // Store all bookings for conflict checking
        setAllBookings(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(error.response?.data?.message || "Failed to fetch bookings.");
      setBookings([]);
      setFilteredBookings([]);
      setAllBookings([]);
    } finally {
      setTableLoading(false);
    }
  };

  // Function to pre-fill form from query params
  const prefillFormFromQueryParams = async () => {
    const roomNumberId = searchParams.get("room");
    const dateStr = searchParams.get("date");
    const hotelIdParam = searchParams.get("hotel");

    if (roomNumberId && dateStr && hotelInfo.length > 0) {
      try {
        // Find the hotel
        const hotelId = hotelIdParam ? Number(hotelIdParam) : (selectedHotelId || Number(hotelID));
        const hotel = hotelInfo.find(h => h.hotelID === hotelId);
        
        if (!hotel) {
          message.warning("Hotel not found. Please select a hotel first.");
          return;
        }

        // Find the room in hotel's categories
        let foundRoom = null;
        let foundCategory = null;

        if (hotel.roomCategories && Array.isArray(hotel.roomCategories)) {
          for (const category of hotel.roomCategories) {
            if (category.roomNumbers && Array.isArray(category.roomNumbers)) {
              foundRoom = category.roomNumbers.find(room => room._id === roomNumberId);
              if (foundRoom) {
                foundCategory = category;
                break;
              }
            }
          }
        }

        if (!foundRoom || !foundCategory) {
          message.warning("Room not found. Please check the room selection.");
          return;
        }

        // Set selected hotel
        setSelectedHotelId(hotel.hotelID);
        extractHotelCategories(hotel);

        // Wait a bit for categories to load
        setTimeout(() => {
          // Set form values
          const checkInDate = dayjs(dateStr);
          const checkOutDate = checkInDate.add(1, "day");
          const nights = 1;

          formik.setValues({
            ...formik.values,
            hotelID: hotel.hotelID,
            hotelName: hotel.hotelName || hotel.name,
            roomCategoryID: foundCategory._id,
            roomCategoryName: foundCategory.name,
            roomNumberID: foundRoom._id,
            roomNumberName: foundRoom.name || foundRoom.roomId,
            roomPrice: foundRoom.price || foundCategory.basePrice || 0,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            nights: nights,
            adults: foundRoom.capacity?.adults || formik.values.adults || 1,
            children: foundRoom.capacity?.children !== undefined ? (foundRoom.capacity.children || 0) : (formik.values.children || 0),
            totalBill: (nights * (foundRoom.price || foundCategory.basePrice || 0)),
            advancePayment: 0,
            duePayment: (nights * (foundRoom.price || foundCategory.basePrice || 0)),
          });

          // Extract room numbers for the category
          extractRoomNumbers(foundCategory._id);

          // Open the modal
          setVisible(true);
          setIsEditing(false);
          setEditingKey(null);
          setPrevData(null);
        }, 500);
      } catch (error) {
        console.error("Error pre-filling form:", error);
        message.error("Failed to pre-fill booking form.");
      }
    }
  };

  useEffect(() => {
    // Fetch hotels and bookings on component mount
    fetchHotelInfo();
    fetchBookings();
  }, []);

  // Watch for query params changes and pre-fill form (only when coming from Calendar)
  useEffect(() => {
    const roomNumberId = searchParams.get("room");
    const dateStr = searchParams.get("date");
    
    // Only auto-open modal if:
    // 1. There are query params (coming from Calendar)
    // 2. Hotel info is loaded
    // 3. Modal is not already visible
    // 4. We haven't already handled these query params
    if (
      hotelInfo.length > 0 && 
      roomNumberId && 
      dateStr && 
      !visible && 
      !hasHandledQueryParams.current
    ) {
      hasHandledQueryParams.current = true;
      prefillFormFromQueryParams();
    }
    
    // Reset the ref when query params are cleared (user navigates away or closes modal)
    if (!roomNumberId && !dateStr) {
      hasHandledQueryParams.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelInfo.length, searchParams]);

  // Set default hotel (hotelID 1) when modal opens for new booking
  useEffect(() => {
    // Only set default hotel if:
    // 1. Modal is visible
    // 2. Not in editing mode
    // 3. Hotels are loaded
    // 4. No hotel is currently selected (to avoid overriding pre-filled data)
    // 5. No query params (to avoid interfering with calendar pre-fill)
    const roomNumberId = searchParams.get("room");
    const dateStr = searchParams.get("date");
    
    if (
      visible &&
      !isEditing &&
      hotelInfo.length > 0 &&
      (!formik.values.hotelID || formik.values.hotelID === 0) &&
      !formik.values.hotelName &&
      !roomNumberId &&
      !dateStr
    ) {
      // Always use first hotel from list (fixed default)
      const defaultHotel = hotelInfo[0];
      if (defaultHotel) {
        handleHotelInfo(defaultHotel.hotelName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isEditing, hotelInfo.length]);

  const handleHotelInfo = (value) => {
    // Find hotel by hotelName
    const selectedHotel = hotelInfo.find((hotel) => hotel && hotel.hotelName === value);

    if (selectedHotel) {
      // Update formik values
      formik.setFieldValue("hotelName", value);
      formik.setFieldValue("hotelID", selectedHotel.hotelID);
      
      // Reset category and room selections
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      
      // Extract categories from selected hotel
      extractHotelCategories(selectedHotel);
      
      // Update selectedHotelId for internal state
      setSelectedHotelId(selectedHotel.hotelID);
    }
  };

  const handleRoomCategoryChange = (value) => {
    const selectedCategory = roomCategories.find(
      (category) => category._id === value
    );

    if (selectedCategory) {
      // Update formik values
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomCategoryID", value);
      formik.setFieldValue("roomCategoryName", selectedCategory.name);
      
      // Set default price from category, but room price will override if room has specific price
      formik.setFieldValue("roomPrice", selectedCategory.basePrice || 0);
      
      // Extract rooms for the selected category (will filter by dates if available)
      extractRoomNumbers(value);
      
      // Recalculate total bill
      const nights = Number(formik.values.nights) || 0;
      const roomPrice = selectedCategory.basePrice || 0;
      const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
      const totalBill = (nights * roomPrice) + breakfastTotalBill;
      const advancePayment = Number(formik.values.advancePayment) || 0;
      const duePayment = Math.max(0, totalBill - advancePayment);
      formik.setFieldValue("totalBill", totalBill);
      formik.setFieldValue("duePayment", duePayment);
    }
  };

  const handleEdit = async (record) => {
    if (!record) return;
    
    setEditingKey(record._id);
    setPrevData(record);
    setIsEditing(true);
    
    // Set selected hotel and extract categories
    if (record.hotelID) {
      setSelectedHotelId(record.hotelID);
      const selectedHotel = hotelInfo.find(h => h.hotelID === record.hotelID);
      if (selectedHotel) {
        extractHotelCategories(selectedHotel);
      }
    }
    
    // Extract room numbers after categories are loaded
    if (record.roomCategoryID) {
      setTimeout(() => {
        extractRoomNumbers(record.roomCategoryID);
      }, 300);
    }

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const checkInDate = record.checkInDate ? dayjs(record.checkInDate) : dayjs();
    const checkOutDate = record.checkOutDate ? dayjs(record.checkOutDate) : dayjs().add(1, "day");

    // Recalculate nights to ensure accuracy
    const calculatedNights = checkOutDate.diff(checkInDate, "day");

    formik.setValues({
      fullName: record.fullName || "",
      nidPassport: record.nidPassport || "",
      address: record.address || "",
      phone: record.phone || "",
      email: record.email || "",
      hotelID: record.hotelID || 0,
      hotelName: record.hotelName || "",
      roomCategoryID: record.roomCategoryID || "",
      roomCategoryName: record.roomCategoryName || "",
      roomNumberID: record.roomNumberID || "",
      roomNumberName: record.roomNumberName || "",
      roomPrice: record.roomPrice || 0,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights: calculatedNights > 0 ? calculatedNights : (record.nights || 0),
      adults: record.adults || 0,
      children: record.children || 0,
      isBreakfast: record.isBreakfast ?? (record.isKitchen || record.extraBed) ?? false,
      breakfastTotalBill: record.breakfastTotalBill ?? (Number(record.kitchenTotalBill) || 0) + (Number(record.extraBedTotalBill) || 0),
      totalBill: record.totalBill || 0,
      advancePayment: record.advancePayment || 0,
      duePayment: record.duePayment || 0,
      paymentMethod: record.paymentMethod || "",
      transactionId: record.transactionId || "",
      note: record.note || "",
      bookedBy: record.bookedBy || userInfo?.username || "",
      bookedByID: record.bookedByID || userInfo?.loginID || "",
      updatedByID: userInfo?.loginID || "",
      reference: record.reference || "",
    });
    
    // Recalculate total bill based on current values
    setTimeout(() => {
      calculateNights(checkInDate, checkOutDate);
    }, 100);
    
    setVisible(true);
  };

  // Function to generate all dates between two given dates
  function getAllDatesBetween(startDate, endDate) {
    const dates = [];
    let currentDate = dayjs(startDate);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    // Check if start date is not the first of the month, then remove last date
    if (dayjs(startDate).date() !== 1) {
      dates.pop(); // Remove the last date
    }

    return dates;
  }

  const handleDelete2 = async (key) => {
    setSubmitLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const canceledBy = userInfo?.username || userInfo?.loginID || "admin";

      // Soft delete: PUT /api/bookings/booking/soft/:id
      const res = await coreAxios.put(`/booking/soft/${key}`, {
        canceledBy: canceledBy,
        reason: cancellationReason,
      });

      if (res.status === 200) {
        message.success(res.data?.message || "Booking cancelled successfully.");
        setIsModalVisible(false);
        setCancellationReason("");
        setCurrentBooking(null);
        fetchBookings(); // Fetch the updated list of bookings
      } else {
        message.error(res.data?.message || res.data?.error || "Failed to cancel booking.");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      message.error(error.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Function to handle advance payment and calculate due payment
  const handleAdvancePaymentChange = (e) => {
    const advancePayment = parseFloat(e.target.value) || 0;
    const totalBill = parseFloat(formik.values.totalBill) || 0;

    // Calculate due payment
    const duePayment = totalBill - advancePayment;

    // Set the field values in formik
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0); // Ensure due payment is non-negative
  };

  // Apply all filters (search and date filter)
  const applyFilters = () => {
    let filtered = Array.isArray(bookings) ? bookings : [];
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((booking) => {
        const bookingNo = (booking.bookingNo || "").toLowerCase();
        const fullName = (booking.fullName || "").toLowerCase();
        const phone = (booking.phone || "").toLowerCase();
        const email = (booking.email || "").toLowerCase();
        const roomCategoryName = (booking.roomCategoryName || "").toLowerCase();
        const roomNumberName = (booking.roomNumberName || "").toLowerCase();
        const hotelName = (booking.hotelName || "").toLowerCase();
        const transactionId = (booking.transactionId || "").toLowerCase();
        
        return (
          bookingNo.includes(searchLower) ||
          fullName.includes(searchLower) ||
          phone.includes(searchLower) ||
          email.includes(searchLower) ||
          roomCategoryName.includes(searchLower) ||
          roomNumberName.includes(searchLower) ||
          hotelName.includes(searchLower) ||
          transactionId.includes(searchLower)
        );
      });
    }
    
    // Apply check-in date filter (single date)
    if (checkInDate) {
      const selectedDate = dayjs(checkInDate).startOf("day");
      
      filtered = filtered.filter((booking) => {
        if (!booking.checkInDate) return false;
        const bookingCheckIn = dayjs(booking.checkInDate).startOf("day");
        return bookingCheckIn.isSame(selectedDate, "day");
      });
    }
    
    setFilteredBookings(filtered);
    setPagination({ ...pagination, current: 1 });
  };
  
  // Apply filters when search term or date changes
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, checkInDate, bookings]);

  // Paginate the filtered data
  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const fetchBookingDetails = async (bookingNo, guestInfoOnly = false) => {
    try {
      const response = await coreAxios.get(`/bookings/bookingNo/${bookingNo}`);
      if (response?.status === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const bookingDetails = response.data[0];
        if (!guestInfoOnly && bookingDetails.hotelID) {
          setSelectedHotelId(bookingDetails.hotelID);
          const selectedHotel = hotelInfo.find(h => h.hotelID === bookingDetails.hotelID);
          if (selectedHotel) {
            extractHotelCategories(selectedHotel);
          }
        }
        return bookingDetails;
      }
      return null;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      message.error("Failed to fetch booking details. Please check the booking number.");
      return null;
    }
  };

  const handleBlur = async (e) => {
    const { value } = e.target;
    if (value && value.trim()) {
      const bookingDetails = await fetchBookingDetails(value, true);
      if (bookingDetails) {
        // Only fill Guest Information. All other fields stay initially blank.
        formik.setValues({
          ...formik.values,
          fullName: bookingDetails.fullName || "",
          nidPassport: bookingDetails.nidPassport || "",
          address: bookingDetails.address || "",
          phone: bookingDetails.phone || "",
          email: bookingDetails.email || "",
        });
        message.success("Guest information loaded.");
      }
    }
  };

  // night calculations
  const handleCheckInChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      setRoomNumbers([]);
    }
    formik.setFieldValue("checkInDate", date);
    
    // Recalculate nights
    calculateNights(date, formik.values.checkOutDate);
    
    // Re-filter rooms if category is already selected
    if (formik.values.roomCategoryID && formik.values.hotelID) {
      setTimeout(() => {
        extractRoomNumbers(formik.values.roomCategoryID);
      }, 100);
    }
  };

  const handleCheckOutChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      setRoomNumbers([]);
    }
    formik.setFieldValue("checkOutDate", date);
    
    // Recalculate nights
    calculateNights(formik.values.checkInDate, date);
    
    // Re-filter rooms if category is already selected
    if (formik.values.roomCategoryID && formik.values.hotelID) {
      setTimeout(() => {
        extractRoomNumbers(formik.values.roomCategoryID);
      }, 100);
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      // Calculate nights accurately using start of day
      const checkInDate = dayjs(checkIn).startOf("day");
      const checkOutDate = dayjs(checkOut).startOf("day");
      const nights = checkOutDate.diff(checkInDate, "day");
      
      const calculatedNights = nights > 0 ? nights : 0;
      formik.setFieldValue("nights", calculatedNights);
      
      // Recalculate total bill when nights change
      const roomPrice = Number(formik.values.roomPrice) || 0;
      const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
      const totalBill = (calculatedNights * roomPrice) + breakfastTotalBill;
      const advancePayment = Number(formik.values.advancePayment) || 0;
      const duePayment = Math.max(0, totalBill - advancePayment);
      
      formik.setFieldValue("totalBill", totalBill);
      formik.setFieldValue("duePayment", duePayment);
    } else {
      formik.setFieldValue("nights", 0);
      formik.setFieldValue("totalBill", 0);
      formik.setFieldValue("duePayment", 0);
    }
  };

  // booking cancel functionality
  const handleCancelReasonChange = (e) => {
    setCancellationReason(e.target.value);
  };

  const showModal = (booking) => {
    setCurrentBooking(booking); // Store the current booking object
    setIsModalVisible(true); // Show the modal
  };

  const handleOk = async () => {
    if (!cancellationReason.trim()) {
      message.error("Please provide a reason for cancellation.");
      return;
    }

    // Call soft delete directly (this updates statusID to 255)
    await handleDelete2(currentBooking?._id);
  };

  const handleCancel = () => {
    setIsModalVisible(false); // Close the modal without doing anything
  };

  const handleDelete = (booking) => {
    // Open the modal to confirm cancellation
    showModal(booking);
  };

  const handleViewDetails = (booking) => {
    setSelectedBookingDetails(booking);
    setDetailsModalVisible(true);
  };

  return (
    <div>
      {bookingPermissions.viewAccess ? (
        <>
          <div>
            <div className="space-y-4">
                {/* Header Section */}
                <div className="mb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bookings</h1>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
                      {/* Search and Date Filter Row */}
                      <div className="w-full sm:w-auto flex flex-row gap-2 flex-wrap sm:flex-nowrap">
                        <Input
                          placeholder="Search bookings..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          allowClear
                          className="flex-1 sm:flex-initial"
                          style={{ height: "40px", minWidth: "150px" }}
                          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                        />
                        <DatePicker
                          value={checkInDate}
                          onChange={(date) => setCheckInDate(date)}
                          format="MMM D, YYYY"
                          allowClear
                          placeholder="Check-in Date"
                          className="flex-1 sm:flex-initial"
                          style={{ height: "40px", minWidth: "130px", width: "130px" }}
                        />
                        {(searchTerm || checkInDate) && (
                          <Button
                            onClick={() => {
                              setSearchTerm("");
                              setCheckInDate(null);
                            }}
                            className="w-full sm:w-auto sm:flex-initial"
                            style={{ height: "40px" }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      {/* Action Buttons - Two per row on mobile */}
                      <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-2">
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            fetchBookings();
                            fetchHotelInfo();
                          }}
                          loading={tableLoading}
                          className="w-full sm:w-auto"
                          style={{ height: "40px" }}
                        >
                          Refresh
                        </Button>
                        {bookingPermissions?.insertAccess && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              formik.resetForm();
                              setVisible(true);
                              setIsEditing(false);
                              setEditingKey(null);
                              setPrevData(null);
                              setIsHotelFromReference(false);
                              // Clear category and room selections
                              setRoomCategories([]);
                              setRoomNumbers([]);
                              // Reset query params ref when manually opening modal
                              hasHandledQueryParams.current = false;
                              // Clear query params from URL if they exist
                              if (searchParams.get("room") || searchParams.get("date")) {
                                router.replace("/dashboard?menu=6");
                              }
                              // Fetch hotel info (default hotel will be set by useEffect)
                              fetchHotelInfo();
                            }}
                            className="w-full sm:w-auto"
                            style={{ height: "40px" }}
                          >
                            <span className="hidden sm:inline">Create Booking</span>
                          
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  {filteredBookings.length !== bookings.length && (
                    <div className="mt-2 text-sm text-gray-600">
                      Showing {filteredBookings.length} of {bookings.length} bookings
                    </div>
                  )}
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ fontSize: "11px", border: "1px solid #e5e7eb" }}>
                      {/* Table Header */}
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Booking No.
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Guest Name
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Phone
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Room Category
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Room Type
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Booking Date
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Check In
                          </th>
                          <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Check Out
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Nights
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Advance
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Total
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Status
                          </th>
                          <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-tight bg-gray-100 border border-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody>
                        {tableLoading ? (
                          // Skeleton Loading Rows - matches table structure exactly
                          Array.from({ length: 8 }).map((_, idx) => (
                            <tr key={`skeleton-${idx}`}>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 100, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 100, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 60, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                              </td>
                              <td className="px-2 py-1.5 border border-gray-300">
                                <Skeleton.Input active size="small" style={{ width: 80, height: 16 }} />
                              </td>
                              <td className="px-3 py-2.5 text-center border border-gray-300">
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  <Skeleton.Input active size="small" style={{ width: 40, height: 16 }} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right border border-gray-300">
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <Skeleton.Input active size="small" style={{ width: 70, height: 16 }} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right border border-gray-300">
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <Skeleton.Input active size="small" style={{ width: 70, height: 16 }} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center border border-gray-300">
                                <div style={{ display: "flex", justifyContent: "center" }}>
                                  <Skeleton.Button active size="small" style={{ width: 70, height: 24 }} />
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center border border-gray-300">
                                <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
                                  <Skeleton.Button active size="small" style={{ width: 50, height: 24 }} />
                                  <Skeleton.Button active size="small" style={{ width: 50, height: 24 }} />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          paginatedBookings?.map((booking, idx) => (
                          <tr
                            key={booking._id}
                            className={`hover:bg-gray-50 transition-colors ${
                              booking.statusID === 255 ? "bg-red-50" : ""
                            }`}
                          >
                            {/* Booking No with Link and Copy Feature */}
                            <td className="px-2 py-1.5 whitespace-nowrap border border-gray-300">
                              <span className="flex items-center gap-1.5">
                                <Link
                                  target="_blank"
                                  href={`/dashboard/${booking.bookingNo}`}
                                  passHref
                                  className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-xs"
                                >
                                  {booking.bookingNo}
                                </Link>
                                <Tooltip title="Click to copy">
                                  <CopyToClipboard
                                    text={booking.bookingNo}
                                    onCopy={() => message.success("Copied!")}
                                  >
                                    <CopyOutlined className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs" />
                                  </CopyToClipboard>
                                </Tooltip>
                              </span>
                            </td>
                            {/* Guest Name */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                              {booking.fullName}
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                              {booking.phone}
                            </td>
                            {/* Room Category */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 font-medium border border-gray-300">
                              {booking.roomCategoryName || "—"}
                            </td>
                            {/* Room Type */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                              {booking.roomNumberName || "—"}
                            </td>
                            {/* Booking Date */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                              {(booking.createdAt || booking.createTime || booking.createdDate) ? moment(booking.createdAt || booking.createTime || booking.createdDate).format("D MMM YY") : "—"}
                            </td>
                            {/* Check In */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                              {moment(booking.checkInDate).format("D MMM YY")}
                            </td>
                            {/* Check Out */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                              {moment(booking.checkOutDate).format("D MMM YY")}
                            </td>
                            {/* Nights */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 text-center border border-gray-300">
                              {booking.nights}
                            </td>
                            {/* Advance Payment */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 text-right border border-gray-300">
                              {booking.advancePayment}
                            </td>
                            {/* Total Bill */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs font-semibold text-green-700 text-right border border-gray-300">
                              {booking.totalBill}
                            </td>
                            {/* Booking Status */}
                            <td className="px-2 py-1.5 whitespace-nowrap text-center border border-gray-300">
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: booking.statusID === 255 ? "#fee2e2" : "#dcfce7",
                                  color: booking.statusID === 255 ? "#dc2626" : "#16a34a",
                                }}
                              >
                                {booking.statusID === 255 ? "Canceled" : "Confirmed"}
                              </span>
                            </td>
                            {/* Actions */}
                            <td className="px-2 py-1.5 whitespace-nowrap border border-gray-300">
                              <div className="flex gap-1.5 justify-center items-center">
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => handleViewDetails(booking)}
                                  style={{ fontSize: "11px", height: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}
                                >
                                  View
                                </Button>
                                {booking?.statusID === 1 && (
                                  <>
                                    {bookingPermissions?.editAccess && (
                                      <Button 
                                        onClick={() => handleEdit(booking)}
                                        size="small"
                                        style={{ fontSize: "11px", height: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                    {bookingPermissions?.deleteAccess && (
                                      <Popconfirm
                                        title="Are you sure to cancel this booking?"
                                        onConfirm={() => handleDelete(booking)}
                                        okText="Yes"
                                        cancelText="No"
                                      >
                                        <Button 
                                          type="link" 
                                          danger 
                                          size="small"
                                          style={{ fontSize: "11px", height: "24px", padding: "0 8px", display: "flex", alignItems: "center" }}
                                        >
                                          Cancel
                                        </Button>
                                      </Popconfirm>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {!tableLoading && filteredBookings.length > 0 && (
                    <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50">
                      <div className="text-xs text-gray-700">
                        Showing {paginatedBookings.length} of {filteredBookings.length} bookings
                      </div>
                      <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={filteredBookings.length}
                        onChange={(page, pageSize) =>
                          setPagination({ current: page, pageSize })
                        }
                        showSizeChanger
                        pageSizeOptions={['10', '20', '50', '100']}
                      />
                    </div>
                  )}
                </div>

                {/* Cancellation Modal */}
                <Modal
                  title="Cancel Booking"
                  open={isModalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  confirmLoading={submitLoading}
                  okText="Confirm Cancellation"
                  cancelText="Cancel"
                  destroyOnClose
                >
                  <div className="space-y-4">
                    {currentBooking && (
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold">Booking: {currentBooking.bookingNo}</p>
                        <p className="text-sm text-gray-600">
                          Guest: {currentBooking.fullName} | Room: {currentBooking.roomNumberName}
                        </p>
                      </div>
                    )}
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium mb-2">
                        Cancellation Reason <span className="text-red-500">*</span>
                      </label>
                      <Input.TextArea
                        id="reason"
                        value={cancellationReason}
                        onChange={handleCancelReasonChange}
                        placeholder="Enter cancellation reason"
                        rows={4}
                        autoFocus
                      />
                    </div>
                  </div>
                </Modal>

                {/* Booking Details Modal */}
                <Modal
                  title="Booking Details"
                  open={detailsModalVisible}
                  onCancel={() => {
                    setDetailsModalVisible(false);
                    setSelectedBookingDetails(null);
                  }}
                  footer={[
                    <Button key="close" onClick={() => {
                      setDetailsModalVisible(false);
                      setSelectedBookingDetails(null);
                    }}>
                      Close
                    </Button>
                  ]}
                  width={800}
                  destroyOnClose
                >
                  {selectedBookingDetails && (
                    <div className="space-y-4">
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Serial No.</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.serialNo}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Booking No.</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.bookingNo}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Booking Date</p>
                            <p className="font-semibold text-sm">
                              {moment(selectedBookingDetails.createTime).format("D MMM YYYY, h:mm A")}
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Hotel Name</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.hotelName}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Room Category</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.roomCategoryName}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Room Number</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.roomNumberName}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.email || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">NID/Passport</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.nidPassport || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={24}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Address</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.address || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Adults / Children</p>
                            <p className="font-semibold text-sm">
                              {selectedBookingDetails.adults} / {selectedBookingDetails.children}
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Room Price (per night)</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.roomPrice}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Breakfast</p>
                            <p className="font-semibold text-sm">
                              {(selectedBookingDetails.isBreakfast || selectedBookingDetails.isKitchen || selectedBookingDetails.extraBed) ? "Yes" : "No"}
                              {((selectedBookingDetails.isBreakfast || selectedBookingDetails.isKitchen || selectedBookingDetails.extraBed) && (selectedBookingDetails.breakfastTotalBill != null || selectedBookingDetails.kitchenTotalBill != null || selectedBookingDetails.extraBedTotalBill != null)) && ` (${Number(selectedBookingDetails.breakfastTotalBill) || (Number(selectedBookingDetails.kitchenTotalBill) || 0) + (Number(selectedBookingDetails.extraBedTotalBill) || 0)})`}
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.paymentMethod || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.transactionId || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Booked By</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.bookedBy || selectedBookingDetails.bookedByID || "N/A"}</p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Updated By</p>
                            <p className="font-semibold text-sm">
                              {selectedBookingDetails.updatedByID || "Not Updated"}
                              {selectedBookingDetails.updatedByID && selectedBookingDetails.updatedAt && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({dayjs(selectedBookingDetails.updatedAt).format("D MMM YYYY, h:mm A")})
                                </span>
                              )}
                            </p>
                          </div>
                        </Col>
                        {selectedBookingDetails.statusID === 255 && (
                          <>
                            <Col span={12}>
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-xs text-red-600 mb-1">Canceled By</p>
                                <p className="font-semibold text-sm text-red-700">
                                  {selectedBookingDetails.canceledBy || "N/A"}
                                </p>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-xs text-red-600 mb-1">Cancellation Reason</p>
                                <p className="font-semibold text-sm text-red-700">
                                  {selectedBookingDetails.reason || "N/A"}
                                </p>
                              </div>
                            </Col>
                          </>
                        )}
                        {selectedBookingDetails.note && (
                          <Col span={24}>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-xs text-gray-500 mb-1">Note</p>
                              <p className="font-semibold text-sm">{selectedBookingDetails.note}</p>
                            </div>
                          </Col>
                        )}
                        {selectedBookingDetails.reference && (
                          <Col span={24}>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-xs text-gray-500 mb-1">Reference Booking No.</p>
                              <p className="font-semibold text-sm">{selectedBookingDetails.reference}</p>
                            </div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}
                </Modal>

                {/* Create/Edit Booking Modal */}
                <Modal
                  title={isEditing ? "Edit Booking" : "Create New Booking"}
                  open={visible}
                  onCancel={() => {
                    setVisible(false);
                    setIsEditing(false);
                    setEditingKey(null);
                    setPrevData(null);
                    setIsHotelFromReference(false);
                    formik.resetForm();
                    // Reset query params ref when modal is closed
                    hasHandledQueryParams.current = false;
                    // Clear query params from URL if they exist
                    if (searchParams.get("room") || searchParams.get("date")) {
                      router.replace("/dashboard?menu=6");
                    }
                    // Reset to default hotel when closing modal
                    if (!isEditing) {
                      fetchHotelInfo();
                    }
                  }}
                  footer={null}
                  width={1200}
                  destroyOnClose
                >
                  <Form 
                    onFinish={formik.handleSubmit} 
                    layout="vertical" 
                    style={{ padding: "0" }}
                    className="booking-form"
                  >
                    <style dangerouslySetInnerHTML={{__html: `
                      .booking-form .ant-form-item {
                        margin-bottom: 12px !important;
                        display: flex !important;
                        flex-direction: column !important;
                      }
                      .booking-form .ant-form-item-label {
                        padding-bottom: 4px !important;
                        line-height: 1.5 !important;
                      }
                      .booking-form .ant-form-item-label > label {
                        font-size: 12px !important;
                        font-weight: 500 !important;
                        height: auto !important;
                        line-height: 1.5 !important;
                      }
                      .booking-form .ant-form-item-control {
                        flex: 1 !important;
                      }
                      .booking-form .ant-input,
                      .booking-form .ant-picker,
                      .booking-form .ant-select-selector,
                      .booking-form .ant-input-number {
                        height: 40px !important;
                        font-size: 14px !important;
                        padding: 8px 12px !important;
                        line-height: 1.5 !important;
                        display: flex !important;
                        align-items: center !important;
                      }
                      .booking-form .ant-picker-input {
                        height: 100% !important;
                      }
                      .booking-form .ant-picker-input > input {
                        height: 100% !important;
                        line-height: 1.5 !important;
                      }
                      .booking-form .ant-input-number {
                        width: 100% !important;
                      }
                      .booking-form .ant-input-number-input {
                        height: 38px !important;
                        font-size: 14px !important;
                        line-height: 1.5 !important;
                      }
                      .booking-form .ant-select {
                        height: 40px !important;
                      }
                      .booking-form .ant-select-selector {
                        display: flex !important;
                        align-items: center !important;
                      }
                      .booking-form .ant-row {
                        display: flex !important;
                        flex-wrap: wrap !important;
                        align-items: flex-start !important;
                      }
                      .booking-form .ant-col {
                        display: flex !important;
                        flex-direction: column !important;
                      }
                    `}} />
                    {/* Guest Information Section */}
                    <Card 
                      title={<span style={{ fontSize: "14px", fontWeight: 600 }}>Guest Information</span>}
                      size="small" 
                      className="mb-3"
                      style={{ border: "1px solid #e8e8e8", borderRadius: "6px" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Reference Booking No." style={{ marginBottom: "12px" }}>
                            <Input
                              name="reference"
                              value={formik.values.reference}
                              onChange={(e) => {
                                formik.handleChange(e);
                                if (!e.target.value?.trim()) setIsHotelFromReference(false);
                              }}
                              onBlur={handleBlur}
                              placeholder="Previous booking no."
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Full Name" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="fullName"
                              value={formik.values.fullName}
                              onChange={formik.handleChange}
                              placeholder="Enter full name"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Phone Number" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="phone"
                              value={formik.values.phone}
                              onChange={formik.handleChange}
                              placeholder="Enter phone number"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        {/* <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="E-mail" style={{ marginBottom: "12px" }}>
                            <Input
                              name="email"
                              type="email"
                              value={formik.values.email}
                              onChange={formik.handleChange}
                              placeholder="Enter email address"
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col> */}
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="NID/Passport" style={{ marginBottom: "12px" }}>
                            <Input
                              name="nidPassport"
                              value={formik.values.nidPassport}
                              onChange={formik.handleChange}
                              placeholder="Enter NID/Passport"
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={18}>
                          <Form.Item label="Address" style={{ marginBottom: "12px" }}>
                            <Input
                              name="address"
                              value={formik.values.address}
                              onChange={formik.handleChange}
                              placeholder="Enter address"
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Booking Details Section */}
                    <Card 
                      title={<span style={{ fontSize: "14px", fontWeight: 600 }}>Booking Details</span>}
                      size="small" 
                      className="mb-3"
                      style={{ border: "1px solid #e8e8e8", borderRadius: "6px" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Check In Date" required style={{ marginBottom: "12px" }}>
                            <DatePicker
                              name="checkInDate"
                              value={formik.values.checkInDate}
                              onChange={handleCheckInChange}
                              className="w-full"
                              style={{ width: "100%", height: "40px" }}
                              disabledDate={(current) =>
                                current && current < dayjs().startOf("day")
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Check Out Date" required style={{ marginBottom: "12px" }}>
                            <DatePicker
                              name="checkOutDate"
                              value={formik.values.checkOutDate}
                              onChange={handleCheckOutChange}
                              className="w-full"
                              style={{ width: "100%", height: "40px" }}
                              disabledDate={(current) =>
                                current && current <= formik.values.checkInDate
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Number of Nights" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="nights"
                              type="number"
                              min={1}
                              value={formik.values.nights}
                              onChange={(e) => {
                                formik.handleChange(e);
                                const nights = Number(e.target.value) || 0;
                                const roomPrice = Number(formik.values.roomPrice) || 0;
                                const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
                                const totalBill = (nights * roomPrice) + breakfastTotalBill;
                                const advancePayment = Number(formik.values.advancePayment) || 0;
                                const duePayment = Math.max(0, totalBill - advancePayment);
                                formik.setFieldValue("totalBill", totalBill);
                                formik.setFieldValue("duePayment", duePayment);
                              }}
                              placeholder="Nights"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Adults / Children" style={{ marginBottom: "12px" }}>
                            <Input.Group compact>
                              <Input
                                name="adults"
                                type="number"
                                min={1}
                                value={formik.values.adults}
                                onChange={formik.handleChange}
                                placeholder="Adults"
                                style={{ width: "50%", height: "40px" }}
                              />
                              <Input
                                name="children"
                                type="number"
                                min={0}
                                value={formik.values.children}
                                onChange={formik.handleChange}
                                placeholder="Children"
                                style={{ width: "50%", height: "40px" }}
                              />
                            </Input.Group>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Room Selection Section */}
                    <Card 
                      title={<span style={{ fontSize: "14px", fontWeight: 600 }}>Room Selection</span>}
                      size="small" 
                      className="mb-3"
                      style={{ border: "1px solid #e8e8e8", borderRadius: "6px" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Hotel Name" required style={{ marginBottom: "12px" }}>
                            <Select
                              name="hotelName"
                              value={formik.values.hotelName || (hotelInfo[0] && hotelInfo[0].hotelName)}
                              onChange={handleHotelInfo}
                              placeholder={hotelInfo.length === 0 ? "Loading..." : "Select hotel"}
                              disabled
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) => {
                                const children = option?.children || "";
                                return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                              }}
                              notFoundContent={hotelInfo.length === 0 ? "No hotels available" : "No matching hotels found"}
                              style={{ height: "40px" }}
                            >
                              {hotelInfo && hotelInfo.length > 0 ? (
                                hotelInfo.map((hotel) => (
                                  <Select.Option
                                    key={hotel.hotelID}
                                    value={hotel.hotelName}
                                  >
                                    {hotel.hotelName || `Hotel ${hotel.hotelID}`}
                                  </Select.Option>
                                ))
                              ) : (
                                (
                                  <Select.Option value="" disabled>
                                    No hotels available
                                  </Select.Option>
                                )
                              )}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Room Category" required style={{ marginBottom: "12px" }}>
                            <Select
                              name="roomCategoryID"
                              value={formik.values.roomCategoryID}
                              onChange={handleRoomCategoryChange}
                              placeholder="Select category"
                              disabled={!formik.values.hotelName || roomCategories.length === 0}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                              notFoundContent="No categories available"
                              style={{ height: "40px" }}
                            >
                              {roomCategories.map((category) => (
                                <Select.Option
                                  key={category._id}
                                  value={category._id}
                                >
                                  {category.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Room Number" required style={{ marginBottom: "12px" }}>
                            <Select
                              name="roomNumberID"
                              value={formik.values.roomNumberID}
                              onChange={(value) => {
                                const selectedRoom = roomNumbers.find(
                                  (room) => room._id === value
                                );
                                formik.setFieldValue("roomNumberID", value);
                                formik.setFieldValue(
                                  "roomNumberName",
                                  selectedRoom ? selectedRoom.name || selectedRoom.roomId : ""
                                );
                                
                                // Set adults and children from room capacity if available
                                if (selectedRoom) {
                                  if (selectedRoom.capacity?.adults) {
                                    formik.setFieldValue("adults", selectedRoom.capacity.adults);
                                  }
                                  if (selectedRoom.capacity?.children !== undefined) {
                                    formik.setFieldValue("children", selectedRoom.capacity.children || 0);
                                  }
                                }
                                
                                // Set room price from selected room if available
                                if (selectedRoom && selectedRoom.price) {
                                  formik.setFieldValue("roomPrice", selectedRoom.price);
                                  // Recalculate total bill
                                  const nights = Number(formik.values.nights) || 0;
                                  const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
                                  const totalBill = (nights * selectedRoom.price) + breakfastTotalBill;
                                  const advancePayment = Number(formik.values.advancePayment) || 0;
                                  const duePayment = Math.max(0, totalBill - advancePayment);
                                  formik.setFieldValue("totalBill", totalBill);
                                  formik.setFieldValue("duePayment", duePayment);
                                }
                              }}
                              placeholder={
                                formik.values.checkInDate && formik.values.checkOutDate && roomNumbers.length === 0
                                  ? "No rooms available for selected dates"
                                  : "Select room"
                              }
                              disabled={!formik.values.roomCategoryID || roomNumbers.length === 0}
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                              }
                              notFoundContent={
                                formik.values.checkInDate && formik.values.checkOutDate
                                  ? "No available rooms for selected dates"
                                  : "No rooms available"
                              }
                              style={{ height: "40px" }}
                            >
                              {roomNumbers.map((room) => (
                                <Select.Option key={room._id} value={room._id}>
                                  {room.name || room.roomId}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Room Price (per night)" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="roomPrice"
                              type="number"
                              value={formik.values.roomPrice}
                              onChange={(e) => {
                                formik.handleChange(e);
                                const roomPrice = Number(e.target.value) || 0;
                                const nights = Number(formik.values.nights) || 0;
                                const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
                                const totalBill = (nights * roomPrice) + breakfastTotalBill;
                                const advancePayment = Number(formik.values.advancePayment) || 0;
                                const duePayment = Math.max(0, totalBill - advancePayment);
                                formik.setFieldValue("totalBill", totalBill);
                                formik.setFieldValue("duePayment", duePayment);
                              }}
                              placeholder="Price per night"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Payment Information Section */}
                    <Card 
                      title={<span style={{ fontSize: "14px", fontWeight: 600 }}>Payment Information</span>}
                      size="small" 
                      className="mb-3"
                      style={{ border: "1px solid #e8e8e8", borderRadius: "6px" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Total Bill" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="totalBill"
                              value={formik.values.totalBill}
                              readOnly
                              className="bg-gray-50"
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Advance Payment" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="advancePayment"
                              type="number"
                              min={0}
                              value={formik.values.advancePayment}
                              onChange={handleAdvancePaymentChange}
                              placeholder="Enter advance"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Due Payment" style={{ marginBottom: "12px" }}>
                            <Input
                              name="duePayment"
                              value={formik.values.duePayment}
                              readOnly
                              className="bg-gray-50"
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Payment Method" required style={{ marginBottom: "12px" }}>
                            <Select
                              name="paymentMethod"
                              value={formik.values.paymentMethod}
                              onChange={(value) =>
                                formik.setFieldValue("paymentMethod", value)
                              }
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
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Transaction ID" required style={{ marginBottom: "12px" }}>
                            <Input
                              name="transactionId"
                              value={formik.values.transactionId}
                              onChange={formik.handleChange}
                              placeholder="Enter transaction ID"
                              required
                              style={{ height: "40px" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    {/* Additional Services Section */}
                    <Card 
                      title={<span style={{ fontSize: "14px", fontWeight: 600 }}>Additional Services</span>}
                      size="small" 
                      className="mb-3"
                      style={{ border: "1px solid #e8e8e8", borderRadius: "6px" }}
                      bodyStyle={{ padding: "16px 20px" }}
                    >
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12} md={12} lg={6}>
                          <Form.Item label="Breakfast" style={{ marginBottom: "12px" }}>
                            <Switch
                              checked={formik.values.isBreakfast}
                              onChange={(checked) => {
                                formik.setFieldValue("isBreakfast", checked);
                                if (!checked) {
                                  formik.setFieldValue("breakfastTotalBill", 0);
                                  const nights = Number(formik.values.nights) || 0;
                                  const roomPrice = Number(formik.values.roomPrice) || 0;
                                  const totalBill = (nights * roomPrice);
                                  const advancePayment = Number(formik.values.advancePayment) || 0;
                                  const duePayment = Math.max(0, totalBill - advancePayment);
                                  formik.setFieldValue("totalBill", totalBill);
                                  formik.setFieldValue("duePayment", duePayment);
                                }
                              }}
                            />
                          </Form.Item>
                          {formik.values.isBreakfast && (
                            <Form.Item label="Breakfast Bill" style={{ marginBottom: "12px" }}>
                              <Input
                                type="number"
                                min={0}
                                value={formik.values.breakfastTotalBill || ""}
                                onChange={(e) => {
                                  const breakfastTotalBill = Number(e.target.value) || 0;
                                  formik.setFieldValue("breakfastTotalBill", breakfastTotalBill);
                                  const nights = Number(formik.values.nights) || 0;
                                  const roomPrice = Number(formik.values.roomPrice) || 0;
                                  const totalBill = (nights * roomPrice) + breakfastTotalBill;
                                  const advancePayment = Number(formik.values.advancePayment) || 0;
                                  const duePayment = Math.max(0, totalBill - advancePayment);
                                  formik.setFieldValue("totalBill", totalBill);
                                  formik.setFieldValue("duePayment", duePayment);
                                }}
                                placeholder="Enter breakfast bill"
                                style={{ height: "40px" }}
                              />
                            </Form.Item>
                          )}
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={12}>
                          <Form.Item label="Note" style={{ marginBottom: "12px" }}>
                            <Input.TextArea
                              name="note"
                              value={formik.values.note}
                              onChange={formik.handleChange}
                              placeholder="Enter any additional notes..."
                              rows={5}
                              style={{ minHeight: "120px", fontSize: "14px", padding: "10px 12px" }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    <div className="flex justify-end gap-3 pt-3 border-t items-center" style={{ marginTop: "16px", paddingTop: "16px" }}>
                      <Button
                        onClick={() => {
                          setVisible(false);
                          setIsEditing(false);
                          setEditingKey(null);
                          setPrevData(null);
                          setIsHotelFromReference(false);
                          formik.resetForm();
                        }}
                        style={{ height: "40px", padding: "0 24px", fontSize: "14px", display: "flex", alignItems: "center" }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitLoading}
                        className="bg-[#8ABF55] hover:bg-[#7DA54E]"
                        style={{ height: "40px", padding: "0 32px", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center" }}
                      >
                        {isEditing ? "Update Booking" : "Create Booking"}
                      </Button>
                    </div>
                  </Form>
                </Modal>
            </div>
          </div>
        </>
      ) : (
        <>
          <NoPermissionBanner />
        </>
      )}
    </div>
  );
};

export default BookingInfo;