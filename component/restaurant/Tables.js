"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  message,
  Popconfirm,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Row,
  Col,
  Space,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form] = Form.useForm();

  // Fetch tables from API
  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/restaurant/tables");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { tables: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const tablesData = responseData?.tables || 
                          (Array.isArray(responseData) ? responseData : []);
        
        // Sort by table number
        const sortedTables = tablesData.sort((a, b) => {
          const numA = parseInt(a.tableNumber || 0);
          const numB = parseInt(b.tableNumber || 0);
          return numA - numB;
        });
        
        setTables(sortedTables);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      message.error(error.response?.data?.message || "Failed to fetch tables.");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      // Ensure status is a valid enum value
      let status = values.status;
      if (!status || typeof status !== "string") {
        status = "available"; // Default value
      }
      
      // Validate status value matches enum
      const validStatuses = ["available", "occupied", "reserved", "maintenance"];
      if (!validStatuses.includes(status)) {
        status = "available"; // Fallback to default
      }

      const tableData = {
        tableNumber: values.tableNumber,
        capacity: Number(values.capacity) || 1,
        location: values.location || "",
        status: status,
        notes: values.notes || "",
      };

      let response;
      if (editingTable) {
        // Update existing table - API expects: PUT /restaurant/table/:id
        const itemId = editingTable.id || editingTable._id;
        response = await coreAxios.put(`/restaurant/table/${itemId}`, tableData);
      } else {
        // Create new table - API expects: POST /restaurant/table
        response = await coreAxios.post("/restaurant/table", tableData);
      }

      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || 
          (editingTable ? "Table updated successfully!" : "Table created successfully!");
        message.success(successMsg);
        setVisible(false);
        setEditingTable(null);
        form.resetFields();
        fetchTables();
      }
    } catch (error) {
      console.error("Error saving table:", error);
      message.error(
        error.response?.data?.message || "Failed to save table."
      );
    }
  };

  // Handle edit
  const handleEdit = (table) => {
    setEditingTable(table);
    
    // Ensure status is a valid string value
    let statusValue = table.status;
    if (!statusValue || typeof statusValue !== "string") {
      statusValue = "available"; // Default value
    }
    
    // Validate status value matches enum
    const validStatuses = ["available", "occupied", "reserved", "maintenance"];
    if (!validStatuses.includes(statusValue)) {
      statusValue = "available"; // Fallback to default
    }
    
    form.setFieldsValue({
      tableNumber: table.tableNumber || "",
      capacity: table.capacity || 1,
      location: table.location || "",
      status: statusValue,
      notes: table.notes || "",
    });
    setVisible(true);
  };

  // Handle delete
  const handleDelete = async (tableId) => {
    try {
      const response = await coreAxios.delete(`/restaurant/table/${tableId}`);
      
      if (response.status === 200) {
        const successMsg = response.data?.message || "Table deleted successfully!";
        message.success(successMsg);
        fetchTables();
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      message.error(error.response?.data?.message || "Failed to delete table.");
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (table) => {
    try {
      // Toggle between available and occupied
      const newStatus = table.status === "available" ? "occupied" : "available";
      
      const response = await coreAxios.put(`/restaurant/table/${table.id || table._id}`, {
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location || "",
        status: newStatus,
        notes: table.notes || "",
      });
      
      if (response.status === 200) {
        const successMsg = response.data?.message || 
          (newStatus === "available" ? "Table marked as available" : "Table marked as occupied");
        message.success(successMsg);
        fetchTables();
      }
    } catch (error) {
      console.error("Error updating table status:", error);
      message.error(error.response?.data?.message || "Failed to update table status.");
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Table Management</h1>
            <div className="w-full sm:w-auto flex flex-row gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTables}
                loading={loading}
                className="w-full sm:w-auto"
                style={{ height: "40px" }}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTable(null);
                  form.resetFields();
                  setVisible(true);
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                style={{ height: "40px" }}
              >
                <span className="hidden sm:inline">Add Table</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="p-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {tables.length === 0 ? (
              <Col span={24}>
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tables found. Create your first table to get started.</p>
                  </div>
                </Card>
              </Col>
            ) : (
              tables.map((table) => {
                const isAvailable = table.status === "available";
                const statusColor = {
                  available: "green",
                  occupied: "red",
                  reserved: "orange",
                  maintenance: "gray"
                }[table.status] || "default";
                
                const statusLabel = {
                  available: "Available",
                  occupied: "Occupied",
                  reserved: "Reserved",
                  maintenance: "Maintenance"
                }[table.status] || table.status;

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={table.id || table._id}>
                    <Card
                      className={`h-full ${
                        isAvailable 
                          ? "border-green-300 hover:border-green-500" 
                          : "border-red-300 hover:border-red-500"
                      }`}
                      actions={[
                        <Tooltip title="Edit">
                          <EditOutlined
                            key="edit"
                            onClick={() => handleEdit(table)}
                            className="text-blue-600 hover:text-blue-800"
                          />
                        </Tooltip>,
                        <Tooltip title={isAvailable ? "Mark as Occupied" : "Mark as Available"}>
                          {isAvailable ? (
                            <CheckCircleOutlined
                              key="status"
                              onClick={() => handleStatusToggle(table)}
                              className="text-green-600 hover:text-green-800"
                            />
                          ) : (
                            <CloseCircleOutlined
                              key="status"
                              onClick={() => handleStatusToggle(table)}
                              className="text-red-600 hover:text-red-800"
                            />
                          )}
                        </Tooltip>,
                        <Popconfirm
                          title="Are you sure to delete this table?"
                          onConfirm={() => handleDelete(table.id || table._id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Tooltip title="Delete">
                            <DeleteOutlined
                              key="delete"
                              className="text-red-600 hover:text-red-800"
                            />
                          </Tooltip>
                        </Popconfirm>,
                      ]}
                    >
                      <div className="text-center">
                        <div className="mb-3">
                          <div
                            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${
                              isAvailable
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {table.tableNumber || "N/A"}
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Table {table.tableNumber || "N/A"}
                        </h3>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-gray-600">
                            Capacity: <span className="font-medium">{table.capacity || 0} persons</span>
                          </p>
                          {table.location && (
                            <p className="text-sm text-gray-600">
                              Location: <span className="font-medium">{table.location}</span>
                            </p>
                          )}
                        </div>
                        <Tag
                          color={statusColor}
                          className="text-sm"
                        >
                          {statusLabel}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        )}
      </div>

      {/* Create/Edit Table Modal */}
      <Modal
        title={editingTable ? "Edit Table" : "Add New Table"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setEditingTable(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tableNumber"
                label="Table Number"
                rules={[{ required: true, message: "Please enter table number" }]}
              >
                <Input placeholder="Enter table number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="capacity"
                label="Capacity (persons)"
                rules={[{ required: true, message: "Please enter capacity" }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Enter capacity"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="location"
                label="Location"
              >
                <Input placeholder="Enter table location (e.g., Indoor, Outdoor)" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
                initialValue="available"
              >
                <Select placeholder="Select status">
                  <Select.Option value="available">Available</Select.Option>
                  <Select.Option value="occupied">Occupied</Select.Option>
                  <Select.Option value="reserved">Reserved</Select.Option>
                  <Select.Option value="maintenance">Maintenance</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="notes" label="Notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Enter any additional notes..."
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              onClick={() => {
                setVisible(false);
                setEditingTable(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {editingTable ? "Update Table" : "Add Table"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Tables;
