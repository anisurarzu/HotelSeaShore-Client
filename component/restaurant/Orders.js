"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  message,
  Popconfirm,
  Form,
  Input,
  DatePicker,
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
  InputNumber,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [instantCreateVisible, setInstantCreateVisible] = useState(false);
  const [instantCreateForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [currentItemFieldIndex, setCurrentItemFieldIndex] = useState(null);
  const [taxType, setTaxType] = useState("fixed"); // "fixed" or "percentage"
  const [discountType, setDiscountType] = useState("fixed"); // "fixed" or "percentage"
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [form] = Form.useForm();

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/restaurant/order");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { orders: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const ordersData = responseData?.orders || 
                          (Array.isArray(responseData) ? responseData : []);
        
        // Sort by createdAt descending (most recent first)
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error(error.response?.data?.message || "Failed to fetch orders.");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const response = await coreAxios.get("/restaurant/tables");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { tables: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const tablesData = responseData?.tables || 
                          (Array.isArray(responseData) ? responseData : []);
        
        // Sort by table number
        const sortedTables = tablesData.sort((a, b) => {
          const numA = parseInt(a.tableNumber || 0);
          const numB = parseInt(b.tableNumber || 0);
          return numA - numB;
        });
        
        setTables(sortedTables);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      // Don't show error message, just log it
      setTables([]);
    }
  };

  // Fetch menu items from API
  const fetchMenuItems = async () => {
    try {
      const response = await coreAxios.get("/restaurant/menu");
      
      if (response.status === 200) {
        // API returns: { success: true, data: { menuItems: [...], count: number } }
        const responseData = response.data?.data || response.data;
        const itemsData = responseData?.menuItems || 
                         (Array.isArray(responseData) ? responseData : []);
        
        // Filter only available items and normalize IDs
        const availableItems = itemsData
          .filter(item => 
            item.availability === "available" && 
            (item.statusID === undefined || item.statusID !== 255)
          )
          .map(item => ({
            ...item,
            // Ensure we have a consistent ID field
            id: item.id || item._id,
            _id: item._id || item.id,
          }));
        
        // Sort by category and item name
        const sortedItems = availableItems.sort((a, b) => {
          const categoryCompare = (a.categoryID || "").localeCompare(b.categoryID || "");
          if (categoryCompare !== 0) return categoryCompare;
          return (a.itemName || "").localeCompare(b.itemName || "");
        });
        
        setMenuItems(sortedItems);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
      message.error("Failed to load menu items. Please refresh the page.");
      setMenuItems([]);
    }
  };

  // Fetch booking info by invoice number
  const fetchBookingByInvoiceNo = async (invoiceNo) => {
    if (!invoiceNo || invoiceNo.trim() === "") {
      return;
    }

    try {
      const response = await coreAxios.get(`/restaurant/booking/${invoiceNo.trim()}`);
      
      if (response.status === 200) {
        const responseData = response.data?.data || response.data;
        const bookings = responseData?.bookings || [];
        
        if (bookings.length > 0) {
          // Use the first booking's information
          const booking = bookings[0];
          form.setFieldsValue({
            customerName: booking.name || "",
            customerPhone: booking.phone || "",
          });
          message.success("Customer information loaded from booking");
        } else {
          message.warning("No booking found for this invoice number");
        }
      }
    } catch (error) {
      console.error("Error fetching booking info:", error);
      // Don't show error message, just log it - user can manually enter info
    }
  };

  // Predefined Bangladeshi Hotel Menu Categories (same as Menu.js)
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

  // Fetch categories for instant create
  const fetchCategories = async () => {
    try {
      const response = await coreAxios.get("/restaurant/menu/categories");
      if (response.status === 200) {
        const responseData = response.data?.data || response.data;
        const categoryIDs = responseData?.categoryIDs || 
                           (Array.isArray(responseData) ? responseData : []);
        
        // Get unique categories from menu items
        const uniqueCategories = [...new Set(menuItems.map(item => 
          item.category || item.categoryName || item.categoryID
        ).filter(Boolean))];
        
        // Combine predefined categories with API categories and unique categories from menu items
        const allCategories = [
          ...predefinedCategories,
          ...categoryIDs,
          ...uniqueCategories.filter(cat => 
            !predefinedCategories.includes(cat) && !categoryIDs.includes(cat)
          )
        ];
        
        // Remove duplicates
        const uniqueAllCategories = [...new Set(allCategories)];
        setCategories(uniqueAllCategories);
      } else {
        // Fallback: use predefined categories + unique from menu items
        const uniqueCategories = [...new Set(menuItems.map(item => 
          item.category || item.categoryName || item.categoryID
        ).filter(Boolean))];
        const allCategories = [
          ...predefinedCategories,
          ...uniqueCategories.filter(cat => !predefinedCategories.includes(cat))
        ];
        setCategories([...new Set(allCategories)]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback: use predefined categories + unique from menu items
      const uniqueCategories = [...new Set(menuItems.map(item => 
        item.category || item.categoryName || item.categoryID
      ).filter(Boolean))];
      const allCategories = [
        ...predefinedCategories,
        ...uniqueCategories.filter(cat => !predefinedCategories.includes(cat))
      ];
      setCategories([...new Set(allCategories)]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchMenuItems();
  }, []);

  // Update categories when menu items change
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchCategories();
    }
  }, [menuItems]);

  // Handle instant create menu item
  const handleInstantCreate = async (values) => {
    try {
      const menuItemData = {
        itemName: values.itemName,
        categoryID: values.categoryID,
        price: Number(values.price) || 0,
        availability: "available",
        description: values.description || "",
      };

      const response = await coreAxios.post("/restaurant/menu", menuItemData);

      if (response.status === 200 || response.status === 201) {
        message.success("Menu item created successfully!");
        setInstantCreateVisible(false);
        instantCreateForm.resetFields();
        
        // Get the new item data from response
        const newItem = response.data?.data || response.data;
        const newItemId = newItem?.id || newItem?._id || newItem?.id;
        
        // Add the new item to menuItems state immediately
        if (newItem) {
          const itemToAdd = {
            ...newItem,
            id: newItemId,
            _id: newItemId,
            itemName: values.itemName,
            categoryID: values.categoryID,
            price: Number(values.price) || 0,
          };
          setMenuItems(prev => [...prev, itemToAdd]);
        }
        
        // Also refresh menu items in background
        fetchMenuItems();
        
        return { id: newItemId, price: Number(values.price) || 0 };
      }
    } catch (error) {
      console.error("Error creating menu item:", error);
      message.error(error.response?.data?.message || "Failed to create menu item.");
      return null;
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = Array.isArray(orders) ? orders : [];
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const orderNumber = (order.orderNumber || order.invoiceNo || "").toLowerCase();
        const customerName = (order.customerName || "").toLowerCase();
        const tableNumber = (order.tableNumber || "").toLowerCase();
        const orderStatus = (order.orderStatus || "").toLowerCase();
        const paymentStatus = (order.paymentStatus || "").toLowerCase();
        
        return (
          orderNumber.includes(searchLower) ||
          customerName.includes(searchLower) ||
          tableNumber.includes(searchLower) ||
          orderStatus.includes(searchLower) ||
          paymentStatus.includes(searchLower)
        );
      });
    }
    
    // Apply date filter
    if (selectedDate) {
      const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      filtered = filtered.filter((order) => {
        if (!order.createdAt) return false;
        const orderDateStr = dayjs(order.createdAt).format("YYYY-MM-DD");
        return orderDateStr === selectedDateStr;
      });
    }
    
    setFilteredOrders(filtered);
    setPagination({ ...pagination, current: 1 });
  }, [searchTerm, selectedDate, orders]);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      // Validate items
      if (!values.items || !Array.isArray(values.items) || values.items.length === 0) {
        message.error("Please add at least one menu item");
        return;
      }

      // Validate each item has menuItemId and quantity
      const invalidItems = values.items.filter(item => !item.menuItemId || !item.quantity);
      if (invalidItems.length > 0) {
        message.error("Please complete all item selections and quantities");
        return;
      }

      // Build items array - expand items based on quantity
      // If quantity is 2, add the itemId twice to the array
      const items = [];
      values.items.forEach(item => {
        const quantity = Number(item.quantity) || 1;
        for (let i = 0; i < quantity; i++) {
          items.push(item.menuItemId);
        }
      });

      // Calculate actual tax and discount amounts
      const subtotal = values.subtotal || 0;
      const taxValue = values.tax || 0;
      const discountValue = values.discount || 0;
      
      let taxAmount = 0;
      if (taxType === "percentage") {
        taxAmount = (subtotal * Number(taxValue)) / 100;
      } else {
        taxAmount = Number(taxValue);
      }
      
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = (subtotal * Number(discountValue)) / 100;
      } else {
        discountAmount = Number(discountValue);
      }

      const orderData = {
        invoiceNo: values.invoiceNo || "",
        customerName: values.customerName,
        customerPhone: values.customerPhone || "",
        tableNumber: values.tableNumber || "",
        orderType: values.orderType || "dine_in",
        items: items, // Array of menu item IDs (ObjectIds) - quantity is represented by duplicates
        tax: taxAmount,
        discount: discountAmount,
        paymentStatus: values.paymentStatus || "pending",
        paymentMethod: values.paymentMethod || "",
        transactionID: values.transactionID || "",
        orderStatus: values.orderStatus || "pending",
        notes: values.notes || "",
      };

      let response;
      if (editingOrder) {
        // Update existing order - API expects: PUT /restaurant/order/:id
        const itemId = editingOrder.id || editingOrder._id;
        response = await coreAxios.put(`/restaurant/order/${itemId}`, orderData);
      } else {
        // Create new order - API expects: POST /restaurant/order
        response = await coreAxios.post("/restaurant/order", orderData);
      }

      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || 
          (editingOrder ? "Order updated successfully!" : "Order created successfully!");
        message.success(successMsg);
        setVisible(false);
        setEditingOrder(null);
        setTaxType("fixed");
        setDiscountType("fixed");
        form.resetFields();
        fetchOrders();
      }
    } catch (error) {
      console.error("Error saving order:", error);
      message.error(
        error.response?.data?.message || "Failed to save order."
      );
    }
  };

  // Handle edit
  const handleEdit = (order) => {
    setEditingOrder(order);
    
    // Transform items to form format: [{ menuItemId, quantity }]
    // Items from backend are array of IDs (ObjectIds), so we need to group by ID and count
    const itemsArray = order.items || [];
    const itemsMap = new Map();
    
    itemsArray.forEach(item => {
      // Extract the ID - could be ObjectId, string, or object
      let itemId;
      if (typeof item === 'object' && item !== null) {
        if (item.menuItemId) {
          itemId = item.menuItemId.id || item.menuItemId._id || item.menuItemId;
        } else {
          itemId = item.id || item._id || item;
        }
      } else {
        itemId = item;
      }
      
      // Convert to string for consistent comparison
      const idStr = String(itemId);
      
      // Count occurrences (quantity)
      if (itemsMap.has(idStr)) {
        itemsMap.set(idStr, itemsMap.get(idStr) + 1);
      } else {
        itemsMap.set(idStr, 1);
      }
    });
    
    // Convert map to array format for form
    const formattedItems = Array.from(itemsMap.entries()).map(([menuItemId, quantity]) => ({
      menuItemId: menuItemId,
      quantity: quantity,
    }));
    
    // Determine if tax/discount were percentages (if tax/discount is less than subtotal, likely percentage)
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const discount = order.discount || 0;
    
    // Check if tax might be percentage (if tax is reasonable percentage of subtotal)
    // We'll default to fixed, but user can change
    setTaxType("fixed");
    setDiscountType("fixed");
    
    form.setFieldsValue({
      invoiceNo: order.invoiceNo || "",
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      tableNumber: order.tableNumber || "",
      orderType: order.orderType || "dine_in",
      items: formattedItems, // Array of objects with menuItemId and quantity
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      total: order.total || 0,
      paymentStatus: order.paymentStatus || "pending",
      paymentMethod: order.paymentMethod || "",
      transactionID: order.transactionID || "",
      orderStatus: order.orderStatus || "pending",
      notes: order.notes || "",
    });
    setVisible(true);
  };

  // Handle delete
  const handleDelete = async (orderId) => {
    try {
      const response = await coreAxios.delete(`/restaurant/order/${orderId}`);
      
      if (response.status === 200) {
        const successMsg = response.data?.message || "Order deleted successfully!";
        message.success(successMsg);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      message.error(error.response?.data?.message || "Failed to delete order.");
    }
  };

  // Get order status color
  const getOrderStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "pending") return "orange";
    if (statusLower === "confirmed" || statusLower === "confirm") return "blue";
    return "default";
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "paid") return "green";
    if (statusLower === "pending") return "orange";
    if (statusLower === "partially_paid") return "blue";
    return "default";
  };

  // Calculate totals with percentage/fixed support - instant calculation
  const calculateTotals = () => {
    const subtotal = Number(form.getFieldValue('subtotal') || 0);
    const taxValue = Number(form.getFieldValue('tax') || 0);
    const discountValue = Number(form.getFieldValue('discount') || 0);
    
    // Calculate tax amount
    let taxAmount = 0;
    if (taxType === "percentage") {
      // If percentage: calculate percentage of subtotal
      // Example: 5% of 1000 = 50
      taxAmount = (subtotal * taxValue) / 100;
    } else {
      // If fixed: use the value directly
      taxAmount = taxValue;
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === "percentage") {
      // If percentage: calculate percentage of subtotal
      // Example: 5% of 1000 = 50
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      // If fixed: use the value directly
      discountAmount = discountValue;
    }
    
    const total = subtotal + taxAmount - discountAmount;
    form.setFieldsValue({ total: total > 0 ? total : 0 });
  };

  // Handle invoice view
  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setInvoiceVisible(true);
  };

  // Process order items for invoice display
  const processOrderItems = (order) => {
    if (!order || !order.items) return [];
    
    const itemsArray = order.items || [];
    const itemsMap = new Map();
    
    itemsArray.forEach(item => {
      let itemId;
      let itemData = null;
      
      // Extract the ID and item data
      if (typeof item === 'object' && item !== null) {
        if (item.menuItemId) {
          itemId = item.menuItemId.id || item.menuItemId._id || item.menuItemId;
          itemData = typeof item.menuItemId === 'object' ? item.menuItemId : null;
        } else {
          itemId = item.id || item._id || item;
          itemData = item;
        }
      } else {
        itemId = item;
      }
      
      // Find menu item details
      const menuItem = menuItems.find(m => 
        (m.id || m._id) === String(itemId)
      );
      
      const idStr = String(itemId);
      
      if (itemsMap.has(idStr)) {
        const existing = itemsMap.get(idStr);
        itemsMap.set(idStr, {
          ...existing,
          quantity: existing.quantity + 1,
        });
      } else {
        itemsMap.set(idStr, {
          id: idStr,
          name: menuItem?.itemName || itemData?.itemName || "Unknown Item",
          price: menuItem?.price || itemData?.price || 0,
          quantity: 1,
        });
      }
    });
    
    return Array.from(itemsMap.values());
  };

  // Print invoice
  const handlePrintInvoice = () => {
    const printContent = document.getElementById("invoice-content");
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${selectedOrder?.orderNumber || selectedOrder?.invoiceNo || "Order"}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0.5in;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            ${printContent.innerHTML.includes('<style>') ? '' : ''}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download invoice as PDF
  const handleDownloadInvoice = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const options = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Invoice-${selectedOrder?.orderNumber || selectedOrder?.invoiceNo || "Order"}-${moment().format("YYYYMMDD")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          backgroundColor: "#FFFFFF"
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };
      
      html2pdf().set(options).from(element).save();
      message.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to download invoice. Please try again.");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Order No.",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 140,
      render: (text, record) => (
        <span className="font-medium text-blue-600">
          {text || record.invoiceNo || "N/A"}
        </span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "Table No.",
      dataIndex: "tableNumber",
      key: "tableNumber",
      width: 100,
      render: (text) => text || "N/A",
    },
    {
      title: "Order Type",
      dataIndex: "orderType",
      key: "orderType",
      width: 100,
      render: (type) => {
        const typeMap = {
          dine_in: "Dine In",
          room_delivery: "Room Delivery"
        };
        return typeMap[type] || type || "N/A";
      },
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      width: 80,
      render: (items) => items ? items.length : 0,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 120,
      align: "right",
      render: (amount) => (
        <span className="font-semibold text-green-600">
          ৳{Number(amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 120,
      render: (status) => (
        <Tag color={getOrderStatusColor(status)}>
          {(status || "Pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      width: 120,
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {(status || "Pending").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => date ? moment(date).format("D MMM YY") : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Invoice">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => handleViewInvoice(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this order?"
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
  const paginatedOrders = filteredOrders.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Orders</h1>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Search and Date Filter */}
              <div className="w-full sm:w-auto flex flex-row gap-2 flex-wrap sm:flex-nowrap">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="flex-1 sm:flex-initial"
                  style={{ height: "40px", minWidth: "150px" }}
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                />
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  format="MMM D, YYYY"
                  allowClear
                  placeholder="Order Date"
                  className="flex-1 sm:flex-initial"
                  style={{ height: "40px", minWidth: "130px", width: "130px" }}
                />
                {(searchTerm || selectedDate) && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDate(null);
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
                  onClick={fetchOrders}
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
                    setEditingOrder(null);
                    setTaxType("fixed");
                    setDiscountType("fixed");
                    form.resetFields();
                    setVisible(true);
                  }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  style={{ height: "40px" }}
                >
                  <span className="hidden sm:inline">Create Order</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Results Count */}
          {filteredOrders.length !== orders.length && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          )}
        </div>

        {/* Orders Table */}
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
                  dataSource={paginatedOrders}
                  rowKey={(record) => record.id || record._id || Math.random()}
                  pagination={false}
                  scroll={{ x: 1200 }}
                  size="small"
                />
                
                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50">
                    <div className="text-xs text-gray-700">
                      Showing {paginatedOrders.length} of {filteredOrders.length} orders
                    </div>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={filteredOrders.length}
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

      {/* Create/Edit Order Modal */}
      <Modal
        title={editingOrder ? "Edit Order" : "Create New Order"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setEditingOrder(null);
          setTaxType("fixed");
          setDiscountType("fixed");
          form.resetFields();
        }}
        afterOpenChange={(open) => {
          if (open) {
            // Refresh menu items when modal opens
            fetchMenuItems();
          }
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 800 }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues, allValues) => {
            // Recalculate totals instantly when subtotal, tax, or discount changes
            if ('subtotal' in changedValues || 'tax' in changedValues || 'discount' in changedValues) {
              calculateTotals();
            }
          }}
          initialValues={{
            orderType: "dine_in",
            orderStatus: "pending",
            paymentStatus: "pending",
            items: [],
            tax: 0,
            discount: 0,
            subtotal: 0,
            total: 0,
          }}
        >
          <Row gutter={[12, 12]}>
            {/* Invoice No */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="invoiceNo"
                label="Invoice No."
              >
                <Input 
                  placeholder="Invoice number (optional)"
                  onBlur={(e) => {
                    const invoiceNo = e.target.value;
                    if (invoiceNo && invoiceNo.trim()) {
                      fetchBookingByInvoiceNo(invoiceNo);
                    }
                  }}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Customer Name */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Customer name" />
              </Form.Item>
            </Col>

            {/* Customer Phone */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="customerPhone"
                label="Phone"
              >
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>

            {/* Table Number */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="tableNumber"
                label="Table"
              >
                <Select 
                  placeholder="Select table"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children || "").toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {tables.map((table) => (
                    <Select.Option 
                      key={table.id || table._id} 
                      value={table.tableNumber}
                    >
                      Table {table.tableNumber}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Order Type */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="orderType"
                label="Order Type"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="dine_in">Dine In</Select.Option>
                  <Select.Option value="room_delivery">Room Delivery</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Menu Items */}
            <Col xs={24}>
              <Form.Item label="Menu Items" required>
                <Form.List name="items" rules={[{ validator: async (_, items) => {
                  if (!items || items.length === 0) {
                    return Promise.reject(new Error("Add at least one item"));
                  }
                }}]}>
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => {
                        const itemValue = form.getFieldValue(['items', name]);
                        const selectedMenuItem = menuItems.find(item => 
                          (item.id || item._id) === itemValue?.menuItemId
                        );
                        const quantity = itemValue?.quantity || 1;
                        const price = selectedMenuItem ? Number(selectedMenuItem.price || 0) : (itemValue?.price || 0);
                        const itemSubtotal = quantity * price;

                        return (
                          <Row key={key} gutter={8} align="middle" className="mb-2">
                            <Col xs={24} sm={12} md={10}>
                              <Form.Item
                                {...restField}
                                name={[name, 'menuItemId']}
                                rules={[{ required: true, message: "Select item" }]}
                              >
                                <Select
                                  placeholder="Select menu item"
                                  showSearch
                                  optionFilterProp="children"
                                  filterOption={(input, option) =>
                                    (option?.children || "").toLowerCase().indexOf(input.toLowerCase()) >= 0
                                  }
                                  dropdownRender={(menu) => (
                                    <>
                                      {menu}
                                      <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                                        <Button
                                          type="link"
                                          icon={<PlusOutlined />}
                                          onClick={() => {
                                            setCurrentItemFieldIndex(name);
                                            setInstantCreateVisible(true);
                                          }}
                                          style={{ width: '100%' }}
                                        >
                                          Instant Create New Item
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                  onChange={(value) => {
                                    const menuItem = menuItems.find(item => 
                                      (item.id || item._id) === value
                                    );
                                    if (menuItem) {
                                      const currentItems = form.getFieldValue('items') || [];
                                      const updatedItems = currentItems.map((item, idx) => 
                                        idx === name 
                                          ? { 
                                              ...item, 
                                              menuItemId: value, 
                                              quantity: item.quantity || 1,
                                              price: menuItem.price
                                            }
                                          : item
                                      );
                                      form.setFieldsValue({ items: updatedItems });
                                      
                                      // Recalculate totals
                                      let subtotal = 0;
                                      updatedItems.forEach((item, idx) => {
                                        const menuItem = menuItems.find(m => 
                                          (m.id || m._id) === item.menuItemId
                                        );
                                        if (menuItem) {
                                          subtotal += (item.quantity || 1) * Number(menuItem.price || 0);
                                        }
                                      });
                                      form.setFieldsValue({ subtotal });
                                      calculateTotals();
                                    }
                                  }}
                                  notFoundContent={menuItems.length === 0 ? "Loading..." : "No items"}
                                >
                                  {menuItems.map((item) => (
                                    <Select.Option 
                                      key={item.id || item._id} 
                                      value={item.id || item._id}
                                    >
                                      {item.itemName} {item.categoryID ? `(${item.categoryID})` : ''} - ৳{Number(item.price || 0).toLocaleString()}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xs={12} sm={6} md={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'quantity']}
                                rules={[{ required: true, message: "Qty" }]}
                              >
                                <InputNumber
                                  min={1}
                                  placeholder="Qty"
                                  style={{ width: '100%' }}
                                  onChange={(value) => {
                                    const currentItems = form.getFieldValue('items') || [];
                                    const updatedItems = currentItems.map((item, idx) => 
                                      idx === name ? { ...item, quantity: value || 1 } : item
                                    );
                                    form.setFieldsValue({ items: updatedItems });
                                    
                                    // Recalculate totals
                                    let subtotal = 0;
                                    updatedItems.forEach((item) => {
                                      const menuItem = menuItems.find(m => 
                                        (m.id || m._id) === item.menuItemId
                                      );
                                      if (menuItem) {
                                        subtotal += (item.quantity || 1) * Number(menuItem.price || 0);
                                      }
                                    });
                                    form.setFieldsValue({ subtotal });
                                    calculateTotals();
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={8} sm={4} md={4}>
                              <div className="text-sm font-semibold text-gray-600">
                                ৳{itemSubtotal.toLocaleString()}
                              </div>
                            </Col>
                            <Col xs={4} sm={2} md={2}>
                              <Button
                                type="link"
                                danger
                                onClick={() => {
                                  remove(name);
                                  // Recalculate totals after removal
                                  const currentItems = form.getFieldValue('items') || [];
                                  let subtotal = 0;
                                  currentItems.forEach((item, idx) => {
                                    if (idx !== name) {
                                      const menuItem = menuItems.find(m => 
                                        (m.id || m._id) === item.menuItemId
                                      );
                                      if (menuItem) {
                                        subtotal += (item.quantity || 1) * Number(menuItem.price || 0);
                                      }
                                    }
                                  });
                                  form.setFieldsValue({ subtotal });
                                  calculateTotals();
                                }}
                                icon={<DeleteOutlined />}
                              />
                            </Col>
                          </Row>
                        );
                      })}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add({ menuItemId: undefined, quantity: 1 })}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add Item
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>

            {/* Amounts */}
            <Col xs={12} sm={6}>
              <Form.Item name="subtotal" label="Subtotal">
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                  readOnly
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="tax" 
                label="Vat/Tax"
                help={taxType === "percentage" ? "Enter percentage (e.g., 5 for 5%)" : "Enter fixed amount"}
              >
                <Input.Group compact>
                  <Select
                    value={taxType}
                    onChange={(value) => {
                      setTaxType(value);
                      // Reset tax value when switching types
                      form.setFieldsValue({ tax: 0 });
                      calculateTotals();
                    }}
                    style={{ width: '30%' }}
                  >
                    <Select.Option value="fixed">৳ Fixed</Select.Option>
                    <Select.Option value="percentage">% Percentage</Select.Option>
                  </Select>
                  <InputNumber
                    min={0}
                    max={taxType === "percentage" ? 100 : undefined}
                    placeholder={taxType === "percentage" ? "5" : "0"}
                    style={{ width: '70%' }}
                    formatter={taxType === "percentage" ? (value) => `${value}%` : (value) => `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={taxType === "percentage" ? (value) => value.replace('%', '') : (value) => value.replace(/৳\s?|(,*)/g, '')}
                    onChange={(value) => {
                      form.setFieldsValue({ tax: value || 0 });
                      calculateTotals();
                    }}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item 
                name="discount" 
                label="Discount"
                help={discountType === "percentage" ? "Enter percentage (e.g., 5 for 5%)" : "Enter fixed amount"}
              >
                <Input.Group compact>
                  <Select
                    value={discountType}
                    onChange={(value) => {
                      setDiscountType(value);
                      // Reset discount value when switching types
                      form.setFieldsValue({ discount: 0 });
                      calculateTotals();
                    }}
                    style={{ width: '30%' }}
                  >
                    <Select.Option value="fixed">৳ Fixed</Select.Option>
                    <Select.Option value="percentage">% Percentage</Select.Option>
                  </Select>
                  <InputNumber
                    min={0}
                    max={discountType === "percentage" ? 100 : undefined}
                    placeholder={discountType === "percentage" ? "5" : "0"}
                    style={{ width: '70%' }}
                    formatter={discountType === "percentage" ? (value) => `${value}%` : (value) => `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={discountType === "percentage" ? (value) => value.replace('%', '') : (value) => value.replace(/৳\s?|(,*)/g, '')}
                    onChange={(value) => {
                      form.setFieldsValue({ discount: value || 0 });
                      calculateTotals();
                    }}
                  />
                </Input.Group>
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="total" label="Total">
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                  readOnly
                />
              </Form.Item>
            </Col>

            {/* Status Fields */}
            <Col xs={24} sm={8}>
              <Form.Item name="paymentStatus" label="Payment Status">
                <Select placeholder="Payment status">
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="paid">Paid</Select.Option>
                  <Select.Option value="partially_paid">Partially Paid</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="paymentMethod" label="Payment Method">
                <Select placeholder="Payment method" allowClear>
                  <Select.Option value="cash">Cash</Select.Option>
                  <Select.Option value="bkash">Bkash</Select.Option>
                  <Select.Option value="nagad">Nagad</Select.Option>
                  <Select.Option value="bank">Bank</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="orderStatus" label="Order Status">
                <Select placeholder="Order status">
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="confirmed">Confirm</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Transaction ID */}
            <Col xs={24} sm={8}>
              <Form.Item name="transactionID" label="Transaction ID">
                <Input placeholder="Transaction ID (optional)" allowClear />
              </Form.Item>
            </Col>

            {/* Notes */}
            <Col xs={24}>
              <Form.Item name="notes" label="Notes">
                <Input.TextArea
                  rows={2}
                  placeholder="Additional notes (optional)"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              onClick={() => {
                setVisible(false);
                setEditingOrder(null);
                setTaxType("fixed");
                setDiscountType("fixed");
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
              {editingOrder ? "Update Order" : "Create Order"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>Invoice</span>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrintInvoice}
              >
                Print
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadInvoice}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Download PDF
              </Button>
            </Space>
          </div>
        }
        open={invoiceVisible}
        onCancel={() => {
          setInvoiceVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 900 }}
        destroyOnClose
      >
        {selectedOrder && (
          <div 
            id="invoice-content" 
            className="bg-white p-6"
            style={{
              fontFamily: 'Arial, sans-serif',
              color: '#1f2937',
              maxWidth: '100%'
            }}
          >
            <style>{`
              @media print {
                .no-print {
                  display: none !important;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                #invoice-content {
                  padding: 20px !important;
                }
              }
              #invoice-content table {
                width: 100%;
                border-collapse: collapse;
              }
              #invoice-content th,
              #invoice-content td {
                border: 1px solid #d1d5db;
                padding: 8px 16px;
              }
            `}</style>
            
            {/* Invoice Header */}
            <div className="mb-6">
              {/* Logo and Header Section */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-300">
                <div className="flex items-center gap-4">
                  <img 
                    src="https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg" 
                    alt="Hotel Sea Shore Logo" 
                    style={{ 
                      height: '80px', 
                      width: 'auto', 
                      objectFit: 'contain',
                      maxWidth: '200px'
                    }}
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">INVOICE</h1>
                    <p className="text-sm text-gray-600 font-medium">Hotel Sea Shore Restaurant</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Invoice No:</strong> {selectedOrder.orderNumber || selectedOrder.invoiceNo || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Date:</strong> {moment(selectedOrder.createdAt).format("DD MMM YYYY")}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Time:</strong> {moment(selectedOrder.createdAt).format("hh:mm A")}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6 grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Bill To:</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{selectedOrder.customerName || "N/A"}</p>
                  {selectedOrder.customerPhone && (
                    <p>Phone: {selectedOrder.customerPhone}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Order Details:</h3>
                <div className="text-sm text-gray-600">
                  {selectedOrder.tableNumber && (
                    <p>Table: {selectedOrder.tableNumber}</p>
                  )}
                  <p>Type: {(selectedOrder.orderType === "room_delivery" ? "Room Delivery" : "Dine In")}</p>
                  <p>Status: <span className="font-medium">{(selectedOrder.orderStatus === "confirmed" ? "Confirm" : "Pending").toUpperCase()}</span></p>
                  <p>Payment: <span className="font-medium">{(selectedOrder.paymentStatus || "pending").replace("_", " ").toUpperCase()}</span></p>
                  {selectedOrder.transactionID && (
                    <p>Transaction ID: <span className="font-medium">{selectedOrder.transactionID}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>#</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Item</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Qty</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Unit Price</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {processOrderItems(selectedOrder).map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px 16px', fontSize: '14px', color: '#374151' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px 16px', fontSize: '14px', color: '#374151' }}>{item.name}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px 16px', fontSize: '14px', color: '#374151', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px 16px', fontSize: '14px', color: '#374151', textAlign: 'right' }}>৳{Number(item.price).toLocaleString()}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '10px 16px', fontSize: '14px', color: '#374151', textAlign: 'right', fontWeight: '500' }}>৳{(item.quantity * Number(item.price)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mb-6 flex justify-end">
              <div className="w-full md:w-1/2">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-800 font-medium">৳{Number(selectedOrder.subtotal || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-800 font-medium">৳{Number(selectedOrder.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-gray-800 font-medium text-red-600">-৳{Number(selectedOrder.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-2">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-emerald-600">৳{Number(selectedOrder.total || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.paymentMethod && (
                  <div className="flex justify-between py-2 text-sm mt-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-800 font-medium">{(selectedOrder.paymentMethod || "").charAt(0).toUpperCase() + (selectedOrder.paymentMethod || "").slice(1)}</span>
                  </div>
                )}
                {selectedOrder.transactionID && (
                  <div className="flex justify-between py-2 text-sm mt-2">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="text-gray-800 font-medium">{selectedOrder.transactionID}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="mb-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-1">Hotel Sea Shore Restaurant</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Instant Create Menu Item Modal */}
      <Modal
        title="Instant Create Menu Item"
        open={instantCreateVisible}
        onCancel={() => {
          setInstantCreateVisible(false);
          setCurrentItemFieldIndex(null);
          instantCreateForm.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={instantCreateForm}
          layout="vertical"
          onFinish={async (values) => {
            const result = await handleInstantCreate(values);
            if (result && result.id) {
              const newItemId = result.id;
              const newItemPrice = result.price;
              
              // Get current items from form
              const currentItems = form.getFieldValue('items') || [];
              
              // Update the current field with the new item
              if (currentItemFieldIndex !== null && currentItemFieldIndex !== undefined) {
                const updatedItems = currentItems.map((item, idx) => 
                  idx === currentItemFieldIndex 
                    ? { ...item, menuItemId: newItemId, quantity: item.quantity || 1 }
                    : item
                );
                form.setFieldsValue({ items: updatedItems });
                
                // Recalculate totals
                let subtotal = 0;
                updatedItems.forEach((item) => {
                  const menuItem = menuItems.find(m => 
                    (m.id || m._id) === item.menuItemId
                  );
                  if (menuItem) {
                    subtotal += (item.quantity || 1) * Number(menuItem.price || 0);
                  } else if (item.menuItemId === newItemId) {
                    // Use the price from the newly created item
                    subtotal += (item.quantity || 1) * newItemPrice;
                  }
                });
                form.setFieldsValue({ subtotal });
                calculateTotals();
              } else {
                // Add as new item if no field index
                const newItems = [...currentItems, { menuItemId: newItemId, quantity: 1 }];
                form.setFieldsValue({ items: newItems });
                
                // Recalculate totals
                let subtotal = 0;
                newItems.forEach((item) => {
                  const menuItem = menuItems.find(m => 
                    (m.id || m._id) === item.menuItemId
                  );
                  if (menuItem) {
                    subtotal += (item.quantity || 1) * Number(menuItem.price || 0);
                  } else if (item.menuItemId === newItemId) {
                    subtotal += (item.quantity || 1) * newItemPrice;
                  }
                });
                form.setFieldsValue({ subtotal });
                calculateTotals();
              }
              
              setCurrentItemFieldIndex(null);
            }
          }}
          initialValues={{
            availability: "available",
            price: 0,
          }}
        >
          <Form.Item
            name="itemName"
            label="Item Name"
            rules={[{ required: true, message: "Item name is required" }]}
          >
            <Input placeholder="Enter item name" />
          </Form.Item>

          <Form.Item
            name="categoryID"
            label="Category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Select 
              placeholder="Select or enter category"
              showSearch
              allowClear
              mode={undefined}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children || "").toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  {cat}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[
              { required: true, message: "Price is required" },
              { type: "number", min: 0, message: "Price must be greater than 0" }
            ]}
          >
            <InputNumber
              min={0}
              placeholder="Enter price"
              style={{ width: '100%' }}
              formatter={(value) => `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/৳\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter description (optional)"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              onClick={() => {
                setInstantCreateVisible(false);
                setCurrentItemFieldIndex(null);
                instantCreateForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create & Add to Order
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
