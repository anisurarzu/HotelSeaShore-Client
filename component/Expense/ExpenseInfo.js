"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Pagination,
  DatePicker,
  Select,
  Row,
  Col,
  Skeleton,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, LeftOutlined, RightOutlined, DownloadOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import coreAxios from "@/utils/axiosInstance";

dayjs.extend(utc);
dayjs.extend(timezone);
import { toast } from "react-toastify";
import NoPermissionBanner from "../Permission/NoPermissionBanner";
import DailySummary from "../DailySummary";
import { getPagePermissionFromStorage, normalizeContentPermissions } from "@/utils/pagePermission";

const ExpenseInfo = ({ contentPermissions: contentPermissionsFromProps }) => {
  const contentPermissions = contentPermissionsFromProps
    ? normalizeContentPermissions(contentPermissionsFromProps)
    : getPagePermissionFromStorage(["Expense"]);
  const canView = contentPermissions.viewAccess;
  const canInsert = contentPermissions.insertAccess;
  const canEdit = contentPermissions.editAccess;
  const canDelete = contentPermissions.deleteAccess;
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  
  // Expense Category states
  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryKey, setEditingCategoryKey] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Daily sum
  const [dailySumDate, setDailySumDate] = useState(() => dayjs().tz("Asia/Dhaka").startOf("day"));
  const [dailySum, setDailySum] = useState(null);
  const [dailySumLoading, setDailySumLoading] = useState(false);
  const [dailyIncomeForSummary, setDailyIncomeForSummary] = useState(0);

  /** Same date helpers as DailyStatement.js (Mongo $date + Asia/Dhaka) */
  const unwrapDate = (value) => {
    if (!value) return null;
    if (dayjs.isDayjs(value)) return value.toDate();
    if (typeof value === "object") {
      if (value.$date) return value.$date;
      if (value.date) return value.date;
    }
    return value;
  };

  const toDhakaDayjs = (value) => {
    const raw = unwrapDate(value);
    if (!raw) return null;
    const d = dayjs(raw).tz("Asia/Dhaka");
    return d.isValid() ? d : null;
  };

  /** Same as DailyStatement: payments on given date (cash, bkash, nagad, bank) for one booking */
  const getPaymentsByDate = (booking, date) => {
    const payments = booking.payments || [];
    const dateKey = toDhakaDayjs(date)?.format("YYYY-MM-DD");
    const out = { cash: 0, bkash: 0, nagad: 0, bank: 0 };
    if (!dateKey) return out;
    payments.forEach((p) => {
      const d = toDhakaDayjs(p.createdAt)?.format("YYYY-MM-DD");
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

  const getTotalPaidUpToDate = (booking, date) => {
    if (!date) return 0;
    const selectedDay = toDhakaDayjs(date)?.endOf("day");
    if (!selectedDay) return 0;

    if (Array.isArray(booking?.paidAmountsByDate) && booking.paidAmountsByDate.length > 0) {
      return booking.paidAmountsByDate.reduce((sum, row) => {
        const d = toDhakaDayjs(row?.date)?.endOf("day");
        if (!d) return sum;
        if (d.isAfter(selectedDay, "day")) return sum;
        return sum + (Number(row.totalPaid) || 0);
      }, 0);
    }

    const payments = Array.isArray(booking?.payments) ? booking.payments : [];
    if (payments.length > 0) {
      return payments.reduce((sum, p) => {
        const d = toDhakaDayjs(p?.createdAt)?.endOf("day");
        if (!d) return sum;
        if (d.isAfter(selectedDay, "day")) return sum;
        return sum + (Number(p.amount) || 0);
      }, 0);
    }

    if (Number(booking?.advancePayment) > 0) {
      const created = toDhakaDayjs(booking?.createdAt)?.endOf("day");
      if (!created || created.isAfter(selectedDay, "day")) return 0;
      return Number(booking.advancePayment) || 0;
    }
    return 0;
  };

  const getDueClearedDate = (booking) => {
    const totalBill = Number(booking.totalBill) || 0;
    const payments = [...(booking.payments || [])];
    payments.sort((a, b) => {
      const ad = toDhakaDayjs(a.createdAt)?.valueOf() || 0;
      const bd = toDhakaDayjs(b.createdAt)?.valueOf() || 0;
      return ad - bd;
    });
    if (payments.length === 0) {
      const advance = Number(booking.advancePayment) || 0;
      if (advance > 0 && advance >= totalBill) {
        return toDhakaDayjs(booking.createdAt)?.startOf("day") || null;
      }
      return null;
    }
    let running = 0;
    for (const p of payments) {
      running += Number(p.amount) || 0;
      if (running >= totalBill) {
        const d = toDhakaDayjs(p.createdAt)?.startOf("day");
        return d || null;
      }
    }
    return null;
  };

  /** Daily cash total for summary — same booking sets + cash sum as DailyStatement.js */
  const fetchDailyIncomeFromBookings = async (date) => {
    try {
      const response = await coreAxios.get("/bookings");
      if (response.status !== 200) {
        setDailyIncomeForSummary(0);
        return;
      }
      let allBookings = Array.isArray(response.data) ? response.data : [];
      allBookings = allBookings.filter((b) => b && b.statusID !== 255);
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const userRole = userInfo?.role?.value;
        const userHotelID = Number(userInfo?.hotelID);
        if (userRole === "hoteladmin" && userHotelID) {
          allBookings = allBookings.filter((b) => b && Number(b.hotelID) === userHotelID);
        }
      } catch (_) {}

      const selectedDay = toDhakaDayjs(date)?.startOf("day");
      if (!selectedDay) {
        setDailyIncomeForSummary(0);
        return;
      }

      const dueClearedCache = new Map();
      const getDueClearedDayCached = (booking) => {
        const id = booking?._id || booking?.id;
        if (!id) return getDueClearedDate(booking);
        if (dueClearedCache.has(id)) return dueClearedCache.get(id);
        const d = getDueClearedDate(booking);
        dueClearedCache.set(id, d);
        return d;
      };

      const regularInvoice = allBookings.filter((booking) => {
        if (!booking.checkInDate || !booking.checkOutDate) return false;
        const checkIn = toDhakaDayjs(booking.checkInDate)?.startOf("day");
        const checkOut = toDhakaDayjs(booking.checkOutDate)?.startOf("day");
        if (!checkIn || !checkOut) return false;
        if (selectedDay.isBefore(checkIn, "day")) return false;
        if (!selectedDay.isBefore(checkOut, "day")) return false;
        return true;
      });

      const unPaidInvoice = allBookings.filter((booking) => {
        if (!booking.checkOutDate) return false;
        const checkOut = toDhakaDayjs(booking.checkOutDate)?.startOf("day");
        if (!checkOut) return false;
        if (selectedDay.isBefore(checkOut, "day")) return false;

        const totalBill = Number(booking.totalBill) || 0;
        const paidUptoCheckout = getTotalPaidUpToDate(booking, checkOut);
        if (Math.max(0, totalBill - paidUptoCheckout) <= 0) return false;

        const dueClearedDay = getDueClearedDayCached(booking);
        if (dueClearedDay && selectedDay.isAfter(dueClearedDay, "day")) return false;
        return true;
      });

      const combined = [...regularInvoice, ...unPaidInvoice];
      const calculated = combined.reduce((sum, booking) => {
        const byDate = getPaymentsByDate(booking, date);
        return sum + (byDate.cash || 0);
      }, 0);
      setDailyIncomeForSummary(calculated);
    } catch (error) {
      console.error("Error fetching daily income for summary:", error);
      setDailyIncomeForSummary(0);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/expenses");
      if (response.status === 200) {
        const data = Array.isArray(response.data) ? response.data : [];
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const response = await coreAxios.get("/expense-categories");
      if (response.status === 200) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error.response?.data?.message || "Failed to fetch categories");
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchDailySum = async (date) => {
    try {
      setDailySumLoading(true);
      const dateStr = dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");
      const response = await coreAxios.get(`/expenses/sum/daily?date=${dateStr}`);
      if (response?.data) {
        setDailySum(response.data);
      } else {
        setDailySum({ date: dateStr, totalAmount: 0, expenseCount: 0, expenses: [] });
      }
    } catch (error) {
      console.error("Error fetching daily sum:", error);
      toast.error(error.response?.data?.message || "Failed to fetch daily sum");
      setDailySum(null);
    } finally {
      setDailySumLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDailySum(dailySumDate);
    fetchDailyIncomeFromBookings(dailySumDate);
    // No localStorage merge — match DailyStatement live calculation only. Prev/next does not POST daily-summary.
  }, [dailySumDate]);

  // Expenses for selected date only (Bangladesh date)
  const selectedDayBD = dayjs(dailySumDate).tz("Asia/Dhaka").startOf("day");
  const expensesForDate = expenses.filter((e) => {
    if (!e || !e.expenseDate) return false;
    const expenseDayBD = dayjs(e.expenseDate).tz("Asia/Dhaka").startOf("day");
    return expenseDayBD.isSame(selectedDayBD, "day");
  });

  const totalExpensesAmountForDate = useMemo(() => {
    return expensesForDate.reduce((sum, e) => sum + (Number(e?.expenseAmount) || 0), 0);
  }, [expensesForDate]);

  const expenseCountForDate = expensesForDate.length;

  // Reset to page 1 when date changes
  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [dailySumDate]);

  // Category → color for row styling (green, purple, yellow, blue, orange)
  const CATEGORY_COLORS = ["green", "purple", "yellow", "blue", "orange"];
  const categoryColorMap = useMemo(() => {
    const names = [...new Set(expensesForDate.map((e) => (e?.expenseCategory || "").trim()).filter(Boolean))].sort();
    const map = {};
    names.forEach((name, i) => {
      map[name] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    return map;
  }, [expensesForDate]);

  const defaultExpenseRow = () => ({
    expenseCategory: "",
    expenseReason: "",
    expenseAmount: 0,
  });

  const formik = useFormik({
    initialValues: {
      expenseItems: [defaultExpenseRow()],
      expenseDate: dayjs().tz("Asia/Dhaka").startOf("day"),
      createdAt: dayjs().tz("Asia/Dhaka"),
      // Single-item mode for edit
      expenseCategory: "",
      expenseReason: "",
      expenseAmount: 0,
    },
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const expenseDateStr = dayjs(values.expenseDate).tz("Asia/Dhaka").format("YYYY-MM-DD");

        if (isEditing) {
          const payload = {
            expenseCategory: values.expenseCategory || "",
            expenseReason: values.expenseReason?.trim() || "",
            expenseAmount: Number(values.expenseAmount) || 0,
            expenseDate: expenseDateStr,
            createdAt: dayjs(values.createdAt).toISOString(),
          };
          const response = await coreAxios.put(`/expenses/${editingKey}`, payload);
          if (response?.status === 200) {
            toast.success("Expense updated successfully!");
          }
        } else {
          const items = values.expenseItems || [];
          const validItems = items.filter(
            (row) => (row.expenseCategory || "").trim() && Number(row.expenseAmount) > 0
          );
          if (validItems.length === 0) {
            toast.error("Add at least one expense with category and amount.");
            setLoading(false);
            return;
          }
          let successCount = 0;
          for (const row of validItems) {
            const payload = {
              expenseCategory: (row.expenseCategory || "").trim(),
              expenseReason: (row.expenseReason || "").trim() || row.expenseCategory,
              expenseAmount: Number(row.expenseAmount) || 0,
              expenseDate: expenseDateStr,
            };
            const response = await coreAxios.post("/expenses", payload);
            if (response?.status === 200) successCount++;
          }
          if (successCount > 0) {
            toast.success(
              successCount === validItems.length
                ? `${successCount} expense(s) added successfully!`
                : `${successCount}/${validItems.length} expense(s) added.`
            );
          }
        }

        resetForm({
          values: {
            expenseItems: [defaultExpenseRow()],
            expenseDate: dayjs().tz("Asia/Dhaka").startOf("day"),
            createdAt: dayjs().tz("Asia/Dhaka"),
            expenseCategory: "",
            expenseReason: "",
            expenseAmount: 0,
          },
        });

        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        await fetchExpenses();
        fetchDailySum(dailySumDate);
      } catch (error) {
        console.error("Error saving expense:", error);
        toast.error(error.response?.data?.message || "Failed to save expense");
      } finally {
        setLoading(false);
      }
    },
  });

  const addExpenseRow = () => {
    formik.setFieldValue("expenseItems", [
      ...(formik.values.expenseItems || []),
      defaultExpenseRow(),
    ]);
  };

  const removeExpenseRow = (index) => {
    const items = [...(formik.values.expenseItems || [])];
    if (items.length <= 1) return;
    items.splice(index, 1);
    formik.setFieldValue("expenseItems", items);
  };

  const updateExpenseRow = (index, field, value) => {
    const items = [...(formik.values.expenseItems || [])];
    if (!items[index]) return;
    items[index] = { ...items[index], [field]: value };
    formik.setFieldValue("expenseItems", items);
  };

  const categoryFormik = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setCategoryLoading(true);
        const name = values.name?.trim();
        if (!name) {
          toast.error("Category name is required");
          return;
        }

        if (isEditingCategory) {
          await coreAxios.put(`/expense-categories/${editingCategoryKey}`, { name });
          toast.success("Category updated successfully!");
        } else {
          await coreAxios.post("/expense-categories", { name });
          toast.success("Category added successfully!");
        }

        resetForm();
        setCategoryModalVisible(false);
        setIsEditingCategory(false);
        setEditingCategoryKey(null);
        await fetchCategories();
      } catch (error) {
        console.error("Error saving category:", error);
        toast.error(error.response?.data?.message || "Failed to save category");
      } finally {
        setCategoryLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record?._id);
    formik.setValues({
      expenseCategory: record.expenseCategory || "",
      expenseReason: record.expenseReason,
      expenseAmount: record.expenseAmount,
      expenseDate: dayjs(record.expenseDate).tz("Asia/Dhaka"),
      createdAt: dayjs(record.createdAt).tz("Asia/Dhaka"),
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleEditCategory = (record) => {
    setEditingCategoryKey(record._id);
    categoryFormik.setValues({
      name: record.name,
    });
    setCategoryModalVisible(true);
    setIsEditingCategory(true);
  };

  const handleDeleteCategory = async (record) => {
    try {
      setCategoryLoading(true);
      await coreAxios.delete(`/expense-categories/${record._id}`);
      toast.success("Category deleted successfully!");
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      const response = await coreAxios.delete(`/expenses/${record?._id}`);
      if (response?.status === 200) {
        toast.success("Expense deleted successfully!");
        await fetchExpenses();
        fetchDailySum(dailySumDate);
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(error.response?.data?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  const headerCellStyle = {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "11px",
    textAlign: "center",
  };

  const expenseColumns = [
    {
      title: "SL No.",
      dataIndex: "sl",
      key: "sl",
      width: 70,
      align: "center",
      render: (_value, _record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Expense Category",
      dataIndex: "expenseCategory",
      key: "expenseCategory",
      render: (category) => category || "N/A",
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Expense Details",
      dataIndex: "expenseReason",
      key: "expenseReason",
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Amount (BDT)",
      dataIndex: "expenseAmount",
      key: "expenseAmount",
      align: "right",
      render: (amount) => `৳${amount?.toFixed(2) || 0}`,
      sorter: (a, b) => (a.expenseAmount || 0) - (b.expenseAmount || 0),
      onHeaderCell: () => ({ style: headerCellStyle }),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Space size="middle">
          {canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Are you sure to delete this expense?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCategory(record)}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          />
          <Popconfirm
            title="Are you sure to delete this category?"
            onConfirm={() => handleDeleteCategory(record)}
            okText="Yes"
            cancelText="No">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const toBangladeshDateStr = (date) => dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");

  const downloadDailyExpensePdf = async () => {
    try {
      const dateStr = toBangladeshDateStr(dailySumDate);
      const dateLabel = dayjs(dailySumDate).tz("Asia/Dhaka").format("DD MMM YYYY");

      const rows = expensesForDate.map((e, idx) => ({
        sl: idx + 1,
        category: e?.expenseCategory || "N/A",
        reason: e?.expenseReason || e?.expenseDetails || "—",
        amount: Number(e?.expenseAmount || 0),
      }));

      const totalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      // Daily Summary: opening = previous day's closing (same as DailySummary.js)
      const prevDateStr = dayjs(dailySumDate).tz("Asia/Dhaka").subtract(1, "day").format("YYYY-MM-DD");
      const [prevSumRes, expRes] = await Promise.all([
        coreAxios.get(`/daily-summary/${prevDateStr}`).catch(() => null),
        coreAxios.get(`/expenses/sum/daily?date=${dateStr}`).catch(() => null),
      ]);

      const openingBalance =
        Number(prevSumRes?.status === 200 ? prevSumRes.data?.closingBalance : 0) || 0;
      const dailyExpenses =
        Number(expRes?.status === 200 ? expRes.data?.totalAmount : 0) || 0;
      const dailyIncome = Number(dailyIncomeForSummary) || 0;
      const totalBalance = openingBalance + dailyIncome;
      const closingBalance = totalBalance - dailyExpenses;

      const statementRowsHtml = rows.length
        ? rows
            .map(
              (r) => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:center;">${r.sl}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;">${r.category}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;">${r.reason}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;">৳${Number(r.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</td>
              </tr>
            `
            )
            .join("")
        : `<tr><td colspan="4" style="border:1px solid #e5e7eb;padding:8px;font-size:9px;text-align:center;">No records</td></tr>`;

      const totalRowHtml = rows.length
        ? `
          <tr>
            <td colSpan="3" style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
              Total:
            </td>
            <td style="border:1px solid #e5e7eb;padding:5px 4px;font-size:9px;text-align:right;font-weight:800;color:#0f172a;line-height:1.1;">
              ৳${Number(totalAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        `
        : "";

      const html = `
        <div id="daily-expense-pdf-root" style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#0f172a;">
          <div style="padding:14px 18px;background:linear-gradient(135deg,#2563eb 0%, #1d4ed8 100%);color:#fff;text-align:center;">
            <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;">Daily Expenses & Summary - Hotel Sea Shore</div>
            <div style="font-size:12px;opacity:0.95;margin-top:4px;">Date: ${dateLabel}</div>
          </div>

          <div style="padding:14px 18px 8px 18px;">
            <div style="font-size:12px;font-weight:800;color:#0f172a;text-align:center;margin-bottom:8px;">Daily Expense</div>
            <div style="overflow:visible;">
              <table style="width:100%;border-collapse:collapse;min-width:640px;">
                <thead>
                  <tr>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">SL</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Category</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;">Details</th>
                    <th style="border:1px solid #1d4ed8;padding:6px 4px;font-size:9px;background:#2563eb;color:#ffffff;text-align:right;">Amount</th>
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
            <h3 style="margin:0 0 10px 0;font-size:12px;font-weight:800;color:#0f172a;border-bottom:2px solid #93c5fd;padding-bottom:6px;width:100%;text-align:center;">
              Daily Summary
            </h3>
            <div style="overflow:visible;display:flex;justify-content:center;">
              <table style="width:50%;border-collapse:collapse;min-width:unset;">
                <tbody>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Opening Balance</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">
                      ${openingBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Daily Income</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">
                      ${dailyIncome.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Total Balance</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">
                      ${totalBalance.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Daily Expenses</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">
                      ${dailyExpenses.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:700;color:#0f172a;">Closing Balance</td>
                    <td style="border:1px solid #e5e7eb;padding:6px 4px;font-size:10px;font-weight:800;text-align:right;color:#0f172a;">
                      ${closingBalance.toLocaleString()}
                    </td>
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
      const element = container.querySelector("#daily-expense-pdf-root");

      const options = {
        margin: [0.2, 0.2, 0.2, 0.2],
        filename: `Daily-Expense-${dateStr}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().from(element).set(options).save();
      container.remove();
    } catch (e) {
      console.error("Download PDF failed", e);
      toast.error("Failed to download PDF");
    }
  };

  if (!canView) {
    return <NoPermissionBanner />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex-shrink-0">
          {canInsert && (
          <Button
            type="primary"
            onClick={() => {
              setIsEditing(false);
              formik.resetForm({
                values: {
                  expenseItems: [defaultExpenseRow()],
                  expenseDate: dayjs(dailySumDate),
                  createdAt: dayjs(),
                  expenseCategory: "",
                  expenseReason: "",
                  expenseAmount: 0,
                },
              });
              setVisible(true);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            icon={<PlusOutlined />}>
            Add New Expense
          </Button>
          )}
        </div>

        <div className="flex-1 flex justify-center min-w-0">
          {dailySumLoading ? (
            <div className="text-center">
              <Skeleton.Input active size="small" className="mb-1 block mx-auto" />
              <Skeleton.Input active size="small" className="block mx-auto" style={{ width: 120 }} />
            </div>
          ) : (
            <div className="text-center">
              <span className="text-sm text-gray-600 block">Daily total</span>
              <span className="font-semibold text-lg text-gray-800">
                {dailySum != null ? `৳${Number(dailySum.totalAmount || 0).toFixed(2)} (${dailySum.expenseCount || 0} items)` : "—"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="default"
            icon={<LeftOutlined />}
            onClick={() => setDailySumDate(dailySumDate.subtract(1, "day"))}
            aria-label="Previous day"
          />
          <DatePicker
            value={dailySumDate}
            onChange={(date) => setDailySumDate(date ? dayjs(date).tz("Asia/Dhaka").startOf("day") : dayjs().tz("Asia/Dhaka").startOf("day"))}
            allowClear={false}
            format="DD MMM YYYY"
          />
          <Button
            type="default"
            icon={<RightOutlined />}
            onClick={() => setDailySumDate(dailySumDate.add(1, "day"))}
            aria-label="Next day"
          />
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={downloadDailyExpensePdf}
            disabled={loading || dailySumLoading}
          >
            Download PDF
          </Button>
        </div>
      </div>

      <Row gutter={16}>
        {/* Expense Info Table - 2/3 width */}
        <Col xs={24} lg={16}>
          {loading || dailySumLoading ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                      <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-xs w-[70px]">
                        SL No.
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-xs w-[140px]">
                        Expense Category
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-xs min-w-[160px]">
                        Expense Details
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-xs w-[110px]">
                        Amount (BDT)
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-xs w-[110px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-3 py-2 align-middle">
                          <Skeleton.Input active size="small" className="w-full" block />
                        </td>
                        <td className="border border-gray-200 px-3 py-2 align-middle">
                          <Skeleton.Input active size="small" className="w-full" block />
                        </td>
                        <td className="border border-gray-200 px-3 py-2 align-middle">
                          <Skeleton.Input active size="small" className="w-full" block />
                        </td>
                        <td className="border border-gray-200 px-3 py-2 align-middle">
                          <Skeleton.Input active size="small" className="w-full" block />
                        </td>
                        <td className="border border-gray-200 px-3 py-2 align-middle">
                          <Skeleton.Input active size="small" className="w-full" block />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    columns={expenseColumns}
                    dataSource={expensesForDate.slice(
                      (pagination.current - 1) * pagination.pageSize,
                      pagination.current * pagination.pageSize
                    )}
                    pagination={false}
                    rowKey={(record) => record._id || record.id}
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          Total ({expenseCountForDate})
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          {`৳${totalExpensesAmountForDate.toFixed(2)}`}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                      </Table.Summary.Row>
                    )}
                    rowClassName={(record) => {
                      const color = categoryColorMap[(record?.expenseCategory || "").trim()] || "default";
                      return `expense-row expense-cat-${color}`;
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: true }}
                    bordered
                    size="small"
                  />
                </div>
              </div>

              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={expensesForDate?.length || 0}
                showSizeChanger
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                onChange={(page, pageSize) =>
                  setPagination((p) => ({
                    ...p,
                    current: page,
                    pageSize: pageSize || p.pageSize,
                  }))
                }
                className="mt-4"
              />

              <div className="mt-6">
                <DailySummary
                  selectedDate={dailySumDate}
                  dailyIncome={dailyIncomeForSummary}
                  hideSave
                />
              </div>
            </>
          )}
        </Col>

        {/* Expense Category Table - 1/3 width */}
        <Col xs={24} lg={8}>
          <div className="mb-2">
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setIsEditingCategory(false);
                categoryFormik.resetForm({
                  values: {
                    name: "",
                  },
                });
                setCategoryModalVisible(true);
              }}
              style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
              icon={<PlusOutlined />}>
              Add Category
            </Button>
          </div>
          {categoryLoading ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table
                  columns={categoryColumns}
                  dataSource={categories}
                  pagination={false}
                  rowKey={(record) => record._id}
                  scroll={{ x: true }}
                  bordered
                  size="small"
                />
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Expense Modal */}
      <Modal
        title={isEditing ? "Edit Expense" : "Add New Expense"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          formik.resetForm({
            values: {
              expenseItems: [defaultExpenseRow()],
              expenseDate: dayjs().tz("Asia/Dhaka").startOf("day"),
              createdAt: dayjs().tz("Asia/Dhaka"),
              expenseCategory: "",
              expenseReason: "",
              expenseAmount: 0,
            },
          });
        }}
        footer={null}
        width={isEditing ? 520 : 720}>
        <form onSubmit={formik.handleSubmit}>
          {isEditing ? (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Expense Category</label>
                <Select
                  name="expenseCategory"
                  style={{ width: "100%" }}
                  placeholder="Select expense category"
                  value={formik.values.expenseCategory}
                  onChange={(value) => formik.setFieldValue("expenseCategory", value)}
                  required>
                  {categories.map((cat) => (
                    <Select.Option key={cat._id} value={cat.name}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Expense Reason</label>
                <Input.TextArea
                  name="expenseReason"
                  rows={3}
                  placeholder="Enter expense reason"
                  value={formik.values.expenseReason}
                  onChange={formik.handleChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Amount (BDT)</label>
                <InputNumber
                  name="expenseAmount"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
                  step={0.01}
                  precision={2}
                  min={0}
                  value={formik.values.expenseAmount}
                  onChange={(value) => formik.setFieldValue("expenseAmount", value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Expense Date</label>
                <DatePicker
                  name="expenseDate"
                  style={{ width: "100%" }}
                  value={formik.values.expenseDate}
                  onChange={(date) => formik.setFieldValue("expenseDate", date)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Created At</label>
                <DatePicker
                  name="createdAt"
                  style={{ width: "100%" }}
                  showTime
                  value={formik.values.createdAt}
                  onChange={(date) => formik.setFieldValue("createdAt", date)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Expense Date</label>
                <DatePicker
                  style={{ width: "100%" }}
                  value={formik.values.expenseDate}
                  onChange={(date) => formik.setFieldValue("expenseDate", date ? dayjs(date).tz("Asia/Dhaka").startOf("day") : dayjs().tz("Asia/Dhaka").startOf("day"))}
                  required
                />
              </div>
              <div className="mb-2 flex justify-between items-center">
                <span className="font-medium text-gray-700">Category-wise expense (reason & amount)</span>
                <Button type="dashed" icon={<PlusOutlined />} onClick={addExpenseRow} size="small">
                  Add row
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 w-[180px]">Category</th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600">Reason</th>
                      <th className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 w-[120px]">Amount (BDT)</th>
                      <th className="border-b border-gray-200 px-3 py-2 w-[56px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formik.values.expenseItems || []).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-3 py-2 align-top">
                          <Select
                            style={{ width: "100%", minWidth: 160 }}
                            placeholder="Select category"
                            value={row.expenseCategory || undefined}
                            onChange={(value) => updateExpenseRow(index, "expenseCategory", value)}
                            allowClear>
                            {categories.map((cat) => (
                              <Select.Option key={cat._id} value={cat.name}>
                                {cat.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            placeholder="Reason"
                            value={row.expenseReason || ""}
                            onChange={(e) => updateExpenseRow(index, "expenseReason", e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <InputNumber
                            style={{ width: "100%", minWidth: 100 }}
                            placeholder="0"
                            min={0}
                            step={0.01}
                            precision={2}
                            value={row.expenseAmount}
                            onChange={(value) => updateExpenseRow(index, "expenseAmount", value ?? 0)}
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeExpenseRow(index)}
                            disabled={(formik.values.expenseItems || []).length <= 1}
                            aria-label="Remove row"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            style={{ width: "100%", backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            className="mt-2">
            {isEditing ? "Update Expense" : "Add Expense(s)"}
          </Button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={isEditingCategory ? "Edit Category" : "Add New Category"}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          categoryFormik.resetForm({
            values: {
              name: "",
            },
          });
        }}
        footer={null}>
        <form onSubmit={categoryFormik.handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Category Name</label>
            <Input
              name="name"
              placeholder="Enter category name"
              value={categoryFormik.values.name}
              onChange={categoryFormik.handleChange}
              required
            />
          </div>

          <Button
            type="primary"
            loading={categoryLoading}
            htmlType="submit"
            style={{ width: "100%", backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            className="mt-2">
            {isEditingCategory ? "Update Category" : "Add Category"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ExpenseInfo;
