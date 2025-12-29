"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Table,
  Spin,
  Alert,
  Select,
  Input,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const CustomCalendar = ({ hotelID }) => {
  const [hotelData, setHotelData] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [editingCell, setEditingCell] = useState(null);
  const [bookingData, setBookingData] = useState({});
  const [roomList, setRoomList] = useState([]);
  const [numberOfDays, setNumberOfDays] = useState(7);

  useEffect(() => {
    fetchHotelInformation();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      loadRoomsForHotel();
    }
  }, [selectedHotel, hotelData]);

  const fetchHotelInformation = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      const mockHotels = [
        {
          hotelID: 1,
          hotelName: "Samudra Bari",
          roomCategories: [
            {
              name: "Standard",
              roomNumbers: [
                { name: "C1-3B", bookedDates: [], bookings: [] },
                { name: "F1-3B", bookedDates: [], bookings: [] },
                { name: "G1-3B", bookedDates: [], bookings: [] },
              ],
            },
          ],
        },
      ];

      setHotelData(mockHotels);
      if (mockHotels.length > 0) {
        setSelectedHotel(mockHotels[0].hotelName);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      message.error("Failed to fetch hotel information.");
    }
  };

  const loadRoomsForHotel = () => {
    const hotel = hotelData.find((h) => h.hotelName === selectedHotel);
    if (hotel) {
      const rooms = [];
      hotel.roomCategories.forEach((category) => {
        category.roomNumbers.forEach((room) => {
          rooms.push({
            key: room.name,
            flatNo: room.name,
            category: category.name,
            totalBooked: 0,
          });
        });
      });
      setRoomList(rooms);
    }
  };

  const handleHotelChange = (hotel) => {
    setSelectedHotel(hotel);
    setBookingData({});
  };

  const goToNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const goToPrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const goToToday = () => {
    setCurrentMonth(dayjs().startOf("month"));
  };

  // Generate array of dates to display
  const generateDateColumns = () => {
    const today = dayjs();
    const dates = [];
    for (let i = 0; i < numberOfDays; i++) {
      dates.push(currentMonth.add(i, "day"));
    }
    return dates;
  };

  const handleCellEdit = (roomKey, dateStr, value) => {
    setBookingData((prev) => ({
      ...prev,
      [`${roomKey}-${dateStr}`]: value,
    }));
  };

  const handleCellClick = (roomKey, dateStr) => {
    setEditingCell(`${roomKey}-${dateStr}`);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const getCellValue = (roomKey, dateStr) => {
    return bookingData[`${roomKey}-${dateStr}`] || "";
  };

  const getCellColor = (value) => {
    if (!value) return "#ffffff";
    if (value.toLowerCase().includes("owner")) return "#00FFFF";
    if (value.toLowerCase().includes("othol") || value.toLowerCase().includes("ftb")) return "#90EE90";
    return "#FFD700";
  };

  const calculateTotalBooked = (roomKey) => {
    const dates = generateDateColumns();
    let count = 0;
    dates.forEach((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const value = getCellValue(roomKey, dateStr);
      if (value && value.trim() !== "") {
        count++;
      }
    });
    return count;
  };

  const calculateDayTotal = (dateStr) => {
    let count = 0;
    roomList.forEach((room) => {
      const value = getCellValue(room.key, dateStr);
      if (value && value.trim() !== "") {
        count++;
      }
    });
    return count;
  };

  const calculateGrandTotal = () => {
    let total = 0;
    const dates = generateDateColumns();
    roomList.forEach((room) => {
      dates.forEach((date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const value = getCellValue(room.key, dateStr);
        if (value && value.trim() !== "") {
          total++;
        }
      });
    });
    return total;
  };

  const addNewRoom = () => {
    const newRoomNumber = `R${roomList.length + 1}`;
    setRoomList([
      ...roomList,
      {
        key: newRoomNumber,
        flatNo: newRoomNumber,
        category: "Standard",
        totalBooked: 0,
      },
    ]);
    message.success("New room added!");
  };

  const deleteRoom = (roomKey) => {
    setRoomList(roomList.filter((room) => room.key !== roomKey));
    // Clean up booking data for this room
    const newBookingData = { ...bookingData };
    Object.keys(newBookingData).forEach((key) => {
      if (key.startsWith(`${roomKey}-`)) {
        delete newBookingData[key];
      }
    });
    setBookingData(newBookingData);
    message.success("Room deleted!");
  };

  const columns = [
    {
      title: "Flat No.",
      dataIndex: "flatNo",
      key: "flatNo",
      fixed: "left",
      width: 100,
      render: (text, record) => (
        <div className="flex items-center justify-between">
          <span className="font-semibold">{text}</span>
          <Popconfirm
            title="Delete this room?"
            onConfirm={() => deleteRoom(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined className="text-red-500 cursor-pointer ml-2" />
          </Popconfirm>
        </div>
      ),
    },
    ...generateDateColumns().map((date) => ({
      title: (
        <div className="text-center">
          <div className="font-bold">{date.format("D")}</div>
          <div className="text-xs">{date.format("ddd, MMM D, YY")}</div>
        </div>
      ),
      dataIndex: date.format("YYYY-MM-DD"),
      key: date.format("YYYY-MM-DD"),
      width: 180,
      render: (_, record) => {
        const dateStr = date.format("YYYY-MM-DD");
        const cellKey = `${record.key}-${dateStr}`;
        const value = getCellValue(record.key, dateStr);
        const isEditing = editingCell === cellKey;

        return (
          <div
            style={{
              backgroundColor: getCellColor(value),
              padding: "4px",
              minHeight: "50px",
              cursor: "pointer",
              border: isEditing ? "2px solid #1890ff" : "1px solid #d9d9d9",
            }}
            onClick={() => handleCellClick(record.key, dateStr)}
          >
            {isEditing ? (
              <Input.TextArea
                autoFocus
                value={value}
                onChange={(e) =>
                  handleCellEdit(record.key, dateStr, e.target.value)
                }
                onBlur={handleCellBlur}
                onPressEnter={handleCellBlur}
                placeholder="Guest name + details"
                autoSize={{ minRows: 2, maxRows: 4 }}
                style={{ fontSize: "12px" }}
              />
            ) : (
              <div
                style={{
                  fontSize: "12px",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {value || <span className="text-gray-400">Click to edit</span>}
              </div>
            )}
          </div>
        );
      },
    })),
    {
      title: "Total Booked",
      key: "totalBooked",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <div className="text-center font-bold text-lg">
          {calculateTotalBooked(record.key)}
        </div>
      ),
    },
  ];

  const dates = generateDateColumns();
  const footerData = [
    {
      key: "footer",
      flatNo: "Booked",
      ...dates.reduce((acc, date) => {
        const dateStr = date.format("YYYY-MM-DD");
        acc[dateStr] = calculateDayTotal(dateStr);
        return acc;
      }, {}),
      totalBooked: calculateGrandTotal(),
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          {"Hotel Sea Shore"} Booking Calendar
        </h1>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {/* <Select
              value={selectedHotel}
              onChange={handleHotelChange}
              style={{ width: 250 }}
              placeholder="Select a Hotel"
            >
              {hotelData.map((hotel) => (
                <Option key={hotel.hotelName} value={hotel.hotelName}>
                  {hotel.hotelName}
                </Option>
              ))}
            </Select> */}

            <Select
              value={numberOfDays}
              onChange={setNumberOfDays}
              style={{ width: 150 }}
            >
              <Option value={3}>3 Days</Option>
              <Option value={7}>7 Days</Option>
              <Option value={14}>14 Days</Option>
              <Option value={30}>30 Days</Option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button icon={<LeftOutlined />} onClick={goToPrevMonth}>
              Previous
            </Button>
            <Button onClick={goToToday}>Today</Button>
            <Button icon={<RightOutlined />} onClick={goToNextMonth}>
              Next
            </Button>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNewRoom}
          >
            Add Room
          </Button>
        </div>

        <div className="mb-4 text-center">
          <span className="text-xl font-semibold">
            {currentMonth.format("MMMM YYYY")}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" tip="Loading calendar..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={roomList}
                pagination={false}
                scroll={{ x: 1500, y: 600 }}
                bordered
                size="small"
                footer={() => (
                  <Table
                    columns={columns}
                    dataSource={footerData}
                    pagination={false}
                    showHeader={false}
                    bordered
                    size="small"
                    rowClassName="bg-orange-100 font-bold"
                  />
                )}
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Color Legend:</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 border"
                    style={{ backgroundColor: "#00FFFF" }}
                  ></div>
                  <span>Owner Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 border"
                    style={{ backgroundColor: "#90EE90" }}
                  ></div>
                  <span>FTB/Othol Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 border"
                    style={{ backgroundColor: "#FFD700" }}
                  ></div>
                  <span>Regular Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 border"
                    style={{ backgroundColor: "#ffffff" }}
                  ></div>
                  <span>Available</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 <strong>Tip:</strong> Click any cell to edit booking details. Press Enter or click outside to save.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomCalendar;