"use client";

import { useEffect, useState } from "react";
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
import { EditOutlined, DeleteOutlined, PlusOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";
import { toast } from "react-toastify";

const ExpenseInfo = () => {
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
  const [dailySumDate, setDailySumDate] = useState(dayjs());
  const [dailySum, setDailySum] = useState(null);
  const [dailySumLoading, setDailySumLoading] = useState(false);

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
      const dateStr = dayjs(date).format("YYYY-MM-DD");
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
  }, [dailySumDate]);

  // Expenses for selected date only (table is date-wise)
  const expensesForDate = expenses.filter(
    (e) => e && e.expenseDate && dayjs(e.expenseDate).isSame(dailySumDate, "day")
  );

  // Reset to page 1 when date changes
  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [dailySumDate]);

  const formik = useFormik({
    initialValues: {
      expenseCategory: "",
      expenseReason: "",
      expenseAmount: 0,
      expenseDate: dayjs(),
      createdAt: dayjs(),
    },
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const payload = {
          expenseCategory: values.expenseCategory || "",
          expenseReason: values.expenseReason?.trim() || "",
          expenseAmount: Number(values.expenseAmount) || 0,
          expenseDate: dayjs(values.expenseDate).format("YYYY-MM-DD"),
        };
        if (isEditing) {
          payload.createdAt = dayjs(values.createdAt).toISOString();
          const response = await coreAxios.put(`/expenses/${editingKey}`, payload);
          if (response?.status === 200) {
            toast.success("Expense updated successfully!");
          }
        } else {
          const response = await coreAxios.post("/expenses", payload);
          if (response?.status === 200) {
            toast.success("Expense created successfully!");
          }
        }

        resetForm({
          values: {
            expenseCategory: "",
            expenseReason: "",
            expenseAmount: 0,
            expenseDate: dayjs(),
            createdAt: dayjs(),
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
      expenseDate: dayjs(record.expenseDate),
      createdAt: dayjs(record.createdAt),
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

  const expenseColumns = [
    {
      title: "Expense Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: "Category",
      dataIndex: "expenseCategory",
      key: "expenseCategory",
      render: (category) => category || "N/A",
    },
    {
      title: "Expense Reason",
      dataIndex: "expenseReason",
      key: "expenseReason",
    },
    {
      title: "Amount (BDT)",
      dataIndex: "expenseAmount",
      key: "expenseAmount",
      render: (amount) => `৳${amount?.toFixed(2) || 0}`,
      sorter: (a, b) => (a.expenseAmount || 0) - (b.expenseAmount || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
          />
          <Popconfirm
            title="Are you sure to delete this expense?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No">
            <Button
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex-shrink-0">
          <Button
            type="primary"
            onClick={() => {
              setIsEditing(false);
              formik.resetForm({
                values: {
                  expenseCategory: "",
                  expenseReason: "",
                  expenseAmount: 0,
                  expenseDate: dayjs(),
                  createdAt: dayjs(),
                },
              });
              setVisible(true);
            }}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            icon={<PlusOutlined />}>
            Add New Expense
          </Button>
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
            onChange={(date) => setDailySumDate(date || dayjs())}
            allowClear={false}
            format="DD MMM YYYY"
          />
          <Button
            type="default"
            icon={<RightOutlined />}
            onClick={() => setDailySumDate(dailySumDate.add(1, "day"))}
            aria-label="Next day"
          />
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
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-[120px]">Expense Date</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-[100px]">Category</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 min-w-[140px]">Expense Reason</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-[110px]">Amount (BDT)</th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <tr key={i}>
                        <td className="border border-gray-200 px-3 py-2 align-middle"><Skeleton.Input active size="small" className="w-full" block /></td>
                        <td className="border border-gray-200 px-3 py-2 align-middle"><Skeleton.Input active size="small" className="w-full" block /></td>
                        <td className="border border-gray-200 px-3 py-2 align-middle"><Skeleton.Input active size="small" className="w-full" block /></td>
                        <td className="border border-gray-200 px-3 py-2 align-middle"><Skeleton.Input active size="small" className="w-full" block /></td>
                        <td className="border border-gray-200 px-3 py-2 align-middle"><Skeleton.Input active size="small" className="w-full" block /></td>
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
                  setPagination((p) => ({ ...p, current: page, pageSize: pageSize || p.pageSize }))
                }
                className="mt-4"
              />
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
              expenseCategory: "",
              expenseReason: "",
              expenseAmount: 0,
              expenseDate: dayjs(),
              createdAt: dayjs(),
            },
          });
        }}
        footer={null}>
        <form onSubmit={formik.handleSubmit}>
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

          {isEditing && (
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
          )}

          {isEditing && (
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
          )}

          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            style={{ width: "100%", backgroundColor: "#2563eb", borderColor: "#2563eb" }}
            className="mt-2">
            {isEditing ? "Update Expense" : "Add Expense"}
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
