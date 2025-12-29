"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Checkbox,
  message,
  Input,
  Spin,
  Popconfirm,
  Tag,
  Dropdown,
  Menu,
  Skeleton,
  Divider,
  Grid,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";

const { useBreakpoint } = Grid;

const validPageNames = [
  "Dashboard",
  "Calender",
  "Booking",
  "Daily Statement",
  "Report",
  "Expense",
  "Hotel",
  "Users",
  "WebHotels",
  "WebUsers",
  "WebBooking",
  "RoomAvailability",
];

const PermissionManagement = () => {
  const screens = useBreakpoint();
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/permission");
      if (response.status === 200) {
        setPermissions(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch permissions. Please try again.");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const formik = useFormik({
    initialValues: {
      permissionName: "",
      permissions: [
        {
          pageName: "",
          viewAccess: false,
          editAccess: false,
          deleteAccess: false,
          insertAccess: false,
        },
      ],
    },
    onSubmit: async (values, { resetForm }) => {
      if (
        values.permissions.some((p) => !validPageNames.includes(p.pageName))
      ) {
        message.error(
          "Invalid page name in one or more permissions. Please choose from the available list."
        );
        return;
      }

      if (!values.permissionName) {
        message.error("Please provide a permission name");
        return;
      }

      setLoading(true);
      try {
        if (isEditing) {
          const response = await coreAxios.put(
            `/permission/${editingKey}`,
            values
          );
          if (response.status === 200) {
            message.success("Permission updated successfully!");
          }
        } else {
          const response = await coreAxios.post("/permission", values);
          if (response.status === 201) {
            message.success("Permission created successfully!");
          }
        }

        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        fetchPermissions();
      } catch (error) {
        message.error(
          error.response?.data?.message ||
            "Failed to save permission. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record._id);
    formik.setValues({
      permissionName: record.permissionName,
      permissions: record.permissions,
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      const response = await coreAxios.delete(`/permission/${record._id}`);
      if (response.status === 200) {
        message.success("Permission deleted successfully!");
        fetchPermissions();
      }
    } catch (error) {
      message.error("Failed to delete permission. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addPermissionItem = () => {
    formik.setValues({
      ...formik.values,
      permissions: [
        ...formik.values.permissions,
        {
          pageName: "",
          viewAccess: false,
          editAccess: false,
          deleteAccess: false,
          insertAccess: false,
        },
      ],
    });
  };

  const removePermissionItem = (index) => {
    const newPermissions = [...formik.values.permissions];
    newPermissions.splice(index, 1);
    formik.setValues({
      ...formik.values,
      permissions: newPermissions,
    });
  };

  const columns = [
    {
      title: "Permission Name",
      dataIndex: "permissionName",
      key: "permissionName",
      render: (text) => (
        <span className="hover:text-blue-600 transition-colors cursor-pointer">
          {text}
        </span>
      ),
    },
    {
      title: "Pages",
      dataIndex: "permissions",
      key: "pages",
      render: (permissions) => (
        <div className="flex flex-wrap gap-1">
          {permissions
            .slice(0, screens.md ? permissions.length : 3)
            .map((p, i) => (
              <Tag key={i} color="blue">
                {p.pageName}
              </Tag>
            ))}
          {!screens.md && permissions.length > 3 && (
            <Tag>+{permissions.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: screens.md ? 150 : 100,
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Menu.Item>
              <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
                <Popconfirm
                  title="Are you sure to delete this permission?"
                  onConfirm={() => handleDelete(record)}
                  okText="Yes"
                  cancelText="No"
                >
                  Delete
                </Popconfirm>
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button
            className="flex items-center"
            size={screens.md ? "middle" : "small"}
          >
            {screens.md ? "Actions" : <EditOutlined />}{" "}
            {screens.md && <DownOutlined className="ml-1" />}
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Permission Management
        </h1>
      </div>

      <div className="flex justify-end my-2" style={{ marginTop: "1rem" }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setIsEditing(false);
            formik.resetForm();
            formik.setValues({
              permissionName: "",
              permissions: [
                {
                  pageName: "",
                  viewAccess: false,
                  editAccess: false,
                  deleteAccess: false,
                  insertAccess: false,
                },
              ],
            });
            setVisible(true);
          }}
          className="shadow-md"
        >
          {screens.sm ? "Add New Permission" : "Add New"}
        </Button>
      </div>

      {initialLoad ? (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      ) : (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <Table
            columns={columns}
            dataSource={permissions}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: permissions.length,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              size: screens.md ? "default" : "small",
            }}
            loading={loading}
            scroll={{ x: true }}
            size={screens.md ? "default" : "middle"}
          />
        </div>
      )}

      <Modal
        title={isEditing ? "Edit Permission" : "Add New Permission"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={800}
        centered
      >
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Permission Name
            </label>
            <Input
              name="permissionName"
              value={formik.values.permissionName}
              onChange={formik.handleChange}
              required
              placeholder="e.g., Admin Permissions, Manager Permissions"
              className="py-2"
            />
          </div>

          <Divider orientation="left">Page Permissions</Divider>

          {formik.values.permissions.map((permission, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 mb-4 relative"
              style={{ marginBottom: "1rem", marginTop: "1rem" }}
            >
              {formik.values.permissions.length > 1 && (
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => removePermissionItem(index)}
                  className="absolute top-2 right-2"
                  danger
                />
              )}

              <div className="mb-4">
                <label
                  className="block font-semibold text-gray-700"
                  style={{ marginBottom: "1rem", marginTop: "1rem" }}
                >
                  Page Name
                </label>
                <div className="gap-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {validPageNames.map((name) => (
                    <Tag
                      key={name}
                      color={permission.pageName === name ? "green" : "blue"}
                      className={`cursor-pointer hover:shadow-md transition-all text-center py-1 px-3 ${
                        permission.pageName === name
                          ? "ring-2 ring-green-400"
                          : ""
                      }`}
                      onClick={() =>
                        formik.setFieldValue(
                          `permissions[${index}].pageName`,
                          name
                        )
                      }
                    >
                      {name}
                    </Tag>
                  ))}
                </div>
              </div>

              <div
                className=""
                style={{ marginBottom: "1rem", marginTop: "1rem" }}
              >
                <label className="block mb-2 text-gray-700">
                  Access Rights
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Checkbox
                    name={`permissions[${index}].viewAccess`}
                    checked={permission.viewAccess}
                    onChange={formik.handleChange}
                    className="hover:bg-gray-50 p-2 rounded"
                  >
                    View Access
                  </Checkbox>
                  <Checkbox
                    name={`permissions[${index}].editAccess`}
                    checked={permission.editAccess}
                    onChange={formik.handleChange}
                    className="hover:bg-gray-50 p-2 rounded"
                  >
                    Edit Access
                  </Checkbox>
                  <Checkbox
                    name={`permissions[${index}].deleteAccess`}
                    checked={permission.deleteAccess}
                    onChange={formik.handleChange}
                    className="hover:bg-gray-50 p-2 rounded"
                  >
                    Delete Access
                  </Checkbox>
                  <Checkbox
                    name={`permissions[${index}].insertAccess`}
                    checked={permission.insertAccess}
                    onChange={formik.handleChange}
                    className="hover:bg-gray-50 p-2 rounded"
                  >
                    Insert Access
                  </Checkbox>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="dashed"
            onClick={addPermissionItem}
            block
            icon={<PlusOutlined />}
          >
            Add Another Page Permission
          </Button>

          <div
            className="flex justify-end gap-4 pt-6"
            style={{ marginTop: "1rem" }}
          >
            <Button
              onClick={() => setVisible(false)}
              className="px-6 py-2 border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="px-6 py-2 shadow-md"
            >
              {isEditing ? "Update Permission" : "Create Permission"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
