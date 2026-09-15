"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Modal,
  Upload,
  Table,
  Select,
  message,
  Input,
  Radio,
  Typography,
  Dropdown,
  Empty,
  Avatar,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";
import { normalizePermissions, getRoleOptions } from "@/utils/permissionStructure";
import { filterVisibleUsers } from "@/utils/systemUsers";
import "./AdminOps.css";

const { Text } = Typography;

// ----- Data hook -----
function useAgentData() {
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsNormalized, setPermissionsNormalized] = useState({ flat: [], byResource: {} });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await coreAxios.get("/users");
      if (res.status === 200) {
        const raw = Array.isArray(res.data) ? res.data : res.data?.users || [];
        setUsers(filterVisibleUsers(raw));
      }
    } catch {
      message.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await coreAxios.get("/hotels");
      const data = res.data;
      let list = [];
      if (data?.hotels && Array.isArray(data.hotels)) list = data.hotels;
      else if (data?.data?.hotels && Array.isArray(data.data.hotels)) list = data.data.hotels;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data)) list = data;
      setHotels(Array.isArray(list) ? list : []);
    } catch {
      message.error("Failed to fetch hotels.");
      setHotels([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await coreAxios.get("/permission");
      const data = Array.isArray(res.data) ? res.data : res.data?.permissions || [];
      setPermissions(data);
      setPermissionsNormalized(normalizePermissions(data));
    } catch {
      message.error("Failed to fetch permissions.");
      setPermissions([]);
      setPermissionsNormalized({ flat: [], byResource: {} });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHotels();
    fetchPermissions();
  }, []);

  return {
    users,
    hotels,
    permissions,
    permissionsNormalized,
    loading,
    fetchUsers,
    fetchHotels,
    fetchPermissions,
  };
}

// ----- Constants -----
const roleInfo = getRoleOptions();
const DEFAULT_AVATAR_MALE =
  "https://static.vecteezy.com/system/resources/thumbnails/003/773/576/small/business-man-icon-free-vector.jpg";
const DEFAULT_AVATAR_FEMALE =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWAtOLEsziFIaBIl6r27R6f0Rh1eU-Ha0Y-g&s";

