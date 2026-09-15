import localFont from "next/font/local";
import AntdThemeProvider from "@/component/AntdThemeProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Hotel Sea Shore Starter v2.0",
  description:
    "Hotel Sea Shore Starter v2.0 — Management Portal. For Pro version contact Cox Web Solutions.",
  icons: {
    icon: "https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg",
    shortcut: "https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg",
    apple: "https://i.ibb.co/7Jt48WLZ/Whats-App-Image-2025-12-29-at-04-33-36.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdThemeProvider>{children}</AntdThemeProvider>
      </body>
    </html>
  );
}
