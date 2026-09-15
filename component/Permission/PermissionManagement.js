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
  Skeleton,
  Tag,
  Dropdown,
  Tabs,
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
} from "@ant-design/icons";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";
import {
  HOTEL_PAGES,
  RESTAURANT_PAGES,
} from "@/config/dashboardPages";
import "../AdminOps.css";

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
        <Space size={8}>
          <SafetyOutlined style={{ color: "#0b5c66" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Page access",
      dataIndex: "permissions",
      key: "pages",
      render: (permissions) => {
        const visible = permissions?.filter((p) => p.viewAccess) || [];
        return (
          <div className="hs-pm__tags">
            {visible.slice(0, 5).map((p, i) => (
              <Tag key={i}>{p.pageName || p.pageKey}</Tag>
            ))}
            {visible.length > 5 && <Tag>+{visible.length - 5} more</Tag>}
          </div>
        );
      },
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

  const viewCount = roles.reduce((sum, r) => {
    const n = (r.permissions || []).filter((p) => p.viewAccess).length;
    return sum + n;
  }, 0);

  return (
    <div className="hs-pm">
      <div className="hs-pm__toolbar">
        <div className="hs-pm__title-block">
          <p className="hs-pm__eyebrow">Security</p>
          <h2 className="hs-pm__title">Settings</h2>
          <p className="hs-pm__meta">
            Role templates and page-level access (view, add, edit, delete)
          </p>
        </div>
        <div className="hs-pm__controls">
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add role
          </Button>
        </div>
      </div>

      <div className="hs-pm__kpis">
        <div className="hs-pm__kpi">
          <p className="hs-pm__kpi-label">Roles</p>
          <p className="hs-pm__kpi-value">{roles.length}</p>
        </div>
        <div className="hs-pm__kpi hs-pm__kpi--soft">
          <p className="hs-pm__kpi-label">Hotel pages</p>
          <p className="hs-pm__kpi-value">{HOTEL_PAGES.length}</p>
        </div>
        <div className="hs-pm__kpi hs-pm__kpi--sand">
          <p className="hs-pm__kpi-label">Restaurant pages</p>
          <p className="hs-pm__kpi-value">{RESTAURANT_PAGES.length}</p>
        </div>
        <div className="hs-pm__kpi">
          <p className="hs-pm__kpi-label">Granted views</p>
          <p className="hs-pm__kpi-value">{viewCount}</p>
        </div>
      </div>

      <div className="hs-pm__panel">
        <div className="hs-pm__panel-head">
          <h3>Role catalog</h3>
          <span>{roles.length} role{roles.length === 1 ? "" : "s"}</span>
        </div>
        {initialLoad ? (
          <div style={{ padding: 16 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={roles}
            rowKey="_id"
            loading={loading}
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} roles`,
            }}
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
        )}
      </div>

      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">Access control</p>
            <h2 className="hs-booking-modal__title">
              {isEditing ? "Edit role" : "Create role"}
            </h2>
            <p className="hs-booking-modal__sub">
              Name the role and set page permissions
            </p>
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={760}
        destroyOnClose
        centered
      >
        <form className="hs-bf" onSubmit={formik.handleSubmit}>
          <div className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Role</h3>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__field">
                <label className="hs-bf__label">Role name</label>
                <Input
                  placeholder="e.g. Hotel Manager, Reception"
                  value={formik.values.permissionName}
                  onChange={(e) =>
                    formik.setFieldValue("permissionName", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Page matrix</h3>
              <p className="hs-bf__section-hint">Toggle access per page</p>
            </div>
            <div className="hs-bf__section-body">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                items={[
                  { key: "hotel", label: "Hotel pages" },
                  { key: "restaurant", label: "Restaurant pages" },
                ]}
              />
              <div className="hs-pm__matrix-wrap">
                <table className="hs-pm__matrix">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th className="is-center">View</th>
                      <th className="is-center">Add</th>
                      <th className="is-center">Edit</th>
                      <th className="is-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPages.map((page) => {
                      const perm =
                        formik.values.permissions.find(
                          (p) => (p.pageKey || getPageKey(p)) === page.key
                        ) || defaultPagePermission(page);
                      return (
                        <tr key={page.key}>
                          <td>
                            <span className="hs-pm__page-name">{page.label}</span>
                          </td>
                          <td className="is-center">
                            <Checkbox
                              checked={!!perm.viewAccess}
                              onChange={(e) =>
                                setPagePermission(
                                  page.key,
                                  "viewAccess",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td className="is-center">
                            <Checkbox
                              checked={!!perm.insertAccess}
                              onChange={(e) =>
                                setPagePermission(
                                  page.key,
                                  "insertAccess",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td className="is-center">
                            <Checkbox
                              checked={!!perm.editAccess}
                              onChange={(e) =>
                                setPagePermission(
                                  page.key,
                                  "editAccess",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td className="is-center">
                            <Checkbox
                              checked={!!perm.deleteAccess}
                              onChange={(e) =>
                                setPagePermission(
                                  page.key,
                                  "deleteAccess",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="hs-bf__footer">
            <Button onClick={() => setVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditing ? "Save changes" : "Create role"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
