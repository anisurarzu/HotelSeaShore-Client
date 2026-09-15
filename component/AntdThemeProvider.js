"use client";

import { ConfigProvider } from "antd";
import { antdTheme } from "@/config/theme";
import "./Booking/BookingForm.css";

export default function AntdThemeProvider({ children }) {
  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
