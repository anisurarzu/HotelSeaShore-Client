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
  TimePicker,
} from "antd";
import dayjs from "dayjs";
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
import "./HotelInformation.css";
import "./Booking/BookingForm.css";

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
  const [detailsLoading, setDetailsLoading] = useState(false);

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
      termsAndConditions: Array.isArray(hotelData?.termsAndConditions)
        ? hotelData.termsAndConditions
            .map((t) => (typeof t === "string" ? t : String(t)))
            .map((t) => t.trim())
            .filter(Boolean)
        : typeof hotelData?.termsAndConditions === "string" && hotelData.termsAndConditions.trim()
          ? [hotelData.termsAndConditions.trim()]
          : [""],
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
      checkInTime: hotelData?.checkInTime || "14:00",
      checkOutTime: hotelData?.checkOutTime || "11:00",
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
        const termsAndConditions = Array.isArray(values.termsAndConditions)
          ? values.termsAndConditions
              .map((t) => (typeof t === "string" ? t : String(t)))
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        const payload = {
          hotelName: values.hotelName,
          status: values.status,
          address: values.address,
          contact: values.contact,
          checkInTime: values.checkInTime || "14:00",
          checkOutTime: values.checkOutTime || "11:00",
          termsAndConditions,
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
      termsAndConditions: [""],
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
      checkInTime: "14:00",
      checkOutTime: "11:00",
      status: "active",
    });
    setIsCreatingHotel(true);
    setIsEditingHotel(false);
    setHotelModalVisible(true);
  };

  const handleEditHotel = (hotelOverride = null) => {
    const source = hotelOverride || hotelData;
    const normalizedTerms = Array.isArray(source?.termsAndConditions)
      ? source.termsAndConditions
          .map((t) => (typeof t === "string" ? t : String(t)))
          .map((t) => t.trim())
          .filter(Boolean)
      : typeof source?.termsAndConditions === "string" && source.termsAndConditions.trim()
        ? [source.termsAndConditions.trim()]
        : [];

    hotelFormik.setValues({
      hotelName: source?.hotelName || "",
      hotelDescription: source?.hotelDescription || "",
      termsAndConditions: normalizedTerms.length > 0 ? normalizedTerms : [""],
      address: {
        address1:
          source?.address?.address1 ||
          source?.address?.street ||
          "",
        address2:
          source?.address?.address2 ||
          source?.address?.city ||
          "",
        address3:
          source?.address?.address3 ||
          source?.address?.state ||
          "",
      },
      contact: {
        phone: source?.contact?.phone || "",
        email: source?.contact?.email || "",
        website: source?.contact?.website || "",
      },
      checkInTime: source?.checkInTime || "14:00",
      checkOutTime: source?.checkOutTime || "11:00",
      status: source?.status || "active",
    });
    if (source?.images && source.images.length > 0) {
      setHotelImages(
        source.images.map((url) => ({
          uid: url,
          name: url.split("/").pop(),
          status: "done",
          url: url,
        }))
      );
    } else {
      setHotelImages([]);
    }
    if (source?.hotelID) {
      setSelectedHotelId(source.hotelID);
      setHotelData(source);
      if (source.roomCategories) {
        setCategories(source.roomCategories);
      }
    }
    setIsEditingHotel(true);
    setIsCreatingHotel(false);
    setHotelModalVisible(true);
  };

  const handleViewDetails = async (hotel) => {
    try {
      setSelectedHotelForDetails(hotel);
      setDetailsLoading(true);
      setDetailsModalVisible(true);
      const response = await coreAxios.get(`/hotels/${hotel.hotelID}`);
      const payload =
        response?.data?.data ||
        response?.data?.hotel ||
        response?.data ||
        null;
      if (response.status === 200 && payload) {
        setSelectedHotelForDetails(payload);
      }
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      setSelectedHotelForDetails(hotel);
      message.warning("Showing list data. Full details could not be loaded.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleHideHotelWorkspace = () => {
    setSelectedHotelId(null);
    setHotelData(null);
    setCategories([]);
    setExpandedCategories([]);
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
    const key = String(status || "").toLowerCase();
    const map = {
      active: { cls: "hs-hi__status--ok", text: "Active" },
      available: { cls: "hs-hi__status--ok", text: "Available" },
      inactive: { cls: "hs-hi__status--bad", text: "Inactive" },
      maintenance: { cls: "hs-hi__status--warn", text: "Maintenance" },
      booked: { cls: "hs-hi__status--warn", text: "Booked" },
    };
    const config = map[key] || {
      cls: "hs-hi__status--neutral",
      text: status || "—",
    };
    return <span className={`hs-hi__status ${config.cls}`}>{config.text}</span>;
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
        <div className="hs-hi__actions">
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
        </div>
      ),
    },
  ];

  const handleSearch = (value) => {
    setSearchText(value);
    fetchHotels(1, pagination.pageSize, value);
  };

  const hotelColumns = [
    {
      title: "ID",
      dataIndex: "hotelID",
      key: "hotelID",
      width: 72,
      responsive: ["md"],
      render: (id) => <span className="hs-hi__muted">{id}</span>,
    },
    {
      title: "Hotel",
      dataIndex: "hotelName",
      key: "hotelName",
      render: (name) => <span className="hs-hi__hotel-name">{name}</span>,
    },
    {
      title: "Location",
      key: "location",
      width: 180,
      responsive: ["sm"],
      render: (_, record) => {
        const loc =
          record.address?.city ||
          record.address?.address2 ||
          record.address?.address1 ||
          record.address?.street ||
          "—";
        return <span className="hs-hi__muted">{loc}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => getStatusTag(status),
      responsive: ["md"],
    },
    {
      title: "Rooms",
      dataIndex: "totalRooms",
      key: "totalRooms",
      width: 90,
      align: "right",
      responsive: ["lg"],
      render: (rooms) => <span className="hs-hi__muted">{rooms || 0}</span>,
    },
    {
      title: "Available",
      dataIndex: "availableRooms",
      key: "availableRooms",
      width: 100,
      align: "right",
      responsive: ["lg"],
      render: (rooms) => (
        <strong style={{ color: "#0b5c66" }}>{rooms || 0}</strong>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <div className="hs-hi__actions" onClick={(e) => e.stopPropagation()}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          <Button
            size="small"
            type={selectedHotelId === record.hotelID ? "primary" : "default"}
            onClick={() => {
              setSelectedHotelId(record.hotelID);
              fetchHotelData(record.hotelID);
            }}
          >
            {selectedHotelId === record.hotelID ? "Selected" : "Open"}
          </Button>
        </div>
      ),
    },
  ];

  const addressLine = (hotel) => {
    if (!hotel?.address) return "—";
    return (
      [
        hotel.address.address1 || hotel.address.street,
        hotel.address.address2 || hotel.address.city,
        hotel.address.address3 || hotel.address.state,
      ]
        .filter(Boolean)
        .join(", ") || "—"
    );
  };

  const categoryCount = categories.length;
  const roomCount =
    hotelData?.totalRooms ??
    categories.reduce((s, c) => s + (c.roomNumbers?.length || 0), 0);
  const availableCount = hotelData?.availableRooms ?? "—";

  return (
    <div className="hs-hi">
      <div className="hs-hi__toolbar">
        <div className="hs-hi__title-block">
          <p className="hs-hi__eyebrow">Master data</p>
          <h1 className="hs-hi__title">Hotel Information</h1>
          <p className="hs-hi__meta">
            Manage hotels, room categories, and inventory in one place
          </p>
        </div>
        <div className="hs-hi__controls">
          <Input.Search
            placeholder="Search hotels…"
            allowClear
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (!e.target.value) handleSearch("");
            }}
            onSearch={handleSearch}
          />
          <Button
            onClick={() =>
              fetchHotels(pagination.current, pagination.pageSize, searchText)
            }
            loading={loading}
          >
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHotel}>
            Create Hotel
          </Button>
        </div>
      </div>

      <div className="hs-hi__panel">
        <div className="hs-hi__panel-head">
          <div>
            <h2 className="hs-hi__panel-title">Hotels</h2>
            <p className="hs-hi__panel-hint">
              Select a row to manage details and room structure
            </p>
          </div>
          <p className="hs-hi__panel-hint">
            {pagination.total || hotels.length} total
          </p>
        </div>
        <div className="hs-hi__panel-body">
          {loading && hotels.length === 0 ? (
            <div style={{ padding: 16 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : (
            <Table
              columns={hotelColumns}
              dataSource={hotels}
              rowKey="hotelID"
              loading={loading && hotels.length > 0}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20", "50"],
                showTotal: (total) => `${total} hotels`,
                onChange: (page, pageSize) => {
                  fetchHotels(page, pageSize, searchText);
                },
              }}
              scroll={{ x: "max-content" }}
              size="small"
              rowClassName={(record) =>
                selectedHotelId === record.hotelID ? "hs-hi__row--selected" : ""
              }
              onRow={(record) => ({
                onClick: () => {
                  setSelectedHotelId(record.hotelID);
                  fetchHotelData(record.hotelID);
                },
                style: { cursor: "pointer" },
              })}
              locale={{
                emptyText: (
                  <div className="hs-hi__empty">
                    <p className="hs-hi__empty-title">No hotels yet</p>
                    <p className="hs-hi__empty-sub">
                      Create a hotel to start configuring categories and rooms.
                    </p>
                  </div>
                ),
              }}
            />
          )}
        </div>
      </div>

      {!selectedHotelId && (
        <div className="hs-hi__panel">
          <div className="hs-hi__empty">
            <p className="hs-hi__empty-title">No hotel selected</p>
            <p className="hs-hi__empty-sub">
              Click a hotel in the list above to open its object page.
            </p>
          </div>
        </div>
      )}

      {selectedHotelId && (
        <>
          <div className="hs-hi__object">
            <div className="hs-hi__object-head">
              <div>
                <p className="hs-hi__eyebrow">Hotel object</p>
                <h2 className="hs-hi__object-name">
                  {hotelData?.hotelName || "Loading…"}
                </h2>
                <p className="hs-hi__object-sub">
                  ID {selectedHotelId}
                  {hotelData?.status ? ` · ${String(hotelData.status)}` : ""}
                </p>
              </div>
              <div className="hs-hi__object-actions">
                <Button icon={<CloseOutlined />} onClick={handleHideHotelWorkspace}>
                  Hide
                </Button>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEditHotel}>
                  Edit Hotel
                </Button>
              </div>
            </div>

            <div className="hs-hi__kpi-row">
              <div className="hs-hi__kpi">
                <p className="hs-hi__kpi-label">Total rooms</p>
                <p className="hs-hi__kpi-value">{roomCount || 0}</p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--soft">
                <p className="hs-hi__kpi-label">Available</p>
                <p className="hs-hi__kpi-value">{availableCount}</p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--sand">
                <p className="hs-hi__kpi-label">Categories</p>
                <p className="hs-hi__kpi-value">{categoryCount}</p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--deep">
                <p className="hs-hi__kpi-label">Status</p>
                <p className="hs-hi__kpi-value" style={{ fontSize: 14 }}>
                  {hotelData ? getStatusTag(hotelData.status) : "—"}
                </p>
              </div>
            </div>

            <div className="hs-hi__attrs">
              {loading && !hotelData ? (
                <div className="hs-hi__attr--full">
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              ) : hotelData ? (
                <>
                  <div className="hs-hi__attr hs-hi__attr--full">
                    <label>Description</label>
                    <p>{hotelData.hotelDescription || "—"}</p>
                  </div>
                  <div className="hs-hi__attr">
                    <label>Address</label>
                    <p>{addressLine(hotelData)}</p>
                  </div>
                  <div className="hs-hi__attr">
                    <label>Contact</label>
                    <p>
                      {[
                        hotelData.contact?.phone,
                        hotelData.contact?.email,
                        hotelData.contact?.website,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="hs-hi__attr">
                    <label>Check-in</label>
                    <p>{hotelData.checkInTime || "14:00"}</p>
                  </div>
                  <div className="hs-hi__attr">
                    <label>Check-out</label>
                    <p>{hotelData.checkOutTime || "11:00"}</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="hs-hi__panel">
            <div className="hs-hi__panel-head">
              <div>
                <h2 className="hs-hi__panel-title">Room categories & rooms</h2>
                <p className="hs-hi__panel-hint">
                  Expand a category to manage individual rooms
                </p>
              </div>
              <div className="hs-hi__object-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => {
                    categoryFormik.resetForm();
                    setIsEditingCategory(false);
                    setEditingCategoryId(null);
                    setCategoryModalVisible(true);
                  }}
                >
                  Add Category
                </Button>
                <Button size="small" icon={<CloseOutlined />} onClick={handleHideHotelWorkspace}>
                  Hide
                </Button>
              </div>
            </div>
            <div className="hs-hi__panel-body hs-hi__panel-body--pad">
              {loading && categories.length === 0 && !hotelData ? (
                <>
                  <Skeleton active paragraph={{ rows: 2 }} className="mb-4" />
                  <Skeleton active paragraph={{ rows: 2 }} />
                </>
              ) : categories.length === 0 ? (
                <div className="hs-hi__empty">
                  <p className="hs-hi__empty-title">No categories yet</p>
                  <p className="hs-hi__empty-sub">
                    Add a category first, then create rooms under it.
                  </p>
                </div>
              ) : (
                <Collapse
                  activeKey={expandedCategories}
                  onChange={setExpandedCategories}
                  bordered={false}
                >
                  {categories.map((category) => (
                    <Panel
                      key={category._id}
                      header={
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full pr-2">
                          <div className="hs-hi__cat-main">
                            <span className="hs-hi__cat-name">{category.name}</span>
                            {!category.isActive && getStatusTag("inactive")}
                            <span className="hs-hi__cat-meta">
                              {category.roomNumbers?.length || 0} rooms
                            </span>
                            <span className="hs-hi__cat-price">
                              ৳{Number(category.basePrice || 0).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className="hs-hi__cat-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              >
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
                          </div>
                        </div>
                      }
                    >
                      {category.description && (
                        <p className="hs-hi__cat-desc">{category.description}</p>
                      )}
                      <p className="hs-hi__cat-meta" style={{ marginBottom: 10 }}>
                        Max occupancy: {category.maxOccupancy?.adults || 0} adults,{" "}
                        {category.maxOccupancy?.children || 0} children
                      </p>
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
                        <div className="hs-hi__empty" style={{ padding: "24px 8px" }}>
                          <p className="hs-hi__empty-title">No rooms in this category</p>
                          <p className="hs-hi__empty-sub">
                            Click Add Room to create inventory.
                          </p>
                        </div>
                      )}
                    </Panel>
                  ))}
                </Collapse>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Hotel Modal */}
      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">
              {isCreatingHotel ? "New record" : "Update record"}
            </p>
            <h2 className="hs-booking-modal__title">
              {isCreatingHotel ? "Create Hotel" : "Edit Hotel"}
            </h2>
            <p className="hs-booking-modal__sub">
              Profile, address, contact, policies and branding
            </p>
          </div>
        }
        open={hotelModalVisible}
        onCancel={() => {
          setHotelModalVisible(false);
          setIsEditingHotel(false);
          setIsCreatingHotel(false);
          hotelFormik.resetForm();
          setHotelImages([]);
        }}
        footer={null}
        width={860}
        centered
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={hotelFormik.handleSubmit}
          className="hs-bf"
          requiredMark="optional"
        >
          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Basic information</h3>
              <p className="hs-bf__section-hint">Name and operating status</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__grid-2">
                <Form.Item label="Hotel name" required>
                  <Input
                    name="hotelName"
                    value={hotelFormik.values.hotelName}
                    onChange={hotelFormik.handleChange}
                    placeholder="Enter hotel name"
                  />
                </Form.Item>
                <Form.Item label="Status">
                  <Select
                    value={hotelFormik.values.status}
                    onChange={(value) => hotelFormik.setFieldValue("status", value)}
                  >
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="maintenance">Maintenance</Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Address</h3>
              <p className="hs-bf__section-hint">Location lines</p>
            </div>
            <div className="hs-bf__section-body">
              <Form.Item label="Address 1">
                <Input
                  value={hotelFormik.values.address.address1}
                  onChange={(e) =>
                    hotelFormik.setFieldValue("address.address1", e.target.value)
                  }
                  placeholder="Address line 1"
                />
              </Form.Item>
              <div className="hs-bf__grid-2">
                <Form.Item label="Address 2">
                  <Input
                    value={hotelFormik.values.address.address2}
                    onChange={(e) =>
                      hotelFormik.setFieldValue("address.address2", e.target.value)
                    }
                    placeholder="Address line 2"
                  />
                </Form.Item>
                <Form.Item label="Address 3">
                  <Input
                    value={hotelFormik.values.address.address3}
                    onChange={(e) =>
                      hotelFormik.setFieldValue("address.address3", e.target.value)
                    }
                    placeholder="Address line 3"
                  />
                </Form.Item>
              </div>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Contact & schedule</h3>
              <p className="hs-bf__section-hint">Front desk and stay times</p>
            </div>
            <div className="hs-bf__section-body">
              <div className="hs-bf__grid-2">
                <Form.Item label="Front desk number">
                  <Input
                    value={hotelFormik.values.contact.phone}
                    onChange={(e) =>
                      hotelFormik.setFieldValue("contact.phone", e.target.value)
                    }
                    placeholder="Front desk phone"
                  />
                </Form.Item>
                <Form.Item label="Reservation number">
                  <Input
                    value={hotelFormik.values.contact.email}
                    onChange={(e) =>
                      hotelFormik.setFieldValue("contact.email", e.target.value)
                    }
                    placeholder="Reservation number"
                  />
                </Form.Item>
                <Form.Item label="Check-in time">
                  <TimePicker
                    value={dayjs(hotelFormik.values.checkInTime || "14:00", "HH:mm")}
                    onChange={(time) =>
                      hotelFormik.setFieldValue(
                        "checkInTime",
                        time ? time.format("HH:mm") : "14:00"
                      )
                    }
                    format="h:mm A"
                    use12Hours
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Check-out time">
                  <TimePicker
                    value={dayjs(hotelFormik.values.checkOutTime || "11:00", "HH:mm")}
                    onChange={(time) =>
                      hotelFormik.setFieldValue(
                        "checkOutTime",
                        time ? time.format("HH:mm") : "11:00"
                      )
                    }
                    format="h:mm A"
                    use12Hours
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
            </div>
          </section>

          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Terms & branding</h3>
              <p className="hs-bf__section-hint">Policies and hotel logo</p>
            </div>
            <div className="hs-bf__section-body">
              <Form.Item
                label="Terms & conditions"
                extra="Each line is stored as a separate policy item."
              >
                {(hotelFormik.values.termsAndConditions || []).map((term, idx) => (
                  <div className="hs-bf__term-row" key={idx}>
                    <Input
                      value={term}
                      onChange={(e) => {
                        const next = [...(hotelFormik.values.termsAndConditions || [])];
                        next[idx] = e.target.value;
                        hotelFormik.setFieldValue("termsAndConditions", next);
                      }}
                      placeholder={`Term ${idx + 1}`}
                    />
                    <Button
                      danger
                      type="text"
                      icon={<MinusCircleOutlined />}
                      onClick={() => {
                        const current = [...(hotelFormik.values.termsAndConditions || [])];
                        const next = current.filter((_, i) => i !== idx);
                        hotelFormik.setFieldValue(
                          "termsAndConditions",
                          next.length > 0 ? next : [""]
                        );
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  className="hs-bf__add-pay"
                  onClick={() => {
                    const next = [...(hotelFormik.values.termsAndConditions || [])];
                    next.push("");
                    hotelFormik.setFieldValue("termsAndConditions", next);
                  }}
                >
                  Add term
                </Button>
              </Form.Item>
              <Form.Item label="Hotel logo">
                <Upload
                  listType="picture-card"
                  fileList={hotelImages}
                  onChange={({ fileList }) => setHotelImages(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  onRemove={(file) => {
                    setHotelImages(hotelImages.filter((item) => item.uid !== file.uid));
                    return true;
                  }}
                >
                  {hotelImages.length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </div>
          </section>

          <div className="hs-bf__footer">
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                setHotelModalVisible(false);
                setIsEditingHotel(false);
                setIsCreatingHotel(false);
                hotelFormik.resetForm();
                setHotelImages([]);
              }}
            >
              Hide
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<SaveOutlined />}
            >
              {isCreatingHotel ? "Create Hotel" : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">
              {isEditingCategory ? "Update record" : "New record"}
            </p>
            <h2 className="hs-booking-modal__title">
              {isEditingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <p className="hs-booking-modal__sub">
              Pricing, occupancy and availability for a room group
            </p>
          </div>
        }
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setIsEditingCategory(false);
          setEditingCategoryId(null);
          categoryFormik.resetForm();
          setCategoryImages([]);
        }}
        footer={null}
        width={640}
        centered
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={categoryFormik.handleSubmit}
          className="hs-bf"
          requiredMark="optional"
        >
          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">Category details</h3>
            </div>
            <div className="hs-bf__section-body">
              <Form.Item label="Category name" required>
                <Input
                  name="name"
                  value={categoryFormik.values.name}
                  onChange={categoryFormik.handleChange}
                  placeholder="e.g. Deluxe Sea View"
                />
              </Form.Item>
              <div className="hs-bf__grid-3">
                <Form.Item label="Base price">
                  <InputNumber
                    value={categoryFormik.values.basePrice}
                    onChange={(value) =>
                      categoryFormik.setFieldValue("basePrice", value || 0)
                    }
                    min={0}
                    placeholder="0"
                    prefix="৳"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Max adults">
                  <InputNumber
                    value={categoryFormik.values.maxOccupancy.adults}
                    onChange={(value) =>
                      categoryFormik.setFieldValue("maxOccupancy.adults", value || 2)
                    }
                    min={1}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Max children">
                  <InputNumber
                    value={categoryFormik.values.maxOccupancy.children}
                    onChange={(value) =>
                      categoryFormik.setFieldValue("maxOccupancy.children", value || 0)
                    }
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </div>
              <div className="hs-bf__breakfast">
                <div className="hs-bf__breakfast-top">
                  <div>
                    <div className="hs-bf__breakfast-label">Active status</div>
                    <div className="hs-bf__breakfast-hint">
                      Inactive categories stay hidden from booking flows
                    </div>
                  </div>
                  <Switch
                    checked={categoryFormik.values.isActive}
                    onChange={(checked) =>
                      categoryFormik.setFieldValue("isActive", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </section>
          <div className="hs-bf__footer">
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                setCategoryModalVisible(false);
                setIsEditingCategory(false);
                setEditingCategoryId(null);
                categoryFormik.resetForm();
                setCategoryImages([]);
              }}
            >
              Hide
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Room Modal */}
      <Modal
        className="hs-booking-modal"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">
              {isEditingRoom ? "Update record" : "New inventory"}
            </p>
            <h2 className="hs-booking-modal__title">
              {isEditingRoom ? "Edit Room" : "Add Room"}
            </h2>
            <p className="hs-booking-modal__sub">
              {isEditingRoom
                ? "Update room identity and status"
                : "Add one or multiple rooms under this category"}
            </p>
          </div>
        }
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
        width={640}
        centered
        destroyOnClose
      >
        <Form
          layout="vertical"
          className="hs-bf"
          requiredMark="optional"
          onFinish={(e) => {
            e?.preventDefault?.();
            if (isEditingRoom) {
              roomFormik.handleSubmit();
            } else {
              handleAddMultipleRoomsSubmit();
            }
          }}
        >
          <section className="hs-bf__section">
            <div className="hs-bf__section-head">
              <h3 className="hs-bf__section-title">
                {isEditingRoom ? "Room details" : "Room list"}
              </h3>
              <p className="hs-bf__section-hint">
                {isEditingRoom
                  ? "Identity and availability"
                  : "Enter room names, then save together"}
              </p>
            </div>
            <div className="hs-bf__section-body">
              {isEditingRoom ? (
                <div className="hs-bf__grid-2">
                  <Form.Item label="Room name" required>
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
                    >
                      <Option value="available">Available</Option>
                      <Option value="maintenance">Maintenance</Option>
                    </Select>
                  </Form.Item>
                </div>
              ) : (
                <>
                  {roomRows.map((row, index) => (
                    <div className="hs-bf__pay-row" key={index} style={{ gridTemplateColumns: "1.4fr 1fr auto" }}>
                      <Form.Item label={index === 0 ? "Room name" : " "}>
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
                      <Form.Item label={index === 0 ? "Status" : " "}>
                        <Select
                          value={row.status}
                          onChange={(value) => {
                            setRoomRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, status: value } : r
                              )
                            );
                          }}
                        >
                          <Option value="available">Available</Option>
                          <Option value="maintenance">Maintenance</Option>
                        </Select>
                      </Form.Item>
                      <div className="hs-bf__pay-actions">
                        {roomRows.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() =>
                              setRoomRows((prev) => prev.filter((_, i) => i !== index))
                            }
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    className="hs-bf__add-pay"
                    onClick={() =>
                      setRoomRows((prev) => [
                        ...prev,
                        { name: "", status: "available" },
                      ])
                    }
                  >
                    Add another room
                  </Button>
                </>
              )}
            </div>
          </section>
          <div className="hs-bf__footer">
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                setRoomModalVisible(false);
                setIsEditingRoom(false);
                setEditingRoomId(null);
                setSelectedCategoryId(null);
                roomFormik.resetForm();
                setRoomImages([]);
                setRoomRows([{ name: "", status: "available" }]);
              }}
            >
              Hide
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEditingRoom ? "Save Changes" : "Add Room(s)"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Hotel Details Modal */}
      <Modal
        className="hs-booking-modal hs-hi-details"
        wrapClassName="hs-hi-details-wrap"
        title={
          <div className="hs-booking-modal__head">
            <p className="hs-booking-modal__eyebrow">Quick preview</p>
            <h2 className="hs-booking-modal__title">
              {selectedHotelForDetails?.hotelName || "Hotel details"}
            </h2>
            <p className="hs-booking-modal__sub">
              {selectedHotelForDetails
                ? `ID ${selectedHotelForDetails.hotelID} · Smart overview`
                : "Loading hotel profile…"}
            </p>
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedHotelForDetails(null);
        }}
        footer={
          <div className="hs-hi-details__footer">
            <Button
              onClick={() => {
                setDetailsModalVisible(false);
                setSelectedHotelForDetails(null);
              }}
            >
              Close
            </Button>
            {selectedHotelForDetails && (
              <>
                <Button
                  icon={<HomeOutlined />}
                  onClick={() => {
                    setSelectedHotelId(selectedHotelForDetails.hotelID);
                    fetchHotelData(selectedHotelForDetails.hotelID);
                    setDetailsModalVisible(false);
                    setSelectedHotelForDetails(null);
                  }}
                >
                  Open workspace
                </Button>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    const hotel = selectedHotelForDetails;
                    setDetailsModalVisible(false);
                    setSelectedHotelForDetails(null);
                    handleEditHotel(hotel);
                  }}
                >
                  Edit
                </Button>
              </>
            )}
          </div>
        }
        width={860}
        centered
        destroyOnClose
      >
        {detailsLoading ? (
          <div className="hs-hi-details__loading">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : selectedHotelForDetails ? (
          <div className="hs-hi-details__body">
            <div className="hs-hi-details__hero">
              <div className="hs-hi-details__hero-main">
                <div className="hs-hi-details__status-row">
                  {getStatusTag(selectedHotelForDetails.status)}
                  <span className="hs-hi-details__id">
                    Hotel ID {selectedHotelForDetails.hotelID}
                  </span>
                </div>
                <h3 className="hs-hi-details__name">
                  {selectedHotelForDetails.hotelName}
                </h3>
                <p className="hs-hi-details__desc">
                  {selectedHotelForDetails.hotelDescription ||
                    "No description provided for this property."}
                </p>
              </div>
              {(selectedHotelForDetails.logo ||
                (selectedHotelForDetails.images &&
                  selectedHotelForDetails.images[0])) && (
                <div className="hs-hi-details__logo">
                  <Image
                    src={
                      selectedHotelForDetails.logo ||
                      selectedHotelForDetails.images[0]
                    }
                    alt="Hotel"
                    preview
                  />
                </div>
              )}
            </div>

            <div className="hs-hi__kpi-row hs-hi-details__kpis">
              <div className="hs-hi__kpi">
                <p className="hs-hi__kpi-label">Total rooms</p>
                <p className="hs-hi__kpi-value">
                  {selectedHotelForDetails.totalRooms ||
                    (selectedHotelForDetails.roomCategories || []).reduce(
                      (s, c) => s + (c.roomNumbers?.length || 0),
                      0
                    ) ||
                    0}
                </p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--soft">
                <p className="hs-hi__kpi-label">Available</p>
                <p className="hs-hi__kpi-value">
                  {selectedHotelForDetails.availableRooms ?? "—"}
                </p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--sand">
                <p className="hs-hi__kpi-label">Categories</p>
                <p className="hs-hi__kpi-value">
                  {(selectedHotelForDetails.roomCategories || []).length}
                </p>
              </div>
              <div className="hs-hi__kpi hs-hi__kpi--deep">
                <p className="hs-hi__kpi-label">Check-in / out</p>
                <p className="hs-hi__kpi-value hs-hi-details__kpi-time">
                  {selectedHotelForDetails.checkInTime || "14:00"} ·{" "}
                  {selectedHotelForDetails.checkOutTime || "11:00"}
                </p>
              </div>
            </div>

            <div className="hs-hi__attrs hs-hi-details__attrs">
              <div className="hs-hi__attr">
                <label>Address</label>
                <p>{addressLine(selectedHotelForDetails)}</p>
              </div>
              <div className="hs-hi__attr">
                <label>Contact</label>
                <p>
                  {[
                    selectedHotelForDetails.contact?.phone,
                    selectedHotelForDetails.contact?.email,
                    selectedHotelForDetails.contact?.website,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
            </div>

            {(selectedHotelForDetails.roomCategories || []).length > 0 && (
              <div className="hs-hi-details__section">
                <div className="hs-hi-details__section-head">
                  <h4>Room categories</h4>
                  <span>
                    {(selectedHotelForDetails.roomCategories || []).length} groups
                  </span>
                </div>
                <div className="hs-hi-details__cats">
                  {(selectedHotelForDetails.roomCategories || []).map((cat) => (
                    <div key={cat._id || cat.name} className="hs-hi-details__cat">
                      <div className="hs-hi-details__cat-top">
                        <strong>{cat.name}</strong>
                        {!cat.isActive && getStatusTag("inactive")}
                      </div>
                      <div className="hs-hi-details__cat-meta">
                        <span>{cat.roomNumbers?.length || 0} rooms</span>
                        <span>
                          ৳{Number(cat.basePrice || 0).toLocaleString()}
                        </span>
                        <span>
                          {cat.maxOccupancy?.adults || 0}A /{" "}
                          {cat.maxOccupancy?.children || 0}C
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(selectedHotelForDetails.termsAndConditions) &&
              selectedHotelForDetails.termsAndConditions.filter(Boolean).length >
                0 && (
                <div className="hs-hi-details__section">
                  <div className="hs-hi-details__section-head">
                    <h4>Terms & conditions</h4>
                  </div>
                  <ul className="hs-hi-details__terms">
                    {selectedHotelForDetails.termsAndConditions
                      .filter(Boolean)
                      .map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                  </ul>
                </div>
              )}

            {selectedHotelForDetails.images &&
              selectedHotelForDetails.images.length > 0 && (
                <div className="hs-hi-details__section">
                  <div className="hs-hi-details__section-head">
                    <h4>Gallery</h4>
                    <span>{selectedHotelForDetails.images.length} images</span>
                  </div>
                  <Image.PreviewGroup>
                    <div className="hs-hi-details__gallery">
                      {selectedHotelForDetails.images.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt={`Hotel ${index + 1}`}
                        />
                      ))}
                    </div>
                  </Image.PreviewGroup>
                </div>
              )}
          </div>
        ) : (
          <div className="hs-hi__empty">
            <p className="hs-hi__empty-title">No details available</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotelInformation;

