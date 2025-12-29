// "use client";

// import {
//   ArrowLeftOutlined,
//   PrinterOutlined,
//   DownloadOutlined,
// } from "@ant-design/icons";
// import React, { useEffect, useState } from "react";
// import { Alert, Button, QRCode, Spin, Watermark, message, Divider } from "antd";
// import html2pdf from "html2pdf.js";
// import axios from "axios";
// import Image from "next/image";
// import coreAxios from "@/utils/axiosInstance";
// import moment from "moment";

// const Invoice = ({ params }) => {
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState([]);
//   const [totals, setTotals] = useState({
//     totalAdvance: 0,
//     extraBedTotalBill: 0,
//     kitchenTotalBill: 0,
//     totalDue: 0,
//     totalBill: 0,
//     finalTotal: 0,
//     ftbCommission: 0,
//     cashCommission: 0,
//   });
//   const { id } = params;

//   const fetchInvoiceInfo = async () => {
//     try {
//       setLoading(true);
//       const response = await coreAxios.get(`/bookings/bookingNo/${id}`);
//       if (response?.status === 200) {
//         // Filter out items where statusID is 255
//         const filteredData = response?.data.filter(
//           (item) => item.statusID !== 255
//         );

//         calculateTotals(filteredData); // Calculate totals with filtered data
//         setData(filteredData); // Set state with filtered data
//         setLoading(false);
//       } else {
//         message.error("Failed to load data");
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       message.error("Error fetching data");
//       setLoading(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchInvoiceInfo();
//   }, []);

//   const print = () => {
//     const printContent = document.getElementById("invoice-card");
//     const printWindow = window.open("", "_blank");

//     // Get all style tags from the document
//     const styles = Array.from(
//       document.querySelectorAll('style, link[rel="stylesheet"]')
//     )
//       .map((el) => el.outerHTML)
//       .join("");

//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>Invoice - ${data?.[0]?.bookingNo || "N/A"}</title>
//           ${styles}
//           <style>
//             @media print {
//               body {
//                 padding: 15px;
//                 background: white;
//                 font-size: 12px;
//                 width: 100%;
//               }
//               .no-print {
//                 display: none !important;
//               }
//               #invoice-card {
//                 box-shadow: none;
//                 border: 1px solid #ddd;
//                 padding: 15px;
//                 max-width: 100%;
//                 margin: 0 auto;
//               }
//               .address-wrap {
//                 white-space: normal !important;
//                 overflow: visible !important;
//                 text-overflow: clip !important;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div id="print-container">
//             ${printContent.outerHTML}
//           </div>
//           <script>
//             window.onload = function() {
//               window.print();
//             }
//           </script>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//   };

//   const downloadPDF = () => {
//     const element = document.getElementById("invoice-card");
//     const options = {
//       margin: 0.3,
//       filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
//       image: { type: "jpeg", quality: 0.98 },
//       html2canvas: {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#FFFFFF",
//         logging: false,
//       },
//       jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
//     };
//     html2pdf().from(element).set(options).save();
//   };

//   const calculateTotals = (bookings) => {
//     const totalAdvance = bookings.reduce(
//       (sum, booking) => sum + (booking?.advancePayment || 0),
//       0
//     );
//     const totalDue = bookings.reduce(
//       (sum, booking) => sum + (booking?.duePayment || 0),
//       0
//     );
//     const totalBill = bookings.reduce(
//       (sum, booking) => sum + (booking?.totalBill || 0),
//       0
//     );
//     const kitchenTotalBill = bookings.reduce(
//       (sum, booking) => sum + (booking?.kitchenTotalBill || 0),
//       0
//     );
//     const extraBedTotalBill = bookings.reduce(
//       (sum, booking) => sum + (booking?.extraBedTotalBill || 0),
//       0
//     );
//     const finalTotal = totalBill + kitchenTotalBill + extraBedTotalBill;

