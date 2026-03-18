"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button, message, Alert, Tooltip, InputNumber, Pagination, Skeleton } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import moment from "moment";

dayjs.extend(utc);
dayjs.extend(timezone);
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined } from "@ant-design/icons";
import { DownloadOutlined } from "@ant-design/icons";
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
  const summaryRef = useRef(null);
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

  /** Group booking.payments by date (createdAt); for a given date return merged { cash, bkash, nagad, bank } */
  const getPaymentsByDate = (booking, date) => {
    const payments = booking.payments || [];
    const dateKey = dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");
    const out = { cash: 0, bkash: 0, nagad: 0, bank: 0 };
    payments.forEach((p) => {
      const d = p.createdAt ? dayjs(p.createdAt).tz("Asia/Dhaka").format("YYYY-MM-DD") : null;
      if (d !== dateKey) return;
      const method = (p.paymentMethod || p.method || "").toUpperCase();
      const amount = Number(p.amount) || 0;
      if (method === "CASH") out.cash += amount;
      else if (method === "BKASH") out.bkash += amount;
      else if (method === "NAGAD") out.nagad += amount;
      else if (method === "BANK") out.bank += amount;
    });
    return out;
  };

  /** Total paid = sum of all payment amounts (payments array is source of truth); fallback advancePayment if no payments */
  const getTotalPaidOnDate = (booking, date) => {
    if (!date) return 0;
    const selectedKey = dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");

    // Preferred: backend-calculated per-day totals (controller: paidAmountsByDate)
    if (Array.isArray(booking?.paidAmountsByDate) && booking.paidAmountsByDate.length > 0) {
      const row = booking.paidAmountsByDate.find((r) => {
        const rowKey = r?.date ? dayjs(r.date).tz("Asia/Dhaka").format("YYYY-MM-DD") : null;
        return rowKey === selectedKey;
      });
      return Number(row?.totalPaid) || 0;
    }

    // Fallback: sum payments on that exact date
    const payments = Array.isArray(booking?.payments) ? booking.payments : [];
    if (payments.length > 0) {
      return payments.reduce((sum, p) => {
        const rowKey = p?.createdAt ? dayjs(p.createdAt).tz("Asia/Dhaka").format("YYYY-MM-DD") : null;
        if (!rowKey || rowKey !== selectedKey) return sum;
        return sum + (Number(p.amount) || 0);
      }, 0);
    }
    return 0;
  };

  const getTotalPaidUpToDate = (booking, date) => {
    if (!date) return 0;
    const selectedDay = dayjs(date).tz("Asia/Dhaka").endOf("day");

    // Preferred: backend-calculated per-day totals (controller: paidAmountsByDate)
    if (Array.isArray(booking?.paidAmountsByDate) && booking.paidAmountsByDate.length > 0) {
      return booking.paidAmountsByDate.reduce((sum, row) => {
        const d = row?.date ? dayjs(row.date).tz("Asia/Dhaka").endOf("day") : null;
        if (!d) return sum;
        if (d.isAfter(selectedDay, "day")) return sum;
        return sum + (Number(row.totalPaid) || 0);
      }, 0);
    }

    // Fallback: sum payments up to date (inclusive)
    const payments = Array.isArray(booking?.payments) ? booking.payments : [];
    if (payments.length > 0) {
      return payments.reduce((sum, p) => {
        const d = p?.createdAt ? dayjs(p.createdAt).tz("Asia/Dhaka").endOf("day") : null;
        if (!d) return sum;
        if (d.isAfter(selectedDay, "day")) return sum;
        return sum + (Number(p.amount) || 0);
      }, 0);
    }

    // Legacy fallback: treat advancePayment as paid on createdAt
    if (Number(booking?.advancePayment) > 0) {
      const created = booking?.createdAt ? dayjs(booking.createdAt).tz("Asia/Dhaka").endOf("day") : null;
      if (!created || created.isAfter(selectedDay, "day")) return 0;
      return Number(booking.advancePayment) || 0;
    }
    return 0;
  };

  const getCumulativeTotals = (booking, selectedDateForRow = null) => {
    const payments = booking.payments || [];
    const totalBill = Number(booking.totalBill) || 0;
    const totalPaidAllTime =
      payments.length > 0
        ? payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        : Number(booking.advancePayment) || 0;
    const totalPaid = selectedDateForRow ? getTotalPaidUpToDate(booking, selectedDateForRow) : totalPaidAllTime;
    const totalPaidOnDate =
      selectedDateForRow ? getTotalPaidOnDate(booking, selectedDateForRow) : totalPaidAllTime;
    const duePayment = Math.max(0, totalBill - totalPaid);

    const byDate = selectedDateForRow ? getPaymentsByDate(booking, selectedDateForRow) : { cash: 0, bkash: 0, nagad: 0, bank: 0 };
    return {
      totalPaid,
      totalPaidOnDate,
      duePayment,
      dailyAmount: byDate.cash,
      bkash: byDate.bkash + byDate.nagad,
      bank: byDate.bank,
      nagad: byDate.nagad,
    };
  };

  /** First date when total paid >= total bill (using payments in date order) */
  const getDueClearedDate = (booking) => {
    const totalBill = Number(booking.totalBill) || 0;
    const payments = [...(booking.payments || [])];
    payments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    let running = 0;
    for (const p of payments) {
      running += Number(p.amount) || 0;
      if (running >= totalBill) {
        const d = p.createdAt ? dayjs(p.createdAt).tz("Asia/Dhaka").startOf("day") : null;
        return d || null;
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

        // Unpaid list:
        // - when selected date is on or after checkout date
        // - keep invoice in this list even if due becomes 0 (history)
        const unPaidInvoice = allBookings.filter((booking) => {
          if (!booking.checkOutDate) return false;
          const checkOut = dayjs(booking.checkOutDate).tz("Asia/Dhaka").startOf("day");
          const isOnOrAfterCheckout = !selectedDay.isBefore(checkOut, "day");
          if (!isOnOrAfterCheckout) return false;
          return true;
        });

        // Regular = active bookings on selected date, but exclude anything that belongs to unpaid tab (checkout day & after)
        const unpaidIds = new Set(
          unPaidInvoice
            .map((b) => b?._id || b?.id)
            .filter(Boolean)
        );
        const regularInvoice = bookingsForDate.filter((booking) => {
          const id = booking?._id || booking?.id;
          return id ? !unpaidIds.has(id) : true;
        });

        setBookings({
          regularInvoice: regularInvoice,
          unPaidInvoice: unPaidInvoice,
        });

        const initialValues = {};

        [...regularInvoice, ...unPaidInvoice].forEach((booking) => {
          const id = booking._id || booking.id;
          if (!id) return;
          const byDate = getPaymentsByDate(booking, date);
          const totals = getCumulativeTotals(booking, date);
          initialValues[id] = {
            totalPaid: totals.totalPaid || 0,
            dailyAmount: byDate.cash ?? 0,
            bkash: (byDate.bkash || 0) + (byDate.nagad || 0),
            bank: byDate.bank ?? 0,
          };
        });

        formik.setValues(initialValues, false);

        const calculatedDailyIncome = [...regularInvoice, ...unPaidInvoice].reduce(
          (sum, booking) => {
            const byDate = getPaymentsByDate(booking, date);
            // For Daily Summary, Daily Income should reflect only daily CASH
            return sum + (byDate.cash || 0);
          },
          0
        );
        setDailyIncome(calculatedDailyIncome);
        try {
          const dateKey = selectedDay.format("YYYY-MM-DD");
          const payload = { dailyIncome: calculatedDailyIncome };
          localStorage.setItem(`dailySummary:${dateKey}`, JSON.stringify(payload));
        } catch (_) {}
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

      // Cumulative Total Paid up to the selectedDate (used for Due calculation)
      const currentTotals = getCumulativeTotals(booking, selectedDate);
      const currentTotalPaid = currentTotals.totalPaid;
      const byDate = getPaymentsByDate(booking, selectedDate);
      const currentDailyAmount = byDate.cash || 0;

      // Replace selectedDate CASH amount:
      // newCumulativePaid = currentCumulativePaid - oldDailyCash + newDailyCash
      const newTotalPaid = currentTotalPaid - currentDailyAmount + dailyAmount;
      const newDuePayment = (booking.totalBill || 0) - newTotalPaid;

      if (newTotalPaid > (booking.totalBill || 0)) {
        throw new Error("Total paid cannot exceed total bill");
      }
      if (dailyAmount < 0) {
        throw new Error("Daily amount cannot be negative");
      }

      const selectedKey = dayjs(selectedDate).tz("Asia/Dhaka").format("YYYY-MM-DD");
      // Send UTC midnight for backend dateKey (slice(0,10)) to match selectedKey
      const selectedISOForBackend = `${selectedKey}T00:00:00.000Z`;

      const existingEntry = booking.invoiceDetails?.find((entry) => {
        if (!entry?.date) return false;
        const entryKey = dayjs(entry.date).tz("Asia/Dhaka").format("YYYY-MM-DD");
        return entryKey === selectedKey;
      });
      let updatedInvoiceDetails = Array.isArray(booking.invoiceDetails)
        ? [...booking.invoiceDetails]
        : [];

      // Save daily-wise info in DB: selected date & that date's CASH total
      const newDailyAmountForDate = dailyAmount;
      const newEntry = {
        // Use fixed ISO date so backend's toISOString().slice(0,10) matches BD calendar date
        date: selectedISOForBackend,
        dailyAmount: newDailyAmountForDate,
        totalPaid: newTotalPaid, // (backend ignores, but keep for consistency)
        duePayment: newDuePayment,
      };
      if (existingEntry) {
        updatedInvoiceDetails = updatedInvoiceDetails.map((entry) =>
          entry?.date &&
          dayjs(entry.date).tz("Asia/Dhaka").format("YYYY-MM-DD") === selectedKey
            ? newEntry
            : entry
        );
      } else {
        updatedInvoiceDetails.push(newEntry);
      }

      // Normalize ALL invoiceDetails dates to UTC midnight based on Bangladesh day.
      // This prevents older shifted entries (UTC slicing) from overriding daily CASH rebuilds.
      updatedInvoiceDetails = updatedInvoiceDetails.map((entry) => {
        const k = entry?.date
          ? dayjs(entry.date).tz("Asia/Dhaka").format("YYYY-MM-DD")
          : selectedKey;
        return {
          ...entry,
          date: `${k}T00:00:00.000Z`,
          dailyAmount: Number(entry?.dailyAmount) || 0,
        };
      });

      // Build explicit CASH payments from invoiceDetails so backend dateKey matches.
      // Some controller variants only rely on `payments` to compute paidAmountsByDate.
      const datesInInvoice = new Set(
        updatedInvoiceDetails
          .map((e) => (e?.date ? new Date(e.date).toISOString().slice(0, 10) : null))
          .filter(Boolean)
      );

      const existingPayments = Array.isArray(booking.payments) ? booking.payments : [];
      const existingNonCashPayments = existingPayments.filter(
        (p) => String(p?.paymentMethod || "").toUpperCase() !== "CASH"
      );
      const existingCashPayments = existingPayments.filter((p) => {
        const method = String(p?.paymentMethod || "").toUpperCase();
        if (method !== "CASH") return true;
        if (!p?.createdAt) return true;
        const d = new Date(p.createdAt).toISOString().slice(0, 10);
        // Remove cash payments for any invoice date we are updating
        return !datesInInvoice.has(d);
      });

      const cashPaymentsFromInvoice = updatedInvoiceDetails
        .map((e) => ({
          paymentMethod: "CASH",
          amount: Number(e?.dailyAmount) || 0,
          transactionId: "",
          createdAt: e?.date,
        }))
        .filter((p) => Number(p.amount) > 0);

      const mergedPayments = [
        ...existingNonCashPayments,
        ...existingCashPayments,
        ...cashPaymentsFromInvoice,
      ];

      const computedTotalPaid = mergedPayments.reduce(
        (sum, p) => sum + (Number(p?.amount) || 0),
        0
      );
      const computedDuePayment = Math.max(
        0,
        (booking?.totalBill || 0) - computedTotalPaid
      );

      const response = await coreAxios.put(`/booking/${bookingId}`, {
        totalPaid: computedTotalPaid,
        duePayment: computedDuePayment,
        invoiceDetails: updatedInvoiceDetails,
        payments: mergedPayments,
      });

      if (response.status === 200) {
        message.success(
          existingEntry
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

  const handleDateChange = async (date) => {
    if (date) {
      try {
        await summaryRef.current?.save?.();
      } catch (_) {}
      setSelectedDate(date);
    }
  };

  const handlePreviousDay = async () => {
    try {
      await summaryRef.current?.save?.();
    } catch (_) {}
    setSelectedDate((prev) => prev.subtract(1, "day"));
  };

  const handleNextDay = async () => {
    try {
      await summaryRef.current?.save?.();
    } catch (_) {}
    const today = todayBD();
    setSelectedDate((prev) => {
      const next = prev.add(1, "day");
      return next.isAfter(today, "day") ? prev : next;
    });
  };

  // Calculate totals
  const regularTotals = bookings.regularInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking, selectedDate);
      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        totalPaidOnDate: acc.totalPaidOnDate + (totals.totalPaidOnDate || 0),
        dailyAmount: acc.dailyAmount + (totals.dailyAmount || 0),
        duePayment: acc.duePayment + (totals.duePayment || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        bank: acc.bank + (totals.bank || 0),
        nagad: acc.nagad + (totals.nagad || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      totalPaidOnDate: 0,
      dailyAmount: 0,
      duePayment: 0,
      bkash: 0,
      bank: 0,
      nagad: 0,
    }
  );

  const unpaidTotals = bookings.unPaidInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking, selectedDate);
      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        totalPaidOnDate: acc.totalPaidOnDate + (totals.totalPaidOnDate || 0),
        dailyAmount: acc.dailyAmount + (totals.dailyAmount || 0),
        duePayment: acc.duePayment + (totals.duePayment || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        bank: acc.bank + (totals.bank || 0),
        nagad: acc.nagad + (totals.nagad || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      totalPaidOnDate: 0,
      dailyAmount: 0,
      duePayment: 0,
      bkash: 0,
      bank: 0,
      nagad: 0,
    }
  );

  // Total of Daily Cash column (formik) — this is what we send to Daily Summary as Daily Income and save
  const totalDailyCashForSummary = useMemo(() => {
    const all = [...(bookings.regularInvoice || []), ...(bookings.unPaidInvoice || [])];
    return all.reduce(
      (sum, b) => sum + (Number(formik.values[b._id || b.id]?.dailyAmount) || 0),
      0
    );
  }, [bookings.regularInvoice, bookings.unPaidInvoice, formik.values]);

  const toBangladeshDateStr = (date) => dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");

  const downloadDailyStatementAndSummaryPdf = async () => {
    try {
      const dateStr = toBangladeshDateStr(selectedDate);

      const allBookings = [...(bookings.regularInvoice || []), ...(bookings.unPaidInvoice || [])];

      // Statement rows (UI daily cash input + saved daily cash from backend)
      const statementRows = allBookings.map((booking, idx) => {
        const bookingId = booking._id || booking.id;
        const totals = getCumulativeTotals(booking, selectedDate);
        const byDate = getPaymentsByDate(booking, selectedDate);
        const inputDailyCash = Number(formik.values?.[bookingId]?.dailyAmount) || 0;
        const remainingAmount = (booking.totalBill || 0) - totals.totalPaid;

        return {
          sl: idx + 1,
          room: booking.roomNumberName || booking.roomNumber || "N/A",
          invoice: booking.bookingNo || booking.bookingNumber || "N/A",
          guest: booking.fullName || booking.guestName || "N/A",
          phone: booking.phone || booking.phoneNumber || "N/A",
          checkIn: moment(booking.checkInDate).format("D MMM"),
          checkOut: moment(booking.checkOutDate).format("D MMM"),
          nights: booking.nights || 0,
          totalBill: Number(booking.totalBill || 0),
          bkash: Number(totals.bkash || 0),
          bank: Number(totals.bank || 0),
          totalPaid: Number(totals.totalPaid || 0),
          dailyCashFromDb: Number(byDate.cash || 0),
          inputDailyCash,
          due: Number(totals.duePayment || 0),
          remaining: Math.max(0, remainingAmount || 0),
        };
      });

      // Summary values
      const [sumRes, expRes] = await Promise.all([
        coreAxios.get(`/daily-summary/${dateStr}`).catch(() => null),
        coreAxios.get(`/expenses/sum/daily?date=${dateStr}`).catch(() => null),
      ]);

      const openingBalance = Number(sumRes?.status === 200 ? sumRes.data?.openingBalance : 0) || 0;
      const dailyExpenses = Number(expRes?.status === 200 ? expRes.data?.totalAmount : 0) || 0;
      const dailyIncome = Number(totalDailyCashForSummary) || 0;
      const totalBalance = openingBalance + dailyIncome;
      const closingBalance = totalBalance - dailyExpenses;

      const statementRowsHtml = statementRows.length
        ? statementRows
            .map(
              (r) => `
                  <tr>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:center;">${r.sl}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;">${r.room}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;">${r.invoice}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;">${r.phone}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:center;">${r.checkIn}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:center;">${r.checkOut}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:center;">${r.nights}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">${r.totalBill.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">${r.bkash.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">${r.bank.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">${r.totalPaid.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">${r.dailyCashFromDb.toLocaleString()}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;color:#dc2626;font-weight:600;">${Number(r.due ?? 0).toLocaleString()}</td>
              </tr>
            `
            )
            .join("")
          : `<tr><td colspan="13" style="border:1px solid #e5e7eb;padding:8px;font-size:9px;text-align:center;">No records</td></tr>`;

      const grandTotals = statementRows.reduce(
        (acc, r) => {
          acc.totalBill += Number(r?.totalBill || 0);
          acc.bkash += Number(r?.bkash || 0);
          acc.bank += Number(r?.bank || 0);
          acc.totalPaid += Number(r?.totalPaid || 0);
          acc.dailyCashFromDb += Number(r?.dailyCashFromDb || 0);
          acc.duePayment += Number(r?.due || 0);
          return acc;
        },
        {
          totalBill: 0,
          bkash: 0,
          bank: 0,
          totalPaid: 0,
          dailyCashFromDb: 0,
          duePayment: 0,
        }
      );

      const totalRowHtml =
        statementRows.length > 0
          ? `
              <tr>
                <td colSpan="7" style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  Total:
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  ${grandTotals.totalBill.toLocaleString()}
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  ${grandTotals.bkash.toLocaleString()}
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  ${grandTotals.bank.toLocaleString()}
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  ${grandTotals.totalPaid.toLocaleString()}
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
                  ${grandTotals.dailyCashFromDb.toLocaleString()}
                </td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#dc2626;line-height:1.1;">
                  ${grandTotals.duePayment.toLocaleString()}
                </td>
              </tr>
            `
          : "";

      const html = `
        <div id="daily-pdf-root" style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#0f172a;">
          <div style="padding:14px 18px;background:linear-gradient(135deg,#2563eb 0%, #1d4ed8 100%);color:#fff;text-align:center;">
            <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;">Daily Statement & Summary - Hotel Sea Shore</div>
            <div style="font-size:12px;opacity:0.95;margin-top:4px;">Date: ${dateStr}</div>
          </div>

          <div style="padding:14px 18px;">
            <div style="overflow:visible;">
              <table style="width:100%;border-collapse:collapse;min-width:740px;">
                <thead>
                  <tr>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">SL</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Room</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Invoice</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Phone</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Check-in</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Check-out</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">N</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Total Bill</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Bkash</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Bank</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Total Paid</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Daily Cash</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Due</th>
                  </tr>
                </thead>
                <tbody>
                  ${statementRowsHtml}
                  ${totalRowHtml}
                </tbody>
              </table>
            </div>
          </div>

          <div style="padding:0 18px 18px 18px;">
            <h3 style="margin:0 0 10px 0;font-size:14px;font-weight:800;color:#0f172a;border-bottom:3px solid #bbf7d0;padding-bottom:6px;width:100%;text-align:center;">Daily Summary</h3>
            <div style="overflow:visible;display:flex;justify-content:center;">
              <table style="width:50%;border-collapse:collapse;min-width:unset;">
                <tbody>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Opening Balance</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">৳${Number(openingBalance || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Daily Income (CASH)</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">৳${Number(dailyIncome || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Daily Expenses</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">৳${Number(dailyExpenses || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Closing Balance</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">৳${Number(closingBalance || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.innerHTML = html;
      document.body.appendChild(container);

      const html2pdf = (await import("html2pdf.js")).default;
      const element = container.querySelector("#daily-pdf-root");

      const options = {
        margin: [0.2, 0.2, 0.2, 0.2],
        filename: `Daily-Statement-Summary-${dateStr}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().from(element).set(options).save();
      container.remove();
    } catch (e) {
      console.error("Download PDF failed", e);
      message.error("Failed to download PDF");
    }
  };

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
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={downloadDailyStatementAndSummaryPdf}
          >
            Download PDF
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
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Total Paid
                </th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600, fontSize: '10px' }}>
                  Daily Cash
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
                Array.from({ length: 8 }).map((_, rowIdx) => (
                  <tr key={`skeleton-${rowIdx}`}>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 24, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 32, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 70, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 70, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 60, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 60, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 28, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 50, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 50, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 50, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 60, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 60, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 50, height: 20 }} />
                    </td>
                    <td className="px-2 py-1.5 border border-gray-300">
                      <Skeleton.Input active size="small" style={{ width: "100%", minWidth: 56, height: 20 }} />
                    </td>
                  </tr>
                ))
              ) : bookings.regularInvoice?.length === 0 &&
                bookings.unPaidInvoice?.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center p-4">
                    <Alert message="No bookings found" type="info" />
                  </td>
                </tr>
              ) : (
                <>
                  {/* Regular Invoices */}
                  {regularDisplay.map((booking, index) => {
                    const totals = getCumulativeTotals(booking, selectedDate);
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
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {booking.phone || booking.phoneNumber || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkInDate).format("D MMM")}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkOutDate).format("D MMM")}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-700 border border-gray-300">
                          {booking.nights || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                          {booking.totalBill || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bkash || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bank || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right border border-gray-300">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px", backgroundColor: "#f3f4f6", color: "#000", textAlign: "right" }}
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
                            style={{ width: "70px", color: "#000", textAlign: "right", fontSize: "10px" }}
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
                      <td colSpan="14" className="px-2 py-2 border border-gray-300 bg-gray-50">
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
                  <td colSpan="14" className="p-2"></td>
                    </tr>
                  )}

                  {/* Unpaid Invoices */}
                  {unpaidDisplay.map((booking, index) => {
                    const totals = getCumulativeTotals(booking, selectedDate);
                    const remainingAmount =
                      (booking.totalBill || 0) - totals.totalPaid;
                    const bookingId = booking._id || booking.id;
                    const slNo = (unpaidPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <tr
                        key={bookingId}
                        className="transition-colors"
                        style={{ backgroundColor: "#fee2e2" }}
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
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {booking.phone || booking.phoneNumber || "N/A"}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkInDate).format("D MMM")}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border border-gray-300">
                          {moment(booking.checkOutDate).format("D MMM")}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-700 border border-gray-300">
                          {booking.nights || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                          {booking.totalBill || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bkash || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-medium border border-gray-300">
                          {totals.bank || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right border border-gray-300">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px", backgroundColor: "#f3f4f6", color: "#000", textAlign: "right" }}
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
                            style={{ width: "70px", color: "#000", textAlign: "right", fontSize: "10px" }}
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
                      <td colSpan="14" className="px-2 py-2 border border-gray-300 bg-amber-100">
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
                        colSpan="7"
                        className="px-2 py-1.5 text-right text-xs font-bold text-gray-900 border border-gray-300"
                      >
                        Total:
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.totalBill || 0) + (unpaidTotals?.totalBill || 0)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs font-bold text-gray-900 border border-gray-300">
                        {(regularTotals?.bkash || 0) + (unpaidTotals?.bkash || 0)}
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
          <DailySummary
            ref={summaryRef}
            selectedDate={selectedDate}
            dailyIncome={totalDailyCashForSummary}
            hideSave
          />
        </div>
      </div>
    </div>
  );
};

export default DailyStatement;