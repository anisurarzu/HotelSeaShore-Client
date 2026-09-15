"use client";

import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import React, { useEffect, useState, useMemo } from "react";
import { Button, Spin, message, Space } from "antd";
import { useRouter } from "next/navigation";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment";

const INVOICE_PAGE_MARGIN_IN = 0.22;
const INVOICE_WIDTH_A4 = "210mm";

const SEA = {
  tide: "#0a3d44",
  lagoon: "#1a6d75",
  sand: "#c4a46a",
  sandSoft: "#e8d7b0",
  paper: "#fbfcfb",
  ink: "#1c2628",
  mute: "#5c6e6c",
  line: "rgba(10, 61, 68, 0.12)",
  paid: "#0f6b4c",
  due: "#9b2c2c",
};

function money(n) {
  return `৳${Number(n || 0).toLocaleString()}`;
}

function collectPaymentRows(invoices) {
  const allPayments = [];
  (invoices || []).forEach((inv) => {
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
    return { rows: [], total: 0, empty: true };
  }

  const normalized = allPayments
    .map((p) => ({
      method: ((p.paymentMethod || p.method || "").trim() || "CASH").toUpperCase(),
      txnId: (p.transactionId || "").trim(),
      amount: Number(p.amount) || 0,
      createdAt: p.createdAt || null,
    }))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  const mergeMap = new Map();
  for (const r of normalized) {
    const groupKey = `${r.method}|||${r.txnId}`;
    if (!mergeMap.has(groupKey)) {
      mergeMap.set(groupKey, { method: r.method, txnId: r.txnId, amount: 0 });
    }
    mergeMap.get(groupKey).amount += r.amount;
  }

  const methodOrder = (m) => {
    const order = ["CASH", "BKASH", "NAGAD", "BANK", "CARD"];
    const i = order.indexOf(m);
    return i === -1 ? 100 : i;
  };

  const rows = [...mergeMap.values()]
    .filter((g) => !(g.method === "CASH" && (Number(g.amount) || 0) === 0))
    .sort((a, b) => {
      const mo = methodOrder(a.method) - methodOrder(b.method);
      if (mo !== 0) return mo;
      return String(a.txnId || "").localeCompare(String(b.txnId || ""));
    })
    .map((g) => ({
      method: g.method,
      txnDisplay: g.method === "CASH" ? "—" : g.txnId || "—",
      amount: g.amount,
    }));

  const total = normalized.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return { rows, total, empty: false };
}

const Invoice = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    extraBedTotalBill: 0,
    kitchenTotalBill: 0,
    breakfastTotalBill: 0,
    totalBill: 0,
    finalTotal: 0,
  });
  const { id } = params;

  const fetchInvoiceInfo = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get(`/bookings/bookingNo/${id}`);
      if (response?.status === 200) {
        const filteredData = response?.data.filter((item) => item.statusID !== 255);
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

  const print = () => window.print();

  const downloadPDF = async () => {
    if (!document) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById("invoice-card");
    const options = {
      margin: [
        INVOICE_PAGE_MARGIN_IN,
        INVOICE_PAGE_MARGIN_IN,
        INVOICE_PAGE_MARGIN_IN,
        INVOICE_PAGE_MARGIN_IN,
      ],
      filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(element).set(options).save();
  };

  const calculateTotals = (bookings) => {
    const totalBill = bookings.reduce((sum, booking) => sum + (booking?.totalBill || 0), 0);
    const kitchenTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.kitchenTotalBill || 0),
      0
    );
    const extraBedTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.extraBedTotalBill || 0),
      0
    );
    const breakfastTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.breakfastTotalBill || 0),
      0
    );
    setTotals({
      totalBill,
      kitchenTotalBill,
      extraBedTotalBill,
      breakfastTotalBill,
      finalTotal: totalBill + kitchenTotalBill + extraBedTotalBill,
    });
  };

  const paymentInfo = useMemo(() => collectPaymentRows(data), [data]);

  const totalPaidFromInvoices = useMemo(() => {
    if (!paymentInfo.empty) return paymentInfo.total;
    let sum = 0;
    (data || []).forEach((inv) => {
      if (Array.isArray(inv.payments) && inv.payments.length > 0) {
        inv.payments.forEach((p) => {
          sum += Number(p.amount) || 0;
        });
      } else if (Number(inv?.advancePayment) > 0) {
        sum += Number(inv.advancePayment);
      }
    });
    return sum;
  }, [data, paymentInfo]);

  const dueAmount = totals.finalTotal - totalPaidFromInvoices;
  const isPaidInFull = dueAmount <= 0 && totals.finalTotal > 0;

  const bookingCreatedAt =
    data?.[0]?.createdAt || data?.[0]?.createTime || data?.[0]?.createdDate;
  const invoiceCreatedMoment = bookingCreatedAt ? moment(bookingCreatedAt) : null;
  const invoiceCreatedLabel = invoiceCreatedMoment?.isValid()
    ? invoiceCreatedMoment.format("D MMMM YYYY · h:mm A")
    : "N/A";

  const getHotelColorScheme = (hotelID) => {
    switch (hotelID) {
      case 1:
        return { primary: "#1e3a5f", secondary: "#f4f7fa", accent: "#c4a46a", tableHeader: "#1e3a5f" };
      case 2:
        return { primary: SEA.tide, secondary: "#f3f7f6", accent: SEA.sand, tableHeader: SEA.tide };
      case 3:
        return { primary: "#0f5c4c", secondary: "#f3f8f6", accent: SEA.sand, tableHeader: "#0f5c4c" };
      case 4:
        return { primary: "#1e3a5f", secondary: "#f4f7fa", accent: SEA.sand, tableHeader: "#1e3a5f" };
      case 6:
        return { primary: "#1b5c3a", secondary: "#f4f8f5", accent: SEA.sand, tableHeader: "#1b5c3a" };
      case 7:
        return { primary: "#3d3554", secondary: "#f6f5f8", accent: SEA.sand, tableHeader: "#3d3554" };
      default:
        return { primary: SEA.tide, secondary: "#f3f7f6", accent: SEA.sand, tableHeader: SEA.tide };
    }
  };

  const getHotelInfo = () => {
    if (!data?.[0]) {
      const colorScheme = getHotelColorScheme(undefined);
      return { name: "Hotel", logo: null, color: colorScheme.primary, colorScheme };
    }

    const hotelID = Number(data?.[0]?.hotelID);
    const hotelLogo = data?.[0]?.hotelLogo;
    const hotelColor = data?.[0]?.hotelColor;
    const seaScheme = getHotelColorScheme(2);

    if (hotelLogo) {
      const colorScheme = hotelColor
        ? {
            primary: hotelColor,
            secondary: "#f3f7f6",
            accent: SEA.sand,
            tableHeader: hotelColor,
          }
        : seaScheme;
      return {
        name: data?.[0]?.hotelName || "Hotel",
        logo: hotelLogo,
        color: colorScheme.primary,
        colorScheme,
      };
    }

    const colorScheme = getHotelColorScheme(hotelID);
    const hotelInfoMap = {
      1: { name: "Mermaid", logo: "/images/marmaid-logo.png" },
      2: { name: "Hotel Sea Shore", logo: "/images/hotel-sea-shore-logo.png" },
      3: { name: "Sea Paradise", logo: "/images/Shamudro-Bari-1.png" },
      4: { name: "Shopno Bilash Holiday Suites", logo: "/images/Sopno.png" },
      6: { name: "Beach Garden", logo: "https://i.ibb.co.com/jZDnyS4V/beach-gardn.png" },
      7: {
        name: "The Grand Sandy",
        logo: "https://i.ibb.co/svznKpfF/Whats-App-Image-2025-07-01-at-22-11-50-dda6f6f0.jpg",
      },
    };
    const mapped = hotelInfoMap[hotelID];
    return {
      name: mapped?.name || data?.[0]?.hotelName || "Hotel",
      logo: mapped?.logo || null,
      color: colorScheme.primary,
      colorScheme,
    };
  };

  const hotelInfo = getHotelInfo();
  const c = hotelInfo.colorScheme;
  const booking = data?.[0];
  const hotelAddress = booking?.hotelInformation?.address;
  const addressLine2 =
    hotelAddress?.address2 ||
    [hotelAddress?.city, hotelAddress?.state, hotelAddress?.zipCode, hotelAddress?.country]
      .filter(Boolean)
      .join(", ");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#e8eeec" }}>
        <Spin size="large" tip="Preparing invoice..." />
      </div>
    );
  }

  return (
    <div className="inv-page min-h-screen py-8 px-4 print:py-0 print:px-0">
      <div className="max-w-5xl mx-auto mb-6 print:hidden flex items-center justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={print} size="large">
            Print
          </Button>
          <Button
            type="primary"
            onClick={downloadPDF}
            icon={<DownloadOutlined />}
            size="large"
            style={{ background: SEA.tide, borderColor: SEA.tide }}
          >
            Download PDF
          </Button>
        </Space>
      </div>

      <div
        id="invoice-card"
        className="invoice-card-export mx-auto print:shadow-none"
        style={{
          fontFamily: "var(--font-outfit), 'Helvetica Neue', sans-serif",
          maxWidth: INVOICE_WIDTH_A4,
          width: "100%",
          background: "#fff",
          color: SEA.ink,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div style={{ height: 4, background: c.accent }} />
        <div style={{ height: 2, background: c.primary }} />

        <div style={{ padding: "14px 22px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {hotelInfo.logo && (
                <img
                  src={hotelInfo.logo}
                  alt={hotelInfo.name}
                  style={{ height: 52, width: "auto", maxWidth: 72, objectFit: "contain" }}
                />
              )}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontSize: 21,
                    fontStyle: "italic",
                    lineHeight: 1.05,
                    color: c.primary,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {hotelInfo.name}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                  }}
                >
                  Cox&apos;s Bazar
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: 12,
                }}
              >
                Invoice
              </div>
              <div style={{ marginTop: 2, fontSize: 16, fontWeight: 650, color: c.primary }}>
                #{booking?.bookingNo || "N/A"}
              </div>
              <div style={{ marginTop: 1, fontSize: 11, color: SEA.mute }}>{invoiceCreatedLabel}</div>
              {isPaidInFull && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: SEA.paid,
                  }}
                >
                  Paid in full
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              height: 1,
              background: `linear-gradient(to right, ${c.accent}, transparent)`,
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 12 }}>
            <div>
              <div className="inv-kicker" style={{ color: c.accent }}>
                Guest
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: SEA.ink, marginTop: 3 }}>
                {booking?.fullName || "N/A"}
              </div>
              <div className="inv-meta">{booking?.phone || "N/A"}</div>
              {booking?.email && <div className="inv-meta">{booking.email}</div>}
              {(booking?.nidPassport || booking?.nid) && (
                <div className="inv-meta">NID · {booking?.nidPassport || booking?.nid}</div>
              )}
              {booking?.address && <div className="inv-meta">{booking.address}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="inv-kicker" style={{ color: c.accent }}>
                Property
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: SEA.ink, marginTop: 3 }}>
                {booking?.hotelInformation?.hotelName || booking?.hotelName || hotelInfo.name}
              </div>
              {(hotelAddress?.address1 || hotelAddress?.street) && (
                <div className="inv-meta">{hotelAddress?.address1 || hotelAddress?.street}</div>
              )}
              {addressLine2 && <div className="inv-meta">{addressLine2}</div>}
              {(booking?.hotelInformation?.reservationNo ?? booking?.hotelInformation?.contact?.email) && (
                <div className="inv-meta">
                  Reservation · {booking?.hotelInformation?.reservationNo ?? booking?.hotelInformation?.contact?.email}
                </div>
              )}
              {(booking?.hotelInformation?.frontdeskNo ?? booking?.hotelInformation?.contact?.phone) && (
                <div className="inv-meta">
                  Front desk · {booking?.hotelInformation?.frontdeskNo ?? booking?.hotelInformation?.contact?.phone}
                </div>
              )}
            </div>
          </div>

          <div className="inv-kicker" style={{ color: c.accent, marginTop: 14 }}>
            Stay
          </div>
          <table className="inv-table" style={{ marginTop: 4 }}>
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: "center" }}>#</th>
                <th style={{ textAlign: "left" }}>Room</th>
                <th style={{ textAlign: "left" }}>Check-in</th>
                <th style={{ textAlign: "left" }}>Check-out</th>
                <th style={{ textAlign: "center" }}>Nights</th>
                <th style={{ textAlign: "center" }}>Guests</th>
                <th style={{ textAlign: "right" }}>Rate</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((row, index) => {
                const guests = [
                  row?.adults ? `${row.adults} adult${row.adults > 1 ? "s" : ""}` : null,
                  row?.children ? `${row.children} child${row.children > 1 ? "ren" : ""}` : null,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <tr key={index}>
                    <td style={{ textAlign: "center", color: SEA.mute }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: SEA.ink }}>
                        {row?.roomCategoryName || "N/A"}
                      </div>
                    </td>
                    <td>{moment(row?.checkInDate).format("D MMM YYYY")}</td>
                    <td>{moment(row?.checkOutDate).format("D MMM YYYY")}</td>
                    <td style={{ textAlign: "center" }}>{row?.nights || 0}</td>
                    <td style={{ textAlign: "center" }}>{guests || "—"}</td>
                    <td style={{ textAlign: "right" }}>{money(row?.roomPrice)}</td>
                    <td style={{ textAlign: "right", fontWeight: 650 }}>{money(row?.totalBill)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(totals.kitchenTotalBill > 0 ||
            totals.extraBedTotalBill > 0 ||
            totals.breakfastTotalBill > 0) && (
            <div style={{ marginTop: 10 }}>
              <div className="inv-kicker" style={{ color: c.accent }}>
                Additional
              </div>
              <table className="inv-table" style={{ marginTop: 4 }}>
                <tbody>
                  {totals.breakfastTotalBill > 0 && (
                    <tr>
                      <td>Breakfast</td>
                      <td style={{ textAlign: "right", fontWeight: 650 }}>{money(totals.breakfastTotalBill)}</td>
                    </tr>
                  )}
                  {totals.kitchenTotalBill > 0 && (
                    <tr>
                      <td>Kitchen</td>
                      <td style={{ textAlign: "right", fontWeight: 650 }}>{money(totals.kitchenTotalBill)}</td>
                    </tr>
                  )}
                  {totals.extraBedTotalBill > 0 && (
                    <tr>
                      <td>Extra bed</td>
                      <td style={{ textAlign: "right", fontWeight: 650 }}>{money(totals.extraBedTotalBill)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {booking?.note && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: "#f7f4ea",
                borderLeft: `3px solid ${c.accent}`,
              }}
            >
              <div className="inv-kicker" style={{ color: c.primary, marginBottom: 4 }}>
                Note
              </div>
              <div style={{ fontSize: 13, color: SEA.ink, lineHeight: 1.5 }}>{booking.note}</div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              marginTop: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="inv-kicker" style={{ color: c.accent }}>
                Payments
              </div>
              {paymentInfo.empty ? (
                <div style={{ marginTop: 10, fontSize: 13, color: SEA.mute }}>
                  {booking?.paymentMethod || "—"}
                  {booking?.transactionId ? ` · ${booking.transactionId}` : ""}
                </div>
              ) : (
                <table className="inv-table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Method</th>
                      <th style={{ textAlign: "left" }}>Reference</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentInfo.rows.map((r, idx) => (
                      <tr key={`${r.method}-${r.txnDisplay}-${idx}`}>
                        <td style={{ fontWeight: 600 }}>{r.method}</td>
                        <td style={{ color: SEA.mute }}>{r.txnDisplay}</td>
                        <td style={{ textAlign: "right", fontWeight: 650 }}>{money(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ width: 200, flexShrink: 0, paddingTop: 8 }}>
              <div className="inv-total-row">
                <span>Subtotal</span>
                <span>{money(totals.finalTotal)}</span>
              </div>
              <div className="inv-total-row">
                <span>Paid</span>
                <span style={{ color: SEA.paid }}>{money(totalPaidFromInvoices)}</span>
              </div>
              <div
                className="inv-total-row inv-due"
                style={{
                  borderTop: `1px solid ${SEA.line}`,
                  marginTop: 8,
                  paddingTop: 10,
                  color: isPaidInFull ? SEA.paid : SEA.due,
                }}
              >
                <span>{isPaidInFull ? "Balance" : "Due"}</span>
                <span>{money(Math.max(0, dueAmount))}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: 14,
            }}
          >
            Thank you for staying with {booking?.hotelName || hotelInfo.name}.
          </div>

          {(booking?.bookedBy || booking?.bookedByID) && (
            <div style={{ marginTop: 8, fontSize: 11, color: SEA.mute }}>
              Prepared by {booking?.bookedBy || booking?.bookedByID}
            </div>
          )}

          {Array.isArray(booking?.hotelInformation?.termsAndConditions) &&
            booking.hotelInformation.termsAndConditions.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${SEA.line}` }}>
                <div className="inv-kicker" style={{ color: c.accent, marginBottom: 4 }}>
                  Terms
                </div>
                <ol style={{ margin: 0, paddingLeft: 16 }}>
                  {booking.hotelInformation.termsAndConditions.map((t, idx) => (
                    <li
                      key={idx}
                      style={{
                        fontSize: 9,
                        marginBottom: 2,
                        fontWeight: /check-?\s*in\s*time|check-?\s*out\s*time/i.test(String(t))
                          ? 700
                          : 400,
                      }}
                    >
                      {t}
                    </li>
                  ))}
                </ol>
              </div>
            )}

          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${SEA.line}`,
              textAlign: "center",
              fontSize: 9,
            }}
          >
            System generated · Cox Web Solutions
          </div>
        </div>
      </div>

      <style jsx global>{`
        .inv-page {
          background: #e8eeec;
        }
        .invoice-card-export {
          box-sizing: border-box;
          box-shadow: 0 18px 50px rgba(10, 61, 68, 0.12);
        }
        .inv-kicker {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .inv-meta {
          margin-top: 1px;
          font-size: 12px;
          color: ${SEA.mute};
          line-height: 1.35;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .inv-table th {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 650;
          color: ${SEA.mute};
          border-bottom: 1px solid ${SEA.line};
          padding: 5px 4px;
        }
        .inv-table td {
          padding: 6px 4px;
          border-bottom: 1px solid ${SEA.line};
          color: ${SEA.ink};
          vertical-align: top;
        }
        .inv-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          padding: 2px 0;
          color: ${SEA.mute};
        }
        .inv-total-row span:last-child {
          font-weight: 650;
          color: ${SEA.ink};
          font-variant-numeric: tabular-nums;
        }
        .inv-due span,
        .inv-due span:last-child {
          font-size: 13px;
          font-weight: 700;
        }
        @media print {
          @page {
            size: A4;
            margin: ${INVOICE_PAGE_MARGIN_IN}in;
          }
          .inv-page {
            background: white !important;
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
        }
      `}</style>
    </div>
  );
};

export default Invoice;
