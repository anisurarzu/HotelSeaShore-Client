/**
 * Central registry of dashboard pages for role-based & page-wise permissions.
 * Single source of truth: menu key, label, and content actions per page.
 * Align with app/dashboard/page.js hotelMenuItems & restaurantMenuItems.
 */

// Content actions that can be granted per page
export const CONTENT_ACTIONS = ["view", "insert", "edit", "delete"];

/** @type {{ key: string, label: string }[]} */
export const HOTEL_PAGES = [
  { key: "1", label: "Dashboard" },
  { key: "7", label: "Calendar" },
  { key: "6", label: "Booking Info" },
  { key: "10", label: "Report Dashboard" },
  { key: "11", label: "Daily Statement" },
  { key: "101", label: "Expense" },
  { key: "5", label: "Hotel Info" },
  { key: "2", label: "Users" },
  { key: "8", label: "Settings" },
];

/** @type {{ key: string, label: string }[]} */
export const RESTAURANT_PAGES = [
  { key: "1", label: "Dashboard" },
  { key: "20", label: "Orders" },
  { key: "21", label: "Menu" },
  { key: "22", label: "Tables" },
  { key: "23", label: "Reports" },
  { key: "101", label: "Expense" },
  { key: "2", label: "Users" },
  { key: "8", label: "Settings" },
];

/** Get pages for portal type */
export function getPagesForPortal(isRestaurant) {
  return isRestaurant ? RESTAURANT_PAGES : HOTEL_PAGES;
}

/** Get page by key (hotel or restaurant) */
export function getPageByKey(key, isRestaurant) {
  const pages = getPagesForPortal(isRestaurant);
  return pages.find((p) => p.key === key) || null;
}

/** Get all page keys for portal */
export function getAllPageKeys(isRestaurant) {
  return getPagesForPortal(isRestaurant).map((p) => p.key);
}

/** Map legacy pageName (from backend) to page key for backward compatibility */
export const PAGE_NAME_TO_KEY = {
  Dashboard: "1",
  Calender: "7",
  Calendar: "7",
  "Booking Info": "6",
  Booking: "6",
  "Report Dashboard": "10",
  Report: "10",
  "Daily Statement": "11",
  Expense: "101",
  "Hotel Info": "5",
  Hotel: "5",
  Users: "2",
  Settings: "8",
  Orders: "20",
  Menu: "21",
  Tables: "22",
  Reports: "23",
  WebHotels: "5",
  WebUsers: "2",
  WebBooking: "6",
  RoomAvailability: "7",
};

export function getKeyByPageName(pageName) {
  return PAGE_NAME_TO_KEY[pageName] || pageName;
}
