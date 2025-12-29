import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

export default function UserBookingInfo({ userTableData, title }) {
  return (
    <div className="w-full"> {/* Full width container */}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg mt-4 w-full"> {/* Full width card */}
        <Title
          level={4}
          className="text-[#6366F1] mb-4 text-center lg:text-left"> {/* Changed to indigo color */}
          {title}
        </Title>

        {/* Responsive Table */}
        <div className="relative overflow-x-auto w-full"> {/* Full width table container */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="w-full text-sm text-left rtl:text-right"> {/* Slightly larger text */}
              {/* Table Header */}
              <thead>
                <tr style={{ 
                  backgroundColor: "#6366F1", // Indigo header
                  color: "white",
                }}>
                  <th className="border border-gray-200 text-center p-3"> {/* Increased padding */}
                    User ID
                  </th>
                  <th className="border border-gray-200 text-center p-3">
                    {`Today's Booking`}
                  </th>
                  <th className="border border-gray-200 text-center p-3">
                    Last 7 Days Booking
                  </th>
                  <th className="border border-gray-200 text-center p-3">
                    Last 30 Days Booking
                  </th>
                  <th className="border border-gray-200 text-center p-3">
                    Overall Booking
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {userTableData?.map((user, index) => (
                  <tr
                    key={user.key}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#E0E7FF" : "#EDE9FE", // Indigo/Lavender alternates
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#C7D2FE") // Lighter indigo on hover
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#E0E7FF" : "#EDE9FE")
                    }>
                    <td className="border border-gray-200 text-center p-3 font-medium">
                      {user.username}
                    </td>
                    <td className="border border-gray-200 text-center p-3">
                      ৳{user.totalBillForTodayByFTB?.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 text-center p-3">
                      ৳{user.totalBillForUserLast7Days?.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 text-center p-3">
                      ৳{user.totalBillForLast30DaysByFTB?.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 text-center p-3 font-semibold text-[#6366F1]">
                      ৳{user.totalBillOverall?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}