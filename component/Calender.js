"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Spin,
  Alert,
  Select,
  message,
  Popconfirm,
  Tooltip,
  DatePicker,
  Modal,
  Tag,
  Space,
} from "antd";
import {
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { RangePicker } = DatePicker;

const HotelCalendar = ({ hotelID }) => {
  const router = useRouter();
  const [hotelData, setHotelData] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const [roomList, setRoomList] = useState([]);
  const [bookingData, setBookingData] = useState({});
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRoomKey, setSelectedRoomKey] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);

  // Generate 30 days from start date
  const generateDateColumns = () => {
    const dates = [];
    let currentDate = dateRange[0];
    
    // Always show exactly 30 days
    for (let i = 0; i < 30; i++) {
      dates.push(currentDate.add(i, "day"));
    }
    return dates;
  };

  // Calculate total booked days for a room
  const calculateTotalBooked = (roomKey) => {
    const dates = generateDateColumns();
    return dates.filter(date => {
      const dateStr = date.format("YYYY-MM-DD");
      return bookingData[`${roomKey}-${dateStr}`];
    }).length;
  };

  // Calculate day total bookings
  const calculateDayTotal = (dateStr) => {
    return roomList.filter(room => {
      return bookingData[`${room.key}-${dateStr}`];
    }).length;
  };

  // Get booking color based on content
  const getBookingColor = (value) => {
    if (!value) return "#ffffff";
    const val = value.toLowerCase();
    if (val.includes("owner")) return "#00FFFF";
    if (val.includes("othol") || val.includes("ftb")) return "#90EE90";
    return "#FFD700";
  };

  // Navigate to BookingInfo page
  const handleEditClick = (roomKey, dateStr, bookingInfo, e) => {
    if (e) {
      e.stopPropagation();
    }
    // Navigate to dashboard - user can select Booking Info menu (key: "6")
    // You can update dashboard to read menu query param if needed
    router.push(`/dashboard?menu=6&room=${roomKey}&date=${dateStr}&hotel=${selectedHotel || hotelID}`);
  };

  // Show booking history modal
  const handleCellClick = (roomKey, dateStr) => {
    setSelectedRoomKey(roomKey);
    setSelectedDateStr(dateStr);
    
    // Fetch booking history for this room and date
    // For now, using mock data - replace with actual API call
    const mockHistory = [
      {
        _id: "1",
        bookingNo: "FTB-0001",
        fullName: "John Doe",
        phone: "+8801712345678",
        checkInDate: dateStr,
        checkOutDate: dayjs(dateStr).add(2, "day").format("YYYY-MM-DD"),
        statusID: 1,
        totalBill: 5000,
        advancePayment: 2000,
      },
      {
        _id: "2",
        bookingNo: "FTB-0002",
        fullName: "Jane Smith",
        phone: "+8801723456789",
        checkInDate: dayjs(dateStr).subtract(1, "day").format("YYYY-MM-DD"),
        checkOutDate: dateStr,
        statusID: 1,
        totalBill: 3000,
        advancePayment: 3000,
      },
    ];
    
    setBookingHistory(mockHistory);
    setHistoryModalVisible(true);
  };

  // Main columns configuration
  const getColumns = () => {
    const dates = generateDateColumns();
    
    const dateColumns = dates.map((date) => {
      const dateStr = date.format("YYYY-MM-DD");
      const dayOfWeek = date.format("ddd");
      const dayNum = date.format("D");
      const isToday = date.isSame(dayjs(), 'day');
      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
      
      return {
        title: (
          <div className="text-center p-0 m-0" style={{ minWidth: '45px' }}>
            <div 
              className={`font-bold ${isToday ? 'text-red-600' : ''} ${isWeekend ? 'text-blue-600' : ''}`}
              style={{ fontSize: '9px', lineHeight: '1.2' }}
            >
              {dayOfWeek.toUpperCase()}
            </div>
            <div 
              className={`font-extrabold ${isToday ? 'text-red-600' : ''}`}
              style={{ fontSize: '12px', lineHeight: '1.2' }}
            >
              {dayNum}
            </div>
            <div 
              className="text-gray-500 font-medium"
              style={{ fontSize: '8px', lineHeight: '1.2' }}
            >
              {calculateDayTotal(dateStr)}
            </div>
          </div>
        ),
        key: dateStr,
        width: 50, // Fixed small width for mobile
        align: 'center',
        render: (_, record) => {
          const bookingKey = `${record.key}-${dateStr}`;
          const bookingInfo = bookingData[bookingKey];
          
          return (
            <Tooltip title={bookingInfo ? `Click to view history: ${bookingInfo}` : "Click to view history or add booking"}>
              <div
                className="flex items-center justify-center p-0 relative"
                style={{
                  minHeight: '50px',
                  backgroundColor: getBookingColor(bookingInfo || ''),
                  cursor: 'pointer',
                  border: '1px solid #e8e8e8',
                  fontSize: '8px',
                  padding: '2px',
                }}
                onClick={() => handleCellClick(record.key, dateStr)}
              >
                {bookingInfo ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-grow overflow-hidden text-center">
                      <div className="font-semibold" style={{ fontSize: '8px' }}>
                        {bookingInfo.split(' ')[0]}
                      </div>
                      {bookingInfo.length > 10 && (
                        <div className="text-gray-600" style={{ fontSize: '7px' }}>
                          ...
                        </div>
                      )}
                    </div>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined style={{ fontSize: '8px' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record.key, dateStr, bookingInfo, e);
                      }}
                      className="p-0 m-0"
                      style={{ fontSize: '8px', height: '16px' }}
                    >
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-gray-400 text-xs mb-1">+</div>
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined style={{ fontSize: '8px' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record.key, dateStr, null, e);
                      }}
                      className="p-0 m-0"
                      style={{ fontSize: '8px', height: '16px' }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </Tooltip>
          );
        },
      };
    });

    return [
      {
        title: (
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm">Room</div>
            <div className="text-xs text-gray-500">No.</div>
          </div>
        ),
        dataIndex: 'flatNo',
        key: 'flatNo',
        fixed: 'left',
        width: 70,
        render: (text, record) => (
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm">{text}</div>
            <div className="text-xs text-gray-500">
              {calculateTotalBooked(record.key)}/{30}
            </div>
          </div>
        ),
      },
      ...dateColumns,
    ];
  };

  // Initialize with sample data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Sample hotel data
      const sampleHotels = [
        {
          id: 1,
          name: "Hotel Sea Shore",
          rooms: Array.from({ length: 20 }, (_, i) => ({
            key: `room-${i + 1}`,
            flatNo: `Room ${i + 101}`,
            category: i < 10 ? "Standard" : "Deluxe",
          })),
        },
      ];

      // Sample booking data
      const sampleBookings = {};
      const dates = generateDateColumns();
      
      sampleHotels[0].rooms.forEach(room => {
        dates.forEach(date => {
          const dateStr = date.format("YYYY-MM-DD");
          // Random bookings for demonstration
          if (Math.random() > 0.7) {
            const guests = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Owner Booking", "FTB Booking"];
            sampleBookings[`${room.key}-${dateStr}`] = 
              guests[Math.floor(Math.random() * guests.length)];
          }
        });
      });

      setHotelData(sampleHotels);
      setSelectedHotel(sampleHotels[0].name);
      setRoomList(sampleHotels[0].rooms);
      setBookingData(sampleBookings);
      
      setLoading(false);
    };

    initializeData();
  }, []);

  // Navigation
  const goToPreviousMonth = () => {
    setDateRange([
      dateRange[0].subtract(1, 'month'),
      dateRange[1].subtract(1, 'month'),
    ]);
  };

  const goToNextMonth = () => {
    setDateRange([
      dateRange[0].add(1, 'month'),
      dateRange[1].add(1, 'month'),
    ]);
  };

  const goToToday = () => {
    const today = dayjs();
    setDateRange([
      today.startOf('month'),
      today.endOf('month'),
    ]);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
    }
  };

  // Table footer with totals
  const Footer = () => {
    const dates = generateDateColumns();
    const dayTotals = dates.map(date => {
      const dateStr = date.format("YYYY-MM-DD");
      return calculateDayTotal(dateStr);
    });

    return (
      <div className="bg-gray-50 border-t">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ width: '70px' }} className="text-center p-1 sm:p-2">
                <div className="font-bold text-xs sm:text-sm">Total</div>
              </td>
              {dayTotals.map((total, index) => {
                const date = dates[index];
                const isWeekend = date.format('ddd') === 'Sat' || date.format('ddd') === 'Sun';
                
                return (
                  <td 
                    key={index} 
                    className="text-center p-0.5 sm:p-1 border-l"
                    style={{ width: '50px' }}
                  >
                    <div className={`font-bold text-xs sm:text-sm ${total > 0 ? 'text-green-600' : 'text-gray-400'} ${isWeekend ? 'bg-blue-50' : ''}`}>
                      {total}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-2 sm:p-3 md:p-4">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-2 sm:mb-3 p-2 sm:p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                Hotel Booking Calendar
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                {dateRange[0].format("MMM D, YYYY")} - {dateRange[1].format("MMM D, YYYY")}
              </p>
            </div>

            {/* <div className="flex items-center gap-2">
              <Select
                value={selectedHotel}
                onChange={setSelectedHotel}
                className="w-full sm:w-40 md:w-48"
                size="small"
              >
                {hotelData.map(hotel => (
                  <Option key={hotel.id} value={hotel.name}>
                    {hotel.name}
                  </Option>
                ))}
              </Select>
            </div> */}
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Button
                icon={<LeftOutlined />}
                onClick={goToPreviousMonth}
                size="small"
                className="text-xs"
              >
                <span className="hidden sm:inline">Prev</span>
                <span className="sm:hidden">‹</span>
              </Button>
              
              <Button
                onClick={goToToday}
                size="small"
                className="text-xs"
              >
                Today
              </Button>
              
              <Button
                icon={<RightOutlined />}
                onClick={goToNextMonth}
                size="small"
                className="text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Button
                type={showDateRange ? "primary" : "default"}
                icon={<CalendarOutlined />}
                onClick={() => setShowDateRange(!showDateRange)}
                size="small"
                className="text-xs"
              >
                <span className="hidden md:inline">Custom Range</span>
                <span className="md:hidden">Range</span>
              </Button>
              
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => window.print()}
                size="small"
                className="text-xs"
              >
                <span className="hidden sm:inline">Print</span>
                <span className="sm:hidden">Print</span>
              </Button>
            </div>
          </div>

          {/* Date Range Picker */}
          {showDateRange && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="font-semibold text-xs sm:text-sm">Select Date Range:</span>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="MMM D, YYYY"
                  allowClear={false}
                  size="small"
                  className="w-full sm:w-auto"
                />
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    const today = dayjs();
                    setDateRange([
                      today.startOf('month'),
                      today.endOf('month'),
                    ]);
                  }}
                  className="text-xs p-0"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-10 sm:py-20">
              <Spin size="large" tip="Loading calendar..." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table
                  columns={getColumns()}
                  dataSource={roomList}
                  pagination={false}
                  bordered
                  size="small"
                  rowKey="key"
                  scroll={{ 
                    x: 'max-content',
                    y: 550 // Height for approximately 10 rows (50px per row + header)
                  }}
                  className="calendar-table"
                  style={{ fontSize: '10px' }}
                  components={{
                    body: {
                      cell: (props) => (
                        <td {...props} style={{ padding: '0 !important' }} />
                      ),
                    },
                  }}
                />
              </div>
              
              <Footer />
            </>
          )}
        </div>

        {/* Legend and Instructions */}
        <div className="mt-2 sm:mt-3 md:mt-4 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2">Color Legend</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { color: "#00FFFF", label: "Owner Booking" },
                { color: "#90EE90", label: "FTB/Othol Booking" },
                { color: "#FFD700", label: "Regular Booking" },
                { color: "#ffffff", label: "Available" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs sm:text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2">Instructions</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0">•</span>
                <span>Click on date cell to view booking history</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0">•</span>
                <span>Click Edit/Add button to navigate to Booking Info page</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0">•</span>
                <span>Blue weekend dates (Saturday/Sunday) in header</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0">•</span>
                <span>Red date number indicates today</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-1 sm:mr-2 flex-shrink-0">•</span>
                <span>Bottom row shows daily totals</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Booking History Modal */}
      <Modal
        title={
          <div>
            <div className="font-semibold text-base sm:text-lg">Booking History</div>
            <div className="text-xs sm:text-sm text-gray-500 font-normal">
              {selectedRoomKey && roomList.find(r => r.key === selectedRoomKey)?.flatNo} - {selectedDateStr && dayjs(selectedDateStr).format("MMM D, YYYY")}
            </div>
          </div>
        }
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedRoomKey(null);
          setSelectedDateStr(null);
          setBookingHistory([]);
        }}
        footer={[
          <Button key="close" size="small" onClick={() => {
            setHistoryModalVisible(false);
            setSelectedRoomKey(null);
            setSelectedDateStr(null);
            setBookingHistory([]);
          }}>
            Close
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => {
              if (selectedRoomKey && selectedDateStr) {
                handleEditClick(selectedRoomKey, selectedDateStr, null);
              }
            }}
          >
            <span className="hidden sm:inline">Add New Booking</span>
            <span className="sm:hidden">Add</span>
          </Button>
        ]}
        width="90%"
        style={{ maxWidth: '800px' }}
      >
        <div className="mt-2 sm:mt-4">
          {bookingHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {bookingHistory.map((booking) => (
                <div
                  key={booking._id}
                  className="border rounded-lg p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base text-gray-900">{booking.bookingNo}</div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                        <UserOutlined className="mr-1" />
                        {booking.fullName}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                        <PhoneOutlined className="mr-1" />
                        {booking.phone}
                      </div>
                    </div>
                    <Tag color={booking.statusID === 1 ? "green" : "red"} className="text-xs">
                      {booking.statusID === 1 ? "Active" : "Cancelled"}
                    </Tag>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>{" "}
                      <span className="font-medium">
                        {dayjs(booking.checkInDate).format("MMM D, YYYY")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>{" "}
                      <span className="font-medium">
                        {dayjs(booking.checkOutDate).format("MMM D, YYYY")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Bill:</span>{" "}
                      <span className="font-medium">৳{booking.totalBill.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Advance:</span>{" "}
                      <span className="font-medium text-green-600">
                        ৳{booking.advancePayment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex justify-end">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setHistoryModalVisible(false);
                        handleEditClick(selectedRoomKey, selectedDateStr, booking);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-base sm:text-lg mb-2">No booking history found</div>
              <div className="text-xs sm:text-sm">This room is available for this date</div>
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .calendar-table .ant-table-thead > tr > th {
          padding: 2px 1px !important;
          text-align: center;
          background: #fafafa;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .calendar-table .ant-table-tbody > tr > td {
          padding: 0 !important;
          vertical-align: middle;
        }
        
        .calendar-table .ant-table-cell {
          border-right: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .calendar-table .ant-table-row:hover td {
          background: #fafafa !important;
        }
        
        .calendar-table .ant-table-thead > tr > th:first-child {
          z-index: 11;
        }
        
        .calendar-table .ant-table-tbody > tr > td:first-child {
          position: sticky;
          left: 0;
          z-index: 5;
          background: white;
        }
        
        .calendar-table .ant-table-tbody > tr:hover > td:first-child {
          background: #fafafa !important;
        }
        
        @media (max-width: 640px) {
          .calendar-table .ant-table-thead > tr > th {
            padding: 2px 1px !important;
            font-size: 9px !important;
          }
          
          .calendar-table .ant-table-tbody > tr > td {
            font-size: 8px !important;
          }
        }
        
        @media print {
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HotelCalendar;