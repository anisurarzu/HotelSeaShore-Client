"use client";

import { Card, Descriptions, Tag, Typography, Space } from "antd";
import NoPermissionBanner from "./Permission/NoPermissionBanner";
import { getUserInfoFromStorage } from "@/utils/userInfo";

const { Title, Text } = Typography;

export default function UserInformation() {
  const userInfo = getUserInfoFromStorage();
  const roleValue = userInfo?.role?.value;

  // Restriction: only superadmin can access this page
  if (!userInfo || roleValue !== "superadmin") {
    return <NoPermissionBanner />;
  }

  const hotelIds = Array.isArray(userInfo?.hotelID)
    ? userInfo.hotelID.map((h) => h?.hotelID).filter(Boolean)
    : [];

  const perms = Array.isArray(userInfo?.permission?.permissions)
    ? userInfo.permission.permissions
    : [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4">
        <Title level={2} className="!m-0">
          User Information
        </Title>
        <Text className="text-gray-600">
          Only <b>superadmin</b> can view this page.
        </Text>
      </div>

      <Card
        bordered={false}
        className="shadow-sm rounded-2xl"
        style={{
          border: "1px solid rgba(99, 102, 241, 0.18)",
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.06) 100%)",
        }}
      >
        <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="User ID">
            {userInfo?.id || userInfo?._id || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Login ID">
            {userInfo?.loginID || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Username">
            {userInfo?.username || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {userInfo?.email || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Role">
            <Tag color="blue">{roleValue}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hotels">
            {hotelIds.length > 0 ? (
              <Space wrap>
                {hotelIds.map((hid) => (
                  <Tag key={hid} color="geekblue">
                    {hid}
                  </Tag>
                ))}
              </Space>
            ) : (
              "N/A"
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Permissions" span={2}>
            {perms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => (
                  <Tag key={p?._id || p?.pageName} color={p?.viewAccess ? "green" : "red"}>
                    {p?.pageName || "Unknown"}{" "}
                    {p?.viewAccess ? "(View)" : "(No Access)"}
                  </Tag>
                ))}
              </div>
            ) : (
              "N/A"
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