//     // Commission calculations
//     const ftbCommission = totalBill * 0.2; // 20% of total bill
//     const cashCommission = ftbCommission - totalAdvance; // FTB commission minus advance payment

//     setTotals({
//       totalAdvance,
//       totalDue,
//       totalBill,
//       kitchenTotalBill,
//       extraBedTotalBill,
//       finalTotal,
//       ftbCommission,
//       cashCommission,
//     });
//   };

//   // Function to get hotel-specific color scheme
//   const getHotelColorScheme = (hotelID) => {
//     switch (hotelID) {
//       case 1: // Mermaid
//         return {
//           primary: "#1a56db",
//           secondary: "#e1effe",
//           accent: "#93c5fd",
//           tableHeader: "#1a56db",
//         };
//       case 2: // Golden Hill
//         return {
//           primary: "#d97706",
//           secondary: "#fef3c7",
//           accent: "#fcd34d",
//           tableHeader: "#d97706",
//         };
//       case 3: // Sea Paradise
//         return {
//           primary: "#059669",
//           secondary: "#d1fae5",
//           accent: "#6ee7b7",
//           tableHeader: "#059669",
//         };
//       case 4: // Shopno Bilash
//         return {
//           primary: "#2B388F",
//           secondary: "#e0e7ff",
//           accent: "#a5b4fc",
//           tableHeader: "#2B388F",
//         };
//       case 6: // Beach Garden
//         return {
//           primary: "#6C9944",
//           secondary: "#f0fdf4",
//           accent: "#bbf7d0",
//           tableHeader: "#6C9944",
//         };
//       case 7: // The Grand Sandy
//         return {
//           primary: "#7c3aed",
//           secondary: "#f5f3ff",
//           accent: "#c4b5fd",
//           tableHeader: "#7c3aed",
//         };
//       default: // Samudra Bari
//         return {
//           primary: "#dc2626",
//           secondary: "#fef2f2",
//           accent: "#fca5a5",
//           tableHeader: "#dc2626",
//         };
//     }
//   };

//   const colorScheme = getHotelColorScheme(data?.[0]?.hotelID);

//   return (
//     <Watermark
//       content={`${
//         data?.[0]?.hotelID === 1
//           ? "Mermaid 2024"
//           : data?.[0]?.hotelID === 2
//           ? "Hotel Golden Hill"
//           : data?.[0]?.hotelID === 3
//           ? "Sea Paradise"
//           : data?.[0]?.hotelID === 4
//           ? "Shopno Bilash Holiday Suites"
//           : data?.[0]?.hotelID === 7
//           ? "The Grand Sandy"
//           : "Samudra Bari 2024"
//       }`}
//     >
//       {loading ? (
//         <div className="flex justify-center items-center h-screen">
//           <Spin size="large" tip="Loading invoice data..." />
//         </div>
//       ) : (
//         <div className="min-h-screen bg-gray-50 py-4">
//           <div className="container mx-auto px-4 max-w-4xl">
//             <div className="flex gap-2 mb-4 no-print">
//               <Button
//                 type="primary"
//                 onClick={downloadPDF}
//                 icon={<DownloadOutlined />}
//                 style={{ backgroundColor: colorScheme.primary }}
//                 size="small"
//               >
//                 Download PDF
//               </Button>
//               <Button
//                 type="primary"
//                 onClick={print}
//                 icon={<PrinterOutlined />}
//                 style={{ backgroundColor: colorScheme.primary }}
//                 size="small"
//               >
//                 Print
//               </Button>
//             </div>

