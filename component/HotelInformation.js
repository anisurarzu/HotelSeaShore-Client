"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Popconfirm,
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
  Skeleton,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
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
import { uploadMultipleImagesToImgbb } from "@/utils/imgbbUpload";

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
  const [roomRows, setRoomRows] = useState([{ name: "", status: "available" }]);
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
      address: {
        address1:
          hotelData?.address?.address1 ||
          hotelData?.address?.street ||
          "",
        address2:
          hotelData?.address?.address2 ||
          hotelData?.address?.city ||
          "",
        address3:
          hotelData?.address?.address3 ||
          hotelData?.address?.state ||
          "",
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
        
        // First, upload new images to imgbb
        const newImageFiles = hotelImages
          .filter((file) => file.originFileObj)
          .map((file) => file.originFileObj);
        
        let uploadedImageUrls = [];
        if (newImageFiles.length > 0) {
          const loadingMessage = message.loading("Uploading images...", 0);
          try {
            const uploadResult = await uploadMultipleImagesToImgbb(newImageFiles);
            message.destroy(loadingMessage);
            
            uploadedImageUrls = uploadResult.urls;
            
            // Show warnings if some images failed
            if (uploadResult.errors.length > 0) {
              if (uploadedImageUrls.length > 0) {
                message.warning(
                  `${uploadResult.errors.length} image(s) failed to upload, but ${uploadedImageUrls.length} uploaded successfully.`
                );
              } else {
                message.error(
                  `Failed to upload images: ${uploadResult.errors.join(", ")}`
                );
                setSubmitting(false);
                return;
              }
            }
          } catch (error) {
            message.destroy(loadingMessage);
            console.error("Image upload error:", error);
            message.error(
              error.message || "Failed to upload images. Please check your API key and try again."
            );
            setSubmitting(false);
            return;
          }
        }
        
        // Collect existing image URLs
        const existingImageUrls = hotelImages
          .filter((file) => !file.originFileObj && file.url)
          .map((file) => file.url);
        
        // Combine all image URLs
        const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
        
        // Prepare JSON payload
        const payload = {
          hotelName: values.hotelName,
          status: values.status,
          address: values.address,
          contact: values.contact,
          images: allImageUrls.length > 0 ? allImageUrls : undefined,
        };

        if (isCreatingHotel) {
          // Create new hotel
          const response = await coreAxios.post(`/hotels`, payload);
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
          const response = await coreAxios.put(`/hotels/${selectedHotelId}`, payload);
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
        
        // First, upload new images to imgbb
        const newImageFiles = categoryImages
          .filter((file) => file.originFileObj)
          .map((file) => file.originFileObj);
        
        let uploadedImageUrls = [];
        if (newImageFiles.length > 0) {
          const loadingMessage = message.loading("Uploading images...", 0);
          try {
            const uploadResult = await uploadMultipleImagesToImgbb(newImageFiles);
            message.destroy(loadingMessage);
            
            uploadedImageUrls = uploadResult.urls;
            
            // Show warnings if some images failed
            if (uploadResult.errors.length > 0) {
              if (uploadedImageUrls.length > 0) {
                message.warning(
                  `${uploadResult.errors.length} image(s) failed to upload, but ${uploadedImageUrls.length} uploaded successfully.`
                );
              } else {
                message.error(
                  `Failed to upload images: ${uploadResult.errors.join(", ")}`
                );
                setSubmitting(false);
                return;
              }
            }
          } catch (error) {
            message.destroy(loadingMessage);
            console.error("Image upload error:", error);
            message.error(
              error.message || "Failed to upload images. Please check your API key and try again."
            );
            setSubmitting(false);
            return;
          }
        }
        
        // Collect existing image URLs
        const existingImageUrls = categoryImages
          .filter((file) => !file.originFileObj && file.url)
          .map((file) => file.url);
        
        // Combine all image URLs
        const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
        
        // Prepare JSON payload
        const payload = {
          name: values.name,
          description: values.description || "",
          basePrice: values.basePrice || 0,
          maxOccupancy: {
            adults: values.maxOccupancy.adults || 2,
            children: values.maxOccupancy.children || 0,
          },
          isActive: values.isActive,
          images: allImageUrls.length > 0 ? allImageUrls : undefined,
        };

        if (!selectedHotelId) {
          message.error("Please select a hotel first");
          return;
        }
        if (isEditingCategory) {
          const response = await coreAxios.put(
            `/hotels/${selectedHotelId}/categories/${editingCategoryId}`,
            payload
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
            payload
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
        
        // First, upload new images to imgbb
        const newImageFiles = roomImages
          .filter((file) => file.originFileObj)
          .map((file) => file.originFileObj);
        
        let uploadedImageUrls = [];
        if (newImageFiles.length > 0) {
          const loadingMessage = message.loading("Uploading images...", 0);
          try {
            const uploadResult = await uploadMultipleImagesToImgbb(newImageFiles);
            message.destroy(loadingMessage);
            
            uploadedImageUrls = uploadResult.urls;
            
            // Show warnings if some images failed
            if (uploadResult.errors.length > 0) {
              if (uploadedImageUrls.length > 0) {
                message.warning(
                  `${uploadResult.errors.length} image(s) failed to upload, but ${uploadedImageUrls.length} uploaded successfully.`
                );
              } else {
                message.error(
                  `Failed to upload images: ${uploadResult.errors.join(", ")}`
                );
                setSubmitting(false);
                return;
              }
            }
          } catch (error) {
            message.destroy(loadingMessage);
            console.error("Image upload error:", error);
            message.error(
              error.message || "Failed to upload images. Please check your API key and try again."
            );
            setSubmitting(false);
            return;
          }
        }
        
        // Collect existing image URLs
        const existingImageUrls = roomImages
          .filter((file) => !file.originFileObj && file.url)
          .map((file) => file.url);
        
        // Combine all image URLs
        const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
        
        // Helper to build payload for a single room
        const buildPayload = (roomNameOrNumber) => ({
          name: roomNameOrNumber,
          roomId: values.roomId || roomNameOrNumber,
          status: values.status,
          price: values.price || 0,
          capacity: {
            adults: values.capacity.adults || 2,
            children: values.capacity.children || 0,
          },
          description: values.description || "",
          images: allImageUrls.length > 0 ? allImageUrls : undefined,
        });

        if (!selectedHotelId || !selectedCategoryId) {
          message.error("Please select a hotel and category first");
          return;
        }
        if (isEditingRoom) {
          const payload = buildPayload(values.name);
          const response = await coreAxios.put(
            `/hotels/${selectedHotelId}/categories/${selectedCategoryId}/rooms/${editingRoomId}`,
            payload
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
          // Support adding multiple rooms at once from comma/newline separated input
          const raw = values.name || "";
          const tokens = raw
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean);

          if (tokens.length === 0) {
            message.error("Please enter at least one room number");
            setSubmitting(false);
            return;
          }

          for (const roomToken of tokens) {
            const payload = buildPayload(roomToken);
            const response = await coreAxios.post(
              `/hotels/${selectedHotelId}/categories/${selectedCategoryId}/rooms`,
              payload
            );
            if (!(response.status === 200 || response.status === 201) || !response.data.success) {
              throw new Error("Failed to add room");
            }
          }

          message.success("Room(s) added successfully!");
          await fetchHotelData(selectedHotelId);
          setRoomModalVisible(false);
          setSelectedCategoryId(null);
          roomFormik.resetForm();
          setRoomImages([]);
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
      address: {
        address1: "",
        address2: "",
        address3: "",
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
    setRoomRows([{ name: "", status: "available" }]);
    setIsEditingRoom(false);
    setEditingRoomId(null);
    setRoomModalVisible(true);
  };

  const handleAddMultipleRoomsSubmit = async () => {
    if (!selectedHotelId || !selectedCategoryId) {
      message.error("Please select a hotel and category first");
      return;
    }
    const category = categories.find((c) => c._id === selectedCategoryId);
    const price = category?.basePrice ?? 0;
    const capacity = {
      adults: category?.maxOccupancy?.adults ?? 2,
      children: category?.maxOccupancy?.children ?? 0,
    };
    const toAdd = roomRows.map((r) => ({ ...r, name: (r.name || "").trim() })).filter((r) => r.name);
    if (toAdd.length === 0) {
      message.error("Please enter at least one room name");
      return;
    }
    try {
      setSubmitting(true);
      for (const row of toAdd) {
        const payload = {
          name: row.name,
          roomId: row.name,
          status: row.status || "available",
          price,
          capacity,
          description: "",
        };
        const response = await coreAxios.post(
          `/hotels/${selectedHotelId}/categories/${selectedCategoryId}/rooms`,
          payload
        );
        if (!(response.status === 200 || response.status === 201) || !response.data?.success) {
          throw new Error(response?.data?.message || "Failed to add room");
        }
      }
      message.success(toAdd.length === 1 ? "Room added successfully!" : `${toAdd.length} rooms added successfully!`);
      await fetchHotelData(selectedHotelId);
      setRoomModalVisible(false);
      setSelectedCategoryId(null);
      setRoomRows([{ name: "", status: "available" }]);
    } catch (error) {
      console.error("Error adding rooms:", error);
      message.error(error.response?.data?.message || error.message || "Failed to save room(s)");
    } finally {
      setSubmitting(false);
    }
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
      const ok = response.status === 200 && (response.data?.success === true || response.data?.success === undefined);
      if (ok) {
        message.success("Room deleted successfully!");
        await fetchHotelData(selectedHotelId);
      } else {
        message.error(response.data?.message || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete room";
      message.error(msg);
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusTag(status),
      responsive: ["md"],
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
      responsive: ["lg"],
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="flex-wrap">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRoom(categoryId, record)}
            className="p-0 text-xs"
          >
            <span className="hidden sm:inline">Edit</span>
           
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this room?"
            onConfirm={() => handleDeleteRoom(categoryId, record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} className="p-0 text-xs">
              <span className="hidden sm:inline">Delete</span>
          
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && !hotelData) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <Skeleton.Input active size="large" className="mb-2" style={{ width: 280, height: 32 }} />
          <Skeleton.Input active style={{ width: 360, height: 22 }} />
        </div>
        <Card className="mb-6">
          <Skeleton active paragraph={{ rows: 2 }} className="mb-4" />
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
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
      responsive: ["md"],
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
      responsive: ["sm"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => getStatusTag(status),
      responsive: ["md"],
    },
    {
      title: "Total Rooms",
      dataIndex: "totalRooms",
      key: "totalRooms",
      width: 120,
      render: (rooms) => rooms || 0,
      responsive: ["lg"],
    },
    {
      title: "Available Rooms",
      dataIndex: "availableRooms",
      key: "availableRooms",
      width: 140,
      render: (rooms) => rooms || 0,
      responsive: ["lg"],
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="flex-wrap">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(record);
            }}
            className="p-0"
          >
            <span className="hidden sm:inline">Details</span>
            <span className="sm:hidden">View</span>
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHotelId(record.hotelID);
              fetchHotelData(record.hotelID);
            }}
            className="p-0"
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            {/* <span className="text-base sm:text-lg">Hotels List</span> */}
            <div className="w-full sm:w-auto flex justify-end">
              {/*
              <Input.Search
                placeholder="Search hotels..."
                allowClear
                onSearch={handleSearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleSearch("");
                  }
                }}
                className="w-full sm:w-auto"
                style={{ minWidth: "200px" }}
              />
              */}
              <div className="flex flex-row gap-2">
                <Button
                  type="default"
                  onClick={() => fetchHotels(pagination.current, pagination.pageSize, searchText)}
                  loading={loading}
                  className="hidden sm:inline-flex items-center"
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateHotel}
                  className="inline-flex items-center"
                >
                  <span className="hidden sm:inline">Create Hotel</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>
          </div>
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} title={{ width: "100%" }} />
        ) : (
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
            scroll={{ x: "max-content" }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedHotelId(record.hotelID);
                fetchHotelData(record.hotelID);
              },
              style: { cursor: "pointer" },
            })}
          />
        )}
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
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEditHotel}
                className="w-full sm:w-auto"
                size="small"
              >
                <span className="hidden sm:inline">Edit Hotel</span>
               
              </Button>
            }
          >
            {loading && !hotelData ? (
              <Skeleton active paragraph={{ rows: 6 }} title={false} />
            ) : hotelData ? (
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
                    {(hotelData.address?.address1 || hotelData.address?.street) && (
                      <div>{hotelData.address.address1 || hotelData.address.street}</div>
                    )}
                    {(hotelData.address?.address2 || hotelData.address?.city) && (
                      <div>{hotelData.address.address2 || hotelData.address.city}</div>
                    )}
                    {(hotelData.address?.address3 || hotelData.address?.state) && (
                      <div>{hotelData.address.address3 || hotelData.address.state}</div>
                    )}
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
            ) : null}
          </Card>

          {/* Categories and Rooms Section */}
          <Card
        className="shadow-sm"
        title={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">Room Categories & Rooms</span>
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
              className="w-full sm:w-auto"
              size="small"
            >
              <span className="hidden sm:inline">Add Category</span>
              
            </Button>
          </div>
        }
      >
        {loading ? (
          <>
            <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-4" />
            <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-4" />
            <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-4" />
            <Skeleton active paragraph={{ rows: 4 }} />
          </>
        ) : categories.length === 0 ? (
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-2 sm:pr-4 gap-2 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Text strong className="text-sm sm:text-base">{category.name}</Text>
                      {!category.isActive && <Tag color="red" className="text-xs">Inactive</Tag>}
                      <Text type="secondary" className="text-xs sm:text-sm">
                        ({category.roomNumbers?.length || 0} rooms)
                      </Text>
                    </div>
                    <Space onClick={(e) => e.stopPropagation()} className="flex-wrap">
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditCategory(category)}
                        className="text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">Edit</span>
                  
                      </Button>
                      <Popconfirm
                        title="Are you sure you want to delete this category?"
                        onConfirm={() => handleDeleteCategory(category._id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} className="text-xs sm:text-sm">
                          <span className="hidden sm:inline">Delete</span>
                         
                        </Button>
                      </Popconfirm>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleAddRoom(category._id)}
                        className="text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">Add Room</span>
                         
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
                    scroll={{ x: "max-content" }}
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
        width="95%"
        style={{ maxWidth: "800px" }}
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
          <Divider orientation="left">Address</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={24}>
              <Form.Item label="Address 1">
                <Input
                  name="address.address1"
                  value={hotelFormik.values.address.address1}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.address1", e.target.value)
                  }
                  placeholder="Address line 1"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24}>
              <Form.Item label="Address 2">
                <Input
                  name="address.address2"
                  value={hotelFormik.values.address.address2}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.address2", e.target.value)
                  }
                  placeholder="Address line 2"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24}>
              <Form.Item label="Address 3">
                <Input
                  name="address.address3"
                  value={hotelFormik.values.address.address3}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.address3", e.target.value)
                  }
                  placeholder="Address line 3"
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Contact Information</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Front Desk Number">
                <Input
                  name="contact.phone"
                  value={hotelFormik.values.contact.phone}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("contact.phone", e.target.value)
                  }
                  placeholder="Front desk phone number"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Reservation Number">
                <Input
                  name="contact.email"
                  type="number"
                  value={hotelFormik.values.contact.email}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("contact.email", e.target.value)
                  }
                  placeholder="Reservation number"
                />
              </Form.Item>
            </Col>
            {/* Website field temporarily disabled
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
            */}
          </Row>
          <Divider orientation="left">Logo</Divider>
          <Form.Item label="Hotel Logo">
            <Upload
              listType="picture-card"
              fileList={hotelImages}
              onChange={({ fileList }) => setHotelImages(fileList)}
              beforeUpload={() => false}
              maxCount={1}
              onRemove={(file) => {
                const newList = hotelImages.filter((item) => item.uid !== file.uid);
                setHotelImages(newList);
                return true;
              }}
            >
              {hotelImages.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Logo</div>
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SaveOutlined />}
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
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
        width="95%"
        style={{ maxWidth: "900px" }}
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
                    {(selectedHotelForDetails.address.address1 ||
                      selectedHotelForDetails.address.street) && (
                      <div className="mb-2">
                        {selectedHotelForDetails.address.address1 ||
                          selectedHotelForDetails.address.street}
                      </div>
                    )}
                    {(selectedHotelForDetails.address.address2 ||
                      selectedHotelForDetails.address.city) && (
                      <div className="mb-2">
                        {selectedHotelForDetails.address.address2 ||
                          selectedHotelForDetails.address.city}
                      </div>
                    )}
                    {(selectedHotelForDetails.address.address3 ||
                      selectedHotelForDetails.address.state) && (
                      <div className="mb-2">
                        {selectedHotelForDetails.address.address3 ||
                          selectedHotelForDetails.address.state}
                      </div>
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
        width="95%"
        style={{ maxWidth: "600px" }}
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
          {/* Description and Images commented out
          <Form.Item label="Description">...</Form.Item>
          <Form.Item label="Category Images (Max 3)">...</Form.Item>
          */}
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
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Active Status">
                <Switch
                  checked={categoryFormik.values.isActive}
                  onChange={(checked) => categoryFormik.setFieldValue("isActive", checked)}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="primary" htmlType="submit" loading={submitting} className="w-full sm:w-auto">
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
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
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
          setRoomRows([{ name: "", status: "available" }]);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: "600px" }}
      >
        <Form
          layout="vertical"
          onFinish={(e) => {
            e?.preventDefault?.();
            if (isEditingRoom) {
              roomFormik.handleSubmit();
            } else {
              handleAddMultipleRoomsSubmit();
            }
          }}
        >
          {isEditingRoom ? (
            <>
              <Form.Item label="Room Name" required>
                <Input
                  name="name"
                  value={roomFormik.values.name}
                  onChange={roomFormik.handleChange}
                  placeholder="Room name / number"
                />
              </Form.Item>
              <Form.Item label="Status">
                <Select
                  value={roomFormik.values.status}
                  onChange={(value) => roomFormik.setFieldValue("status", value)}
                  style={{ width: "100%" }}
                >
                  <Option value="available">Available</Option>
                  <Option value="maintenance">Maintenance</Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            <>
              {roomRows.map((row, index) => (
                <div key={index} className="flex flex-wrap items-start gap-2 mb-3 p-3 border border-gray-200 rounded">
                  <div className="flex-1 min-w-[120px]">
                    <Form.Item label={index === 0 ? "Room Name" : null} required>
                      <Input
                        value={row.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setRoomRows((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, name: v } : r))
                          );
                        }}
                        placeholder="Room name / number"
                      />
                    </Form.Item>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <Form.Item label={index === 0 ? "Status" : null}>
                      <Select
                        value={row.status}
                        onChange={(value) => {
                          setRoomRows((prev) =>
                            prev.map((r, i) => (i === index ? { ...r, status: value } : r))
                          );
                        }}
                        style={{ width: "100%" }}
                      >
                        <Option value="available">Available</Option>
                        <Option value="maintenance">Maintenance</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  {roomRows.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() =>
                        setRoomRows((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="mt-6"
                    />
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  setRoomRows((prev) => [...prev, { name: "", status: "available" }])
                }
                block
                className="mb-4"
              >
                Add another room
              </Button>
            </>
          )}
          {/*
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
          */}
          <Form.Item>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="primary" htmlType="submit" loading={submitting} className="w-full sm:w-auto">
                {isEditingRoom ? "Update" : "Add Room(s)"}
              </Button>
              <Button
                onClick={() => {
                  setRoomModalVisible(false);
                  setIsEditingRoom(false);
                  setEditingRoomId(null);
                  setSelectedCategoryId(null);
                  roomFormik.resetForm();
                  setRoomImages([]);
                  setRoomRows([{ name: "", status: "available" }]);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelInformation;

