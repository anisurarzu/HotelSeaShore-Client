"use client";

import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  DollarOutlined,
  CreditCardOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState, useMemo } from "react";
import { Button, Spin, message, Space } from "antd";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment";

// Shared layout for Print & PDF – same design
const INVOICE_PAGE_MARGIN_IN = 0.3;
const INVOICE_WIDTH_A4 = "210mm";

const Invoice = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    extraBedTotalBill: 0,
    kitchenTotalBill: 0,
    totalBill: 0,
    finalTotal: 0,
  });
  const { id } = params;

  const fetchInvoiceInfo = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get(`/bookings/bookingNo/${id}`);
      if (response?.status === 200) {
        const filteredData = response?.data.filter(
          (item) => item.statusID !== 255
        );
        calculateTotals(filteredData);
        setData(filteredData);
      } else {
        message.error("Failed to load data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceInfo();
  }, []);

  const print = () => {
    window.print();
  };

  const downloadPDF = async () => {
    if (!document) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("invoice-card");
    const options = {
      margin: [INVOICE_PAGE_MARGIN_IN, INVOICE_PAGE_MARGIN_IN, INVOICE_PAGE_MARGIN_IN, INVOICE_PAGE_MARGIN_IN],
      filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };
    html2pdf().from(element).set(options).save();
  };

  const calculateTotals = (bookings) => {
    const totalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.totalBill || 0),
      0
    );
    const kitchenTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.kitchenTotalBill || 0),
      0
    );
    const extraBedTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.extraBedTotalBill || 0),
      0
    );
    const finalTotal = totalBill + kitchenTotalBill + extraBedTotalBill;

    setTotals({
      totalBill,
      kitchenTotalBill,
      extraBedTotalBill,
      finalTotal,
    });
  };

  // Total Paid = sum of all payments from ALL invoices (same as Payment History)
  const totalPaidFromInvoices = useMemo(() => {
    let sum = 0;
    (data || []).forEach((inv) => {
      if (Array.isArray(inv.payments) && inv.payments.length > 0) {
        inv.payments.forEach((p) => { sum += Number(p.amount) || 0; });
      } else if (Number(inv?.advancePayment) > 0) {
        sum += Number(inv.advancePayment);
      }
    });
    return sum;
  }, [data]);

  const dueAmount = totals.finalTotal - totalPaidFromInvoices;

  // Function to get hotel-specific color scheme
  const getHotelColorScheme = (hotelID) => {
    switch (hotelID) {
      case 1: // Mermaid
        return {
          primary: "#1e40af",
          secondary: "#eff6ff",
          accent: "#bfdbfe",
          tableHeader: "#1e40af",
          gradientFrom: "#1e3a8a",
          gradientTo: "#2563eb",
        };
      case 2: // Golden Hill
        return {
          primary: "#b45309",
          secondary: "#fffbeb",
          accent: "#fde68a",
          tableHeader: "#b45309",
          gradientFrom: "#92400e",
          gradientTo: "#d97706",
        };
      case 3: // Sea Paradise
        return {
          primary: "#047857",
          secondary: "#ecfdf5",
          accent: "#a7f3d0",
          tableHeader: "#047857",
          gradientFrom: "#065f46",
          gradientTo: "#059669",
        };
      case 4: // Shopno Bilash
        return {
          primary: "#1e3a8a",
          secondary: "#eff6ff",
          accent: "#c7d2fe",
          tableHeader: "#1e3a8a",
          gradientFrom: "#1e3a8a",
          gradientTo: "#3b82f6",
        };
      case 6: // Beach Garden
        return {
          primary: "#15803d",
          secondary: "#f0fdf4",
          accent: "#bbf7d0",
          tableHeader: "#15803d",
          gradientFrom: "#166534",
          gradientTo: "#22c55e",
        };
      case 7: // The Grand Sandy
        return {
          primary: "#6d28d9",
          secondary: "#faf5ff",
          accent: "#ddd6fe",
          tableHeader: "#6d28d9",
          gradientFrom: "#5b21b6",
          gradientTo: "#7c3aed",
        };
      default: // Default/Sea Shore
        return {
          primary: "#b91c1c",
          secondary: "#fef2f2",
          accent: "#fecaca",
          tableHeader: "#b91c1c",
          gradientFrom: "#991b1b",
          gradientTo: "#dc2626",
        };
    }
  };

  const getHotelInfo = () => {
    // Prevent showing any fallback logo before API data is ready
    if (!data?.[0]) {
      const colorScheme = getHotelColorScheme(undefined);
      return {
        name: "Hotel",
        logo: null,
        color: colorScheme.primary,
        colorScheme,
      };
    }

    const hotelID = Number(data?.[0]?.hotelID);
    const hotelLogo = data?.[0]?.hotelLogo;
    const hotelColor = data?.[0]?.hotelColor;
    
    // Use hotelLogo from API if available
    if (hotelLogo) {
      // Use refined golden/amber color scheme for logos from API (eye-catching but not too bright)
      const goldenColorScheme = {
        primary: "#b45309",
        secondary: "#fffbeb",
        accent: "#fde68a",
        tableHeader: "#b45309",
        gradientFrom: "#92400e",
        gradientTo: "#d97706",
      };
      
      // If hotelColor is provided, use it with refined tones; otherwise use golden
      const colorScheme = hotelColor ? {
        primary: hotelColor,
        secondary: "#fffbeb",
        accent: "#fde68a",
        tableHeader: hotelColor,
        gradientFrom: hotelColor,
        gradientTo: hotelColor,
      } : goldenColorScheme;
      
      return {
        name: data?.[0]?.hotelName || "Hotel",
        logo: hotelLogo,
        color: colorScheme.primary,
        colorScheme: colorScheme,
      };
    }
    
    const colorScheme = getHotelColorScheme(hotelID);
    
    // Fallback to hardcoded mapping if hotelLogo is not available
    const hotelInfoMap = {
      1: {
        name: "Mermaid",
        logo: "/images/marmaid-logo.png",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
      2: {
        name: "Hotel Golden Hill",
        logo: "/images/goldenhil.png",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
      3: {
        name: "Sea Paradise",
        logo: "/images/Shamudro-Bari-1.png",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
      4: {
        name: "Shopno Bilash Holiday Suites",
        logo: "/images/Sopno.png",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
      6: {
        name: "Beach Garden",
        logo: "https://i.ibb.co.com/jZDnyS4V/beach-gardn.png",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
      7: {
        name: "The Grand Sandy",
        logo: "https://i.ibb.co/svznKpfF/Whats-App-Image-2025-07-01-at-22-11-50-dda6f6f0.jpg",
        color: colorScheme.primary,
        colorScheme: colorScheme,
      },
    };
    return (
      hotelInfoMap[hotelID] || {
        name: data?.[0]?.hotelName || "Hotel",
        // If API doesn't provide a logo and hotelID isn't mapped, don't show any default logo
        logo: null,
        color: colorScheme.primary,
        colorScheme: colorScheme,
      }
    );
  };

  const hotelInfo = getHotelInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Loading invoice..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:py-0 print:px-0 print:bg-white">
      {/* Action Buttons - Hidden in Print */}
      <div className="max-w-5xl mx-auto mb-6 print:hidden">
        <Space size="middle">
              <Button
                type="primary"
                onClick={downloadPDF}
                icon={<DownloadOutlined />}
            size="large"
              >
                Download PDF
              </Button>
              <Button
                onClick={print}
                icon={<PrinterOutlined />}
            size="large"
              >
            Print Invoice
              </Button>
        </Space>
          </div>

      {/* Invoice Card – single source for Print & PDF (same design) */}
          <div
            id="invoice-card"
            className="invoice-card-export mx-auto bg-white shadow-md print:shadow-none"
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontSize: "10px",
              maxWidth: INVOICE_WIDTH_A4,
              width: "100%",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
        {/* Header Section */}
        <div 
          className="px-6 py-4 print:px-6 print:py-3"
          style={{
            background: `linear-gradient(to right, ${hotelInfo.colorScheme.gradientFrom}, ${hotelInfo.colorScheme.gradientTo})`
          }}
        >
          <div className="flex justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {hotelInfo.logo && (
                <div className="bg-white p-3 rounded shadow-sm">
                  <img
                    src={hotelInfo.logo}
                    alt={hotelInfo.name}
                    className="h-16 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Hotel Name – dynamic title between logo and invoice */}
            <div className="flex-1 text-center">
              <h2
                className="text-white font-bold tracking-wide m-0"
                style={{
                  fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
                  letterSpacing: "0.08em",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {hotelInfo.name}
              </h2>
            </div>

            {/* Invoice Info */}
            <div className="flex-shrink-0 text-right text-white">
              <h1 className="text-2xl font-bold tracking-tight mb-1 uppercase" style={{ letterSpacing: "0.05em" }}>
                Invoice
              </h1>
              <div className="space-y-0.5 opacity-90">
                <p className="font-semibold text-sm">
                  #{data?.[0]?.bookingNo || "N/A"}
                </p>
                <p className="font-normal text-sm">
                  {moment(data?.[0]?.createTime).format("MMM DD, YYYY") || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-4 print:px-6 print:py-3" style={{ fontSize: '10px' }}>
          {/* Guest & Hotel Information */}
          <div className="grid grid-cols-2 gap-8 mb-4">
            <div>
              <h2 
                className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                style={{
                  color: hotelInfo.colorScheme.tableHeader,
                  borderColor: hotelInfo.colorScheme.accent
                }}
              >
                Billed To
              </h2>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-xs">
                  {data?.[0]?.fullName || "N/A"}
                    </p>
                <p className="text-slate-600 text-xs">{data?.[0]?.phone || "N/A"}</p>
                {data?.[0]?.email && (
                  <p className="text-slate-600 text-xs">{data?.[0]?.email}</p>
                )}
                {/* ID (NID/Passport) hidden on invoice as requested */}
                {data?.[0]?.address && (
                  <p className="text-slate-600 text-xs">{data?.[0]?.address}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <h2 
                className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b text-right"
                style={{
                  color: hotelInfo.colorScheme.tableHeader,
                  borderColor: hotelInfo.colorScheme.accent
                }}
              >
                Hotel Information
              </h2>
              <div className="space-y-1 text-right">
                <p className="font-bold text-slate-900 text-xs">
                  {data?.[0]?.hotelInformation?.hotelName || data?.[0]?.hotelName || hotelInfo.name}
                </p>
                {(data?.[0]?.hotelInformation?.address?.address1 || data?.[0]?.hotelInformation?.address?.street) && (
                  <p className="text-slate-600 text-xs">
                    {data?.[0]?.hotelInformation?.address?.address1 || data?.[0]?.hotelInformation?.address?.street}
                  </p>
                )}
                {(() => {
                  const addr = data?.[0]?.hotelInformation?.address;
                  const line2 = addr?.address2 || [addr?.city, addr?.state, addr?.zipCode, addr?.country].filter(Boolean).join(", ");
                  if (!line2) return null;
                  return <p className="text-slate-600 text-xs">{line2}</p>;
                })()}
                {(data?.[0]?.hotelInformation?.reservationNo ?? data?.[0]?.hotelInformation?.contact?.email) && (
                  <p className="text-slate-600 text-xs">
                    Reservation No: {data?.[0]?.hotelInformation?.reservationNo ?? data?.[0]?.hotelInformation?.contact?.email}
                  </p>
                )}
                {(data?.[0]?.hotelInformation?.frontdeskNo ?? data?.[0]?.hotelInformation?.contact?.phone) && (
                  <p className="text-slate-600 text-xs">
                    Frontdesk No: {data?.[0]?.hotelInformation?.frontdeskNo ?? data?.[0]?.hotelInformation?.contact?.phone}
                  </p>
                )}
              </div>
            </div>
              </div>

          {/* Booking Details Table */}
          <div className="mb-3">
            <h2 
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: hotelInfo.colorScheme.tableHeader }}
            >
              Booking Details
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full" style={{ fontSize: '9px' }}>
                  <thead>
                  <tr 
                    className="border-b"
                    style={{
                      backgroundColor: hotelInfo.colorScheme.secondary,
                      borderColor: hotelInfo.colorScheme.accent
                    }}
                  >
                    <th
                      className="px-2 py-1.5 text-center text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader, width: 40 }}
                    >
                      SL
                    </th>
                    <th 
                      className="px-2 py-1.5 text-left text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                        Room
                      </th>
                    <th 
                      className="px-2 py-1.5 text-left text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Check-In
                      </th>
                    <th 
                      className="px-2 py-1.5 text-left text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Check-Out
                      </th>
                    <th 
                      className="px-2 py-1.5 text-center text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                        Nights
                      </th>
                    <th 
                      className="px-2 py-1.5 text-center text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Guests
                      </th>
                    <th 
                      className="px-2 py-1.5 text-right text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Rate
                      </th>
                    <th 
                      className="px-2 py-1.5 text-right text-xs font-bold uppercase"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Amount
                      </th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-100">
                    {data?.map((booking, index) => (
                      <tr key={index}>
                      <td className="px-2 py-1.5 text-xs text-center text-slate-600">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="font-semibold text-slate-900 text-xs">
                          {booking?.roomCategoryName || "N/A"}
                        </div>
                        </td>
                      <td className="px-2 py-1.5 text-xs text-slate-600">
                        {moment(booking?.checkInDate).format("MMM DD, YY")}
                        </td>
                      <td className="px-2 py-1.5 text-xs text-slate-600">
                        {moment(booking?.checkOutDate).format("MMM DD, YY")}
                        </td>
                      <td className="px-2 py-1.5 text-xs text-center font-semibold text-slate-700">
                        {booking?.nights || 0}
                        </td>
                      <td className="px-2 py-1.5 text-xs text-center text-slate-600">
                        {booking?.adults || 0}A{booking?.children > 0 ? `/${booking.children}C` : ''}
                        </td>
                      <td className="px-2 py-1.5 text-xs text-right text-slate-600">
                        ৳{Number(booking?.roomPrice || 0).toLocaleString()}
                        </td>
                      <td className="px-2 py-1.5 text-xs text-right font-bold text-slate-900">
                        ৳{Number(booking?.totalBill || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
              </div>

          {/* Additional Services */}
          {(totals.kitchenTotalBill > 0 || totals.extraBedTotalBill > 0) && (
            <div className="mb-3">
              <h2 
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: hotelInfo.colorScheme.tableHeader }}
              >
                Additional Services
              </h2>
              <div 
                className="border rounded overflow-hidden"
                style={{ 
                  borderColor: hotelInfo.colorScheme.accent 
                }}
              >
                {totals.kitchenTotalBill > 0 && (
                  <div 
                    className="flex justify-between items-center px-3 py-1.5 border-b"
                    style={{
                      backgroundColor: hotelInfo.colorScheme.secondary,
                      borderColor: hotelInfo.colorScheme.accent
                    }}
                  >
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Kitchen
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      ৳{totals.kitchenTotalBill.toLocaleString()}
                    </span>
                  </div>
                          )}
                {totals.extraBedTotalBill > 0 && (
                  <div 
                    className="flex justify-between items-center px-3 py-1.5"
                    style={{
                      backgroundColor: hotelInfo.colorScheme.secondary
                    }}
                  >
                    <span 
                      className="text-xs font-semibold"
                      style={{ color: hotelInfo.colorScheme.tableHeader }}
                    >
                      Extra Bed
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      ৳{totals.extraBedTotalBill.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {data?.[0]?.note && (
            <div className="mb-3 p-2 bg-amber-50 border-l-2 border-amber-400 rounded-r">
              <p className="text-xs font-bold text-amber-900 uppercase mb-1">
                Note
              </p>
              <p className="text-xs text-amber-900">{data[0].note}</p>
            </div>
          )}

          {/* Payment History + Totals (same row) */}
          <div className="mt-4 flex justify-between items-start gap-4">
            {/* Payment Information / Payment History */}
            <div className="flex-1 min-w-0">
              <div
                className="pt-3 border-t"
                style={{
                  borderColor: hotelInfo.colorScheme.accent
                }}
              >
                <p
                  className="text-xs font-semibold mb-2 uppercase"
                  style={{ color: hotelInfo.colorScheme.tableHeader }}
                >
                  Payment History
                </p>
                {(() => {
              // Collect payments from ALL invoices (data array)
              const allPayments = [];
              (data || []).forEach((inv) => {
                if (Array.isArray(inv.payments) && inv.payments.length > 0) {
                  inv.payments.forEach((p) => allPayments.push(p));
                } else if (Number(inv?.advancePayment) > 0) {
                  allPayments.push({
                    paymentMethod: inv.paymentMethod || "CASH",
                    transactionId: inv.transactionId || "",
                    amount: inv.advancePayment,
                  });
                }
              });
              if (allPayments.length === 0) {
                return (
                  <div className="flex justify-between items-stretch gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 rounded">
                        <p className="text-xs font-semibold mb-0.5 uppercase" style={{ color: hotelInfo.colorScheme.tableHeader }}>Payment Method</p>
                        <p className="font-bold text-slate-900 text-xs">{data?.[0]?.paymentMethod || "N/A"}</p>
                      </div>
                      <div className="p-2 rounded">
                        <p className="text-xs font-semibold mb-0.5 uppercase" style={{ color: hotelInfo.colorScheme.tableHeader }}>Transaction</p>
                        <p className="font-bold text-slate-900 text-xs">
                          {data?.[0]?.paymentMethod?.toUpperCase() === "CASH" && !data?.[0]?.transactionId ? "Cash" : (data?.[0]?.transactionId || "—")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              // Normalize then merge by method + TnxId (same txn sums; different TnxId = separate rows). Hide CASH when total is 0.
              const normalized = [...allPayments]
                .map((p) => ({
                  method: ((p.paymentMethod || p.method || "").trim() || "CASH").toUpperCase(),
                  txnId: (p.transactionId || "").trim(),
                  amount: Number(p.amount) || 0,
                  createdAt: p.createdAt || null,
                }))
                .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

              const mergeMap = new Map();
              for (const r of normalized) {
                // Same method + same TnxId (empty string groups "no id" payments together per method)
                const groupKey = `${r.method}|||${r.txnId}`;
                if (!mergeMap.has(groupKey)) {
                  mergeMap.set(groupKey, { method: r.method, txnId: r.txnId, amount: 0 });
                }
                const g = mergeMap.get(groupKey);
                g.amount += r.amount;
              }

              const methodOrder = (m) => {
                const order = ["CASH", "BKASH", "NAGAD", "BANK", "CARD"];
                const i = order.indexOf(m);
                return i === -1 ? 100 + m.charCodeAt(0) : i;
              };

              const mergedRows = [...mergeMap.values()]
                .filter((g) => !(g.method === "CASH" && (Number(g.amount) || 0) === 0))
                .sort((a, b) => {
                  const mo = methodOrder(a.method) - methodOrder(b.method);
                  if (mo !== 0) return mo;
                  return String(a.txnId || "").localeCompare(String(b.txnId || ""));
                })
                .map((g) => ({
                  method: g.method,
                  txnDisplay:
                    g.method === "CASH" ? "—" : g.txnId ? g.txnId : "—",
                  amount: g.amount,
                }));

              const fullPaidTotal = normalized.reduce((s, r) => s + (Number(r.amount) || 0), 0);

              return (
                <div className="w-full">
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full" style={{ fontSize: "9px" }}>
                      <thead>
                        <tr
                          className="border-b"
                          style={{
                            backgroundColor: hotelInfo.colorScheme.secondary,
                            borderColor: hotelInfo.colorScheme.accent,
                          }}
                        >
                          <th
                            className="px-2 py-1.5 text-center text-xs font-bold uppercase"
                            style={{ color: hotelInfo.colorScheme.tableHeader, width: 40 }}
                          >
                            SL
                          </th>
                          <th
                            className="px-2 py-1.5 text-left text-xs font-bold uppercase"
                            style={{ color: hotelInfo.colorScheme.tableHeader }}
                          >
                            Method
                          </th>
                          <th
                            className="px-2 py-1.5 text-left text-xs font-bold uppercase"
                            style={{ color: hotelInfo.colorScheme.tableHeader }}
                          >
                            TnxId
                          </th>
                          <th
                            className="px-2 py-1.5 text-right text-xs font-bold uppercase"
                            style={{ color: hotelInfo.colorScheme.tableHeader }}
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mergedRows.length === 0 ? (
                          <tr>
                            <td className="px-2 py-1.5 text-xs text-center text-slate-500" colSpan={4}>
                              No payment rows to show (zero cash entries are hidden).
                            </td>
                          </tr>
                        ) : (
                          mergedRows.map((r, idx) => (
                            <tr key={`${r.method}-${r.txnDisplay}-${idx}`}>
                              <td className="px-2 py-1.5 text-xs text-center text-slate-600">{idx + 1}</td>
                              <td className="px-2 py-1.5 text-xs font-semibold text-slate-900">{r.method}</td>
                              <td className="px-2 py-1.5 text-xs text-slate-600 break-all">{r.txnDisplay}</td>
                              <td className="px-2 py-1.5 text-xs text-right font-bold text-slate-900 tabular-nums">
                                ৳{Number(r.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr
                          className="border-t"
                          style={{
                            borderColor: hotelInfo.colorScheme.accent,
                            backgroundColor: hotelInfo.colorScheme.secondary,
                          }}
                        >
                          <td className="px-2 py-1.5 text-xs" colSpan={3}>
                            <span className="font-bold text-slate-900">Total Paid</span>
                          </td>
                          <td className="px-2 py-1.5 text-xs text-right font-bold text-slate-900 tabular-nums">
                            ৳{fullPaidTotal.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
              </div>
            </div>

            {/* Totals Section: Subtotal → VAT/Tax → Total → Total Paid → Due */}
            <div className="w-full max-w-xs shrink-0">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-600 font-semibold">Subtotal</span>
                  <span className="text-slate-900 font-bold tabular-nums">৳{totals.finalTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs py-0.5">
                  {/* <span className="text-slate-600 font-semibold">VAT / Tax</span> */}
                  {/* <span className="text-slate-900 font-bold tabular-nums">৳0</span> */}
                </div>
                {/* Total hidden (same as Subtotal) */}
                <div className="flex justify-between text-xs py-0.5 border-t border-slate-200 pt-2">
                  <span className="text-slate-600 font-semibold">Total Paid</span>
                  <span className="text-green-700 font-bold tabular-nums">৳{totalPaidFromInvoices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-2 px-2.5 mt-1 rounded-md border border-red-200 bg-red-50">
                  <span className="font-bold text-red-900">Due</span>
                  <span className="font-bold text-red-800 tabular-nums">৳{Math.max(0, dueAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions (bottom) */}
          {Array.isArray(data?.[0]?.hotelInformation?.termsAndConditions) &&
            data?.[0]?.hotelInformation?.termsAndConditions?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <p
                  className="text-xs font-semibold mb-2 uppercase"
                  style={{ color: hotelInfo.colorScheme.tableHeader }}
                >
                  Terms & Conditions
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  {data[0].hotelInformation.termsAndConditions.map((t, idx) => (
                    <li key={idx} className="text-[11px] text-slate-700 leading-snug">
                      {/check-?\s*in\s*time|check-?\s*out\s*time/i.test(String(t)) ? (
                        <span className="font-bold text-slate-900">{t}</span>
                      ) : (
                        t
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600 font-semibold mb-1">
              Thank you for choosing {data?.[0]?.hotelName || hotelInfo.name}. We hope you enjoyed your stay.
            </p>
            <p className="text-[11px] text-slate-500">
              This is a system-generated report and does not require a signature. Technical support provided by Cox&apos;s Web Solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Print & PDF – same layout (A4, 0.3in margin, same invoice width) */}
      <style jsx global>{`
        .invoice-card-export {
          box-sizing: border-box;
        }
        @media print {
          @page {
            size: A4;
            margin: ${INVOICE_PAGE_MARGIN_IN}in;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #invoice-card,
          #invoice-card * {
            visibility: visible;
          }
          #invoice-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: ${INVOICE_WIDTH_A4} !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:px-6 {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .print\\:py-3 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;