// ----- Main component -----
const AgentInformation = ({ contentPermissions }) => {
  const canInsert = contentPermissions?.insert !== false;
  const canEdit = contentPermissions?.edit !== false;
  const canDelete = contentPermissions?.delete !== false;

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    users,
    hotels,
    permissions,
    permissionsNormalized,
    loading,
    fetchUsers,
    fetchPermissions,
  } = useAgentData();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const userList = users?.users ?? users;
  const dataSource = Array.isArray(userList) ? userList : [];

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return dataSource;
    const q = searchText.toLowerCase();
    return dataSource.filter(
      (u) =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.loginID || "").toLowerCase().includes(q) ||
        (u.phoneNumber || "").toLowerCase().includes(q)
    );
  }, [dataSource, searchText]);

  const formik = useFormik({
    initialValues: {
      image: null,
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      currentAddress: "",
      role: "",
      gender: "",
      loginID: "",
      hotelID: [],
      permissionID: null,
    },
    onSubmit: async (values, { resetForm }) => {
      const hotelIDs = (values.hotelID || []).map((id) =>
        typeof id === "object" ? id : { hotelID: id }
      );
      const selectedPermission = permissions.find((p) => p._id === values.permissionID);
      const selectedRole = roleInfo.find((r) => r.value === values.role);
      if (!selectedRole) {
        message.error("Please select a role.");
        return;
      }

      const payload = {
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        plainPassword: values.password,
        currentAddress: values.currentAddress,
        gender: values.gender,
        loginID: values.loginID,
        role: { id: selectedRole.id, value: selectedRole.value, label: selectedRole.label },
        hotelID: hotelIDs,
        permission: selectedPermission,
        image: values.image && typeof values.image !== "string" ? await uploadImage(values.image) : values.image || "",
      };

      setSubmitLoading(true);
      try {
        if (isEditing) {
          await coreAxios.put(`/users/${editingId}`, payload);
          message.success("User updated successfully.");
        } else {
          await coreAxios.post("/users", { ...payload, key: crypto.randomUUID?.() ?? Date.now().toString() });
          message.success("User added successfully.");
        }
        resetForm();
        setModalOpen(false);
        setEditingId(null);
        setIsEditing(false);
        fetchUsers();
      } catch (err) {
        message.error(err.response?.data?.message || "Failed to save user.");
      } finally {
        setSubmitLoading(false);
      }
    },
  });

  async function uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      return res.data?.url ?? null;
    } catch {
      message.error("Image upload failed.");
      return null;
    }
  }

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    formik.resetForm();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    const id = record.id ?? record._id;
    setEditingId(id);
    setIsEditing(true);
    formik.setValues({
      image: record.image,
      username: record.username ?? "",
      email: record.email ?? "",
      phoneNumber: record.phoneNumber ?? "",
      password: "",
      currentAddress: record.currentAddress ?? "",
      role: record.role?.value ?? "",
      gender: record.gender ?? "",
      loginID: record.loginID ?? "",
      hotelID: record.hotelID?.map((i) => (typeof i === "object" ? i.hotelID : i)) ?? [],
      permissionID: record.permission?._id ?? null,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete user?",
      content: `Remove "${record.username || record.loginID}"? This cannot be undone.`,
      okText: "Delete",
      okType: "danger",
        onOk: async () => {
          try {
            await coreAxios.delete(`/users/${record.id ?? record._id}`);
            message.success("User deleted.");
            fetchUsers();
          } catch {
            message.error("Failed to delete user.");
          }
        },
    });
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 200,
      fixed: "left",
      render: (_, record) => {
        const src =
          record.image ||
          (record.gender === "female" ? DEFAULT_AVATAR_FEMALE : DEFAULT_AVATAR_MALE);
        return (
          <div className="hs-ag__user">
            <Avatar src={src} icon={<UserOutlined />} size={36} />
            <div className="hs-ag__user-meta">
              <strong>{record.username || "—"}</strong>
              <span>{record.loginID || record.email || "—"}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Contact",
      key: "contact",
      width: 180,
      render: (_, record) => (
        <div>
          <Text className="block">{record.email || "—"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.phoneNumber || "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: ["role", "label"],
      key: "role",
      width: 120,
      render: (label) => (
        <span className="hs-ag__chip">{label || "—"}</span>
      ),
    },
    {
      title: "Permission",
      dataIndex: ["permission", "permissionName"],
      key: "permission",
      width: 140,
      ellipsis: true,
      render: (name) => (
        <span className="hs-ag__chip hs-ag__chip--muted" title={name || ""}>
          {name || "—"}
        </span>
      ),
    },
    {
      title: "Hotels",
      key: "hotels",
      width: 140,
      ellipsis: true,
      render: (_, record) =>
        record.hotelID?.length
          ? record.hotelID.map((h) => h.hotelName ?? h).join(", ") || "—"
          : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => {
        const items = [
          canEdit && {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => openEdit(record),
          },
          canDelete && {
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete",
            danger: true,
            onClick: () => handleDelete(record),
          },
        ].filter(Boolean);
        if (items.length === 0) return <Text type="secondary">—</Text>;
        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button size="small">
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="hs-ag">
      <div className="hs-ag__toolbar">
        <div className="hs-ag__title-block">
          <p className="hs-ag__eyebrow">Administration</p>
          <h2 className="hs-ag__title">Users</h2>
          <p className="hs-ag__meta">
            Manage dashboard users, roles, and hotel access
          </p>
        </div>
        <div className="hs-ag__controls">
          <Input
            placeholder="Search name, email, ID, phone…"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {canInsert && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add user
            </Button>
          )}
        </div>
      </div>

      <div className="hs-ag__kpis">
        <div className="hs-ag__kpi">
          <p className="hs-ag__kpi-label">Total users</p>
          <p className="hs-ag__kpi-value">{users?.length || 0}</p>
        </div>
        <div className="hs-ag__kpi hs-ag__kpi--soft">
          <p className="hs-ag__kpi-label">Filtered</p>
          <p className="hs-ag__kpi-value">{filteredData?.length || 0}</p>
        </div>
        <div className="hs-ag__kpi hs-ag__kpi--sand">
          <p className="hs-ag__kpi-label">Roles</p>
          <p className="hs-ag__kpi-value">{roleInfo?.length || 0}</p>
        </div>
        <div className="hs-ag__kpi">
          <p className="hs-ag__kpi-label">Permission sets</p>
          <p className="hs-ag__kpi-value">
            {permissionsNormalized?.flat?.length || 0}
          </p>
        </div>
      </div>

      <div className="hs-ag__panel">
        <div className="hs-ag__panel-head">
          <h3>User directory</h3>
          <span>{filteredData?.length || 0} shown</span>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => r.id ?? r._id ?? r.key ?? String(r.loginID)}
          loading={loading}
          scroll={{ x: 900 }}
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} users`,
            pageSizeOptions: ["10", "20", "50"],
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No users yet"
              >
                {canInsert && (
                  <Button type="primary" onClick={openCreate}>
                    Add first user
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </div>

      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">User master</p>
            <h2 className="hs-booking-modal__title">
              {isEditing ? "Edit user" : "Add user"}
            </h2>
            <p className="hs-booking-modal__sub">
              Profile, credentials, role and hotel assignment
            </p>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          formik.resetForm();
        }}
        footer={null}
        width={720}
        destroyOnClose
        centered
      >
        <form className="hs-bf" onSubmit={formik.handleSubmit}>
          <div className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Personal</h3>
              <p className="hs-bf__section-hint">Identity and contact</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__grid-2">
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Username</label>
                  <Input
                    name="username"
                    placeholder="Username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Login ID</label>
                  <Input
                    name="loginID"
                    placeholder="Login ID"
                    value={formik.values.loginID}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Email</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Phone</label>
                  <Input
                    name="phoneNumber"
                    placeholder="Phone number"
                    value={formik.values.phoneNumber}
                    onChange={formik.handleChange}
                  />
                </div>
                <div className="hs-bf__field hs-bf__span-2">
                  <label className="hs-bf__label">Address</label>
                  <Input
                    name="currentAddress"
                    placeholder="Current address"
                    value={formik.values.currentAddress}
                    onChange={formik.handleChange}
                  />
                </div>
                <div className="hs-bf__field hs-bf__span-2">
                  <label className="hs-bf__label">Gender</label>
                  <Radio.Group
                    name="gender"
                    value={formik.values.gender}
                    onChange={(e) => formik.setFieldValue("gender", e.target.value)}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Account & access</h3>
              <p className="hs-bf__section-hint">Credentials and authorization</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__grid-2">
                <div className="hs-bf__field">
                  <label className="hs-bf__label">
                    Password {isEditing && "(leave blank to keep)"}
                  </label>
                  <Input.Password
                    name="password"
                    placeholder="Password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    required={!isEditing}
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Role</label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select role"
                    value={formik.values.role || undefined}
                    onChange={(v) => formik.setFieldValue("role", v)}
                    options={roleInfo.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Permission template</label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select permission"
                    value={formik.values.permissionID || undefined}
                    onChange={(v) => formik.setFieldValue("permissionID", v)}
                    options={permissionsNormalized.flat.map((p) => ({
                      value: p._id,
                      label: p.permissionName || p.key || p._id,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </div>
                <div className="hs-bf__field">
                  <label className="hs-bf__label">Hotels</label>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Select hotels"
                    value={formik.values.hotelID}
                    onChange={(v) => formik.setFieldValue("hotelID", v)}
                    options={hotels.map((h) => ({
                      value: h.hotelID ?? h._id,
                      label: h.hotelName ?? h.name ?? h.hotelID,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </div>
                {!isEditing && (
                  <div className="hs-bf__field hs-bf__span-2">
                    <label className="hs-bf__label">Profile picture</label>
                    <Upload
                      maxCount={1}
                      beforeUpload={() => false}
                      onChange={({ fileList }) =>
                        formik.setFieldValue("image", fileList[0]?.originFileObj)
                      }
                    >
                      <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hs-bf__footer">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              {isEditing ? "Save changes" : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentInformation;
