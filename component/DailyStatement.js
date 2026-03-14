"use client";

import { useState, useEffect } from "react";
import { Button, message, Spin, Alert, Tooltip, InputNumber, Pagination } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import moment from "moment";

dayjs.extend(utc);
dayjs.extend(timezone);
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined } from "@ant-design/icons";
import Link from "next/link";
import DatePicker from "antd/es/date-picker";
import { useFormik } from "formik";
import DailySummary from "./DailySummary";
import NoPermissionBanner from "./Permission/NoPermissionBanner";
import { getPagePermissionFromStorage, normalizeContentPermissions } from "@/utils/pagePermission";

const DailyStatement = ({ contentPermissions: contentPermissionsFromProps }) => {
  const contentPermissions = contentPermissionsFromProps
    ? normalizeContentPermissions(contentPermissionsFromProps)
    : getPagePermissionFromStorage(["Daily Statement"]);
  const canView = contentPermissions.viewAccess;
  const canEdit = contentPermissions.editAccess;
  const [bookings, setBookings] = useState({
    regularInvoice: [],
    unPaidInvoice: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() =>
    dayjs().tz("Asia/Dhaka").startOf("day")
  );

  const todayBD = () => dayjs().tz("Asia/Dhaka").startOf("day");
  const [submitting, setSubmitting] = useState({});
  const [dailyIncome, setDailyIncome] = useState(0);
  const PAGE_SIZE = 10;
  const [regularPage, setRegularPage] = useState(1);
  const [unpaidPage, setUnpaidPage] = useState(1);

  const formik = useFormik({
    initialValues: {},
    onSubmit: async (values, { resetForm }) => { },
  });

  const isSameDay = (date1, date2) => {
    return dayjs(date1).isSame(dayjs(date2), "day");
  };

  // Calculate payment totals by method (supports paymentMethod or method from backend)
  const getPaymentTotals = (payments, fallbackAdvance = 0) => {
    if (!Array.isArray(payments) || payments.length === 0) {
      return { bkash: 0, cash: fallbackAdvance, bank: 0, nagad: 0 };
    }
    return payments.reduce(
      (acc, payment) => {
        const method = (payment.paymentMethod || payment.method || "").toUpperCase();
        const amount = Number(payment.amount) || 0;
        if (method === "BKASH") acc.bkash += amount;
        else if (method === "CASH") acc.cash += amount;
        else if (method === "BANK") acc.bank += amount;
        else if (method === "NAGAD") acc.nagad += amount;
        return acc;
      },
      { bkash: 0, cash: 0, bank: 0, nagad: 0 }
    );
  };

  const getCumulativeTotals = (booking) => {
    const advance = Number(booking.advancePayment) || 0;
    const paymentTotals = getPaymentTotals(booking.payments, advance);

    const totalBill = booking.totalBill || 0;
    const sumOfPaymentMethods = paymentTotals.bkash + paymentTotals.cash + paymentTotals.bank + paymentTotals.nagad;
    const effectiveAdvance = sumOfPaymentMethods > 0 ? sumOfPaymentMethods : advance;

    const sumOfDailyAmounts = (booking.invoiceDetails || []).reduce(
      (sum, entry) => sum + (Number(entry?.dailyAmount) || 0),
      0
    );
    const totalPaid = effectiveAdvance + sumOfDailyAmounts;

    const duePayment = Math.max(0, totalBill - totalPaid);

    return {
      totalPaid,
      dailyAmount: booking.dailyAmount || 0,
      duePayment,
      bkash: paymentTotals.bkash,
      bank: paymentTotals.bank,
      nagad: paymentTotals.nagad,
    };
  };

  /** First date (Asia/Dhaka) when due was fully cleared (total paid >= total bill), or null if not yet cleared */
  const getDueClearedDate = (booking) => {
    const totalBill = Number(booking.totalBill) || 0;
    const advance = Number(booking.advancePayment) || 0;
    if (advance >= totalBill) {
      return null; // cleared before any daily entry; treat as "no single clear date" – don't show in unpaid
    }
    const entries = [...(booking.invoiceDetails || [])].filter(
      (e) => e?.date != null
    );
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = advance;
    for (const entry of entries) {
      running += Number(entry?.dailyAmount) || 0;
      if (running >= totalBill) {
        return dayjs(entry.date).tz("Asia/Dhaka").startOf("day");
      }
    }
    return null;
  };

  const fetchBookingsByDate = async (date) => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/bookings");

      if (response.status === 200) {
        let allBookings = Array.isArray(response.data) ? response.data : [];

        // Filter out cancelled
        allBookings = allBookings.filter((b) => b && b.statusID !== 255);

        // Optional: filter by hotel for hoteladmin (same as dashboard)
        try {
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          const userRole = userInfo?.role?.value;
          const userHotelID = Number(userInfo?.hotelID);
          if (userRole === "hoteladmin" && userHotelID) {
            allBookings = allBookings.filter(
              (b) => b && Number(b.hotelID) === userHotelID
            );
          }
        } catch (_) {}

        // Use selected date (from date picker) for "today" so lists and form reflect that day
        const selectedDay = dayjs(date).tz("Asia/Dhaka").startOf("day");

        // Show bookings where selected date is within stay (checkIn <= selected <= checkOut)
        const bookingsForDate = allBookings.filter((booking) => {
          if (!booking.checkInDate || !booking.checkOutDate) return false;
          const checkIn = dayjs(booking.checkInDate).tz("Asia/Dhaka").startOf("day");
          const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka").startOf("day");
          return (
            !selectedDay.isBefore(checkIn) && !selectedDay.isAfter(checkOut)
          );
        });

        // Unpaid = only when selected date is the checkout date (same day) AND due amount > 0
        const unPaidInvoice = allBookings.filter((booking) => {
          if (!booking.checkOutDate) return false;
          const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka").startOf("day");
          const isCheckoutDay = selectedDay.isSame(checkOut, "day");
          if (!isCheckoutDay) return false;
          const totals = getCumulativeTotals(booking);
          const duePayment = totals.duePayment || 0;
          return duePayment > 0;
        });

        // Regular = bookings active on selected date (checkIn <= selected <= checkOut) that are not in unpaid
        const regularInvoice = bookingsForDate.filter((booking) => {
          if (!booking.checkOutDate) return true;
          const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka").startOf("day");
          const isCheckoutDay = selectedDay.isSame(checkOut, "day");
          if (!isCheckoutDay) return true;
          const totals = getCumulativeTotals(booking);
          return (totals.duePayment || 0) <= 0;
        });

        setBookings({
          regularInvoice: regularInvoice,
          unPaidInvoice: unPaidInvoice,
        });

        const initialValues = {};

        // Process all invoices – use dayjs for robust same-day comparison
        [...regularInvoice, ...unPaidInvoice].forEach((booking) => {
          const dateEntry = booking.invoiceDetails?.find((entry) =>
            entry?.date && dayjs(entry.date).isSame(date, "day")
          );

          const id = booking._id || booking.id;
          if (id) {
            initialValues[id] = {
              totalPaid: getCumulativeTotals(booking).totalPaid || 0,
              dailyAmount: dateEntry?.dailyAmount ?? 0,
            };
          }
        });

        formik.setValues(initialValues, false);

        // Calculate daily income
        const calculatedDailyIncome = Object.values(initialValues).reduce(
          (sum, value) => sum + (value.dailyAmount || 0),
          0
        );
        setDailyIncome(calculatedDailyIncome);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch bookings"
      );
      setBookings({
        regularInvoice: [],
        unPaidInvoice: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (bookingId) => {
    setSubmitting((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const dailyAmount = Number(formik.values[bookingId]?.dailyAmount) || 0;
      const booking = [
        ...bookings.regularInvoice,
        ...bookings.unPaidInvoice,
      ].find((b) => (b._id || b.id) === bookingId);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get existing payment for the selected date if any
      const existingPayment = booking.invoiceDetails?.find((payment) =>
        dayjs(payment.date).isSame(selectedDate, "day")
      );

      // Get current totals from the booking
      const currentTotals = getCumulativeTotals(booking);
      const currentTotalPaid = currentTotals.totalPaid;
      const currentDailyAmount = existingPayment?.dailyAmount || 0;

      // Calculate new total paid
      const newTotalPaid = currentTotalPaid - currentDailyAmount + dailyAmount;
      const newDuePayment = (booking.totalBill || 0) - newTotalPaid;

      // Validations
      if (newTotalPaid > (booking.totalBill || 0)) {
        throw new Error("Total paid cannot exceed total bill");
      }
      if (dailyAmount < 0) {
        throw new Error("Daily amount cannot be negative");
      }

      // Update invoiceDetails array
      let updatedInvoiceDetails = booking.invoiceDetails || [];
      if (existingPayment) {
        // Update existing entry
        updatedInvoiceDetails = updatedInvoiceDetails.map((entry) =>
          dayjs(entry.date).isSame(selectedDate, "day")
            ? { ...entry, dailyAmount: dailyAmount, date: selectedDate.toISOString() }
            : entry
        );
      } else {
        // Add new entry
        updatedInvoiceDetails.push({
          date: selectedDate.toISOString(),
          dailyAmount: dailyAmount,
        });
      }

      // Use the correct API endpoint PUT /booking/:id
      const response = await coreAxios.put(`/booking/${bookingId}`, {
        totalPaid: newTotalPaid,
        duePayment: newDuePayment,
        invoiceDetails: updatedInvoiceDetails,
      });

      if (response.status === 200) {
        message.success(
          existingPayment
            ? "Payment updated successfully"
            : "Payment added successfully"
        );
        await fetchBookingsByDate(selectedDate);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      message.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update payment"
      );
    } finally {
      setSubmitting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  useEffect(() => {
    fetchBookingsByDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setRegularPage(1);
    setUnpaidPage(1);
  }, [bookings.regularInvoice?.length, bookings.unPaidInvoice?.length]);

  const regularDisplay =
    bookings.regularInvoice?.slice(
      (regularPage - 1) * PAGE_SIZE,
      regularPage * PAGE_SIZE
    ) ?? [];
  const unpaidDisplay =
    bookings.unPaidInvoice?.slice(
      (unpaidPage - 1) * PAGE_SIZE,
      unpaidPage * PAGE_SIZE
    ) ?? [];

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handlePreviousDay = () =>
    setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNextDay = () => {
    const today = todayBD();
    setSelectedDate((prev) => {
      const next = prev.add(1, "day");
      return next.isAfter(today, "day") ? prev : next;
    });
  };

  // Calculate totals
  const regularTotals = bookings.regularInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking);
      const dateEntry = booking.invoiceDetails?.find((entry) =>
        isSameDay(new Date(entry.date), selectedDate.toDate())
      );

      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        dailyAmount: acc.dailyAmount + (dateEntry?.dailyAmount || 0),
        duePayment: acc.duePayment + (totals.duePayment || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        bank: acc.bank + (totals.bank || 0),
        nagad: acc.nagad + (totals.nagad || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      dailyAmount: 0,
      duePayment: 0,
      bkash: 0,
      bank: 0,
      nagad: 0,
    }
  );

  const unpaidTotals = bookings.unPaidInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking);
      const dateEntry = booking.invoiceDetails?.find((entry) =>
        isSameDay(new Date(entry.date), selectedDate.toDate())
      );

      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        dailyAmount: acc.dailyAmount + (dateEntry?.dailyAmount || 0),
        duePayment: acc.duePayment + (totals.duePayment || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        bank: acc.bank + (totals.bank || 0),
        nagad: acc.nagad + (totals.nagad || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      dailyAmount: 0,
      duePayment: 0,
      bkash: 0,
      bank: 0,
      nagad: 0,
    }
  );

  if (!canView) {
    return <NoPermissionBanner />;
  }

  return (
    <div className="p-4 bg-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Daily Statement</h2>
        <div className="flex items-center gap-2">
          <Button
            type="default"
            onClick={handlePreviousDay}
            size="small"
          >
            ←
          </Button>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            allowClear={false}
            size="small"
            style={{ width: "140px" }}
            disabledDate={(d) => d && d.isAfter(todayBD(), "day")}
          />
          <Button
            type="default"
            onClick={handleNextDay}
            size="small"
          >
            →
          </Button>
        </div>
      </div>

      {/* Main Table - constrained width on large screens for better readability */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-full lg:max-w-6xl lg:mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]" style={{ fontSize: "11px", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb' }}>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Sl No.
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Room
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Invoice
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Name
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Phone
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Check In
                </th>
                <th className="px-2 py-1.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Check Out
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Nights
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Total
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Bkash
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Bank
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Total Paid
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Daily Amount
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#dc2626', backgroundColor: '#fee2e2', fontWeight: 600, fontSize: '10px' }}>
                  Due Amount
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Update
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="15" className="text-center p-4">
                    <Spin tip="Loading data..." />
                  </td>
                </tr>
              ) : bookings.regularInvoice?.length === 0 &&
                bookings.unPaidInvoice?.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center p-4">
                    <Alert message="No bookings found" type="info" />
                  </td>
                </tr>
              ) : (
                <>
                  {/* Regular Invoices */}
                  {regularDisplay.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
                    const remainingAmount =
                      (booking.totalBill || 0) - totals.totalPaid;
                    const bookingId = booking._id || booking.id;
                    const slNo = (regularPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={bookingId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-2 py-1.5 whitespace-nowrap text-center text-xs text-gray-800 border border-gray-300">
                          {slNo}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-center text-xs text-gray-800 font-medium border border-gray-300">
                          {booking.roomNumberName || booking.roomNumber || 0}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap border border-gray-300">
                          <span className="flex items-center justify-center gap-1.5">
                            <Link
                              target="_blank"
                              href={`/dashboard/${booking.bookingNo || booking.bookingNumber || booking._id}`}
                              passHref
                              className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-xs"
                            >
                              {booking.bookingNo || booking.bookingNumber || "N/A"}
                            </Link>
                            <Tooltip title="Click to copy">
                              <CopyToClipboard
                                text={booking.bookingNo || booking.bookingNumber || ""}
                                onCopy={() => message.success("Copied!")}
                              >
                                <CopyOutlined className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs" />
                              </CopyToClipboard>
                            </Tooltip>
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                          {booking.fullName || booking.guestName || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {booking.phone || booking.phoneNumber || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkInDate).format("D MMM YYYY")}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkOutDate).format("D MMM YYYY")}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-700 border border-gray-300">
                          {booking.nights || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                          {booking.totalBill || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {(totals.bkash || 0) + (totals.nagad || 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bank || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right border border-gray-300">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px", backgroundColor: "#f3f4f6", color: "#000" }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center border border-gray-300">
                          <InputNumber
                            min={0}
                            max={remainingAmount}
                            value={formik.values[bookingId]?.dailyAmount ?? ""}
                            onChange={(value) => {
                              if (value > remainingAmount) {
                                message.warning(
                                  "Daily amount cannot exceed due amount"
                                );
                                return;
                              }
                              const num = value ?? 0;
                              formik.setFieldValue(
                                `${bookingId}.dailyAmount`,
                                num
                              );
                              const newDailyIncome =
                                dailyIncome -
                                (formik.values[bookingId]?.dailyAmount || 0) +
                                num;
                              setDailyIncome(newDailyIncome);
                            }}
                            disabled={totals.duePayment <= 0 || !canEdit}
                            style={{ width: "80px", color: "#000" }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                          {totals.duePayment}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-gray-300">
                          {canEdit && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleUpdate(bookingId)}
                            loading={submitting[bookingId]}
                            disabled={totals.duePayment <= 0}
                            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                          >
                            Update
                          </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Regular Invoices Pagination */}
                  {bookings.regularInvoice?.length > PAGE_SIZE && (
                    <tr>
                      <td colSpan="15" className="px-2 py-2 border border-gray-300 bg-gray-50">
                        <div className="flex justify-end">
                          <Pagination
                            current={regularPage}
                            total={bookings.regularInvoice?.length ?? 0}
                            pageSize={PAGE_SIZE}
                            onChange={setRegularPage}
                            showSizeChanger={false}
                            showTotal={(total) => `Total ${total} items`}
                            size="small"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {(bookings.regularInvoice?.length > 0 || bookings.unPaidInvoice?.length > 0) && (
                    <tr>
                      <td colSpan="15" className="p-2"></td>
                    </tr>
                  )}

                  {/* Unpaid Invoices */}
                  {unpaidDisplay.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
                    const remainingAmount =
                      (booking.totalBill || 0) - totals.totalPaid;
                    const bookingId = booking._id || booking.id;
                    const slNo = (unpaidPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={bookingId}
                        className="hover:bg-amber-200 transition-colors bg-amber-100"
                      >
                        <td className="px-2 py-1.5 whitespace-nowrap text-center text-xs text-gray-800 border border-gray-300">
                          {slNo}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-center text-xs text-gray-800 font-medium border border-gray-300">
                          {booking.roomNumberName || booking.roomNumber || 0}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap border border-gray-300">
                          <span className="flex items-center justify-center gap-1.5">
                            <Link
                              target="_blank"
                              href={`/dashboard/${booking.bookingNo || booking.bookingNumber || booking._id}`}
                              passHref
                              className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium text-xs"
                            >
                              {booking.bookingNo || booking.bookingNumber || "N/A"}
                            </Link>
                            <Tooltip title="Click to copy">
                              <CopyToClipboard
                                text={booking.bookingNo || booking.bookingNumber || ""}
                                onCopy={() => message.success("Copied!")}
                              >
                                <CopyOutlined className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs" />
                              </CopyToClipboard>
                            </Tooltip>
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                          {booking.fullName || booking.guestName || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {booking.phone || booking.phoneNumber || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkInDate).format("D MMM YYYY")}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkOutDate).format("D MMM YYYY")}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-700 border border-gray-300">
                          {booking.nights || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                          {booking.totalBill || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {(totals.bkash || 0) + (totals.nagad || 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bank || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right border border-gray-300">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px", backgroundColor: "#f3f4f6", color: "#000" }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center border border-gray-300">
                          <InputNumber
                            min={0}
                            max={remainingAmount}
                            value={formik.values[bookingId]?.dailyAmount ?? ""}
                            onChange={(value) => {
                              if (value > remainingAmount) {
                                message.warning(
                                  "Daily amount cannot exceed due amount"
                                );
                                return;
                              }
                              const num = value ?? 0;
                              formik.setFieldValue(
                                `${bookingId}.dailyAmount`,
                                num
                              );
                              const newDailyIncome =
                                dailyIncome -
                                (formik.values[bookingId]?.dailyAmount || 0) +
                                num;
                              setDailyIncome(newDailyIncome);
                            }}
                            disabled={totals.duePayment <= 0 || !canEdit}
                            style={{ width: "80px", color: "#000" }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                          {totals.duePayment}
                        </td>
                        <td className="px-3 py-2.5 text-center border border-gray-300">
                          {canEdit && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleUpdate(bookingId)}
                            loading={submitting[bookingId]}
                            disabled={totals.duePayment <= 0}
                            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                          >
                            Update
                          </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Unpaid Invoices Pagination */}
                  {bookings.unPaidInvoice?.length > PAGE_SIZE && (
                    <tr>
                      <td colSpan="15" className="px-2 py-2 border border-gray-300 bg-amber-100">
                        <div className="flex justify-end">
                          <Pagination
                            current={unpaidPage}
                            total={bookings.unPaidInvoice?.length ?? 0}
                            pageSize={PAGE_SIZE}
                            onChange={setUnpaidPage}
                            showSizeChanger={false}
                            showTotal={(total) => `Total ${total} items`}
                            size="small"
                          />
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Grand Total: Regular + Unpaid */}
                  {(bookings.regularInvoice?.length > 0 || bookings.unPaidInvoice?.length > 0) && (
                    <tr className="bg-blue-100 border-t-2 border-blue-300">
                      <td
                        colSpan="8"
                        className="px-2 py-1.5 text-right text-xs font-bold text-gray-900 border border-gray-300"
                      >
                        Total:
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.totalBill || 0) + (unpaidTotals?.totalBill || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {((regularTotals?.bkash || 0) + (regularTotals?.nagad || 0)) + ((unpaidTotals?.bkash || 0) + (unpaidTotals?.nagad || 0))}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.bank ?? 0) + (unpaidTotals?.bank ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.totalPaid || 0) + (unpaidTotals?.totalPaid || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.dailyAmount || 0) + (unpaidTotals?.dailyAmount || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300" style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                        {(regularTotals?.duePayment || 0) + (unpaidTotals?.duePayment || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-center border border-gray-300">
                        -
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2">
        <div className="w-full">
          <DailySummary selectedDate={selectedDate} dailyIncome={dailyIncome} />
        </div>
      </div>
    </div>
  );
};

export default DailyStatement;