//             <div
//               id="invoice-card"
//               className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-5"
//               style={{ fontSize: "12px" }}
//             >
//               {/* Header Section */}
//               <div className="flex justify-between items-start  mb-3 border-b border-gray-200">
//                 <div className="logo-container flex items-center mb-3">
//                   {data?.[0]?.hotelID === 1 ? (
//                     <img
//                       src="/images/marmaid-logo.png"
//                       alt="Mermaid Beach Resort Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : data?.[0]?.hotelID === 2 ? (
//                     <img
//                       src="/images/goldenhil.png"
//                       alt="Hotel Golden Hill Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : data?.[0]?.hotelID === 3 ? (
//                     <img
//                       src="/images/Shamudro-Bari-1.png"
//                       alt="Sea Paradise Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : data?.[0]?.hotelID === 4 ? (
//                     <img
//                       src="/images/Sopno.png"
//                       alt="Shopno Bilash Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : data?.[0]?.hotelID === 6 ? (
//                     <img
//                       src="https://i.ibb.co.com/jZDnyS4V/beach-gardn.png"
//                       alt="Beach Garden Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : data?.[0]?.hotelID === 7 ? (
//                     <img
//                       src="https://i.ibb.co/svznKpfF/Whats-App-Image-2025-07-01-at-22-11-50-dda6f6f0.jpg"
//                       alt="The Grand Sandy Logo"
//                       className="h-20 object-contain"
//                     />
//                   ) : (
//                     <img
//                       src="/images/Shamudro-Bari-1.png"
//                       alt="Samudra Bari Logo"
//                       className="h-20 object-contain"
//                     />
//                   )}
//                 </div>

//                 <div className="text-right">
//                   <h1
//                     className="text-xl font-bold uppercase mb-1"
//                     style={{ color: colorScheme.primary }}
//                   >
//                     {data?.[0]?.hotelName}
//                   </h1>

//                   <div>
//                     {data?.[0]?.hotelID === 1 ? (
//                       <div>
//                         <p>Block # A, Plot # 17, Kolatoli Main Road</p>
//                         <p>Cox's Bazar 4700</p>
//                         <p>Front Desk: 01818083949</p>
//                       </div>
//                     ) : data?.[0]?.hotelID === 2 ? (
//                       <div>
//                         <p>Plot #65, Block# B, Sugandha Point</p>
//                         <p>Kolatoli, Cox's Bazar</p>
//                         <p>Front Desk: 01313708031</p>
//                       </div>
//                     ) : data?.[0]?.hotelID === 3 ? (
//                       <div>
//                         <p>Kolatoli Beach Road</p>
//                         <p>Kolatoli Cox's Bazar-4700</p>
//                         <p>Front Desk: 01898841012</p>
//                       </div>
//                     ) : data?.[0]?.hotelID === 4 ? (
//                       <div>
//                         <p>Block # A, Plot # 28</p>
//                         <p>kolatoli Residential Area, Cox's Bazar</p>
//                         <p>Front Desk: 01711877621</p>
//                       </div>
//                     ) : data?.[0]?.hotelID === 6 ? (
//                       <div>
//                         <p>Plot No-199, Block # B</p>
//                         <p>Lighthouse, Kolatoli, Cox's Bazar</p>
//                         <p>Front Desk: 01898841016</p>
//                       </div>
//                     ) : data?.[0]?.hotelID === 7 ? (
//                       <div>
//                         <p>N.H.A Building No- 10</p>
//                         <p>Kolatoli, Cox's Bazar</p>
//                         <p>Front Desk: 01827689324</p>
//                       </div>
//                     ) : (
//                       <div>
//                         <p>N.H.A building No- 09</p>
//                         <p>Samudra Bari, Kolatoli, Cox's Bazar</p>
//                         <p>Front Desk: 01886628295</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Hotel and Guest Information */}
//               <div className="grid grid-cols-3 gap-4 mb-4">
//                 <div>
//                   <h3 className="font-semibold text-black print:!text-black uppercase mb-1">
//                     Bill To
//                   </h3>
//                   <div>
//                     <p className="font-medium">
//                       {data?.[0]?.fullName || "Guest Name"}
//                     </p>
//                     <p>Phone: {data?.[0]?.phone || "N/A"}</p>
//                     {data[0]?.email && <p>Email: {data?.[0]?.email}</p>}
//                     <p>NID/Passport: {data?.[0]?.nidPassport || "N/A"}</p>
//                     <p className="address-wrap">
//                       Address: {data?.[0]?.address || "N/A"}
//                     </p>
//                   </div>
//                 </div>

