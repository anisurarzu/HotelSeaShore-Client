"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Switch,
  message,
} from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import coreAxios from "@/utils/axiosInstance";

const BookingForm = ({
  visible,
  setVisible,
  isEditing,
  setIsEditing,
  editingKey,
  setEditingKey,
  fetchBookings,
  fetchHotelInfo,
  hotelInfo,
  prevData,
  setPrevData,
  userInfo,
}) => {
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState(null);

  // Function to check if two date ranges overlap
  const areDatesOverlapping = (checkInDate, checkOutDate, bookedDates) => {
    return bookedDates.some((bookedDate) => {
      const booked = dayjs(bookedDate);
      const checkIn = dayjs(checkInDate);
      const checkOut = dayjs(checkOutDate);

      return (
        (booked.isAfter(checkIn, "day") && booked.isBefore(checkOut, "day")) ||
        booked.isSame(checkIn, "day") ||
        booked.isSame(checkOut, "day")
      );
    });
  };

  const fetchHotelCategories = async (value) => {
    const hotel = hotelInfo.find((hotel) => hotel.hotelID === value);
    if (hotel && hotel.roomCategories) {
      setRoomCategories(hotel.roomCategories);
    } else {
      setRoomCategories([]);
    }
  };

  const fetchRoomNumbers = async (value) => {
    const room = roomCategories.find((room) => room._id === value);
    if (room && room.roomNumbers) {
      const availableRooms = room.roomNumbers.filter((roomNumber) => {
        if (roomNumber.bookedDates.length > 0) {
          const checkInDate = dayjs(formik.values.checkInDate);
          const checkOutDate = dayjs(formik.values.checkOutDate);
          const adjustedCheckOutDate = checkInDate.isSame(checkOutDate, "day")
            ? checkOutDate
            : checkOutDate.subtract(1, "day");

          const isOverlapping = areDatesOverlapping(
            checkInDate,
            adjustedCheckOutDate,
            roomNumber.bookedDates
          );
          return !isOverlapping;
        }
        return true;
      });
      setRoomNumbers(availableRooms);
    } else {
      setRoomNumbers([]);
    }
  };

  const fetchGuestInfo = async (name) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/guest?name=${name}`);
      if (response.data) {
        setGuestInfo(response.data);
        formik.setValues({
          fullName: response.data.fullName,
          nidPassport: response.data.nidPassport,
          address: response.data.address,
          phone: response.data.phone,
          email: response.data.email,
        });
      } else {
        setGuestInfo(null);
      }
    } catch (error) {
      message.error("Failed to fetch guest information.");
    } finally {
      setLoading(false);
    }
  };

  const updateRoomBookingStatus = async (values) => {
    setLoading(true);

    const getBookedDates = (checkInDate, checkOutDate) => {
      const startDate = dayjs(checkInDate);
      const endDate = dayjs(checkOutDate);
      const bookedDates = [];

      for (let d = startDate; d.isBefore(endDate); d = d.add(1, "day")) {
        bookedDates.push(d.format("YYYY-MM-DD"));
      }
      return bookedDates;
    };

    const bookingUpdatePayload = {
      hotelID: values?.hotelID,
      categoryName: values?.roomCategoryName,
      roomName: values?.roomNumberName,
      booking: {
        name: values.roomNumberName,
        bookedDates: getBookedDates(values.checkInDate, values.checkOutDate),
        bookings: [
          {
            guestName: values.fullName,
            checkIn: dayjs(values.checkInDate).format("YYYY-MM-DD"),
            checkOut: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
            bookedBy: values.bookedBy,
            adults: values?.adults,
            children: values?.children,
            paymentDetails: {
              totalBill: values.totalBill,
              advancePayment: values.advancePayment,
              duePayment: values.duePayment,
              paymentMethod: values.paymentMethod,
              transactionId: values.transactionId,
            },
          },
        ],
      },
    };

    try {
      if (isEditing) {
        const deleteResponse = await coreAxios.delete("/bookings/delete", {
          data: {
            hotelID: prevData?.hotelID,
            categoryName: prevData?.roomCategoryName,
            roomName: prevData?.roomNumberName,
            datesToDelete: getAllDatesBetween(
              prevData?.checkInDate,
              prevData?.checkOutDate
            ),
          },
        });
        if (deleteResponse.status === 200) {
          await processBookingUpdate(values, bookingUpdatePayload);
        }
      } else {
        await processBookingUpdate(values, bookingUpdatePayload);
      }
    } catch (error) {
      message.error("An error occurred while updating the booking.");
    } finally {
      setLoading(false);
    }
  };

  const processBookingUpdate = async (values, bookingUpdatePayload) => {
    const updateBookingResponse = await coreAxios.put(
      `/hotel/room/updateBooking`,
      bookingUpdatePayload
    );

    if (updateBookingResponse.status === 200) {
      const newBooking = {
        ...values,
        checkIn: dayjs(values.checkInDate).format("YYYY-MM-DD"),
        checkOut: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
        key: uuidv4(),
        bookingID: updateBookingResponse?.data?.hotel?._id,
      };

      let response;
      if (isEditing) {
        response = await coreAxios.put(`booking/${editingKey}`, newBooking);
      } else {
        response = await coreAxios.post("booking", newBooking);
      }

      if (response.status === 200) {
        message.success("Booking created/updated successfully!");
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        fetchHotelInfo();
        fetchBookings();
      }
    }
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

  const handleHotelInfo = (value) => {
    const selectedHotel = hotelInfo.find((hotel) => hotel.hotelID === value);
    formik.setFieldValue("roomCategoryID", 0);
    formik.setFieldValue("roomCategoryName", "");
    formik.setFieldValue("roomNumberID", "");
    formik.setFieldValue("roomNumberName", "");
    formik.setFieldValue("hotelID", value);
    formik.setFieldValue(
      "hotelName",
      selectedHotel ? selectedHotel.hotelName : ""
    );
    fetchHotelCategories(value);
  };

  const handleRoomCategoryChange = (value) => {
    const selectedCategory = roomCategories.find(
      (category) => category._id === value
    );
    formik.setFieldValue("roomNumberID", 0);
    formik.setFieldValue("roomNumberName", "");
    formik.setFieldValue("roomCategoryID", value);
    formik.setFieldValue(
      "roomCategoryName",
      selectedCategory ? selectedCategory.name : ""
    );
    fetchRoomNumbers(value);
  };

  const handleCheckInChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("hotelName", "");
      formik.setFieldValue("hotelID", 0);
      formik.setFieldValue("roomCategoryID", 0);
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", 0);
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("checkOutDate", "");
    }
    formik.setFieldValue("checkInDate", date);
    calculateNights(date, formik.values.checkOutDate);
  };

  const handleCheckOutChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("hotelName", "");
      formik.setFieldValue("hotelID", 0);
      formik.setFieldValue("roomCategoryID", 0);
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", 0);
      formik.setFieldValue("roomNumberName", "");
    }
    formik.setFieldValue("checkOutDate", date);
    calculateNights(formik.values.checkInDate, date);
  };

  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formik.setFieldValue("nights", diffDays);
    } else {
      formik.setFieldValue("nights", 0);
    }
  };

  const handleAdvancePaymentChange = (e) => {
    const advancePayment = e.target.value;
    const totalBill = formik.values.totalBill;
    const duePayment = totalBill - advancePayment;
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
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
      nights: 0,
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
      adults: 0,
      children: 0,
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        await updateRoomBookingStatus(values);
        resetForm();
      } catch (error) {
        message.error("Failed to add/update booking.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record?._id);
    setPrevData(record);
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
  const fetchBookingDetails = async (bookingNo) => {
    try {
      const response = await coreAxios.get(`/bookings/bookingNo/${bookingNo}`);
      if (response?.status === 200) {
        console.log("-----", response?.data?.[0]?.hotelID);
        // Fetch hotel categories based on the hotelID from booking details
        await fetchHotelCategories(response?.data?.[0]?.hotelID);
      }
      return response.data;
    } catch (error) {
      message.error(
        "Failed to fetch booking details. Please check the booking number."
      );
      return null;
    }
  };

  const handleBlur = async (e) => {
    const { value } = e.target;
    if (value) {
      const bookings = await fetchBookingDetails(value);
      const bookingDetails = bookings[0];

      const checkInDate = dayjs(bookingDetails.checkInDate);
      const checkOutDate = dayjs(bookingDetails.checkOutDate);
      if (bookingDetails) {
        formik.setValues({
          ...formik.values,
          fullName: bookingDetails.fullName,
          nidPassport: bookingDetails.nidPassport,
          address: bookingDetails.address,
          phone: bookingDetails.phone,
          email: bookingDetails.email,
          hotelName: bookingDetails.hotelName,
          hotelID: bookingDetails.hotelID,
          roomCategoryName: bookingDetails.roomCategoryID,
          roomNumberName: bookingDetails.roomNumberName,
          roomPrice: bookingDetails.roomPrice,
          // checkInDate: checkInDate,
          // checkOutDate: checkOutDate,
          adults: bookingDetails.adults,
          children: bookingDetails.children,
          nights: bookingDetails.nights,
          totalBill: bookingDetails.totalBill,
          advancePayment: bookingDetails.advancePayment,
          duePayment: bookingDetails.duePayment,
          paymentMethod: bookingDetails.paymentMethod,
          transactionId: bookingDetails.transactionId,
          // note: bookingDetails.note,
        });
        message.success("Booking details loaded successfully!");
      }
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Booking" : "Create Booking"}
      open={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      width={800}
    >
      <Form onFinish={formik.handleSubmit} layout="vertical">
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Prev Booking No." className="mb-2">
              <Input
                name="reference"
                value={formik.values.reference}
                onChange={formik.handleChange}
                onBlur={handleBlur} // Call API when the user leaves the input
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Full Name" className="mb-2">
              <Input
                name="fullName"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                required={true}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="NID/Passport" className="mb-2">
              <Input
                name="nidPassport"
                value={formik.values.nidPassport}
                onChange={formik.handleChange}
                required={false}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Address" className="mb-2">
              <Input
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                required={false}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Phone Number" className="mb-2">
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                required={true}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="E-mail" className="mb-2">
              <Input
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                required={false}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Check In Date" className="mb-2">
              <DatePicker
                name="checkInDate"
                value={formik.values.checkInDate}
                required={true}
                onChange={handleCheckInChange}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Check Out Date" className="mb-2">
              <DatePicker
                name="checkOutDate"
                required={true}
                value={formik.values.checkOutDate}
                onChange={handleCheckOutChange}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Hotel Name" className="mb-2">
              <Select
                name="hotelName"
                value={formik.values.hotelName}
                onChange={handleHotelInfo}
              >
                {hotelInfo.map((hotel) => (
                  <Select.Option key={hotel.hotelID} value={hotel.hotelID}>
                    {hotel.hotelName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Room Categories" className="mb-2">
              <Select
                name="roomCategoryID"
                value={formik.values.roomCategoryName}
                onChange={handleRoomCategoryChange}
              >
                {roomCategories.map((category) => (
                  <Select.Option key={category._id} value={category._id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Room Number" className="mb-2">
              <Select
                name="roomNumberID"
                value={formik.values.roomNumberName}
                onChange={(value) => {
                  const selectedRoom = roomNumbers.find(
                    (room) => room._id === value
                  );
                  formik.setFieldValue("roomNumberID", value);
                  formik.setFieldValue(
                    "roomNumberName",
                    selectedRoom ? selectedRoom.name : ""
                  );
                }}
              >
                {roomNumbers.map((room) => (
                  <Select.Option key={room._id} value={room._id}>
                    {room.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Room Price" className="mb-2">
              <Input
                name="roomPrice"
                value={formik.values.roomPrice}
                onChange={(e) => {
                  formik.handleChange(e);

                  // Calculate and update totalBill
                  const roomPrice = e.target.value;
                  const nights = formik.values.nights;
                  const kitchenTotalBill = formik.values.kitchenTotalBill || 0;
                  const extraBedTotalBill =
                    formik.values.extraBedTotalBill || 0;

                  const totalBill =
                    (nights && roomPrice ? nights * roomPrice : 0) +
                    parseFloat(kitchenTotalBill) +
                    parseFloat(extraBedTotalBill);

                  formik.setFieldValue("totalBill", totalBill);
                }}
                required={true}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Number of Adults" className="mb-2">
              <Input
                name="adults"
                value={formik.values.adults}
                onChange={formik.handleChange}
                required={false}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Number of Children" className="mb-2">
              <Input
                name="children"
                value={formik.values.children}
                onChange={formik.handleChange}
                required={false}
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Number of Nights" className="mb-2">
              <Input
                name="nights"
                value={formik.values.nights}
                onChange={(e) => {
                  formik.handleChange(e);

                  // Calculate and update totalBill
                  const nights = e.target.value;
                  const roomPrice = formik.values.roomPrice;
                  const kitchenTotalBill = formik.values.kitchenTotalBill || 0;
                  const extraBedTotalBill =
                    formik.values.extraBedTotalBill || 0;

                  const totalBill =
                    (nights && roomPrice ? nights * roomPrice : 0) +
                    parseFloat(kitchenTotalBill) +
                    parseFloat(extraBedTotalBill);

                  formik.setFieldValue("totalBill", totalBill);
                }}
                required={true}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Total Bill" className="mb-2">
              <Input
                name="totalBill"
                value={formik.values.totalBill}
                readOnly // Making this field read-only to prevent manual editing
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Advance Payment" className="mb-2">
              <Input
                name="advancePayment"
                required={true}
                value={formik.values.advancePayment}
                onChange={handleAdvancePaymentChange}
              />
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Due Payment" className="mb-2">
              <Input
                name="duePayment"
                value={formik.values.duePayment}
                readOnly
              />
            </Form.Item>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Payment Method" className="mb-2">
              <Select
                required={true}
                name="paymentMethod"
                value={formik.values.paymentMethod}
                onChange={(value) =>
                  formik.setFieldValue("paymentMethod", value)
                }
              >
                <Select.Option value="BKASH">BKASH</Select.Option>
                <Select.Option value="NAGAD">NAGAD</Select.Option>
                <Select.Option value="BANK">BANK</Select.Option>
                <Select.Option value="CASH">CASH</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Transaction ID" className="mb-2">
              <Input
                required={true}
                name="transactionId"
                value={formik.values.transactionId}
                onChange={formik.handleChange}
              />
            </Form.Item>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Other fields in this row */}
          <div style={{ flex: 1 }}>
            <Form.Item label="Is Kitchen?" className="mb-2">
              <Switch
                checked={formik.values.isKitchen} // Use formik's value for isKitchen
                onChange={(checked) =>
                  formik.setFieldValue("isKitchen", checked)
                } // Update formik value on switch toggle
              />
            </Form.Item>
            {formik.values.isKitchen && ( // Conditionally render totalBill field if isKitchen is true
              <Form.Item label="Total Bill (Kitchen)" className="mb-2">
                <Input
                  type="number"
                  value={formik.values.kitchenTotalBill || ""}
                  onChange={(e) => {
                    formik.setFieldValue("kitchenTotalBill", e.target.value);

                    // Recalculate totalBill
                    const kitchenTotalBill = e.target.value || 0;
                    const nights = formik.values.nights || 0;
                    const roomPrice = formik.values.roomPrice || 0;
                    const extraBedTotalBill =
                      formik.values.extraBedTotalBill || 0;

                    const totalBill =
                      (nights && roomPrice ? nights * roomPrice : 0) +
                      parseFloat(kitchenTotalBill) +
                      parseFloat(extraBedTotalBill);

                    formik.setFieldValue("totalBill", totalBill);
                  }}
                />
              </Form.Item>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Form.Item label="Extra Bed?" className="mb-2">
              <Switch
                checked={formik.values.extraBed} // Use formik's value for extraBed
                onChange={(checked) =>
                  formik.setFieldValue("extraBed", checked)
                } // Update formik value on switch toggle
              />
            </Form.Item>
            {formik.values.extraBed && ( // Conditionally render totalBill field if extraBed is true
              <Form.Item label="Total Bill (Extra Bed)" className="mb-2">
                <Input
                  type="number"
                  value={formik.values.extraBedTotalBill || ""}
                  onChange={(e) => {
                    formik.setFieldValue("extraBedTotalBill", e.target.value);

                    // Recalculate totalBill
                    const extraBedTotalBill = e.target.value || 0;
                    const nights = formik.values.nights || 0;
                    const roomPrice = formik.values.roomPrice || 0;
                    const kitchenTotalBill =
                      formik.values.kitchenTotalBill || 0;

                    const totalBill =
                      (nights && roomPrice ? nights * roomPrice : 0) +
                      parseFloat(kitchenTotalBill) +
                      parseFloat(extraBedTotalBill);

                    formik.setFieldValue("totalBill", totalBill);
                  }}
                />
              </Form.Item>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <Form.Item label="Note" className="mb-2">
              <Input
                name="note"
                value={formik.values.note}
                onChange={formik.handleChange}
              />
            </Form.Item>
          </div>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="bg-[#8ABF55] hover:bg-[#7DA54E]"
        >
          {isEditing ? "Update Booking" : "Create Booking"}
        </Button>
      </Form>
    </Modal>
  );
};

export default BookingForm;
