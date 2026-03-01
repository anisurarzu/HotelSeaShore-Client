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
  Card,
  Space,
  Typography,
  Dropdown,
  Row,
  Col,
  Divider,
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
  TeamOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";
import { normalizePermissions, getRoleOptions } from "@/utils/permissionStructure";

const { Title, Text } = Typography;

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
      if (res.status === 200) setUsers(res.data);
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
          <Space>
            <Avatar src={src} icon={<UserOutlined />} size={40} style={{ borderRadius: 8 }} />
            <div>
              <Text strong className="block">{record.username || "—"}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.loginID || record.email || "—"}
              </Text>
            </div>
          </Space>
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
      render: (label) => <span>{label || "—"}</span>,
    },
    {
      title: "Permission",
      dataIndex: ["permission", "permissionName"],
      key: "permission",
      width: 140,
      ellipsis: true,
      render: (name) => <span>{name || "—"}</span>,
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
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Title level={4} className="!mb-1 flex items-center gap-2">
            <TeamOutlined />
            Users & Agents
          </Title>
          <Text type="secondary">Manage dashboard users, roles, and permissions.</Text>
        </div>
        {canInsert && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} size="middle">
            Add user
          </Button>
        )}
      </div>

      {/* Table card */}
      <Card className="shadow-sm border-0 md:border">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            placeholder="Search by name, email, ID, phone..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="max-w-sm"
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => r.id ?? r._id ?? r.key ?? String(r.loginID)}
          loading={loading}
          scroll={{ x: 900 }}
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
                className="py-8"
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
      </Card>

      {/* Add / Edit modal */}
      <Modal
        title={isEditing ? "Edit user" : "Add user"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          formik.resetForm();
        }}
        footer={null}
        width={720}
        destroyOnClose
        styles={{ body: { paddingTop: 16 } }}
      >
        <form onSubmit={formik.handleSubmit}>
          <Row gutter={[16, 0]}>
            {/* Left column */}
            <Col xs={24} md={12}>
              <Divider orientation="left" plain>
                <Text type="secondary">Personal</Text>
              </Divider>
              <Space direction="vertical" size="small" className="w-full">
                <div>
                  <Text className="block mb-1">Username</Text>
                  <Input
                    name="username"
                    placeholder="Username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div>
                  <Text className="block mb-1">User ID</Text>
                  <Input
                    name="loginID"
                    placeholder="Login ID"
                    value={formik.values.loginID}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div>
                  <Text className="block mb-1">Email</Text>
                  <Input
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    required
                  />
                </div>
                <div>
                  <Text className="block mb-1">Phone</Text>
                  <Input
                    name="phoneNumber"
                    placeholder="Phone number"
                    value={formik.values.phoneNumber}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <Text className="block mb-1">Address</Text>
                  <Input
                    name="currentAddress"
                    placeholder="Current address"
                    value={formik.values.currentAddress}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <Text className="block mb-1">Gender</Text>
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
              </Space>
            </Col>

            {/* Right column */}
            <Col xs={24} md={12}>
              <Divider orientation="left" plain>
                <Text type="secondary">Account & access</Text>
              </Divider>
              <Space direction="vertical" size="small" className="w-full">
                <div>
                  <Text className="block mb-1">Password {isEditing && "(leave blank to keep)"}</Text>
                  <Input.Password
                    name="password"
                    placeholder="Password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    required={!isEditing}
                  />
                </div>
                <div>
                  <Text className="block mb-1">Role</Text>
                  <Select
                    className="w-full"
                    placeholder="Select role"
                    value={formik.values.role || undefined}
                    onChange={(v) => formik.setFieldValue("role", v)}
                    options={roleInfo.map((r) => ({ value: r.value, label: r.label }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </div>
                <div>
                  <Text className="block mb-1">Permission (role template)</Text>
                  <Select
                    className="w-full"
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
                <div>
                  <Text className="block mb-1">Hotels</Text>
                  <Select
                    mode="multiple"
                    className="w-full"
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
                  <div>
                    <Text className="block mb-1">Profile picture</Text>
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
              </Space>
            </Col>
          </Row>

          <Divider className="my-4" />

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              {isEditing ? "Update" : "Create"} user
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentInformation;
