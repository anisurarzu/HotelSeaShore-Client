import { Button, Result, Space } from "antd";
import { motion } from "framer-motion";
import {
  LockOutlined,
  MailOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";

const NoPermissionBanner = () => {
  const whatsappNumber = "+8801515604845"; // Replace with actual number
  const whatsappMessage = encodeURIComponent(
    "Hello, I need access permissions for the dashboard."
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        maxWidth: "100%",
        width: "100%",
        padding: "16px",
      }}
    >
      <motion.div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
        whileHover={{ y: -2 }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              transition: {
                repeat: Infinity,
                duration: 2,
              },
            }}
          >
            <LockOutlined
              style={{
                fontSize: "32px",
                color: "#ff4d4f",
              }}
            />
          </motion.div>

          <Result
            status="403"
            title="Access Restricted"
            subTitle="You don't have permission for this page"
            style={{ padding: 0 }}
          />

          <Space direction="vertical" style={{ width: "100%" }}>
            <motion.div whileTap={{ scale: 0.95 }} style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<WhatsAppOutlined />}
                href={whatsappUrl}
                target="_blank"
                style={{
                  borderRadius: "6px",
                  width: "100%",
                  maxWidth: "240px",
                  backgroundColor: "#25D366",
                  borderColor: "#25D366",
                  marginBottom: "8px",
                }}
              >
                WhatsApp Admin
              </Button>
            </motion.div>
          </Space>
        </Space>
      </motion.div>
    </motion.div>
  );
};

export default NoPermissionBanner;
