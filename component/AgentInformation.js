"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Upload,
  Table,
  Select,
  message,
  Input,
  Radio,
  Image,
  Spin,
  Pagination,
  Menu,
  Popconfirm,
  Dropdown,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { useFormik } from "formik";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";
import { toast } from "react-toastify";

const roleInfo = [
  { id: 1, value: "agentadmin", label: "Agent Admin" },
  { id: 2, value: "superadmin", label: "Super Admin" },
  { id: 3, value: "hoteladmin", label: "Hotel Admin" },
  { id: 4, value: "admin", label: "Admin" },
];

const AgentInformation = () => {
  const token = localStorage.getItem("token");
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/auth/users");
      if (response.status === 200) {
        setLoading(false);
        setUsers(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      // Fetch hotels using API - same structure as BookingInfo
      const response = await coreAxios.get("/hotels");

      if (response.status === 200) {
        const responseData = response.data;
        let hotelsData = [];
        
        // Extract hotels array from response - same pattern as BookingInfo
        if (responseData?.hotels && Array.isArray(responseData.hotels)) {
          hotelsData = responseData.hotels;
        } else if (responseData?.success && responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          hotelsData = responseData.data.hotels;
        } else if (responseData?.data?.hotels && Array.isArray(responseData.data.hotels)) {
          hotelsData = responseData.data.hotels;
        } else if (Array.isArray(responseData?.data)) {
          hotelsData = responseData.data;
        } else if (Array.isArray(responseData)) {
          hotelsData = responseData;
        }

        // Ensure it's an array
        if (!Array.isArray(hotelsData)) {
          hotelsData = [];
        }

        setHotels(hotelsData);
      }
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
      message.error(error.response?.data?.message || "Failed to fetch hotels. Please try again.");
      setHotels([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await coreAxios.get("/permission");
      if (response.status === 200) {
        setPermissions(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch permissions. Please try again.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHotels();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setLoading(true);
      try {
        const hotelIDs = values.hotelID.map((id) => {
          return typeof id === "object" ? id : { hotelID: id };
        });

        const selectedPermission = permissions.find(
          (perm) => perm._id === values.permissionID
        );

        const selectedRole = roleInfo.find(
          (role) => role.value === values.role
        );

        if (!selectedRole) {
          message.error("Invalid role selected.");
          setLoading(false);
          return;
        }

        const baseUser = {
          username: values.username,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: values?.password,
          plainPassword: values?.password,
          currentAddress: values.currentAddress,
          gender: values.gender,
          loginID: values.loginID,
          role: {
            id: selectedRole.id,
            value: selectedRole.value,
            label: selectedRole.label,
          },
          hotelID: hotelIDs,
          permission: selectedPermission,
        };

        // Handle image upload (if needed)
        if (values?.image && typeof values.image !== "string") {
          baseUser.image = await handleImageUpload(values.image);
        } else {
          baseUser.image = values?.image || "";
        }

        if (isEditing) {
          const response = await coreAxios.put(
            `auth/users/${editingKey}`,
            baseUser
          );
          if (response?.status === 200) {
            message.success("User updated successfully!");
          }
        } else {
          baseUser.key = uuidv4(); // Only add 'key' for new user
          const response = await coreAxios.post("/auth/register", baseUser);
          if (response?.status === 200) {
            message.success("User added successfully!");
          } else {
            message.error(response?.error || "Error creating user.");
          }
        }

        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        fetchUsers();
      } catch (error) {
        console.error("User submission error:", error);
        message.error("Failed to add/update user. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.url;
    } catch (error) {
      message.error("Failed to upload image. Please try again.");
      return null;
    }
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      const response = await coreAxios.delete(`/auth/users/${record.id}`);
      if (response.status === 200) {
        message.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      message.error("Failed to delete user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingKey(record?.id);
    formik.setValues({
      image: record.image,
      username: record.username,
      email: record.email,
      phoneNumber: record.phoneNumber,
      password: record.password,
      currentAddress: record.currentAddress,
      role: record.role.value,
      gender: record.gender,
      loginID: record.loginID,
      hotelID:
        record.hotelID?.map((item) =>
          typeof item === "object" ? item.hotelID : item
        ) || [],
      permissionID: record.permission?._id || null,
      status: "",
    });
    setVisible(true);
    setIsEditing(true);
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 60,
      render: (image, record) => {
        const defaultMaleImage =
          "https://static.vecteezy.com/system/resources/thumbnails/003/773/576/small/business-man-icon-free-vector.jpg";
        const defaultFemaleImage =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWAtOLEsziFIaBIl6r27R6f0Rh1eU-Ha0Y-g&s";

        return (
          <Image
            src={
              image ||
              (record.gender === "male" ? defaultMaleImage : defaultFemaleImage)
            }
            alt="Profile"
            width={40}
            height={40}
            style={{ borderRadius: "50%" }}
            preview={false}
          />
        );
      },
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: 120,
    },
    {
      title: "User ID",
      dataIndex: "loginID",
      key: "loginID",
      width: 120,
      responsive: ["sm"],
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 180,
      responsive: ["md"],
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 120,
      responsive: ["lg"],
    },
    {
      title: "Address",
      dataIndex: "currentAddress",
      key: "currentAddress",
      width: 150,
      responsive: ["xl"],
      ellipsis: true,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      responsive: ["md"],
    },
    {
      title: "Role",
      dataIndex: ["role", "label"],
      key: "role",
      width: 120,
    },
    {
      title: "Permission",
      dataIndex: ["permission", "permissionName"],
      key: "permission",
      width: 120,
      responsive: ["lg"],
      ellipsis: true,
    },
    {
      title: "Hotels",
      key: "hotelID",
      width: 150,
      responsive: ["xl"],
      ellipsis: true,
      render: (_, record) => (
        <span>
          {record.hotelID?.map((item) => item.hotelName || item).join(", ")}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />}>
              <Popconfirm
                title="Are you sure you want to delete this user?"
                onConfirm={() => handleDelete(record)}
                okText="Yes"
                cancelText="No"
              >
                Delete
              </Popconfirm>
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown menu={menu} trigger={["click"]}>
            <Button size="small" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Actions</span>
              <span className="sm:hidden">...</span>
              <DownOutlined className="ml-1" />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="p-2 sm:p-4">
      <Button
        type="primary"
        onClick={() => {
          setIsEditing(false);
          formik.resetForm();
          setVisible(true);
        }}
        className="mb-4 w-full sm:w-auto bg-[#8ABF55] hover:bg-[#7DA54E] text-white"
        size="small"
      >
        <span className="hidden sm:inline">Add New User</span>
       
      </Button>
      <Spin spinning={loading}>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={users?.users}
            pagination={false}
            rowKey="key"
            scroll={{ x: "max-content" }}
            size="small"
          />
        </div>
        <div className="mt-4 flex justify-center sm:justify-start">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={users?.users?.length}
            onChange={(page, pageSize) =>
              setPagination({ ...pagination, current: page, pageSize })
            }
            showSizeChanger
            showTotal={(total) => `Total ${total} users`}
            responsive
          />
        </div>
      </Spin>

      <Modal
        title={isEditing ? "Edit User" : "Add New User"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: "800px" }}
      >
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-1">
              Username
            </label>
            <Input
              id="username"
              name="username"
              placeholder="Enter username"
              value={formik.values.username}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="loginID" className="block mb-1">
              User ID
            </label>
            <Input
              id="loginID"
              name="loginID"
              placeholder="Enter User ID"
              value={formik.values.loginID}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              placeholder="Enter email"
              value={formik.values.email}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-1">
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Enter phone number"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              required={true}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <Input.Password
              id="password"
              name="password"
              placeholder="Enter password"
              value={formik.values.password}
              required={isEditing ? false : true}
              onChange={formik.handleChange}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="currentAddress" className="block mb-1">
              Current Address
            </label>
            <Input
              id="currentAddress"
              name="currentAddress"
              placeholder="Enter current address"
              value={formik.values.currentAddress}
              onChange={formik.handleChange}
              required={true}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="gender" className="block mb-1">
              Gender
            </label>
            <Radio.Group
              id="gender"
              name="gender"
              required
              onChange={(e) => formik.setFieldValue("gender", e.target.value)}
              value={formik.values.gender}
              className="flex flex-col sm:flex-row gap-2"
            >
              <Radio value="male">Male</Radio>
              <Radio value="female">Female</Radio>
              <Radio value="other">Other</Radio>
            </Radio.Group>
          </div>
          <div className="mb-4 pb-2">
            <label htmlFor="role" className="block mb-1">
              Role
            </label>
            <Select
              className="w-full"
              id="role"
              placeholder="Select Role"
              showSearch
              optionFilterProp="children"
              value={formik.values.role}
              onChange={(value) => formik.setFieldValue("role", value)}
            >
              {roleInfo.map((role) => (
                <Select.Option key={role.id} value={role.value}>
                  {role.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="mb-4">
            <label htmlFor="permissionID" className="block mb-1">
              Permission
            </label>
            <Select
              className="w-full"
              id="permissionID"
              placeholder="Select Permission"
              showSearch
              optionFilterProp="children"
              value={formik.values.permissionID}
              onChange={(value) => formik.setFieldValue("permissionID", value)}
            >
              {permissions.map((permission) => (
                <Select.Option key={permission._id} value={permission._id}>
                  {permission.permissionName}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="mb-4">
            <label htmlFor="hotelID" className="block mb-1">
              Hotels
            </label>
            <Select
              mode="multiple"
              className="w-full"
              id="hotelID"
              placeholder="Select Hotels"
              showSearch
              optionFilterProp="children"
              value={formik.values.hotelID}
              onChange={(value) => formik.setFieldValue("hotelID", value)}
            >
              {Array.isArray(hotels) && hotels.length > 0 ? (
                hotels.map((hotel) => (
                  <Select.Option key={hotel?.hotelID} value={hotel?.hotelID}>
                    {hotel?.hotelName || hotel?.name}
                  </Select.Option>
                ))
              ) : (
                <Select.Option value="" disabled>
                  No hotels available
                </Select.Option>
              )}
            </Select>
          </div>

          {!isEditing && (
            <div className="mb-4">
              <label htmlFor="image" className="block mb-1">
                Profile Picture
              </label>
              <Upload
                name="image"
                listType="picture"
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
          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            className="w-full bg-[#8ABF55] hover:bg-[#7DA54E] mt-2"
          >
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AgentInformation;
