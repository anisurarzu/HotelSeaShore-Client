"use client";

import { useState, useEffect, useRef } from "react";
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
  Card,
  Row,
  Col,
  Skeleton,
} from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import moment from "moment";

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

// Backend slices date using UTC: dt.toISOString().slice(0,10).
// If we send Asia/Dhaka midnight, UTC date becomes previous day.
// So we set a "safe" time (noon) in Asia/Dhaka to keep UTC date equal to Dhaka calendar date.
const toDhIsoSafeForUtcDate = (dateLike) => {
  const d = dayjs(dateLike);
  if (!d.isValid()) return dayjs().tz("Asia/Dhaka").startOf("day").toISOString();
  return d
    .tz("Asia/Dhaka")
    .hour(12)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toISOString();
};
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined, ReloadOutlined, PlusOutlined, SearchOutlined, MinusCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import NoPermissionBanner from "./Permission/NoPermissionBanner";
import "./Booking/BookingForm.css";
import "./BookingInfo.css";

const BookingInfo = ({ hotelID, contentPermissions: contentPermissionsFromProps }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userInfo2 = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("userInfo") || "{}") : {};
  const userHotelID = hotelID;
  const permission = userInfo2?.permission?.permissions;
  const fromStorage = permission?.find(
    (perm) => perm.pageName === "Booking Info" || perm.pageName === "Booking"
  );
  const bookingPermissionsFromStorage = fromStorage
    ? {
        viewAccess: fromStorage.viewAccess ?? false,
        insertAccess: fromStorage.insertAccess ?? false,
        editAccess: fromStorage.editAccess ?? false,
        deleteAccess: fromStorage.deleteAccess ?? false,
      }
    : null;

  const bookingPermissionsFromProps = contentPermissionsFromProps
    ? {
        viewAccess: contentPermissionsFromProps.viewAccess ?? contentPermissionsFromProps.view ?? false,
        insertAccess:
          contentPermissionsFromProps.insertAccess ?? contentPermissionsFromProps.insert ?? false,
        editAccess: contentPermissionsFromProps.editAccess ?? contentPermissionsFromProps.edit ?? false,
        deleteAccess:
          contentPermissionsFromProps.deleteAccess ?? contentPermissionsFromProps.delete ?? false,
      }
    : null;

  // Prefer localStorage permission (source of truth for this page)
  const bookingPermissions =
    bookingPermissionsFromStorage ||
    bookingPermissionsFromProps || {
      viewAccess: false,
      insertAccess: false,
      editAccess: false,
      deleteAccess: false,
    };

  const [visible, setVisible] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [hotelInfo, setHotelInfo] = useState([]);
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
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
  const [initialPaymentCount, setInitialPaymentCount] = useState(0);
  const hasHandledQueryParams = useRef(false);

  // Fetch hotels list
  const fetchHotelInfo = async () => {
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

    const allCategories = hotel.roomCategories || [];
    const categories = Array.isArray(allCategories)
      ? allCategories.filter((c) => c.isActive !== false)
      : [];
    setRoomCategories(categories);
    
    setRoomNumbers([]);
    formik.setFieldValue("roomCategoryID", "");
    formik.setFieldValue("roomCategoryName", "");
    formik.setFieldValue("roomNumberID", "");
    formik.setFieldValue("roomNumberName", "");
  };

  // Returns true if the date falls inside an existing booking for the given room (so it should be disabled in date picker)
  const isDateInExistingBooking = (date, mode = "checkIn") => {
    if (!date) return false;
    const hotelId = formik.values.hotelID;
    const categoryId = formik.values.roomCategoryID;
    const roomId = formik.values.roomNumberID;
    if (!hotelId || !categoryId || !roomId) return false;
    const d = dayjs(date).startOf("day");
    return allBookings.some((booking) => {
      if (isEditing && editingKey && booking._id === editingKey) return false;
      if (booking.statusID === 255) return false;
      if (
        booking.hotelID !== hotelId ||
        booking.roomCategoryID !== categoryId ||
        booking.roomNumberID !== roomId
      )
        return false;
      const start = dayjs(booking.checkInDate).startOf("day");
      const end = dayjs(booking.checkOutDate).startOf("day");
      if (mode === "checkIn") return !d.isBefore(start) && d.isBefore(end);
      return d.isAfter(start) && !d.isAfter(end);
    });
  };

  // Function to check if a room is available for given dates
  const isRoomAvailable = (roomId, categoryId, hotelId, checkIn, checkOut, excludeBookingId = null) => {
    if (!checkIn || !checkOut) return true;

    const checkInDate = dayjs(checkIn);
    const checkOutDate = dayjs(checkOut);

    const conflictingBooking = allBookings.find((booking) => {
      if (excludeBookingId && booking._id === excludeBookingId) return false;
      if (booking.statusID === 255) return false;

      if (
        booking.hotelID !== hotelId ||
        booking.roomCategoryID !== categoryId ||
        booking.roomNumberID !== roomId
      ) {
        return false;
      }

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

    const selectedHotel = hotelInfo.find(hotel => hotel.hotelID === selectedHotelId);
    if (!selectedHotel) {
      setRoomNumbers([]);
      return;
    }

    const selectedCategory = selectedHotel.roomCategories?.find(
      category => category._id === categoryId
    );

    if (!selectedCategory || !selectedCategory.roomNumbers) {
      setRoomNumbers([]);
      return;
    }

    let rooms = (selectedCategory.roomNumbers || []).filter(
      (r) => (r.status || "available") === "available"
    );
    if (isEditing && prevData?.roomNumberID) {
      const editingRoom = selectedCategory.roomNumbers.find((r) => r._id === prevData.roomNumberID);
      if (editingRoom && !rooms.some((r) => r._id === editingRoom._id)) {
        rooms = [editingRoom, ...rooms];
      }
    }

    if (formik.values.checkInDate && formik.values.checkOutDate) {
      const excludeBookingId = isEditing ? editingKey : null;

      const availableRooms = rooms.filter((roomNumber) => {
        return isRoomAvailable(
          roomNumber._id,
          categoryId,
          selectedHotelId,
          formik.values.checkInDate,
          formik.values.checkOutDate,
          excludeBookingId
        );
      });

      if (isEditing && prevData && prevData.roomNumberID) {
        const editingRoomId = prevData.roomNumberID;
        
        const hasEditingRoom = availableRooms.some(room => room._id === editingRoomId);
        
        if (!hasEditingRoom && editingRoomId) {
          const originalRoom = rooms.find(room => room._id === editingRoomId);
          if (originalRoom) {
            rooms = [originalRoom, ...availableRooms];
          } else {
            rooms = availableRooms;
          }
        } else {
          rooms = availableRooms;
        }
      } else {
        rooms = availableRooms;
      }
    }

    setRoomNumbers(Array.isArray(rooms) ? rooms : []);
    
    if (isEditing && prevData && prevData.roomNumberID) {
      const roomExists = rooms.some(room => room._id === prevData.roomNumberID);
      if (roomExists) {
        formik.setFieldValue("roomNumberID", prevData.roomNumberID);
        formik.setFieldValue("roomNumberName", prevData.roomNumberName);
      } else if (rooms.length > 0) {
        formik.setFieldValue("roomNumberID", rooms[0]._id);
        formik.setFieldValue("roomNumberName", rooms[0].name || rooms[0].roomId);
      }
    }
    
    if (
      !isEditing &&
      formik.values.checkInDate &&
      formik.values.checkOutDate &&
      rooms.length === 0 &&
      selectedCategory?.roomNumbers?.length > 0
    ) {
      message.warning("No rooms available for the selected dates. Please choose different dates.", 4);
    }
  };

  const checkBookingConflict = async (values, excludeBookingId = null) => {
    try {
      const checkInDate = dayjs(values.checkInDate).format("YYYY-MM-DD");
      const checkOutDate = dayjs(values.checkOutDate).format("YYYY-MM-DD");

      const conflictingBooking = allBookings.find((booking) => {
        if (excludeBookingId && booking._id === excludeBookingId) return false;
        if (booking.statusID === 255) return false;

        if (
          booking.hotelID !== values.hotelID ||
          booking.roomCategoryID !== values.roomCategoryID ||
          booking.roomNumberID !== values.roomNumberID
        ) {
          return false;
        }

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
      if (!values.checkInDate || !values.checkOutDate) {
        message.error("Please select both check-in and check-out dates");
        setSubmitLoading(false);
        return;
      }

      let checkIn = dayjs(values.checkInDate).startOf("day");
      let checkOut = dayjs(values.checkOutDate).startOf("day");

      // For update: allow same-day check-in/check-out; ensure payload always has checkOut > checkIn so backend validation passes
      if (isEditing && (checkOut.isSame(checkIn) || checkOut.isBefore(checkIn))) {
        checkOut = checkIn.add(1, "day");
      } else if (!isEditing && checkOut.isSameOrBefore(checkIn)) {
        message.error("Check-out date must be after check-in date");
        setSubmitLoading(false);
        return;
      }

      const nights = Math.max(1, checkOut.diff(checkIn, "day"));

      const totalBill = Number(values.totalBill) || 0;
      const paymentsList = Array.isArray(values.payments) ? values.payments : [{ paymentMethod: "CASH", amount: 0, transactionId: "" }];
      let advancePayment = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (advancePayment > totalBill) {
        advancePayment = totalBill;
      }
      const duePayment = Math.max(0, totalBill - advancePayment);

      const payments = paymentsList
        .filter((p) => (Number(p.amount) || 0) > 0)
        .map((p) => {
          const paymentDate = p.date ? dayjs(p.date) : dayjs();
          return {
            paymentMethod: p.paymentMethod || "CASH",
            amount: Number(p.amount) || 0,
            // Use Bangladesh timezone safe time to prevent 1-day shift
            createdAt: toDhIsoSafeForUtcDate(paymentDate),
            ...(p.transactionId ? { transactionId: String(p.transactionId).trim() } : {}),
          };
        });
      if (payments.length === 0) {
        payments.push({ paymentMethod: "CASH", amount: advancePayment });
      }

      const bookingData = {
        fullName: values.fullName,
        phone: values.phone,
        nidPassport: values.nidPassport || undefined,
        address: values.address || undefined,
        email: values.email || undefined,
        hotelID: values.hotelID,
        hotelName: values.hotelName,
        roomCategoryID: values.roomCategoryID,
        roomCategoryName: values.roomCategoryName,
        roomNumberID: values.roomNumberID,
        roomNumberName: values.roomNumberName,
        roomPrice: Number(values.roomPrice) || 0,
        checkInDate: checkIn.format("YYYY-MM-DD"),
        checkOutDate: checkOut.format("YYYY-MM-DD"),
        nights,
        adults: Number(values.adults) || 1,
        children: Number(values.children) || 0,
        isBreakfast: values.isBreakfast || false,
        breakfastTotalBill: values.isBreakfast ? Number(values.breakfastTotalBill) : 0,
        totalBill,
        advancePayment,
        duePayment,
        paymentMethod: values.paymentMethod || "",
        transactionId: values.transactionId || "",
        payments,
        note: values.note || undefined,
        reference: values.reference || undefined,
      };

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      if (isEditing) {
        bookingData.bookedBy =
          values.bookedBy || prevData?.bookedBy || "";
        bookingData.bookedByID =
          values.bookedByID || prevData?.bookedByID || "";
        bookingData.updatedByID =
          userInfo?.loginID || userInfo?.id || userInfo?._id || "";
      } else {
        bookingData.bookedBy = userInfo?.username || userInfo?.loginID || "admin";
        bookingData.bookedByID = userInfo?.loginID || userInfo?.id || userInfo?._id || "";
        bookingData.updatedByID = "Not Updated";
      }

      // Check for booking conflicts
      const excludeBookingId = isEditing ? editingKey : null;
      const conflictingBooking = await checkBookingConflict(
        bookingData,
        excludeBookingId
      );

      if (conflictingBooking) {
        const conflictMsg = `Room is already booked! Existing Booking: ${conflictingBooking.bookingNo}, Guest: ${conflictingBooking.fullName}, Dates: ${dayjs(conflictingBooking.checkInDate).format("D MMM YYYY")} - ${dayjs(conflictingBooking.checkOutDate).format("D MMM YYYY")}`;
        message.error(conflictMsg, 6);
        setSubmitLoading(false);
        return;
      }

      let response;
      if (isEditing && editingKey) {
        response = await coreAxios.put(`/booking/${editingKey}`, bookingData);
      } else {
        response = await coreAxios.post("/booking", bookingData);
      }

      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || (isEditing ? "Booking updated successfully!" : "Booking created successfully!");
        message.success(successMsg, 3);
        
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        setPrevData(null);
        setInitialPaymentCount(0);
        setIsHotelFromReference(false);
        formik.resetForm();
        
        if (searchParams.get("room") || searchParams.get("date")) {
          router.replace("/dashboard?menu=6");
        }
        
        await fetchBookings();
      } else {
        message.error(response.data?.message || response.data?.error || "Failed to save booking.");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      
      if (error.response?.status === 409) {
        const errorData = error.response?.data;
        const existingBooking = errorData?.details?.existingBooking;
        
        let conflictMsg = errorData?.error || "Room is already booked!";
        if (existingBooking) {
          conflictMsg += ` Booking No: ${existingBooking.bookingNo}, Guest: ${existingBooking.guestName}, Dates: ${dayjs(existingBooking.checkInDate).format("D MMM YYYY")} - ${dayjs(existingBooking.checkOutDate).format("D MMM YYYY")}`;
        }
        message.error(conflictMsg, 6);
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.errors) {
          const errorMessages = Object.values(errorData.errors).join(", ");
          message.error(errorMessages);
        } else if (errorData?.message) {
          message.error(errorData.message);
        } else {
          message.error("Validation failed. Please check your input.");
        }
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
      nights: 1,
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      paymentMethod: "",
      transactionId: "",
      payments: [{ paymentMethod: "", amount: 0, transactionId: "", date: dayjs() }],
      note: "",
      bookedBy: userInfo2 ? userInfo2?.username : "",
      bookedByID: userInfo2 ? userInfo2?.loginID : "",
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
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userRole = userInfo?.role?.value;
      const userHotelID = hotelID;

      const response = await coreAxios.get("/bookings");

      if (response.status === 200) {
        let bookingsData = Array.isArray(response.data) ? response.data : [];

        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking && booking.hotelID === Number(userHotelID)
          );
        }

        bookingsData = bookingsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.createTime || 0);
          const dateB = new Date(b.createdAt || b.createTime || 0);
          return dateB - dateA;
        });

        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
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

  const prefillFormFromQueryParams = async () => {
    const roomNumberId = searchParams.get("room");
    const dateStr = searchParams.get("date");
    const hotelIdParam = searchParams.get("hotel");

    if (roomNumberId && dateStr && hotelInfo.length > 0) {
      try {
        const hotelId = hotelIdParam ? Number(hotelIdParam) : (selectedHotelId || Number(hotelID));
        const hotel = hotelInfo.find(h => h.hotelID === hotelId);
        
        if (!hotel) {
          message.warning("Hotel not found. Please select a hotel first.");
          return;
        }

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

        setSelectedHotelId(hotel.hotelID);
        extractHotelCategories(hotel);

        setTimeout(() => {
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

          extractRoomNumbers(foundCategory._id);

          setVisible(true);
          setIsEditing(false);
          setEditingKey(null);
          setPrevData(null);
          setInitialPaymentCount(0);
        }, 500);
      } catch (error) {
        console.error("Error pre-filling form:", error);
        message.error("Failed to pre-fill booking form.");
      }
    }
  };

  useEffect(() => {
    fetchHotelInfo();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!visible || !isEditing || !prevData || hotelInfo.length === 0) return;

    const currentHotelId = prevData.hotelID;
    if (!currentHotelId) return;

    const selectedHotel = hotelInfo.find(
      (h) => h && h.hotelID === currentHotelId
    );
    
    if (selectedHotel) {
      const categories = selectedHotel.roomCategories || [];
      setRoomCategories(categories);
      
      if (prevData.roomCategoryID) {
        setTimeout(() => {
          extractRoomNumbers(prevData.roomCategoryID);
          
          if (prevData.roomNumberID) {
            formik.setFieldValue("roomNumberID", prevData.roomNumberID);
            formik.setFieldValue("roomNumberName", prevData.roomNumberName);
          }
        }, 300);
      }
    }
  }, [hotelInfo.length, visible, isEditing, prevData]);

  useEffect(() => {
    const roomNumberId = searchParams.get("room");
    const dateStr = searchParams.get("date");
    
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
    
    if (!roomNumberId && !dateStr) {
      hasHandledQueryParams.current = false;
    }
  }, [hotelInfo.length, searchParams]);

  useEffect(() => {
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
      const defaultHotel = hotelInfo[0];
      if (defaultHotel) {
        handleHotelInfo(defaultHotel.hotelName);
      }
    }
  }, [visible, isEditing, hotelInfo.length]);

  const handleHotelInfo = (value) => {
    const selectedHotel = hotelInfo.find((hotel) => hotel && hotel.hotelName === value);

    if (selectedHotel) {
      formik.setFieldValue("hotelName", value);
      formik.setFieldValue("hotelID", selectedHotel.hotelID);
      
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      
      extractHotelCategories(selectedHotel);
      
      setSelectedHotelId(selectedHotel.hotelID);
    }
  };

  const handleRoomCategoryChange = (value) => {
    const selectedCategory = roomCategories.find(
      (category) => category._id === value
    );

    if (selectedCategory) {
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomCategoryID", value);
      formik.setFieldValue("roomCategoryName", selectedCategory.name);
      
      formik.setFieldValue("roomPrice", selectedCategory.basePrice || 0);
      
      extractRoomNumbers(value);
      
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

    let data = record;
    try {
      if (record.bookingNo) {
        const targetBookingId = record._id || record.id;
        const details = await fetchBookingDetails(record.bookingNo, false, targetBookingId);
        if (details && String(details?._id || details?.id) === String(targetBookingId)) {
          data = { ...record, ...details };
        }
      }
    } catch (e) {
      console.error("Failed to fetch full booking details for edit:", e);
    }

    const bookingId = data._id || record._id;
    setEditingKey(bookingId);
    setPrevData(data);
    setIsEditing(true);

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    
    const checkInDate = data.checkInDate ? dayjs(data.checkInDate) : dayjs();
    const checkOutDate = data.checkOutDate ? dayjs(data.checkOutDate) : dayjs().add(1, "day");

    let finalCheckOutDate = checkOutDate;
    if (checkOutDate.isSameOrBefore(checkInDate)) {
      finalCheckOutDate = checkInDate.add(1, "day");
    }

    const calculatedNights = finalCheckOutDate.diff(checkInDate, "day");
    
    if (data.hotelID) {
      setSelectedHotelId(data.hotelID);
      
      const selectedHotel = hotelInfo.find((h) => h.hotelID === data.hotelID);
      if (selectedHotel) {
        const categories = selectedHotel.roomCategories || [];
        setRoomCategories(categories);
      }
    }

    const totalBill = Number(data.totalBill) || 0;
    let advancePayment = Number(data.advancePayment) || 0;
    let paymentMethod = "";
    let transactionId = "";
    let payments = [{ paymentMethod: "", amount: 0, transactionId: "", date: null }];
    if (Array.isArray(data.payments) && data.payments.length > 0) {
      advancePayment = data.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const first = data.payments[0];
      paymentMethod = String(first.paymentMethod || first.method || "").trim().toUpperCase();
      transactionId = first.transactionId || transactionId;
      payments = data.payments.map((p) => ({
        _id: p._id || p.id || undefined,
        paymentMethod: String(p.paymentMethod || p.method || "").trim().toUpperCase(),
        amount: Number(p.amount) || 0,
        transactionId: p.transactionId || "",
        date: p.createdAt ? dayjs(p.createdAt) : dayjs(data.checkInDate || new Date()),
      }));
    } else {
      // No payment rows from backend -> keep method empty in update modal.
      const normalizedLegacyMethod = String(data.paymentMethod || "").trim().toUpperCase();
      const normalizedLegacyTxn = String(data.transactionId || "").trim();
      const hasLegacyPaidAmount = advancePayment > 0;
      payments = [{
        paymentMethod: hasLegacyPaidAmount ? normalizedLegacyMethod : "",
        amount: advancePayment,
        transactionId: hasLegacyPaidAmount ? normalizedLegacyTxn : "",
        date: hasLegacyPaidAmount ? dayjs(data.checkInDate || new Date()) : null,
      }];
      paymentMethod = hasLegacyPaidAmount ? normalizedLegacyMethod : "";
      transactionId = hasLegacyPaidAmount ? normalizedLegacyTxn : "";
    }
    const duePayment = Math.max(0, totalBill - advancePayment);

    const formValues = {
      fullName: data.fullName || data.guestName || "",
      nidPassport: data.nidPassport || data.nid || "",
      address: data.address || "",
      phone: data.phone || "",
      email: data.email || "",
      hotelID: data.hotelID || 0,
      hotelName: data.hotelName || "",
      roomCategoryID: data.roomCategoryID || "",
      roomCategoryName: data.roomCategoryName || "",
      roomNumberID: data.roomNumberID || "",
      roomNumberName: data.roomNumberName || data.roomNumber || "",
      roomPrice: Number(data.roomPrice) || 0,
      checkInDate: checkInDate,
      checkOutDate: finalCheckOutDate,
      nights: calculatedNights > 0 ? calculatedNights : (Number(data.nights) || 1),
      adults: Number(data.adults) || 1,
      children: Number(data.children) || 0,
      isBreakfast: data.isBreakfast ?? (data.isKitchen || data.extraBed) ?? false,
      breakfastTotalBill:
        Number(data.breakfastTotalBill) ||
        (Number(data.kitchenTotalBill) || 0) + (Number(data.extraBedTotalBill) || 0),
      totalBill: totalBill,
      advancePayment: advancePayment,
      duePayment: duePayment,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      payments,
      note: data.note || "",
      bookedBy: data.bookedBy || "",
      bookedByID: data.bookedByID || "",
      updatedByID:
        data.updatedByID !== undefined && data.updatedByID !== null
          ? data.updatedByID
          : "Not Updated",
      reference: data.reference || "",
    };

    formik.setValues(formValues);
    setInitialPaymentCount(payments.length);

    if (data.roomCategoryID) {
      setTimeout(() => {
        extractRoomNumbers(data.roomCategoryID);
      }, 300);
    }

    setVisible(true);
  };

  const deleteBookingPaymentById = async (bookingId, paymentRowOrId, rowIndex) => {
    const rawPaymentId =
      paymentRowOrId?._id ??
      paymentRowOrId?.id ??
      paymentRowOrId?.paymentId ??
      paymentRowOrId ??
      null;

    let normalizedPaymentId = null;
    if (rawPaymentId != null) {
      if (typeof rawPaymentId === "string" || typeof rawPaymentId === "number") {
        normalizedPaymentId = String(rawPaymentId);
      } else if (typeof rawPaymentId === "object") {
        const nestedId = rawPaymentId?.$oid ?? rawPaymentId?.toString?.();
        if (nestedId && nestedId !== "[object Object]") {
          normalizedPaymentId = String(nestedId);
        }
      }
    }

    if (!bookingId || !normalizedPaymentId) {
      message.error("Payment id not found");
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await coreAxios.delete(
        `/bookings/booking/${bookingId}/payments/${encodeURIComponent(normalizedPaymentId)}`
      );
      if (res.status === 200) {
        message.success(res.data?.message || "Booking payment removed successfully");
      }

      // Remove only that row from form; keep rest locked as existing.
      const next = [...(formik.values.payments || [])].filter((_, i) => i !== rowIndex);
      if (next.length === 0) {
        next.push({ paymentMethod: "", amount: 0, transactionId: "", date: null });
      }
      formik.setFieldValue("payments", next);
      syncAdvanceFromPayments(next);
      const remainingExisting = next.filter((p) => p?._id).length;
      setInitialPaymentCount(remainingExisting);
    } catch (error) {
      console.error("Error deleting booking payment:", error);
      message.error(error.response?.data?.error || error.response?.data?.message || "Failed to remove booking payment");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Soft delete (cancel): DELETE /booking/soft/:id with body { canceledBy, reason }
  const handleDelete2 = async (key) => {
    setSubmitLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const canceledBy = userInfo?.username || userInfo?.loginID || "admin";

      const res = await coreAxios.delete(`/booking/soft/${key}`, {
        data: { canceledBy, reason: cancellationReason || "Cancelled by user" },
      });

      if (res.status === 200) {
        message.success(res.data?.message || "Booking cancelled successfully.");
        setIsModalVisible(false);
        setCancellationReason("");
        setCurrentBooking(null);
        fetchBookings();
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

  // Hard delete (permanent): DELETE /booking/:id – removes booking from DB
  const handleHardDelete = async (booking) => {
    if (!booking?._id) return;
    setSubmitLoading(true);
    try {
      const res = await coreAxios.delete(`/booking/${booking._id}`);

      if (res.status === 200) {
        message.success(res.data?.message || "Booking deleted successfully.");
        fetchBookings();
      } else {
        message.error(res.data?.message || res.data?.error || "Failed to delete booking.");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      message.error(error.response?.data?.message || "Failed to delete booking.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAdvancePaymentChange = (e) => {
    const advancePayment = parseFloat(e.target.value) || 0;
    const totalBill = parseFloat(formik.values.totalBill) || 0;

    if (advancePayment > totalBill) {
      message.warning("Advance payment cannot exceed total bill");
      formik.setFieldValue("advancePayment", totalBill);
      formik.setFieldValue("duePayment", 0);
    } else {
      const duePayment = totalBill - advancePayment;
      formik.setFieldValue("advancePayment", advancePayment);
      formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
    }
  };

  const syncAdvanceFromPayments = (paymentsList) => {
    const totalBill = parseFloat(formik.values.totalBill) || 0;
    const advancePayment = (paymentsList || formik.values.payments || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const capped = advancePayment > totalBill ? totalBill : advancePayment;
    const duePayment = Math.max(0, totalBill - capped);
    formik.setFieldValue("advancePayment", capped);
    formik.setFieldValue("duePayment", duePayment);
  };

  const handleTotalBillChange = (e) => {
    const totalBill = parseFloat(e.target.value) || 0;
    const advancePayment = parseFloat(formik.values.advancePayment) || 0;
    const cappedAdvance = advancePayment > totalBill ? totalBill : advancePayment;
    const duePayment = Math.max(0, totalBill - cappedAdvance);
    formik.setFieldValue("totalBill", totalBill);
    formik.setFieldValue("advancePayment", cappedAdvance);
    formik.setFieldValue("duePayment", duePayment);
  };

  const handleAdvanceTotalChange = (e) => {
    const totalBill = parseFloat(formik.values.totalBill) || 0;
    let advancePayment = parseFloat(e.target.value) || 0;
    if (advancePayment > totalBill) {
      message.warning("Advance cannot exceed total bill");
      advancePayment = totalBill;
    }
    const duePayment = Math.max(0, totalBill - advancePayment);
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment);
    const payments = [...(formik.values.payments || [])];
    const first = payments[0] || { paymentMethod: "", amount: 0, transactionId: "", date: dayjs() };
    formik.setFieldValue("payments", [{ ...first, amount: advancePayment }]);
  };

  const handleDuePaymentChange = (e) => {
    const totalBill = parseFloat(formik.values.totalBill) || 0;
    let duePayment = parseFloat(e.target.value) || 0;
    if (duePayment > totalBill) {
      message.warning("Due cannot exceed total bill");
      duePayment = totalBill;
    }
    const advancePayment = Math.max(0, totalBill - duePayment);
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment);
    const payments = [...(formik.values.payments || [])];
    const first = payments[0] || { paymentMethod: "", amount: 0, transactionId: "", date: dayjs() };
    formik.setFieldValue("payments", [{ ...first, amount: advancePayment }]);
  };

  const applyFilters = () => {
    let filtered = Array.isArray(bookings) ? bookings : [];
    
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
  
  useEffect(() => {
    applyFilters();
  }, [searchTerm, checkInDate, bookings]);

  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const fetchBookingDetails = async (bookingNo, guestInfoOnly = false, targetBookingId = null) => {
    try {
      const response = await coreAxios.get(`/bookings/bookingNo/${bookingNo}`);
      
      if (response?.status === 200) {
        let bookingDetails = null;
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          if (targetBookingId) {
            bookingDetails =
              response.data.find((b) => String(b?._id || b?.id) === String(targetBookingId)) ||
              response.data[0];
          } else {
            bookingDetails = response.data[0];
          }
        } else if (response.data && typeof response.data === 'object') {
          bookingDetails = response.data;
        }
        
        if (
          targetBookingId &&
          bookingDetails &&
          String(bookingDetails?._id || bookingDetails?.id) !== String(targetBookingId)
        ) {
          // Avoid mixing a different booking row when bookingNo has multiple entries.
          return null;
        }

        if (bookingDetails && !guestInfoOnly && bookingDetails.hotelID) {
          setSelectedHotelId(bookingDetails.hotelID);
          const selectedHotel = hotelInfo.find(h => h.hotelID === bookingDetails.hotelID);
          if (selectedHotel) {
            setRoomCategories(selectedHotel.roomCategories || []);
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

  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const checkInDate = dayjs(checkIn).startOf("day");
      const checkOutDate = dayjs(checkOut).startOf("day");
      
      if (checkOutDate.isSameOrBefore(checkInDate)) {
        formik.setFieldValue("checkOutDate", checkInDate.add(1, "day"));
        const nights = 1;
        formik.setFieldValue("nights", nights);
        
        const roomPrice = Number(formik.values.roomPrice) || 0;
        const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
        const totalBill = (nights * roomPrice) + breakfastTotalBill;
        const advancePayment = Number(formik.values.advancePayment) || 0;
        const duePayment = Math.max(0, totalBill - advancePayment);
        
        formik.setFieldValue("totalBill", totalBill);
        formik.setFieldValue("duePayment", duePayment);
      } else {
        const nights = checkOutDate.diff(checkInDate, "day");
        const calculatedNights = nights > 0 ? nights : 1;
        formik.setFieldValue("nights", calculatedNights);
        
        const roomPrice = Number(formik.values.roomPrice) || 0;
        const breakfastTotalBill = formik.values.isBreakfast ? Number(formik.values.breakfastTotalBill) || 0 : 0;
        const totalBill = (calculatedNights * roomPrice) + breakfastTotalBill;
        const advancePayment = Number(formik.values.advancePayment) || 0;
        const duePayment = Math.max(0, totalBill - advancePayment);
        
        formik.setFieldValue("totalBill", totalBill);
        formik.setFieldValue("duePayment", duePayment);
      }
    } else {
      formik.setFieldValue("nights", 1);
      formik.setFieldValue("totalBill", 0);
      formik.setFieldValue("duePayment", 0);
    }
  };

  const handleCheckInChange = (date) => {
    if (!date) return;
    
    if (!isEditing) {
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      setRoomNumbers([]);
    }
    
    formik.setFieldValue("checkInDate", date);
    
    const checkOut = formik.values.checkOutDate;
    if (checkOut && dayjs(checkOut).isSameOrBefore(dayjs(date))) {
      const newCheckOut = dayjs(date).add(1, "day");
      formik.setFieldValue("checkOutDate", newCheckOut);
      calculateNights(date, newCheckOut);
    } else {
      calculateNights(date, checkOut);
    }
    
    if (formik.values.roomCategoryID && formik.values.hotelID) {
      setTimeout(() => {
        extractRoomNumbers(formik.values.roomCategoryID);
      }, 100);
    }
  };

  const handleCheckOutChange = (date) => {
    if (!date) return;
    
    if (!isEditing) {
      formik.setFieldValue("roomCategoryID", "");
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", "");
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("roomPrice", 0);
      setRoomNumbers([]);
    }
    
    const checkIn = formik.values.checkInDate;
    if (checkIn && dayjs(date).isSameOrBefore(dayjs(checkIn))) {
      message.warning("Check-out date must be after check-in date");
      return;
    }
    
    formik.setFieldValue("checkOutDate", date);
    
    calculateNights(formik.values.checkInDate, date);
    
    if (formik.values.roomCategoryID && formik.values.hotelID) {
      setTimeout(() => {
        extractRoomNumbers(formik.values.roomCategoryID);
      }, 100);
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

    await handleDelete2(currentBooking?._id);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleDelete = (booking) => {
    showModal(booking);
  };

  const handleViewDetails = (booking) => {
    setSelectedBookingDetails(booking);
    setDetailsModalVisible(true);
  };

  return (
    <div className="hs-bi">
      {bookingPermissions.viewAccess ? (
        <>
          <div>
            <div className="hs-bi__toolbar">
              <div className="hs-bi__title-block">
                <p className="hs-bi__eyebrow">Operations</p>
                <h1 className="hs-bi__title">Booking Info</h1>
                <p className="hs-bi__meta">
                  {filteredBookings.length !== bookings.length
                    ? `Showing ${filteredBookings.length} of ${bookings.length} bookings`
                    : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="hs-bi__controls">
                <Input
                  placeholder="Search booking, guest, phone…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined style={{ color: "#8aa0a4" }} />}
                />
                <DatePicker
                  value={checkInDate}
                  onChange={(date) => setCheckInDate(date)}
                  format="DD MMM YYYY"
                  allowClear
                  placeholder="Check-in"
                />
                {(searchTerm || checkInDate) && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setCheckInDate(null);
                    }}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    fetchBookings();
                    fetchHotelInfo();
                  }}
                  loading={tableLoading}
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
                      setInitialPaymentCount(0);
                      setIsHotelFromReference(false);
                      setRoomCategories([]);
                      setRoomNumbers([]);
                      hasHandledQueryParams.current = false;
                      if (searchParams.get("room") || searchParams.get("date")) {
                        router.replace("/dashboard?menu=6");
                      }
                      fetchHotelInfo();
                    }}
                  >
                    <span className="hidden sm:inline">Create Booking</span>
                    
                  </Button>
                )}
              </div>
            </div>

            <div className="hs-bi__panel">
              <div className="hs-bi__scroll">
                <table className="hs-bi__table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Guest</th>
                      <th>Phone</th>
                      <th>Category</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th className="is-center">Nights</th>
                      <th className="is-num">Paid</th>
                      <th className="is-num">Total</th>
                      <th className="is-num">Due</th>
                      <th>Payments</th>
                      <th className="is-center">Status</th>
                      <th>Booked by</th>
                      <th>Updated by</th>
                      <th className="is-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      Array.from({ length: 8 }).map((_, idx) => (
                        <tr key={`skeleton-${idx}`}>
                          {Array.from({ length: 16 }).map((__, cidx) => (
                            <td key={cidx}>
                              <Skeleton.Input
                                active
                                size="small"
                                style={{ width: cidx === 15 ? 90 : 72, height: 14 }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : paginatedBookings?.length ? (
                      paginatedBookings.map((booking) => {
                        const totalFromPayments = (booking.payments || []).reduce(
                          (s, p) => s + (Number(p.amount) || 0),
                          0
                        );
                        const totalBill = Number(booking.totalBill) || 0;
                        const paid =
                          totalFromPayments > 0
                            ? totalFromPayments
                            : Number(booking.advancePayment) || 0;
                        const due =
                          totalFromPayments > 0
                            ? Math.max(0, totalBill - totalFromPayments)
                            : booking.duePayment != null
                              ? Number(booking.duePayment)
                              : Math.max(0, totalBill - paid);

                        const merged = {};
                        (booking.payments || []).forEach((p) => {
                          const method = ((p.paymentMethod || p.method || "CASH") + "").toUpperCase();
                          const amt = Number(p.amount) || 0;
                          if (amt > 0) merged[method] = (merged[method] || 0) + amt;
                        });
                        if (
                          !booking.payments?.length &&
                          booking.paymentMethod &&
                          (Number(booking.advancePayment) || 0) > 0
                        ) {
                          const m = (booking.paymentMethod + "").toUpperCase();
                          merged[m] = (merged[m] || 0) + (Number(booking.advancePayment) || 0);
                        }
                        const payEntries = Object.entries(merged).filter(([, amt]) => amt > 0);
                        const isCanceled = booking.statusID === 255;

                        return (
                          <tr
                            key={booking._id}
                            className={isCanceled ? "is-canceled" : undefined}
                          >
                            <td>
                              <span className="hs-bi__booking-no">
                                <Link
                                  target="_blank"
                                  href={`/dashboard/${booking.bookingNo}`}
                                  passHref
                                >
                                  {booking.bookingNo}
                                </Link>
                                <Tooltip title="Copy booking no.">
                                  <CopyToClipboard
                                    text={booking.bookingNo}
                                    onCopy={() => message.success("Copied!")}
                                  >
                                    <CopyOutlined className="hs-bi__copy" />
                                  </CopyToClipboard>
                                </Tooltip>
                              </span>
                            </td>
                            <td>
                              <span className="hs-bi__guest">{booking.fullName}</span>
                            </td>
                            <td>
                              <span className="hs-bi__muted">{booking.phone || "—"}</span>
                            </td>
                            <td>
                              <span className="hs-bi__muted">
                                {booking.roomCategoryName || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="hs-bi__guest">
                                {booking.roomNumberName || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="hs-bi__muted">
                                {moment(booking.checkInDate).format("DD MMM YY")}
                              </span>
                            </td>
                            <td>
                              <span className="hs-bi__muted">
                                {moment(booking.checkOutDate).format("DD MMM YY")}
                              </span>
                            </td>
                            <td className="is-center">{booking.nights ?? "—"}</td>
                            <td className="is-num">
                              <span className="hs-bi__money">
                                ৳{Number(paid || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="is-num">
                              <span className="hs-bi__money hs-bi__money--total">
                                ৳{Number(totalBill || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="is-num">
                              <span
                                className={`hs-bi__money ${
                                  due > 0 ? "hs-bi__money--due" : "hs-bi__money--zero"
                                }`}
                              >
                                ৳{Number(due || 0).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              {payEntries.length === 0 ? (
                                <span className="hs-bi__muted">—</span>
                              ) : (
                                <div className="hs-bi__pay-methods">
                                  {payEntries.map(([method, amount]) => (
                                    <div key={method} className="hs-bi__pay-chip">
                                      <span>{method}</span>
                                      <span>৳{Number(amount).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="is-center">
                              <span
                                className={`hs-bi__status ${
                                  isCanceled ? "hs-bi__status--cancel" : "hs-bi__status--ok"
                                }`}
                              >
                                {isCanceled ? "Canceled" : "Confirmed"}
                              </span>
                            </td>
                            <td>
                              <div className="hs-bi__audit">
                                <span className="hs-bi__audit-name">
                                  {booking.bookedByID || booking.bookedBy || "—"}
                                </span>
                                <span className="hs-bi__audit-time">
                                  {(booking.createdAt ||
                                    booking.createTime ||
                                    booking.createdDate)
                                    ? moment(
                                        booking.createdAt ||
                                          booking.createTime ||
                                          booking.createdDate
                                      ).format("DD MMM YY, h:mm A")
                                    : "—"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="hs-bi__audit">
                                {booking.updatedByID &&
                                booking.updatedByID !== "Not Updated" ? (
                                  <>
                                    <span className="hs-bi__audit-name">
                                      {booking.updatedByID}
                                    </span>
                                    <span className="hs-bi__audit-time">
                                      {(booking.updatedAt ||
                                        booking.updateTime ||
                                        booking.updatedDate)
                                        ? moment(
                                            booking.updatedAt ||
                                              booking.updateTime ||
                                              booking.updatedDate
                                          ).format("DD MMM YY, h:mm A")
                                        : ""}
                                    </span>
                                  </>
                                ) : (
                                  <span className="hs-bi__muted">—</span>
                                )}
                              </div>
                            </td>
                            <td className="is-center">
                              <div className="hs-bi__actions">
                                {bookingPermissions?.viewAccess && (
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleViewDetails(booking)}
                                  >
                                    View
                                  </Button>
                                )}
                                {bookingPermissions?.editAccess && (
                                  <Button size="small" onClick={() => handleEdit(booking)}>
                                    Edit
                                  </Button>
                                )}
                                <Popconfirm
                                  title="Cancel booking? Enter reason in the next step."
                                  onConfirm={() => handleDelete(booking)}
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Button type="link" danger size="small">
                                    Cancel
                                  </Button>
                                </Popconfirm>
                                {bookingPermissions?.deleteAccess && (
                                  <Popconfirm
                                    title="Are you sure to delete this booking?"
                                    onConfirm={() => handleHardDelete(booking)}
                                    okText="Yes"
                                    cancelText="No"
                                  >
                                    <Button type="link" danger size="small">
                                      Delete
                                    </Button>
                                  </Popconfirm>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={16}>
                          <div className="hs-bi__empty">
                            <p className="hs-bi__empty-title">No bookings found</p>
                            <p className="hs-bi__empty-sub">
                              Try clearing filters or create a new booking.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!tableLoading && filteredBookings.length > 0 && (
                <div className="hs-bi__footer">
                  <div className="hs-bi__footer-meta">
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
                    pageSizeOptions={["10", "20", "50", "100"]}
                    size="small"
                  />
                </div>
              )}
            </div>

                <Modal
                  className="hs-booking-modal"
                  title={
                    <div className="hs-booking-modal__head">
                      <p className="hs-booking-modal__eyebrow">Action</p>
                      <h2 className="hs-booking-modal__title">Cancel Booking</h2>
                      <p className="hs-booking-modal__sub">
                        Provide a reason before confirming cancellation
                      </p>
                    </div>
                  }
                  open={isModalVisible}
                  onOk={handleOk}
                  onCancel={handleCancel}
                  confirmLoading={submitLoading}
                  okText="Confirm Cancellation"
                  cancelText="Hide"
                  destroyOnClose
                  centered
                >
                  <div className="hs-bf" style={{ paddingBottom: 8 }}>
                    {currentBooking && (
                      <div className="hs-bf__section" style={{ marginBottom: 12 }}>
                        <div className="hs-bf__section-body" style={{ paddingBottom: 14 }}>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            {currentBooking.bookingNo}
                          </p>
                          <p style={{ margin: "4px 0 0", color: "#5f7478", fontSize: 12 }}>
                            Guest: {currentBooking.fullName} · Room:{" "}
                            {currentBooking.roomNumberName}
                          </p>
                        </div>
                      </div>
                    )}
                    <Form layout="vertical" className="hs-bf">
                      <Form.Item
                        label="Cancellation reason"
                        required
                        style={{ marginBottom: 0 }}
                      >
                        <Input.TextArea
                          id="reason"
                          value={cancellationReason}
                          onChange={handleCancelReasonChange}
                          placeholder="Enter cancellation reason"
                          rows={4}
                          autoFocus
                        />
                      </Form.Item>
                    </Form>
                  </div>
                </Modal>

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
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="font-semibold text-sm">
                              {(Array.isArray(selectedBookingDetails.payments) && selectedBookingDetails.payments[0]?.paymentMethod) ||
                                selectedBookingDetails.paymentMethod || "N/A"}
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                            <p className="font-semibold text-sm">
                              {(Array.isArray(selectedBookingDetails.payments) && selectedBookingDetails.payments[0]?.transactionId) ||
                                selectedBookingDetails.transactionId || "N/A"}
                            </p>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-500 mb-1">Booked By</p>
                            <p className="font-semibold text-sm">{selectedBookingDetails.bookedBy || selectedBookingDetails.bookedByID || "N/A"}</p>
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

                <Modal
                  className="hs-booking-modal"
                  title={
                    <div className="hs-booking-modal__head">
                      <p className="hs-booking-modal__eyebrow">
                        {isEditing ? "Update record" : "New reservation"}
                      </p>
                      <h2 className="hs-booking-modal__title">
                        {isEditing ? "Edit Booking" : "Create Booking"}
                      </h2>
                      <p className="hs-booking-modal__sub">
                        Guest, room, stay dates and payment in one place
                      </p>
                    </div>
                  }
                  open={visible}
                  onCancel={() => {
                    setVisible(false);
                    setIsEditing(false);
                    setEditingKey(null);
                    setPrevData(null);
                    setInitialPaymentCount(0);
                    setIsHotelFromReference(false);
                    formik.resetForm();
                    hasHandledQueryParams.current = false;
                    if (searchParams.get("room") || searchParams.get("date")) {
                      router.replace("/dashboard?menu=6");
                    }
                    if (!isEditing) {
                      fetchHotelInfo();
                    }
                  }}
                  footer={null}
                  width={1080}
                  centered
                  destroyOnClose
                >
                  <Form
                    onFinish={formik.handleSubmit}
                    layout="vertical"
                    className="hs-bf booking-form"
                    requiredMark="optional"
                  >
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
                              ? formik.values.payments.reduce(
                                  (s, p) => s + (Number(p.amount) || 0),
                                  0
                                )
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
                          <Form.Item label="Reference booking no.">
                            <Input
                              name="reference"
                              value={formik.values.reference}
                              onChange={(e) => {
                                formik.handleChange(e);
                                if (!e.target.value?.trim()) setIsHotelFromReference(false);
                              }}
                              onBlur={handleBlur}
                              placeholder="Previous booking no."
                              allowClear
                            />
                          </Form.Item>
                          <Form.Item label="Full name" required>
                            <Input
                              name="fullName"
                              value={formik.values.fullName}
                              onChange={formik.handleChange}
                              placeholder="Guest full name"
                              required
                            />
                          </Form.Item>
                          <Form.Item label="Phone number" required>
                            <Input
                              name="phone"
                              value={formik.values.phone}
                              onChange={formik.handleChange}
                              placeholder="01XXXXXXXXX"
                              required
                            />
                          </Form.Item>
                          <Form.Item label="NID / Passport">
                            <Input
                              name="nidPassport"
                              value={formik.values.nidPassport}
                              onChange={formik.handleChange}
                              placeholder="ID document number"
                            />
                          </Form.Item>
                          <Form.Item label="Address" className="hs-bf__span-full">
                            <Input
                              name="address"
                              value={formik.values.address}
                              onChange={formik.handleChange}
                              placeholder="Full address"
                            />
                          </Form.Item>
                        </div>
                      </div>
                    </section>

                    <section className="hs-bf__section">
                      <div className="hs-bf__section-head">
                        <h3 className="hs-bf__section-title">Stay details</h3>
                        <p className="hs-bf__section-hint">Check-in · check-out · guests</p>
                      </div>
                      <div className="hs-bf__section-body">
                        <div className="hs-bf__dates-grid">
                          <Form.Item label="Check-in date" required>
                            <DatePicker
                              name="checkInDate"
                              value={formik.values.checkInDate}
                              onChange={handleCheckInChange}
                              format="DD/MM/YYYY"
                              className="w-full"
                              disabledDate={(current) => {
                                if (!current) return false;
                                return isDateInExistingBooking(current, "checkIn");
                              }}
                            />
                          </Form.Item>
                          <Form.Item label="Check-out date" required>
                            <DatePicker
                              name="checkOutDate"
                              value={formik.values.checkOutDate}
                              onChange={handleCheckOutChange}
                              format="DD/MM/YYYY"
                              className="w-full"
                              disabledDate={(current) => {
                                if (!current) return false;
                                const checkIn = formik.values.checkInDate;
                                if (
                                  checkIn &&
                                  (current.isBefore(dayjs(checkIn), "day") ||
                                    current.isSame(dayjs(checkIn), "day"))
                                )
                                  return true;
                                return isDateInExistingBooking(current, "checkOut");
                              }}
                            />
                          </Form.Item>
                          <Form.Item label="Nights" required>
                            <Input
                              name="nights"
                              type="number"
                              min={1}
                              value={formik.values.nights}
                              onChange={(e) => {
                                formik.handleChange(e);
                                const nights = Number(e.target.value) || 0;
                                const roomPrice = Number(formik.values.roomPrice) || 0;
                                const breakfastTotalBill = formik.values.isBreakfast
                                  ? Number(formik.values.breakfastTotalBill) || 0
                                  : 0;
                                const totalBill = nights * roomPrice + breakfastTotalBill;
                                const advancePayment = Number(formik.values.advancePayment) || 0;
                                const duePayment = Math.max(0, totalBill - advancePayment);
                                formik.setFieldValue("totalBill", totalBill);
                                formik.setFieldValue("duePayment", duePayment);
                              }}
                              placeholder="Nights"
                              required
                            />
                          </Form.Item>
                          <Form.Item label="Adults / Children">
                            <div className="hs-bf__split">
                              <Input
                                name="adults"
                                type="number"
                                min={1}
                                value={formik.values.adults}
                                onChange={formik.handleChange}
                                placeholder="Adults"
                                addonBefore="A"
                              />
                              <Input
                                name="children"
                                type="number"
                                min={0}
                                value={formik.values.children}
                                onChange={formik.handleChange}
                                placeholder="Children"
                                addonBefore="C"
                              />
                            </div>
                          </Form.Item>
                        </div>
                      </div>
                    </section>

                    <section className="hs-bf__section">
                      <div className="hs-bf__section-head">
                        <h3 className="hs-bf__section-title">Room selection</h3>
                        <p className="hs-bf__section-hint">Hotel · category · room · rate</p>
                      </div>
                      <div className="hs-bf__section-body">
                        <div className="hs-bf__room-grid">
                          <Form.Item label="Hotel" required>
                            <Select
                              name="hotelName"
                              value={formik.values.hotelName}
                              onChange={handleHotelInfo}
                              placeholder={hotelInfo.length === 0 ? "Loading..." : "Select hotel"}
                              disabled
                              showSearch
                              optionFilterProp="children"
                              filterOption={(input, option) => {
                                const children = option?.children || "";
                                return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                              }}
                              notFoundContent={
                                hotelInfo.length === 0
                                  ? "No hotels available"
                                  : "No matching hotels found"
                              }
                            >
                              {hotelInfo && hotelInfo.length > 0 ? (
                                hotelInfo.map((hotel) => (
                                  <Select.Option key={hotel.hotelID} value={hotel.hotelName}>
                                    {hotel.hotelName || `Hotel ${hotel.hotelID}`}
                                  </Select.Option>
                                ))
                              ) : (
                                <Select.Option value="" disabled>
                                  No hotels available
                                </Select.Option>
                              )}
                            </Select>
                          </Form.Item>
                          <Form.Item label="Room category" required>
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
                            >
                              {roomCategories.map((category) => (
                                <Select.Option key={category._id} value={category._id}>
                                  {category.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item label="Room number" required>
                            <Select
                              name="roomNumberID"
                              value={formik.values.roomNumberID}
                              onChange={(value) => {
                                const selectedRoom = roomNumbers.find((room) => room._id === value);
                                formik.setFieldValue("roomNumberID", value);
                                formik.setFieldValue(
                                  "roomNumberName",
                                  selectedRoom ? selectedRoom.name || selectedRoom.roomId : ""
                                );

                                if (selectedRoom) {
                                  if (selectedRoom.capacity?.adults) {
                                    formik.setFieldValue("adults", selectedRoom.capacity.adults);
                                  }
                                  if (selectedRoom.capacity?.children !== undefined) {
                                    formik.setFieldValue(
                                      "children",
                                      selectedRoom.capacity.children || 0
                                    );
                                  }
                                }

                                if (selectedRoom && selectedRoom.price) {
                                  formik.setFieldValue("roomPrice", selectedRoom.price);
                                  const nights = Number(formik.values.nights) || 0;
                                  const breakfastTotalBill = formik.values.isBreakfast
                                    ? Number(formik.values.breakfastTotalBill) || 0
                                    : 0;
                                  const totalBill = nights * selectedRoom.price + breakfastTotalBill;
                                  const advancePayment = Number(formik.values.advancePayment) || 0;
                                  const duePayment = Math.max(0, totalBill - advancePayment);
                                  formik.setFieldValue("totalBill", totalBill);
                                  formik.setFieldValue("duePayment", duePayment);
                                }
                              }}
                              placeholder={
                                formik.values.checkInDate &&
                                formik.values.checkOutDate &&
                                roomNumbers.length === 0
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
                            >
                              {roomNumbers.map((room) => (
                                <Select.Option key={room._id} value={room._id}>
                                  {room.name || room.roomId}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item label="Room price / night" required>
                            <Input
                              name="roomPrice"
                              type="number"
                              value={formik.values.roomPrice}
                              onChange={(e) => {
                                formik.handleChange(e);
                                const roomPrice = Number(e.target.value) || 0;
                                const nights = Number(formik.values.nights) || 0;
                                const breakfastTotalBill = formik.values.isBreakfast
                                  ? Number(formik.values.breakfastTotalBill) || 0
                                  : 0;
                                const totalBill = nights * roomPrice + breakfastTotalBill;
                                const advancePayment = Number(formik.values.advancePayment) || 0;
                                const duePayment = Math.max(0, totalBill - advancePayment);
                                formik.setFieldValue("totalBill", totalBill);
                                formik.setFieldValue("duePayment", duePayment);
                              }}
                              placeholder="Price per night"
                              prefix="৳"
                              required
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
                            <Input
                              name="totalBill"
                              type="number"
                              min={0}
                              value={formik.values.totalBill}
                              onChange={handleTotalBillChange}
                              placeholder="Total bill"
                              prefix="৳"
                              disabled
                            />
                          </Form.Item>
                          <Form.Item label="Advance (total)">
                            <Input
                              type="number"
                              min={0}
                              value={
                                Array.isArray(formik.values.payments)
                                  ? formik.values.payments.reduce(
                                      (s, p) => s + (Number(p.amount) || 0),
                                      0
                                    )
                                  : formik.values.advancePayment
                              }
                              onChange={handleAdvanceTotalChange}
                              placeholder="Advance"
                              prefix="৳"
                              disabled
                            />
                          </Form.Item>
                          <Form.Item label="Due payment">
                            <Input
                              name="duePayment"
                              type="number"
                              min={0}
                              value={formik.values.duePayment}
                              onChange={handleDuePaymentChange}
                              placeholder="Due"
                              prefix="৳"
                              disabled
                            />
                          </Form.Item>
                        </div>

                        {(Array.isArray(formik.values.payments) ? formik.values.payments : []).map(
                          (_, index) => {
                            const isExistingPayment = isEditing && index < initialPaymentCount;
                            const usedMethods = (formik.values.payments || [])
                              .map((p, i) =>
                                i !== index && (p.paymentMethod || "").trim()
                                  ? String(p.paymentMethod).trim().toUpperCase()
                                  : null
                              )
                              .filter(Boolean);
                            return (
                              <div className="hs-bf__pay-row" key={index}>
                                <Form.Item label={index === 0 ? "Method" : " "}>
                                  <Select
                                    value={
                                      formik.values.payments[index]?.paymentMethod
                                        ? String(formik.values.payments[index].paymentMethod)
                                            .trim()
                                            .toUpperCase()
                                        : undefined
                                    }
                                    onChange={(value) => {
                                      const next = [...formik.values.payments];
                                      if (!next[index])
                                        next[index] = {
                                          paymentMethod: "",
                                          amount: 0,
                                          transactionId: "",
                                        };
                                      next[index].paymentMethod = value ?? "";
                                      formik.setFieldValue("payments", next);
                                      syncAdvanceFromPayments(next);
                                    }}
                                    placeholder="Method"
                                    optionFilterProp="label"
                                    allowClear
                                    disabled={isExistingPayment}
                                  >
                                    <Select.Option
                                      value="BKASH"
                                      label="BKASH"
                                      disabled={usedMethods.includes("BKASH")}
                                    >
                                      BKASH
                                    </Select.Option>
                                    <Select.Option
                                      value="NAGAD"
                                      label="NAGAD"
                                      disabled={usedMethods.includes("NAGAD")}
                                    >
                                      NAGAD
                                    </Select.Option>
                                    <Select.Option
                                      value="BANK"
                                      label="BANK"
                                      disabled={usedMethods.includes("BANK")}
                                    >
                                      BANK
                                    </Select.Option>
                                    <Select.Option
                                      value="CASH"
                                      label="CASH"
                                      disabled={usedMethods.includes("CASH")}
                                    >
                                      CASH
                                    </Select.Option>
                                  </Select>
                                </Form.Item>
                                <Form.Item label={index === 0 ? "Payment date" : " "}>
                                  <DatePicker
                                    value={
                                      formik.values.payments[index]?.date
                                        ? dayjs(formik.values.payments[index].date)
                                        : null
                                    }
                                    onChange={(date) => {
                                      const next = [...formik.values.payments];
                                      if (!next[index])
                                        next[index] = {
                                          paymentMethod: "",
                                          amount: 0,
                                          transactionId: "",
                                          date: null,
                                        };
                                      next[index].date = date || null;
                                      formik.setFieldValue("payments", next);
                                    }}
                                    format="DD/MM/YYYY"
                                    allowClear
                                    disabled={isExistingPayment}
                                  />
                                </Form.Item>
                                <Form.Item label={index === 0 ? "Amount" : " "}>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={formik.values.payments[index]?.amount ?? ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const totalBill = parseFloat(formik.values.totalBill) || 0;
                                      const next = [...formik.values.payments];
                                      if (!next[index])
                                        next[index] = {
                                          paymentMethod: "",
                                          amount: 0,
                                          transactionId: "",
                                        };
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
                                      const next = [...formik.values.payments];
                                      if (!next[index])
                                        next[index] = {
                                          paymentMethod: "",
                                          amount: 0,
                                          transactionId: "",
                                        };
                                      next[index].transactionId = e.target.value;
                                      formik.setFieldValue("payments", next);
                                    }}
                                    placeholder="Optional"
                                    disabled={isExistingPayment}
                                  />
                                </Form.Item>
                                <div className="hs-bf__pay-actions">
                                  {isExistingPayment ? (
                                    <Popconfirm
                                      title="Delete this payment?"
                                      description="This will remove only this payment row from booking."
                                      onConfirm={() =>
                                        deleteBookingPaymentById(
                                          editingKey,
                                          formik.values.payments[index],
                                          index
                                        )
                                      }
                                      okText="Yes"
                                      cancelText="No"
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        loading={submitLoading}
                                      />
                                    </Popconfirm>
                                  ) : formik.values.payments.length > 1 ? (
                                    <Button
                                      type="text"
                                      danger
                                      icon={<MinusCircleOutlined />}
                                      onClick={() => {
                                        const next = formik.values.payments.filter(
                                          (_, i) => i !== index
                                        );
                                        if (next.length === 0)
                                          next.push({
                                            paymentMethod: "",
                                            amount: 0,
                                            transactionId: "",
                                            date: null,
                                          });
                                        formik.setFieldValue("payments", next);
                                        syncAdvanceFromPayments(next);
                                      }}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            );
                          }
                        )}
                        <Button
                          type="dashed"
                          block
                          icon={<PlusOutlined />}
                          className="hs-bf__add-pay"
                          onClick={() => {
                            const next = [
                              ...(formik.values.payments || []),
                              {
                                paymentMethod: "",
                                amount: 0,
                                transactionId: "",
                                date: null,
                              },
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
                          <div>
                            <div className="hs-bf__breakfast">
                              <div className="hs-bf__breakfast-top">
                                <div>
                                  <div className="hs-bf__breakfast-label">Breakfast</div>
                                  <div className="hs-bf__breakfast-hint">
                                    Include breakfast with this stay
                                  </div>
                                </div>
                                <Switch
                                  checked={formik.values.isBreakfast}
                                  onChange={(checked) => {
                                    formik.setFieldValue("isBreakfast", checked);
                                    if (!checked) {
                                      formik.setFieldValue("breakfastTotalBill", 0);
                                      const nights = Number(formik.values.nights) || 0;
                                      const roomPrice = Number(formik.values.roomPrice) || 0;
                                      const totalBill = nights * roomPrice;
                                      const advancePayment =
                                        Number(formik.values.advancePayment) || 0;
                                      const duePayment = Math.max(0, totalBill - advancePayment);
                                      formik.setFieldValue("totalBill", totalBill);
                                      formik.setFieldValue("duePayment", duePayment);
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
                                      const breakfastTotalBill = Number(e.target.value) || 0;
                                      formik.setFieldValue(
                                        "breakfastTotalBill",
                                        breakfastTotalBill
                                      );
                                      const nights = Number(formik.values.nights) || 0;
                                      const roomPrice = Number(formik.values.roomPrice) || 0;
                                      const totalBill = nights * roomPrice + breakfastTotalBill;
                                      const advancePayment =
                                        Number(formik.values.advancePayment) || 0;
                                      const duePayment = Math.max(0, totalBill - advancePayment);
                                      formik.setFieldValue("totalBill", totalBill);
                                      formik.setFieldValue("duePayment", duePayment);
                                    }}
                                    placeholder="Breakfast amount"
                                    prefix="৳"
                                  />
                                </Form.Item>
                              )}
                            </div>
                          </div>
                          <Form.Item label="Internal note">
                            <Input.TextArea
                              name="note"
                              value={formik.values.note}
                              onChange={formik.handleChange}
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
                          setVisible(false);
                          setIsEditing(false);
                          setEditingKey(null);
                          setPrevData(null);
                          setInitialPaymentCount(0);
                          setIsHotelFromReference(false);
                          formik.resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="primary" htmlType="submit" loading={submitLoading}>
                        {isEditing ? "Update Booking" : "Create Booking"}
                      </Button>
                    </div>
                  </Form>
                </Modal>
          </div>
        </>
      ) : (
        <NoPermissionBanner />
      )}
    </div>
  );
};

export default BookingInfo;