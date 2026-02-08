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
  Pagination,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Skeleton,
  Tooltip,
  Upload,
  Image,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import { uploadImageToImgbb } from "@/utils/imgbbUpload";
import { useSearchParams } from "next/navigation";

const Menu = () => {
  const searchParams = useSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch menu items from API - Get all menu items without hotel ID filtering
  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/restaurant/menu");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { menuItems: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const itemsData = responseData?.menuItems || 
                         (Array.isArray(responseData) ? responseData : []);
        
        setMenuItems(itemsData);
        setFilteredItems(itemsData);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      message.error(error.response?.data?.message || "Failed to fetch menu items.");
      setMenuItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories - Get all category IDs
  const fetchCategories = async () => {
    try {
      const response = await coreAxios.get("/restaurant/menu/categories");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { categoryIDs: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const categoryIDs = responseData?.categoryIDs || 
                           (Array.isArray(responseData) ? responseData : []);
        
        // Convert categoryIDs array to category objects for Select component
        const categoriesData = categoryIDs.map(catID => ({
          _id: catID,
          id: catID,
          categoryID: catID,
          name: catID,
          categoryName: catID
        }));
        
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = Array.isArray(menuItems) ? menuItems : [];
    
      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter((item) => {
          const name = (item.itemName || item.name || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          const category = (item.category || item.categoryName || "").toLowerCase();
          
          return (
            name.includes(searchLower) ||
            description.includes(searchLower) ||
            category.includes(searchLower)
          );
        });
      }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => 
        item.categoryID === selectedCategory || 
        item.category === selectedCategory
      );
    }
    
    setFilteredItems(filtered);
    setPagination({ ...pagination, current: 1 });
  }, [searchTerm, selectedCategory, menuItems]);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      // Ensure availability is one of the valid enum values
      let availability = values.availability;
      if (!availability || typeof availability !== "string") {
        availability = "available"; // Default value
      }
      
      // Validate availability value matches enum
      const validAvailabilityValues = ["available", "unavailable", "out_of_stock"];
      if (!validAvailabilityValues.includes(availability)) {
        availability = "available"; // Fallback to default
      }

      const menuItemData = {
        itemName: values.itemName || values.name,
        categoryID: values.categoryID,
        price: Number(values.price) || 0,
        availability: availability,
        description: values.description || "",
        image: values.image || "",
      };

      let response;
      if (editingItem) {
        // Update existing item - API expects: PUT /restaurant/menu/:id
        const itemId = editingItem.id || editingItem._id;
        response = await coreAxios.put(`/restaurant/menu/${itemId}`, menuItemData);
      } else {
        // Create new item - API expects: POST /restaurant/menu
        response = await coreAxios.post("/restaurant/menu", menuItemData);
      }

      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || 
          (editingItem ? "Menu item updated successfully!" : "Menu item created successfully!");
        message.success(successMsg);
        setVisible(false);
        setEditingItem(null);
        setImagePreview(null);
        form.resetFields();
        fetchMenuItems();
      }
    } catch (error) {
      console.error("Error saving menu item:", error);
      message.error(
        error.response?.data?.message || "Failed to save menu item."
      );
    }
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setImagePreview(item.image || null);
    
    // Ensure availability is a valid string value
    let availabilityValue = item.availability;
    if (typeof availabilityValue !== "string") {
      // Convert boolean to string if needed (for backward compatibility)
      if (typeof availabilityValue === "boolean") {
        availabilityValue = availabilityValue ? "available" : "unavailable";
      } else {
        availabilityValue = "available"; // Default value
      }
    }
    
    // Validate availability value matches enum
    const validAvailabilityValues = ["available", "unavailable", "out_of_stock"];
    if (!validAvailabilityValues.includes(availabilityValue)) {
      availabilityValue = "available"; // Fallback to default
    }
    
    form.setFieldsValue({
      itemName: item.itemName || item.name || "",
      categoryID: item.categoryID || item.category || "",
      price: item.price || 0,
      availability: availabilityValue,
      description: item.description || "",
      image: item.image || "",
    });
    setVisible(true);
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const imageUrl = await uploadImageToImgbb(file);
      if (imageUrl) {
        form.setFieldsValue({ image: imageUrl });
        setImagePreview(imageUrl);
        message.success("Image uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error(error.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  // Handle image removal
  const handleImageRemove = () => {
    form.setFieldsValue({ image: "" });
    setImagePreview(null);
  };

  // Handle delete (soft delete - sets statusID to 255)
  const handleDelete = async (itemId) => {
    try {
      const response = await coreAxios.delete(`/restaurant/menu/${itemId}`);
      
      if (response.status === 200) {
        const successMsg = response.data?.message || "Menu item deleted successfully!";
        message.success(successMsg);
        fetchMenuItems();
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      message.error(error.response?.data?.message || "Failed to delete menu item.");
    }
  };

  // Predefined Bangladeshi Hotel Menu Categories
  const predefinedCategories = [
    "Rice & Biryani",
    "Curry & Bhuna",
    "Fish Items",
    "Chicken Items",
    "Beef Items",
    "Mutton Items",
    "Vegetable Dishes",
    "Dal & Lentils",
    "Soup",
    "Salad",
    "Roti & Paratha",
    "Noodles & Pasta",
    "Fast Food",
    "Snacks",
    "Desserts",
    "Beverages",
    "Tea & Coffee",
    "Juice & Shake",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Special Items",
    "Combo Meals",
    "Tandoori",
    "Kebab",
    "Chinese",
    "Thai",
    "Continental",
    "Ice Cream",
    "Soft Drinks"
  ];

  // Get unique categories from menu items (for fallback if categories API fails)
  const uniqueCategories = [...new Set(menuItems.map(item => item.category || item.categoryName || item.categoryID).filter(Boolean))];
  
  // Combine predefined categories with API categories and unique categories from menu items
  const allCategories = [
    ...predefinedCategories.map(cat => ({
      _id: cat,
      id: cat,
      categoryID: cat,
      name: cat,
      categoryName: cat
    })),
    ...categories,
    ...uniqueCategories.filter(cat => !predefinedCategories.includes(cat)).map(cat => ({
      _id: cat,
      id: cat,
      categoryID: cat,
      name: cat,
      categoryName: cat
    }))
  ];
  
  // Remove duplicates based on categoryID
  const categoryOptions = Array.from(
    new Map(allCategories.map(cat => [cat.categoryID || cat.id || cat._id, cat])).values()
  );

  // Table columns
  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image) => (
        image ? (
          <Image
            src={image}
            alt="Menu item"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: "4px" }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )
      ),
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      width: 200,
      render: (text, record) => <span className="font-medium">{text || record.name || "N/A"}</span>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category, record) => {
        // Try to get category name from categories list or use categoryID
        const categoryName = category || record.categoryName || record.categoryID || "Uncategorized";
        return (
          <Tag color="green">{categoryName}</Tag>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 120,
      align: "right",
      render: (price) => (
        <span className="font-semibold text-green-600">
          ৳{Number(price || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "availability",
      key: "availability",
      width: 100,
      render: (availability) => {
        const isAvailable = typeof availability === "string" 
          ? availability.toLowerCase() === "available"
          : (availability !== false && availability !== "unavailable");
        return (
          <Tag color={isAvailable ? "green" : "red"}>
            {typeof availability === "string" 
              ? availability.charAt(0).toUpperCase() + availability.slice(1)
              : (isAvailable ? "Available" : "Unavailable")
            }
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
            <Popconfirm
            title="Are you sure to delete this menu item?"
            onConfirm={() => handleDelete(record.id || record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Paginate data
  const paginatedItems = filteredItems.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Menu Management</h1>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Search and Category Filter */}
              <div className="w-full sm:w-auto flex flex-row gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="flex-1 sm:flex-initial"
                  style={{ height: "40px", minWidth: "150px" }}
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                />
                <Select
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  allowClear
                  placeholder="Filter by category"
                  className="flex-1 sm:flex-initial"
                  style={{ height: "40px", minWidth: "150px" }}
                >
                  {categoryOptions.map((cat) => (
                    <Select.Option key={cat._id || cat.id || cat.categoryID || cat} value={cat._id || cat.id || cat.categoryID || cat}>
                      {cat.name || cat.categoryName || cat}
                    </Select.Option>
                  ))}
                </Select>
                {(searchTerm || selectedCategory) && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory(null);
                    }}
                    className="w-full sm:w-auto sm:flex-initial"
                    style={{ height: "40px" }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-2">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchMenuItems}
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
                    setEditingItem(null);
                    setImagePreview(null);
                    form.resetFields();
                    setVisible(true);
                  }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  style={{ height: "40px" }}
                >
                  <span className="hidden sm:inline">Add Menu Item</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results Count */}
          {filteredItems.length !== menuItems.length && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredItems.length} of {menuItems.length} menu items
            </div>
          )}
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={paginatedItems}
                  rowKey={(record) => record.id || record._id || record.menuItemID || Math.random()}
                  pagination={false}
                  scroll={{ x: 800 }}
                  size="small"
                />
                
                {/* Pagination */}
                {filteredItems.length > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50">
                    <div className="text-xs text-gray-700">
                      Showing {paginatedItems.length} of {filteredItems.length} menu items
                    </div>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={filteredItems.length}
                      onChange={(page, pageSize) =>
                        setPagination({ current: page, pageSize })
                      }
                      showSizeChanger
                      pageSizeOptions={['10', '20', '50', '100']}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Menu Item Modal */}
      <Modal
        title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setEditingItem(null);
          setImagePreview(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
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
                name="itemName"
                label="Item Name"
                rules={[{ required: true, message: "Please enter item name" }]}
              >
                <Input placeholder="Enter item name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="categoryID"
                label="Category"
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select
                  placeholder="Select category"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children || "").toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  notFoundContent={categoryOptions.length === 0 ? "No categories available" : "No matching categories found"}
                  loading={categories.length === 0 && menuItems.length > 0}
                >
                  {categoryOptions.map((cat) => (
                    <Select.Option key={cat._id || cat.id || cat.categoryID || cat} value={cat._id || cat.id || cat.categoryID || cat}>
                      {cat.name || cat.categoryName || cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Enter price"
                  min={0}
                  formatter={(value) => `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/৳\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="availability"
                label="Availability"
                rules={[{ required: true, message: "Please select availability" }]}
                initialValue="available"
              >
                <Select placeholder="Select availability">
                  <Select.Option value="available">Available</Select.Option>
                  <Select.Option value="unavailable">Unavailable</Select.Option>
                  <Select.Option value="out_of_stock">Out of Stock</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea
                  rows={4}
                  placeholder="Enter item description..."
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="image" label="Menu Item Image">
                <div className="space-y-3">
                  <Upload
                    name="image"
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                    accept="image/*"
                    disabled={uploading}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageRemove();
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            background: "rgba(255, 255, 255, 0.8)",
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        {uploading ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs text-gray-600">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <UploadOutlined className="text-2xl text-gray-400 mb-2" />
                            <span className="text-xs text-gray-600">Upload Image</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Upload>
                  <div className="text-xs text-gray-500">
                    Upload an image for this menu item. Supported formats: JPG, PNG, GIF
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              onClick={() => {
                setVisible(false);
                setEditingItem(null);
                setImagePreview(null);
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
              {editingItem ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Menu;
