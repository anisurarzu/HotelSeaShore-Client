"use client";

/**
 * Role & Permission Management – connects to backend:
 * GET /permission, POST /permission, PUT /permission/:id, DELETE /permission/:id
 */
import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Checkbox,
  message,
  Input,
  Spin,
  Tag,
  Dropdown,
  Tabs,
  Card,
  Space,
  Typography,
  Empty,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SafetyOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";
import {
  HOTEL_PAGES,
  RESTAURANT_PAGES,
} from "@/config/dashboardPages";

const { Text } = Typography;

// Role = Permission document: permissionName (role name) + permissions[] (page-wise access)
const defaultPagePermission = (page) => ({
  pageKey: page.key,
  pageName: page.label,
  viewAccess: false,
  insertAccess: false,
  editAccess: false,
  deleteAccess: false,
});

const PermissionManagement = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState("hotel");

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/permission");
      if (response.status === 200) {
        const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        setRoles(data);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to fetch roles.";
      message.error(msg);
      setRoles([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const pagesByPortal = { hotel: HOTEL_PAGES, restaurant: RESTAURANT_PAGES };
  const currentPages = pagesByPortal[activeTab] || HOTEL_PAGES;
  const allPages = [...HOTEL_PAGES, ...RESTAURANT_PAGES];
  const PAGE_NAME_TO_KEY = Object.fromEntries(allPages.map((p) => [p.label, p.key]));

  function getPageKey(p) {
    return p.pageKey || (p.pageName && PAGE_NAME_TO_KEY[p.pageName]) || p.pageName;
  }

  const formik = useFormik({
    initialValues: {
      permissionName: "",
      permissions: [],
    },
    onSubmit: async (values) => {
      if (!values.permissionName?.trim()) {
        message.error("Please enter a role name.");
        return;
      }

      const permissions = values.permissions.filter((p) => p.viewAccess || p.insertAccess || p.editAccess || p.deleteAccess);
      if (permissions.length === 0) {
        message.error("Assign at least one page with View or other access.");
        return;
      }

      setLoading(true);
      try {
        const payload = { permissionName: values.permissionName.trim(), permissions };
        if (isEditing) {
          await coreAxios.put(`/permission/${editingKey}`, payload);
          message.success("Role updated successfully.");
        } else {
          await coreAxios.post("/permission", payload);
          message.success("Role created successfully.");
        }
        setVisible(false);
        setEditingKey(null);
        formik.resetForm();
        fetchRoles();
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data?.error || "Failed to save role.";
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record._id);
    const perms = Array.isArray(record.permissions) ? record.permissions : [];
    formik.setValues({
      permissionName: record.permissionName || "",
      permissions: allPages.map((page) => {
        const existing = perms.find((p) => (p.pageKey || getPageKey(p)) === page.key);
        return existing
          ? { ...existing, pageKey: page.key, pageName: page.label }
          : { ...defaultPagePermission(page), viewAccess: false };
      }),
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      await coreAxios.delete(`/permission/${record._id}`);
      message.success("Role deleted successfully.");
      await fetchRoles();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Failed to delete role.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingKey(null);
    setIsEditing(false);
    formik.setValues({
      permissionName: "",
      permissions: allPages.map((p) => defaultPagePermission(p)),
    });
    setVisible(true);
  };

  const setPagePermission = (pageKey, field, value) => {
    const next = formik.values.permissions.map((p) =>
      (p.pageKey || getPageKey(p)) === pageKey ? { ...p, [field]: value } : p
    );
    formik.setValues({ ...formik.values, permissions: next });
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "permissionName",
      key: "permissionName",
      render: (text) => (
        <Space>
          <SafetyOutlined className="text-blue-500" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Page access",
      dataIndex: "permissions",
      key: "pages",
      render: (permissions) => (
        <Space wrap size={[4, 4]}>
          {permissions?.filter((p) => p.viewAccess).slice(0, 5).map((p, i) => (
            <Tag key={i} color="blue">{p.pageName || p.pageKey}</Tag>
          ))}
          {permissions?.filter((p) => p.viewAccess).length > 5 && (
            <Tag>+{permissions.filter((p) => p.viewAccess).length - 5} more</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => handleEdit(record) },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => {
                  Modal.confirm({
                    title: "Delete this role?",
                    content: "Users with this role will need a new role assignment.",
                    okText: "Delete",
                    onOk: () => handleDelete(record),
                  });
                },
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button size="small">
            Actions <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AppstoreOutlined />
            Role & Permission Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Create roles and assign page access + content permissions (view, add, edit, delete) per page.
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Role
        </Button>
      </div>

      {initialLoad ? (
        <Card><Spin tip="Loading roles..." /></Card>
      ) : (
        <Card title="Roles" className="shadow-sm">
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t} roles` }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No roles yet"
                >
                  <Button type="primary" onClick={openCreateModal}>
                    Create first role
                  </Button>
                </Empty>
              ),
            }}
          />
        </Card>
      )}

      <Modal
        title={isEditing ? "Edit Role" : "Create Role"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Role name</label>
            <Input
              placeholder="e.g. Hotel Manager, Reception"
              value={formik.values.permissionName}
              onChange={(e) => formik.setFieldValue("permissionName", e.target.value)}
              required
            />
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "hotel", label: "Hotel pages" },
              { key: "restaurant", label: "Restaurant pages" },
            ]}
          />

          <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-2 mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-semibold">Page</th>
                  <th className="text-center p-2 w-20">View</th>
                  <th className="text-center p-2 w-20">Add</th>
                  <th className="text-center p-2 w-20">Edit</th>
                  <th className="text-center p-2 w-20">Delete</th>
                </tr>
              </thead>
              <tbody>
                {currentPages.map((page) => {
                  const perm = formik.values.permissions.find(
                    (p) => (p.pageKey || getPageKey(p)) === page.key
                  ) || defaultPagePermission(page);
                  return (
                    <tr key={page.key} className="border-b hover:bg-gray-50/50">
                      <td className="p-2 font-medium">{page.label}</td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={!!perm.viewAccess}
                          onChange={(e) => setPagePermission(page.key, "viewAccess", e.target.checked)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={!!perm.insertAccess}
                          onChange={(e) => setPagePermission(page.key, "insertAccess", e.target.checked)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={!!perm.editAccess}
                          onChange={(e) => setPagePermission(page.key, "editAccess", e.target.checked)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={!!perm.deleteAccess}
                          onChange={(e) => setPagePermission(page.key, "deleteAccess", e.target.checked)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
