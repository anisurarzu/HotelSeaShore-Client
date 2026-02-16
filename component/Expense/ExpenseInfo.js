"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Pagination,
  DatePicker,
  Select,
  Row,
  Col,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
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

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/expenses");
      if (response.status === 200) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      // Try to fetch from API, if not available, use localStorage
      try {
        const response = await coreAxios.get("/expense-categories");
        if (response.status === 200) {
          setCategories(response.data || []);
          return;
        }
      } catch (apiError) {
        // If API doesn't exist, use localStorage
        const storedCategories = localStorage.getItem("expenseCategories");
        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        } else {
          // Initialize with default categories
          const defaultCategories = [
            { _id: "1", name: "Food & Beverage" },
            { _id: "2", name: "Utilities" },
            { _id: "3", name: "Maintenance" },
            { _id: "4", name: "Staff Salary" },
            { _id: "5", name: "Marketing" },
            { _id: "6", name: "Other" },
          ];
          setCategories(defaultCategories);
          localStorage.setItem("expenseCategories", JSON.stringify(defaultCategories));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

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
        // Format dates before sending to API
        const payload = {
          expenseCategory: values.expenseCategory,
          expenseReason: values.expenseReason,
          expenseAmount: values.expenseAmount,
          expenseDate: values.expenseDate.format("YYYY-MM-DD"),
          createdAt: values.createdAt.format("YYYY-MM-DD HH:mm:ss"),
        };

        if (isEditing) {
          const response = await coreAxios.put(
            `/expenses/${editingKey}`,
            payload
          );
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
        let updatedCategories = [...categories];

        if (isEditingCategory) {
          // Update category
          updatedCategories = categories.map((cat) =>
            cat._id === editingCategoryKey
              ? { ...cat, name: values.name }
              : cat
          );
          try {
            await coreAxios.put(`/expense-categories/${editingCategoryKey}`, {
              name: values.name,
            });
          } catch (apiError) {
            // If API doesn't exist, just update localStorage
            localStorage.setItem("expenseCategories", JSON.stringify(updatedCategories));
          }
          toast.success("Category updated successfully!");
        } else {
          // Add new category
          const newCategory = {
            _id: `cat-${Date.now()}`,
            name: values.name,
          };
          updatedCategories.push(newCategory);
          try {
            await coreAxios.post("/expense-categories", { name: values.name });
          } catch (apiError) {
            // If API doesn't exist, just update localStorage
            localStorage.setItem("expenseCategories", JSON.stringify(updatedCategories));
          }
          toast.success("Category added successfully!");
        }

        setCategories(updatedCategories);
        resetForm();
        setCategoryModalVisible(false);
        setIsEditingCategory(false);
        setEditingCategoryKey(null);
      } catch (error) {
        console.error("Error saving category:", error);
        toast.error("Failed to save category");
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
      const updatedCategories = categories.filter((cat) => cat._id !== record._id);
      setCategories(updatedCategories);
      localStorage.setItem("expenseCategories", JSON.stringify(updatedCategories));
      try {
        await coreAxios.delete(`/expense-categories/${record._id}`);
      } catch (apiError) {
        // If API doesn't exist, that's fine, we already updated localStorage
      }
      toast.success("Category deleted successfully!");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
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
      title: "Expense Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
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
      <div className="mb-4 flex justify-between items-center">
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

      <Row gutter={16}>
        {/* Expense Info Table - 2/3 width */}
        <Col xs={24} lg={16}>
          <Spin spinning={loading}>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table
                  columns={expenseColumns}
                  dataSource={expenses}
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
              total={expenses?.length}
              onChange={(page, pageSize) =>
                setPagination({ ...pagination, current: page, pageSize })
              }
              className="mt-4"
            />
          </Spin>
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
          <Spin spinning={categoryLoading}>
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
          </Spin>
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

          <div className="mb-4">
            <label className="block mb-1 font-medium">Expense Date</label>
            <DatePicker
              name="expenseDate"
              style={{ width: "100%" }}
              value={formik.values.expenseDate}
              onChange={(date) => formik.setFieldValue("expenseDate", date)}
              disabled
              required
            />
          </div>

          {isEditing && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Created At</label>
              <DatePicker
                name="createdAt"
                style={{ width: "100%" }}
                showTime
                value={formik.values.createdAt}
                onChange={(date) => formik.setFieldValue("createdAt", date)}
                disabled
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