//                 <p className="text-black print:!text-black font-bold text-center">
//                   Invoice No:{" "}
//                   <span className="font-semibold">
//                     {data?.[0]?.bookingNo || "N/A"}
//                   </span>
//                 </p>
//                 <p className="text-black print:!text-black font-semibold text-right">
//                   Date:{" "}
//                   {moment(data?.[0]?.createTime).format("MMM D, YYYY") || "N/A"}
//                 </p>
//               </div>

//               {/* Booking Details Table */}
//               <div className="mb-3">
//                 <h3
//                   className="font-semibold mb-2"
//                   style={{ color: colorScheme.primary }}
//                 >
//                   Booking Details
//                 </h3>
//                 <div className="overflow-x-auto">
//                   <table className="w-full border-collapse">
//                     <thead>
//                       <tr
//                         style={{
//                           backgroundColor: colorScheme.tableHeader,
//                           color: "white",
//                         }}
//                       >
//                         <th className="p-2 text-left font-medium uppercase border border-gray-200 print:!border-gray-200">
//                           Apartment
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Check-in
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Check-out
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Nights
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Guests
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Rate/Night
//                         </th>
//                         <th className="p-2 text-left font-medium uppercase border  border-gray-200 print:!border-gray-200">
//                           Total
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {data?.map((booking, index) => (
//                         <tr
//                           key={index}
//                           className={
//                             index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                           }
//                         >
//                           <td className="p-2 border border-black print:!border-black">
//                             {booking?.roomCategoryName || "N/A"}
//                           </td>
//                           <td className="p-2 border border-black print:!border-black">
//                             {moment(booking?.checkInDate).format("MMM D") ||
//                               "N/A"}
//                           </td>
//                           <td className="p-2 border border-black print:!border-black">
//                             {moment(booking?.checkOutDate).format("MMM D") ||
//                               "N/A"}
//                           </td>
//                           <td className="p-2 border border-black print:!border-black text-center">
//                             {booking?.nights || "N/A"}
//                           </td>
//                           <td className="p-2 border border-black print:!border-black text-center">
//                             {booking?.adults || "0"}A,{" "}
//                             {booking?.children || "0"}C
//                           </td>
//                           <td className="p-2 border border-black print:!border-black text-right">
//                             {booking?.roomPrice
//                               ? `৳${booking.roomPrice}`
//                               : "N/A"}
//                           </td>
//                           <td className="p-2 border border-black print:!border-black text-right font-medium">
//                             {booking?.totalBill
//                               ? `৳${booking.totalBill}`
//                               : "N/A"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {/* Additional Services */}
//               {(data?.some((booking) => booking.isKitchen) ||
//                 data?.some((booking) => booking.extraBed)) && (
//                 <div className="mb-3">
//                   <h3
//                     className="font-semibold mb-2"
//                     style={{ color: colorScheme.primary }}
//                   >
//                     Additional Services
//                   </h3>
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr
//                           style={{
//                             backgroundColor: colorScheme.tableHeader,
//                             color: "white",
//                           }}
//                         >
//                           <th className="p-2 text-left font-medium uppercase border border-black print:!border-black">
//                             Service
//                           </th>
//                           <th className="p-2 text-left font-medium uppercase border border-black print:!border-black">
//                             Details
//                           </th>
//                           <th className="p-2 text-left font-medium uppercase border border-black print:!border-black">
//                             Amount
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {data
//                           ?.filter((booking) => booking.isKitchen)
//                           .map((booking, index) => (
//                             <tr
//                               key={`kitchen-${index}`}
//                               className={
//                                 index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                               }
//                             >
//                               <td className="p-2 border border-black print:!border-black font-medium">
//                                 Kitchen Facilities
//                               </td>
//                               <td className="p-2 border border-black print:!border-black">
//                                 Included with booking
//                               </td>
//                               <td className="p-2 border border-black print:!border-black text-right font-medium">
//                                 {booking.kitchenTotalBill
//                                   ? `৳${booking.kitchenTotalBill}`
//                                   : "N/A"}
//                               </td>
//                             </tr>
//                           ))}
//                         {data
//                           ?.filter((booking) => booking.extraBed)
//                           .map((booking, index) => (
//                             <tr
//                               key={`bed-${index}`}
//                               className={
//                                 index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                               }
//                             >
//                               <td className="p-2 border border-black print:!border-black font-medium">
//                                 Extra Bed
//                               </td>
//                               <td className="p-2 border border-black print:!border-black">
//                                 Additional sleeping arrangement
//                               </td>
//                               <td className="p-2 border border-black print:!border-black text-right font-medium">
//                                 {booking.extraBedTotalBill
//                                   ? `৳${booking.extraBedTotalBill}`
//                                   : "N/A"}
//                               </td>
//                             </tr>
//                           ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}

//               {/* Notes */}
//               {data?.[0]?.note && (
//                 <div className="mb-3">
//                   <h3
//                     className="font-semibold mb-1"
//                     style={{ color: colorScheme.primary }}
//                   >
//                     Special Notes
//                   </h3>
//                   <p className="text-black print:!text-black italic">
//                     {data?.[0]?.note}
//                   </p>
//                 </div>
//               )}

//               {/* Payment Summary */}
//               <div className="grid grid-cols-3 gap-4 mb-4">
//                 <div>
//                   <h3
//                     className="font-semibold mb-2"
//                     style={{ color: colorScheme.primary }}
//                   >
//                     Payment Summary
//                   </h3>
//                   <div className="space-y-1">
//                     <div className="flex justify-between">
//                       <span className="text-black print:!text-black">
//                         Room Charges:
//                       </span>
//                       <span className="font-medium">৳{totals.totalBill}</span>
//                     </div>
//                     {totals.kitchenTotalBill > 0 && (
//                       <div className="flex justify-between">
//                         <span className="text-black print:!text-black">
//                           Kitchen Facilities:
//                         </span>
//                         <span className="font-medium">
//                           ৳{totals.kitchenTotalBill}
//                         </span>
//                       </div>
//                     )}
//                     {totals.extraBedTotalBill > 0 && (
//                       <div className="flex justify-between">
//                         <span className="text-black print:!text-black">
//                           Extra Bed:
//                         </span>
//                         <span className="font-medium">
//                           ৳{totals.extraBedTotalBill}
//                         </span>
//                       </div>
//                     )}
//                     <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
//                       <span>Total Amount:</span>
//                       <span>৳{totals.finalTotal}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-black print:!text-black">
//                         Advance Paid:
//                       </span>
//                       <span className="font-medium text-green-600">
//                         - ৳{totals.totalAdvance}
//                       </span>
//                     </div>
//                     <div className="flex justify-between border-t border-gray-200 pt-1 font-bold">
//                       <span>Balance Due:</span>
//                       <span style={{ color: colorScheme.primary }}>
//                         ৳{totals.totalDue}
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="">
//                   <h4 className="font-semibold text-black print:!text-black uppercase mb-1">
//                     Payment Method
//                   </h4>
//                   <p className="mb-2">
//                     {data?.[0]?.paymentMethod || "Not specified"}
//                   </p>

//                   {data?.[0]?.transactionId && (
//                     <>
//                       <h4 className="font-semibold text-black print:!text-black uppercase mb-1">
//                         Transaction ID
//                       </h4>
//                       <p>{data?.[0]?.transactionId}</p>
//                     </>
//                   )}

//                   <h4 className="font-semibold text-black print:!text-black uppercase mt-3 mb-1">
//                     Booked By
//                   </h4>
//                   <p>{data?.[0]?.bookedByID || "N/A"}</p>
//                 </div>
//                 {/* Commission Calculation Section */}
//                 <div className="mb-3 p-3 rounded-lg border border-black print:!border-black bg-white space-y-2 text-sm">
//                   <p>
//                     • FTB Commission (20%): ৳{totals.ftbCommission.toFixed(2)}
//                     <span className="text-gray-600">
//                       {" "}
//                       (20% of ৳{totals.totalBill})
//                     </span>
//                   </p>
//                   <p className="text-green-600">
//                     • Advance Payment: - ৳{totals.totalAdvance.toFixed(2)}
//                   </p>
//                   <p
//                     className={`font-medium ${
//                       totals.cashCommission < 0
//                         ? "text-red-600"
//                         : "text-green-600"
//                     }`}
//                   >
//                     • Cash Commission: ৳{totals.cashCommission.toFixed(2)}
//                   </p>
//                 </div>
//                 {/* Round Paid Seal */}
//                 {/* Round Paid Seal with Date */}
//                 <div className="flex justify-center my-6">
//                   <div className="relative w-36 h-36 rounded-full border-4 border-blue-700 flex flex-col items-center justify-center rotate-[-10deg]">
//                     {/* PAID text */}
//                     <span className="text-blue-700 font-extrabold text-3xl tracking-widest">
//                       PAID
//                     </span>
//                     {/* Date text */}
//                     <span className="text-blue-600 font-semibold text-sm mt-1">
//                       {new Date().toLocaleDateString("en-GB")}
//                     </span>

//                     {/* Inner ring */}
//                     <div className="absolute inset-3 rounded-full border-2 border-blue-500"></div>
//                     {/* Ink spread effect */}
//                     <div className="absolute inset-0 rounded-full border-2 border-blue-300 opacity-40 blur-sm"></div>
//                   </div>
//                 </div>

//                 <p className="text-black print:!text-black text-[12px] font-semibold">
//                   Check-in:{" "}
//                   {data?.[0]?.hotelID === 1 || data?.[0]?.hotelID === 2
//                     ? "1:00 PM"
//                     : data?.[0]?.hotelID === 4 || data?.[0]?.hotelID === 6
//                     ? "11:30 AM"
//                     : data?.[0]?.hotelID === 3
//                     ? "2:00 PM"
//                     : "12:30 PM"}
//                   , Check-out:{" "}
//                   {data?.[0]?.hotelID === 3 ? "12:00 PM" : "11:00 AM"}
//                 </p>
//               </div>

//               {/* Footer */}
//               <div className="pt-3 border-t border-gray-200">
//                 <div className="text-center">
//                   <p className="text-black print:!text-black italic mb-2">
//                     Thank you for choosing {data?.[0]?.hotelName}. We hope you
//                     enjoy your stay with us.
//                   </p>
//                   <p className="text-black print:!text-black mt-1">
//                     This is a computer generated invoice and does not require a
//                     signature.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Print Styles */}
//           <style jsx global>{`
//             @media print {
//               body {
//                 padding: 15px !important;
//                 background: white !important;
//                 font-size: 12px !important;
//                 width: 100% !important;
//               }

//               .no-print {
//                 display: none !important;
//               }
//               * {
//                 -webkit-print-color-adjust: exact !important;
//                 print-color-adjust: exact !important;
//               }

//               /* Specific style for table headers */
//               .table-header-print {
//                 background-color: ${colorScheme.tableHeader} !important;
//                 color: white !important;
//               }
//               #invoice-card {
//                 box-shadow: none !important;
//                 border: 1px solid #ddd !important;
//                 padding: 15px !important;
//                 max-width: 100% !important;
//                 margin: 0 auto !important;
//               }
//               .address-wrap {
//                 white-space: normal !important;
//                 overflow: visible !important;
//                 text-overflow: clip !important;
//               }
//             }
//           `}</style>
//         </div>
//       )}
//     </Watermark>
//   );
// };

// export default Invoice;
import React from "react";

const page = () => {
  return <div></div>;
};

export default page;
