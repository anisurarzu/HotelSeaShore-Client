"use client";

import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Button, Spin, message, Space } from "antd";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment";

const Invoice = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    totalAdvance: 0,
    extraBedTotalBill: 0,
    kitchenTotalBill: 0,
    totalDue: 0,
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
    const printContent = document.getElementById("invoice-card").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const downloadPDF = async () => {
    if (!document) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("invoice-card");
    const options = {
      margin: [0.2, 0.2, 0.2, 0.2],
      filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    html2pdf().from(element).set(options).save();
  };

  const calculateTotals = (bookings) => {
    const totalAdvance = bookings.reduce(
      (sum, booking) => sum + (booking?.advancePayment || 0),
      0
    );
    const totalDue = bookings.reduce(
      (sum, booking) => sum + (booking?.duePayment || 0),
      0
    );
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
      totalAdvance,
      totalDue,
      totalBill,
      kitchenTotalBill,
      extraBedTotalBill,
      finalTotal,
    });
  };

  const getHotelInfo = () => {
    const hotelID = data?.[0]?.hotelID;
    const hotelInfoMap = {
      1: {
        name: "Mermaid",
        logo: "/images/marmaid-logo.png",
        color: "#1e40af",
      },
      2: {
        name: "Hotel Golden Hill",
        logo: "/images/goldenhil.png",
        color: "#dc2626",
      },
      3: {
        name: "Sea Paradise",
        logo: "/images/Shamudro-Bari-1.png",
        color: "#dc2626",
      },
      4: {
        name: "Shopno Bilash Holiday Suites",
        logo: "/images/Sopno.png",
        color: "#1e3a8a",
      },
      6: {
        name: "Beach Garden",
        logo: "https://i.ibb.co.com/jZDnyS4V/beach-gardn.png",
        color: "#16a34a",
      },
      7: {
        name: "The Grand Sandy",
        logo: "https://i.ibb.co/svznKpfF/Whats-App-Image-2025-07-01-at-22-11-50-dda6f6f0.jpg",
        color: "#dc2626",
      },
    };
    return hotelInfoMap[hotelID] || {
      name: data?.[0]?.hotelName || "Hotel",
      logo: "/images/Shamudro-Bari-1.png",
      color: "#dc2626",
    };
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

      {/* Invoice Card */}
          <div
            id="invoice-card"
        className="max-w-5xl mx-auto bg-white shadow-md print:shadow-none"
        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: '10px' }}
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 print:px-6 print:py-3">
          <div className="flex justify-between items-start">
            {/* Logo */}
            <div className="flex-shrink-0">
              {hotelInfo.logo && (
                <div className="bg-white p-2 rounded shadow-sm">
                  <img
                    src={hotelInfo.logo}
                    alt={hotelInfo.name}
                    className="h-8 object-contain"
                  />
                </div>
              )}
                </div>

            {/* Invoice Info */}
            <div className="text-right text-white">
              <h1 className="text-2xl font-bold tracking-tight mb-1 uppercase" style={{ letterSpacing: '0.05em' }}>
                Invoice
              </h1>
              <div className="text-xs space-y-0.5 opacity-90">
                <p className="font-semibold">
                  #{data?.[0]?.bookingNo || "N/A"}
                </p>
                <p className="font-normal">
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
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
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
                {data?.[0]?.nidPassport && (
                  <p className="text-slate-600 text-xs">
                    ID: {data?.[0]?.nidPassport}
                  </p>
                )}
                {data?.[0]?.address && (
                  <p className="text-slate-600 text-xs">{data?.[0]?.address}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                Hotel Information
              </h2>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-xs">
                  {data?.[0]?.hotelName || hotelInfo.name}
                </p>
                <p className="text-slate-600 text-xs">
                  <span className="font-semibold">Date:</span>{" "}
                  {moment(data?.[0]?.createTime).format("MMM DD, YYYY") || "N/A"}
                </p>
                {data?.[0]?.bookedBy && (
                  <p className="text-slate-600 text-xs">
                    <span className="font-semibold">By:</span> {data?.[0]?.bookedBy}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Details Table */}
          <div className="mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Booking Details
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full" style={{ fontSize: '9px' }}>
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-left text-xs font-bold text-slate-700 uppercase">
                      Room
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-bold text-slate-700 uppercase">
                      Check-In
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-bold text-slate-700 uppercase">
                      Check-Out
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-bold text-slate-700 uppercase">
                      Nights
                    </th>
                    <th className="px-2 py-1.5 text-center text-xs font-bold text-slate-700 uppercase">
                      Guests
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-bold text-slate-700 uppercase">
                      Rate
                    </th>
                    <th className="px-2 py-1.5 text-right text-xs font-bold text-slate-700 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.map((booking, index) => (
                    <tr key={index}>
                      <td className="px-2 py-1.5">
                        <div className="font-semibold text-slate-900 text-xs">
                          {booking?.roomCategoryName || "N/A"}
                        </div>
                        {booking?.roomNumberName && (
                          <div className="text-slate-500 text-xs">
                            #{booking.roomNumberName}
                          </div>
                        )}
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
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Additional Services
              </h2>
              <div className="border border-slate-200 rounded overflow-hidden">
                {totals.kitchenTotalBill > 0 && (
                  <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">Kitchen</span>
                    <span className="text-xs font-bold text-slate-900">
                      ৳{totals.kitchenTotalBill.toLocaleString()}
                    </span>
                  </div>
                )}
                {totals.extraBedTotalBill > 0 && (
                  <div className="flex justify-between items-center px-3 py-1.5 bg-slate-50">
                    <span className="text-xs font-semibold text-slate-700">Extra Bed</span>
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

          {/* Totals Section */}
          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="bg-slate-50 rounded p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Subtotal</span>
                  <span className="text-slate-900 font-bold">
                    ৳{totals.totalBill.toLocaleString()}
                  </span>
                </div>
                {totals.kitchenTotalBill > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Kitchen</span>
                    <span className="text-slate-900 font-bold">
                      ৳{totals.kitchenTotalBill.toLocaleString()}
                    </span>
                  </div>
                )}
                {totals.extraBedTotalBill > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Extra Bed</span>
                    <span className="text-slate-900 font-bold">
                      ৳{totals.extraBedTotalBill.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-2 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Total
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      ৳{totals.finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">Advance</span>
                  <span className="text-green-700 font-bold">
                    -৳{totals.totalAdvance.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-700 text-white rounded p-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase">Due</span>
                    <span className="font-bold text-base">
                      ৳{totals.totalDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs text-slate-500 font-semibold mb-0.5 uppercase">Payment Method</p>
                <p className="font-bold text-slate-900 text-xs">
                  {data?.[0]?.paymentMethod || "N/A"}
                </p>
              </div>
              {data?.[0]?.transactionId && (
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-500 font-semibold mb-0.5 uppercase">Transaction ID</p>
                  <p className="font-bold text-slate-900 text-xs">
                    {data[0].transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600 font-semibold mb-1">
              Thank you for choosing {data?.[0]?.hotelName || hotelInfo.name}
            </p>
            <p className="text-xs text-slate-500">
              We hope you enjoyed your stay
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.3in;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
            font-size: 10px !important;
          }
          * {
            font-size: 10px !important;
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
          #invoice-card {
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;