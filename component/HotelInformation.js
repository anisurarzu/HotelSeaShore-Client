"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Popconfirm,
  Spin,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Card,
  Space,
  Row,
  Col,
  Tag,
  Collapse,
  Divider,
  Typography,
  Tabs,
  Upload,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  UploadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";

const { Panel } = Collapse;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const HotelInformation = () => {
  // State
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [isCreatingHotel, setIsCreatingHotel] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });
  const [hotelImages, setHotelImages] = useState([]);
  const [categoryImages, setCategoryImages] = useState([]);
  const [roomImages, setRoomImages] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedHotelForDetails, setSelectedHotelForDetails] = useState(null);

  // Fetch hotels list
  const fetchHotels = async (page = 1, pageSize = 50, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (search) {
        params.append("search", search);
      }
      const response = await coreAxios.get(`/hotels?${params.toString()}`);
      if (response.status === 200 && response.data.success) {
        const { hotels: hotelsList, pagination: apiPagination } = response.data.data;
        setHotels(hotelsList);
        setPagination({
          current: apiPagination.currentPage || page,
          pageSize: apiPagination.itemsPerPage || pageSize,
          total: apiPagination.totalItems || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching hotels:", error);
      message.error(error.response?.data?.message || "Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotel data by ID
  const fetchHotelData = async (hotelId) => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const response = await coreAxios.get(`/hotels/${hotelId}`);
      if (response.status === 200 && response.data.success) {
        const hotel = response.data.data;
        setHotelData(hotel);
        setCategories(hotel.roomCategories || []);
      }
    } catch (error) {
      console.error("Error fetching hotel data:", error);
      message.error(error.response?.data?.message || "Failed to fetch hotel data");
    } finally {
      setLoading(false);
    }
  };

  // Handle hotel selection change
  const handleHotelChange = (hotelId) => {
    setSelectedHotelId(hotelId);
    fetchHotelData(hotelId);
    setCategories([]);
    setExpandedCategories([]);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchHotelData(selectedHotelId);
    }
  }, [selectedHotelId]);

  // Hotel formik
  const hotelFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      hotelName: hotelData?.hotelName || "",
      hotelDescription: hotelData?.hotelDescription || "",
      address: {
        street: hotelData?.address?.street || "",
        city: hotelData?.address?.city || "",
        state: hotelData?.address?.state || "",
        zipCode: hotelData?.address?.zipCode || "",
        country: hotelData?.address?.country || "",
      },
      contact: {
        phone: hotelData?.contact?.phone || "",
        email: hotelData?.contact?.email || "",
        website: hotelData?.contact?.website || "",
      },
      status: hotelData?.status || "active",
    },
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const formData = new FormData();
        
        // Append all form fields
        formData.append("hotelName", values.hotelName);
        formData.append("hotelDescription", values.hotelDescription);
        formData.append("status", values.status);
        
        // Append address
        if (values.address.street) formData.append("address[street]", values.address.street);
        if (values.address.city) formData.append("address[city]", values.address.city);
        if (values.address.state) formData.append("address[state]", values.address.state);
        if (values.address.zipCode) formData.append("address[zipCode]", values.address.zipCode);
        if (values.address.country) formData.append("address[country]", values.address.country);
        
        // Append contact
        if (values.contact.phone) formData.append("contact[phone]", values.contact.phone);
        if (values.contact.email) formData.append("contact[email]", values.contact.email);
        if (values.contact.website) formData.append("contact[website]", values.contact.website);
        
        // Append images - handle new files and existing URLs
        const existingImageUrls = [];
        hotelImages.forEach((file) => {
          if (file.originFileObj) {
            // New file upload - append as file
            formData.append("images", file.originFileObj);
          } else if (file.url && !file.originFileObj) {
            // Existing image URL (not a new upload)
            existingImageUrls.push(file.url);
          }
        });
        // If there are existing URLs and no new files, send them in body
        // Note: Backend prioritizes req.files over req.body.images
        // So if we have new files, they'll be used. Otherwise, use existing URLs.
        if (existingImageUrls.length > 0 && hotelImages.every(f => !f.originFileObj)) {
          // All images are existing URLs, send as JSON string
          formData.append("images", JSON.stringify(existingImageUrls));
        }

        if (isCreatingHotel) {
          // Create new hotel
          const response = await coreAxios.post(`/hotels`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (response.status === 200 || response.status === 201) {
            if (response.data.success) {
              message.success("Hotel created successfully!");
              await fetchHotels(pagination.current, pagination.pageSize, searchText);
              // Auto-select the newly created hotel
              if (response.data.data?.hotelID) {
                setSelectedHotelId(response.data.data.hotelID);
              }
              setHotelModalVisible(false);
              setIsCreatingHotel(false);
              hotelFormik.resetForm();
              setHotelImages([]);
            }
          }
        } else {
          // Update existing hotel
          if (!selectedHotelId) {
            message.error("Please select a hotel first");
            return;
          }
          const response = await coreAxios.put(`/hotels/${selectedHotelId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (response.status === 200 && response.data.success) {
            message.success("Hotel information updated successfully!");
            await fetchHotelData(selectedHotelId);
            await fetchHotels(pagination.current, pagination.pageSize, searchText);
            setHotelModalVisible(false);
            setIsEditingHotel(false);
            setHotelImages([]);
          }
        }
      } catch (error) {
        console.error("Error saving hotel:", error);
        message.error(error.response?.data?.message || `Failed to ${isCreatingHotel ? 'create' : 'update'} hotel information`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Category formik
  const categoryFormik = useFormik({
    initialValues: {
      name: "",
      description: "",
      basePrice: 0,
      maxOccupancy: {
        adults: 2,
        children: 0,
      },
      amenities: [],
      isActive: true,
    },
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const formData = new FormData();
        
        // Append all form fields
        formData.append("name", values.name);
        formData.append("description", values.description || "");
        formData.append("basePrice", values.basePrice || 0);
        formData.append("maxOccupancy[adults]", values.maxOccupancy.adults || 2);
        formData.append("maxOccupancy[children]", values.maxOccupancy.children || 0);
        formData.append("isActive", values.isActive);
        
        // Append images
        categoryImages.forEach((file) => {
          if (file.originFileObj) {
            formData.append("images", file.originFileObj);
          }
        });
        
        // Handle existing image URLs
        const existingImageUrls = categoryImages
          .filter((f) => !f.originFileObj && f.url)
          .map((f) => f.url);
        if (existingImageUrls.length > 0 && categoryImages.every(f => !f.originFileObj)) {
          formData.append("images", JSON.stringify(existingImageUrls));
        }

        if (!selectedHotelId) {
          message.error("Please select a hotel first");
          return;
        }
        if (isEditingCategory) {
          const response = await coreAxios.put(
            `/hotels/${selectedHotelId}/categories/${editingCategoryId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status === 200 && response.data.success) {
            message.success("Category updated successfully!");
            await fetchHotelData(selectedHotelId);
            setCategoryModalVisible(false);
            setIsEditingCategory(false);
            setEditingCategoryId(null);
            categoryFormik.resetForm();
            setCategoryImages([]);
          }
        } else {
          const response = await coreAxios.post(
            `/hotels/${selectedHotelId}/categories`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status === 200 || response.status === 201) {
            if (response.data.success) {
              message.success("Category added successfully!");
              await fetchHotelData(selectedHotelId);
              setCategoryModalVisible(false);
              categoryFormik.resetForm();
              setCategoryImages([]);
            }
          }
        }
      } catch (error) {
        console.error("Error saving category:", error);
        message.error(error.response?.data?.message || "Failed to save category");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Room formik
  const roomFormik = useFormik({
    initialValues: {
      name: "",
      roomId: "",
      status: "available",
      price: 0,
      capacity: {
        adults: 2,
        children: 0,
      },
      amenities: [],
      description: "",
    },
    onSubmit: async (values) => {
      try {
        setSubmitting(true);
        const formData = new FormData();
        
        // Append all form fields
        formData.append("name", values.name);
        formData.append("roomId", values.roomId || "");
        formData.append("status", values.status);
        formData.append("price", values.price || 0);
        formData.append("capacity[adults]", values.capacity.adults || 2);
        formData.append("capacity[children]", values.capacity.children || 0);
        formData.append("description", values.description || "");
        
        // Append images
        roomImages.forEach((file) => {
          if (file.originFileObj) {
            formData.append("images", file.originFileObj);
          }
        });
        
        // Handle existing image URLs
        const existingImageUrls = roomImages
          .filter((f) => !f.originFileObj && f.url)
          .map((f) => f.url);
        if (existingImageUrls.length > 0 && roomImages.every(f => !f.originFileObj)) {
          formData.append("images", JSON.stringify(existingImageUrls));
        }

        if (!selectedHotelId || !selectedCategoryId) {
          message.error("Please select a hotel and category first");
          return;
        }
        if (isEditingRoom) {
          const response = await coreAxios.put(
            `/hotels/${selectedHotelId}/categories/${selectedCategoryId}/rooms/${editingRoomId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status === 200 && response.data.success) {
            message.success("Room updated successfully!");
            await fetchHotelData(selectedHotelId);
            setRoomModalVisible(false);
            setIsEditingRoom(false);
            setEditingRoomId(null);
            setSelectedCategoryId(null);
            roomFormik.resetForm();
            setRoomImages([]);
          }
        } else {
          const response = await coreAxios.post(
            `/hotels/${selectedHotelId}/categories/${selectedCategoryId}/rooms`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status === 200 || response.status === 201) {
            if (response.data.success) {
              message.success("Room added successfully!");
              await fetchHotelData(selectedHotelId);
              setRoomModalVisible(false);
              setSelectedCategoryId(null);
              roomFormik.resetForm();
              setRoomImages([]);
            }
          }
        }
      } catch (error) {
        console.error("Error saving room:", error);
        message.error(error.response?.data?.message || "Failed to save room");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handlers
  const handleCreateHotel = () => {
    hotelFormik.resetForm();
    hotelFormik.setValues({
      hotelName: "",
      hotelDescription: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      contact: {
        phone: "",
        email: "",
        website: "",
      },
      status: "active",
    });
    setIsCreatingHotel(true);
    setIsEditingHotel(false);
    setHotelModalVisible(true);
  };

  const handleEditHotel = () => {
    hotelFormik.setValues({
      hotelName: hotelData?.hotelName || "",
      hotelDescription: hotelData?.hotelDescription || "",
      address: {
        street: hotelData?.address?.street || "",
        city: hotelData?.address?.city || "",
        state: hotelData?.address?.state || "",
        zipCode: hotelData?.address?.zipCode || "",
        country: hotelData?.address?.country || "",
      },
      contact: {
        phone: hotelData?.contact?.phone || "",
        email: hotelData?.contact?.email || "",
        website: hotelData?.contact?.website || "",
      },
      status: hotelData?.status || "active",
    });
    // Set existing images
    if (hotelData?.images && hotelData.images.length > 0) {
      setHotelImages(
        hotelData.images.map((url) => ({
          uid: url,
          name: url.split("/").pop(),
          status: "done",
          url: url,
        }))
      );
    } else {
      setHotelImages([]);
    }
    setIsEditingHotel(true);
    setIsCreatingHotel(false);
    setHotelModalVisible(true);
  };

  const handleViewDetails = async (hotel) => {
    try {
      setLoading(true);
      const response = await coreAxios.get(`/hotels/${hotel.hotelID}`);
      if (response.status === 200 && response.data.success) {
        setSelectedHotelForDetails(response.data.data);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      message.error("Failed to fetch hotel details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    categoryFormik.setValues({
      name: category.name || "",
      description: category.description || "",
      basePrice: category.basePrice || 0,
      maxOccupancy: category.maxOccupancy || { adults: 2, children: 0 },
      amenities: category.amenities || [],
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    // Set existing images
    if (category.images && category.images.length > 0) {
      setCategoryImages(
        category.images.map((url) => ({
          uid: url,
          name: url.split("/").pop(),
          status: "done",
          url: url,
        }))
      );
    } else {
      setCategoryImages([]);
    }
    setEditingCategoryId(category._id);
    setIsEditingCategory(true);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!selectedHotelId) {
      message.error("Please select a hotel first");
      return;
    }
    try {
      setLoading(true);
      const response = await coreAxios.delete(
        `/hotels/${selectedHotelId}/categories/${categoryId}`
      );
      if (response.status === 200 && response.data.success) {
        message.success("Category deleted successfully!");
        await fetchHotelData(selectedHotelId);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      message.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = (categoryId) => {
    setSelectedCategoryId(categoryId);
    roomFormik.resetForm();
    setRoomImages([]);
    setIsEditingRoom(false);
    setEditingRoomId(null);
    setRoomModalVisible(true);
  };

  const handleEditRoom = (categoryId, room) => {
    setSelectedCategoryId(categoryId);
    roomFormik.setValues({
      name: room.name || "",
      roomId: room.roomId || "",
      status: room.status || "available",
      price: room.price || 0,
      capacity: room.capacity || { adults: 2, children: 0 },
      amenities: room.amenities || [],
      description: room.description || "",
    });
    // Set existing images
    if (room.images && room.images.length > 0) {
      setRoomImages(
        room.images.map((url) => ({
          uid: url,
          name: url.split("/").pop(),
          status: "done",
          url: url,
        }))
      );
    } else {
      setRoomImages([]);
    }
    setEditingRoomId(room._id);
    setIsEditingRoom(true);
    setRoomModalVisible(true);
  };

  const handleDeleteRoom = async (categoryId, roomId) => {
    if (!selectedHotelId) {
      message.error("Please select a hotel first");
      return;
    }
    try {
      setLoading(true);
      const response = await coreAxios.delete(
        `/hotels/${selectedHotelId}/categories/${categoryId}/rooms/${roomId}`
      );
      if (response.status === 200 && response.data.success) {
        message.success("Room deleted successfully!");
        await fetchHotelData(selectedHotelId);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      message.error(error.response?.data?.message || "Failed to delete room");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "green", text: "Active" },
      inactive: { color: "red", text: "Inactive" },
      maintenance: { color: "orange", text: "Maintenance" },
      available: { color: "green", text: "Available" },
      occupied: { color: "red", text: "Occupied" },
      reserved: { color: "blue", text: "Reserved" },
    };
    const config = statusConfig[status] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Room columns
  const roomColumns = (categoryId) => [
    {
      title: "Room Name",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "Room ID",
      dataIndex: "roomId",
      key: "roomId",
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price) => `৳${price || 0}`,
    },
    {
      title: "Capacity",
      key: "capacity",
      width: 120,
      render: (_, record) =>
        `${record.capacity?.adults || 0} Adults, ${record.capacity?.children || 0} Children`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRoom(categoryId, record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this room?"
            onConfirm={() => handleDeleteRoom(categoryId, record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && !hotelData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchHotels(1, pagination.pageSize, value);
  };

  // Hotel table columns
  const hotelColumns = [
    {
      title: "ID",
      dataIndex: "hotelID",
      key: "hotelID",
      width: 80,
    },
    {
      title: "Hotel Name",
      dataIndex: "hotelName",
      key: "hotelName",
      width: 200,
    },
    {
      title: "City",
      dataIndex: ["address", "city"],
      key: "city",
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Total Rooms",
      dataIndex: "totalRooms",
      key: "totalRooms",
      width: 120,
      render: (rooms) => rooms || 0,
    },
    {
      title: "Available Rooms",
      dataIndex: "availableRooms",
      key: "availableRooms",
      width: 140,
      render: (rooms) => rooms || 0,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedHotelId(record.hotelID);
              fetchHotelData(record.hotelID);
            }}
          >
            Select
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Title level={2} className="m-0 mb-2">
          Hotel Information
        </Title>
        <Text type="secondary">Manage hotel details, categories, and rooms</Text>
      </div>

      {/* Hotels Table */}
      <Card
        className="mb-6 shadow-sm"
        title={
          <div className="flex items-center justify-between">
            <span>Hotels List</span>
            <Space>
              <Input.Search
                placeholder="Search by name, description, or city"
                allowClear
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch("");
                  }
                }}
                style={{ width: 250 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateHotel}
              >
                Create Hotel
              </Button>
              <Button
                type="default"
                onClick={() => fetchHotels(pagination.current, pagination.pageSize, searchText)}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </div>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={hotelColumns}
            dataSource={hotels}
            rowKey="hotelID"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              defaultPageSize: 5,
              showTotal: (total) => `Total ${total} hotels`,
              onChange: (page, pageSize) => {
                fetchHotels(page, pageSize, searchText);
              },
            }}
            scroll={{ x: true }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedHotelId(record.hotelID);
                fetchHotelData(record.hotelID);
              },
              style: { cursor: "pointer" },
            })}
          />
        </Spin>
      </Card>

      {!selectedHotelId && (
        <Card className="mb-6 shadow-sm">
          <div className="text-center py-8 text-gray-500">
            Please select a hotel to view and manage its information
          </div>
        </Card>
      )}

      {/* Hotel Information Card */}
      {selectedHotelId && (
        <>
          <Card
            className="mb-6 shadow-sm"
            title={
              <div className="flex items-center gap-2">
                <HomeOutlined />
                <span>Hotel Details</span>
              </div>
            }
            extra={
              <Button type="primary" icon={<EditOutlined />} onClick={handleEditHotel}>
                Edit Hotel
              </Button>
            }
          >
            {hotelData && (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>Hotel Name:</Text>
                  <div className="mb-3">{hotelData.hotelName}</div>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Status:</Text>
                  <div className="mb-3">{getStatusTag(hotelData.status)}</div>
                </Col>
                <Col xs={24}>
                  <Text strong>Description:</Text>
                  <div className="mb-3">{hotelData.hotelDescription}</div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="flex items-center gap-2 mb-2">
                    <EnvironmentOutlined />
                    <Text strong>Address</Text>
                  </div>
                  <div className="ml-6">
                    {hotelData.address?.street && <div>{hotelData.address.street}</div>}
                    {hotelData.address?.city && <div>{hotelData.address.city}</div>}
                    {hotelData.address?.state && <div>{hotelData.address.state}</div>}
                    {hotelData.address?.zipCode && <div>{hotelData.address.zipCode}</div>}
                    {hotelData.address?.country && <div>{hotelData.address.country}</div>}
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneOutlined />
                    <Text strong>Contact</Text>
                  </div>
                  <div className="ml-6">
                    {hotelData.contact?.phone && (
                      <div className="mb-1">
                        <PhoneOutlined className="mr-2" />
                        {hotelData.contact.phone}
                      </div>
                    )}
                    {hotelData.contact?.email && (
                      <div className="mb-1">
                        <MailOutlined className="mr-2" />
                        {hotelData.contact.email}
                      </div>
                    )}
                    {hotelData.contact?.website && (
                      <div>
                        <GlobalOutlined className="mr-2" />
                        {hotelData.contact.website}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Total Rooms:</Text>
                  <div className="mb-3">{hotelData.totalRooms || 0}</div>
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Available Rooms:</Text>
                  <div className="mb-3">{hotelData.availableRooms || 0}</div>
                </Col>
              </Row>
            )}
          </Card>

          {/* Categories and Rooms Section */}
          <Card
        className="shadow-sm"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Room Categories & Rooms</span>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                categoryFormik.resetForm();
                setIsEditingCategory(false);
                setEditingCategoryId(null);
                setCategoryModalVisible(true);
              }}
            >
              Add Category
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found. Add a category to get started.
            </div>
          ) : (
            <Collapse
              activeKey={expandedCategories}
              onChange={setExpandedCategories}
              className="mb-4"
            >
              {categories.map((category) => (
                <Panel
                  key={category._id}
                  header={
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Text strong>{category.name}</Text>
                        {!category.isActive && <Tag color="red">Inactive</Tag>}
                        <Text type="secondary">
                          ({category.roomNumbers?.length || 0} rooms)
                        </Text>
                      </div>
                      <Space onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditCategory(category)}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this category?"
                          onConfirm={() => handleDeleteCategory(category._id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddRoom(category._id)}
                        >
                          Add Room
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  {category.description && (
                    <div className="mb-3">
                      <Text type="secondary">{category.description}</Text>
                    </div>
                  )}
                  <div className="mb-3">
                    <Text strong>Base Price: </Text>
                    <Text>৳{category.basePrice || 0}</Text>
                    <Text className="ml-4" strong>
                      Max Occupancy:{" "}
                    </Text>
                    <Text>
                      {category.maxOccupancy?.adults || 0} Adults,{" "}
                      {category.maxOccupancy?.children || 0} Children
                    </Text>
                  </div>
                  {category.roomNumbers && category.roomNumbers.length > 0 ? (
                    <Table
                      columns={roomColumns(category._id)}
                      dataSource={category.roomNumbers}
                      rowKey="_id"
                      pagination={false}
                      size="small"
                      scroll={{ x: true }}
                    />
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No rooms in this category. Click "Add Room" to add one.
                    </div>
                  )}
                </Panel>
              ))}
            </Collapse>
          )}
        </Spin>
      </Card>
        </>
      )}

      {/* Create/Edit Hotel Modal */}
      <Modal
        title={isCreatingHotel ? "Create New Hotel" : "Edit Hotel Information"}
        open={hotelModalVisible}
        onCancel={() => {
          setHotelModalVisible(false);
          setIsEditingHotel(false);
          setIsCreatingHotel(false);
          hotelFormik.resetForm();
        }}
        footer={null}
        width={800}
      >
        <Form layout="vertical" onFinish={hotelFormik.handleSubmit}>
          <Form.Item label="Hotel Name" required>
            <Input
              name="hotelName"
              value={hotelFormik.values.hotelName}
              onChange={hotelFormik.handleChange}
              placeholder="Enter hotel name"
            />
          </Form.Item>
          <Form.Item label="Description" required>
            <TextArea
              name="hotelDescription"
              value={hotelFormik.values.hotelDescription}
              onChange={hotelFormik.handleChange}
              rows={4}
              placeholder="Enter hotel description"
            />
          </Form.Item>
          <Divider orientation="left">Address</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Street">
                <Input
                  name="address.street"
                  value={hotelFormik.values.address.street}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.street", e.target.value)
                  }
                  placeholder="Street address"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="City">
                <Input
                  name="address.city"
                  value={hotelFormik.values.address.city}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.city", e.target.value)
                  }
                  placeholder="City"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="State">
                <Input
                  name="address.state"
                  value={hotelFormik.values.address.state}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.state", e.target.value)
                  }
                  placeholder="State"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Zip Code">
                <Input
                  name="address.zipCode"
                  value={hotelFormik.values.address.zipCode}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.zipCode", e.target.value)
                  }
                  placeholder="Zip code"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Country">
                <Input
                  name="address.country"
                  value={hotelFormik.values.address.country}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.country", e.target.value)
                  }
                  placeholder="Country"
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Contact Information</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Phone">
                <Input
                  name="contact.phone"
                  value={hotelFormik.values.contact.phone}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("contact.phone", e.target.value)
                  }
                  placeholder="Phone number"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Email">
                <Input
                  name="contact.email"
                  type="email"
                  value={hotelFormik.values.contact.email}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("contact.email", e.target.value)
                  }
                  placeholder="Email address"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Website">
                <Input
                  name="contact.website"
                  value={hotelFormik.values.contact.website}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("contact.website", e.target.value)
                  }
                  placeholder="Website URL"
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Images</Divider>
          <Form.Item label="Hotel Images (Max 3)">
            <Upload
              listType="picture-card"
              fileList={hotelImages}
              onChange={({ fileList }) => setHotelImages(fileList)}
              beforeUpload={() => false}
              maxCount={3}
              onRemove={(file) => {
                const newList = hotelImages.filter((item) => item.uid !== file.uid);
                setHotelImages(newList);
                return true;
              }}
            >
              {hotelImages.length < 3 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="Status">
            <Select
              value={hotelFormik.values.status}
              onChange={(value) => hotelFormik.setFieldValue("status", value)}
              style={{ width: "100%" }}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
              >
                {isCreatingHotel ? "Create Hotel" : "Save Changes"}
              </Button>
              <Button
                onClick={() => {
                  setHotelModalVisible(false);
                  setIsEditingHotel(false);
                  setIsCreatingHotel(false);
                  hotelFormik.resetForm();
                  setHotelImages([]);
                }}
                icon={<CloseOutlined />}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Hotel Details Modal */}
      <Modal
        title="Hotel Details"
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedHotelForDetails(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailsModalVisible(false);
            setSelectedHotelForDetails(null);
          }}>
            Close
          </Button>,
          selectedHotelForDetails && (
            <Button
              key="select"
              type="primary"
              onClick={() => {
                setSelectedHotelId(selectedHotelForDetails.hotelID);
                fetchHotelData(selectedHotelForDetails.hotelID);
                setDetailsModalVisible(false);
                setSelectedHotelForDetails(null);
              }}
            >
              Select Hotel
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedHotelForDetails && (
          <div>
            {selectedHotelForDetails.images && selectedHotelForDetails.images.length > 0 && (
              <div className="mb-4">
                <Text strong className="block mb-2">Images:</Text>
                <Image.PreviewGroup>
                  <Row gutter={[8, 8]}>
                    {selectedHotelForDetails.images.map((img, index) => (
                      <Col key={index} xs={8} sm={8} md={8}>
                        <Image
                          src={img}
                          alt={`Hotel ${index + 1}`}
                          style={{ width: "100%", height: "150px", objectFit: "cover" }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
              </div>
            )}
            <Collapse defaultActiveKey={["basic", "address", "contact"]} className="mb-4">
              <Panel header="Basic Information" key="basic">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Text strong>Hotel ID:</Text>
                    <div className="mb-3">{selectedHotelForDetails.hotelID}</div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text strong>Hotel Name:</Text>
                    <div className="mb-3">{selectedHotelForDetails.hotelName}</div>
                  </Col>
                  <Col xs={24}>
                    <Text strong>Description:</Text>
                    <div className="mb-3">{selectedHotelForDetails.hotelDescription}</div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text strong>Status:</Text>
                    <div className="mb-3">{getStatusTag(selectedHotelForDetails.status)}</div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text strong>Total Rooms:</Text>
                    <div className="mb-3">{selectedHotelForDetails.totalRooms || 0}</div>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text strong>Available Rooms:</Text>
                    <div className="mb-3">{selectedHotelForDetails.availableRooms || 0}</div>
                  </Col>
                </Row>
              </Panel>
              {selectedHotelForDetails.address && (
                <Panel header="Address" key="address">
                  <div className="ml-4">
                    {selectedHotelForDetails.address.street && (
                      <div className="mb-2">{selectedHotelForDetails.address.street}</div>
                    )}
                    {selectedHotelForDetails.address.city && (
                      <div className="mb-2">{selectedHotelForDetails.address.city}</div>
                    )}
                    {selectedHotelForDetails.address.state && (
                      <div className="mb-2">{selectedHotelForDetails.address.state}</div>
                    )}
                    {selectedHotelForDetails.address.zipCode && (
                      <div className="mb-2">{selectedHotelForDetails.address.zipCode}</div>
                    )}
                    {selectedHotelForDetails.address.country && (
                      <div>{selectedHotelForDetails.address.country}</div>
                    )}
                  </div>
                </Panel>
              )}
              {selectedHotelForDetails.contact && (
                <Panel header="Contact Information" key="contact">
                  <div className="ml-4">
                    {selectedHotelForDetails.contact.phone && (
                      <div className="mb-2">
                        <PhoneOutlined className="mr-2" />
                        {selectedHotelForDetails.contact.phone}
                      </div>
                    )}
                    {selectedHotelForDetails.contact.email && (
                      <div className="mb-2">
                        <MailOutlined className="mr-2" />
                        {selectedHotelForDetails.contact.email}
                      </div>
                    )}
                    {selectedHotelForDetails.contact.website && (
                      <div>
                        <GlobalOutlined className="mr-2" />
                        {selectedHotelForDetails.contact.website}
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </Collapse>
          </div>
        )}
      </Modal>

      {/* Category Modal */}
      <Modal
        title={isEditingCategory ? "Edit Category" : "Add Category"}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setIsEditingCategory(false);
          setEditingCategoryId(null);
          categoryFormik.resetForm();
          setCategoryImages([]);
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={categoryFormik.handleSubmit}>
          <Form.Item label="Category Name" required>
            <Input
              name="name"
              value={categoryFormik.values.name}
              onChange={categoryFormik.handleChange}
              placeholder="Enter category name"
            />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea
              name="description"
              value={categoryFormik.values.description}
              onChange={categoryFormik.handleChange}
              rows={3}
              placeholder="Enter category description"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Base Price">
                <InputNumber
                  name="basePrice"
                  value={categoryFormik.values.basePrice}
                  onChange={(value) => categoryFormik.setFieldValue("basePrice", value || 0)}
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Base price"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Max Adults">
                <InputNumber
                  value={categoryFormik.values.maxOccupancy.adults}
                  onChange={(value) =>
                    categoryFormik.setFieldValue("maxOccupancy.adults", value || 2)
                  }
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Max adults"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Max Children">
                <InputNumber
                  value={categoryFormik.values.maxOccupancy.children}
                  onChange={(value) =>
                    categoryFormik.setFieldValue("maxOccupancy.children", value || 0)
                  }
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Max children"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Active Status">
                <Switch
                  checked={categoryFormik.values.isActive}
                  onChange={(checked) => categoryFormik.setFieldValue("isActive", checked)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Images</Divider>
          <Form.Item label="Category Images (Max 3)">
            <Upload
              listType="picture-card"
              fileList={categoryImages}
              onChange={({ fileList }) => setCategoryImages(fileList)}
              beforeUpload={() => false}
              maxCount={3}
              onRemove={(file) => {
                const newList = categoryImages.filter((item) => item.uid !== file.uid);
                setCategoryImages(newList);
                return true;
              }}
            >
              {categoryImages.length < 3 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditingCategory ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setCategoryModalVisible(false);
                  setIsEditingCategory(false);
                  setEditingCategoryId(null);
                  categoryFormik.resetForm();
                  setCategoryImages([]);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Room Modal */}
      <Modal
        title={isEditingRoom ? "Edit Room" : "Add Room"}
        open={roomModalVisible}
        onCancel={() => {
          setRoomModalVisible(false);
          setIsEditingRoom(false);
          setEditingRoomId(null);
          setSelectedCategoryId(null);
          roomFormik.resetForm();
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={roomFormik.handleSubmit}>
          <Form.Item label="Room Name" required>
            <Input
              name="name"
              value={roomFormik.values.name}
              onChange={roomFormik.handleChange}
              placeholder="Enter room name"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Room ID">
                <Input
                  name="roomId"
                  value={roomFormik.values.roomId}
                  onChange={roomFormik.handleChange}
                  placeholder="Enter room ID"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Status">
                <Select
                  value={roomFormik.values.status}
                  onChange={(value) => roomFormik.setFieldValue("status", value)}
                  style={{ width: "100%" }}
                >
                  <Option value="available">Available</Option>
                  <Option value="occupied">Occupied</Option>
                  <Option value="maintenance">Maintenance</Option>
                  <Option value="reserved">Reserved</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Price">
                <InputNumber
                  name="price"
                  value={roomFormik.values.price}
                  onChange={(value) => roomFormik.setFieldValue("price", value || 0)}
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Room price"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Adults Capacity">
                <InputNumber
                  value={roomFormik.values.capacity.adults}
                  onChange={(value) =>
                    roomFormik.setFieldValue("capacity.adults", value || 2)
                  }
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Adults"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Children Capacity">
                <InputNumber
                  value={roomFormik.values.capacity.children}
                  onChange={(value) =>
                    roomFormik.setFieldValue("capacity.children", value || 0)
                  }
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Children"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Description">
            <TextArea
              name="description"
              value={roomFormik.values.description}
              onChange={roomFormik.handleChange}
              rows={3}
              placeholder="Enter room description"
            />
          </Form.Item>
          <Divider orientation="left">Images</Divider>
          <Form.Item label="Room Images (Max 3)">
            <Upload
              listType="picture-card"
              fileList={roomImages}
              onChange={({ fileList }) => setRoomImages(fileList)}
              beforeUpload={() => false}
              maxCount={3}
              onRemove={(file) => {
                const newList = roomImages.filter((item) => item.uid !== file.uid);
                setRoomImages(newList);
                return true;
              }}
            >
              {roomImages.length < 3 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {isEditingRoom ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setRoomModalVisible(false);
                  setIsEditingRoom(false);
                  setEditingRoomId(null);
                  setSelectedCategoryId(null);
                  roomFormik.resetForm();
                  setRoomImages([]);
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelInformation;

