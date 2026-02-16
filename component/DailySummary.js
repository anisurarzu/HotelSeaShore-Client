"use client";

import { useEffect, useState } from "react";
import { InputNumber, Button, message } from "antd";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";

const DailySummary = ({ selectedDate, dailyIncome }) => {
  const [openingBalance, setOpeningBalance] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Fetch previous day's closing balance
  const fetchOpeningBalance = async () => {
    try {
      const prevDate = selectedDate.subtract(1, "day").format("YYYY-MM-DD");
      const res = await coreAxios.get(`/daily-summary/${prevDate}`);
      if (res.status === 200) {
        const prevClosing = res.data?.closingBalance || 0;
        setOpeningBalance(prevClosing);
      } else {
        setOpeningBalance(0);
      }
    } catch (err) {
      console.error("Failed to fetch previous day summary", err);
      setOpeningBalance(0);
    }
  };

  // Fetch daily expenses sum from expense API
  const fetchDailyExpenses = async () => {
    try {
      setExpenseLoading(true);
      const dateString = selectedDate.format("YYYY-MM-DD");
      const res = await coreAxios.get(`/expenses/sum/daily?date=${dateString}`);

      if (res.status === 200) {
        setDailyExpenses(res.data.totalAmount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch daily expenses", err);
      message.error("Failed to load daily expenses");
    } finally {
      setExpenseLoading(false);
    }
  };

  // Calculate balances when values change
  useEffect(() => {
    const total = openingBalance + dailyIncome;
    const closing = total - dailyExpenses;
    setTotalBalance(total);
    setClosingBalance(closing);
  }, [openingBalance, dailyIncome, dailyExpenses]);

  // Fetch opening balance and expenses when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchOpeningBalance();
      fetchDailyExpenses();
    }
  }, [selectedDate]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate.format("YYYY-MM-DD"),
        openingBalance,
        dailyIncome,
        totalBalance,
        dailyExpenses,
        closingBalance,
      };

      const res = await coreAxios.post("/daily-summary", payload);

      if (res.status === 200 || res.status === 201) {
        message.success("Daily summary saved successfully");
      } else {
        throw new Error("Error saving summary");
      }
    } catch (err) {
      console.error("Save failed", err);
      message.error("Failed to save daily summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: "11px", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb' }}>
                <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600 }}>
                  Item
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                  Opening Balance
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                  {openingBalance}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                  Daily Income
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                  {dailyIncome}
                </td>
              </tr>
              <tr className="bg-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-semibold border border-gray-300">
                  Total Balance
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                  {totalBalance}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-medium border border-gray-300">
                  Daily Expenses
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                  {dailyExpenses}
                </td>
              </tr>
              <tr className="bg-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-800 font-semibold border border-gray-300">
                  Closing Balance
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-800 font-semibold border border-gray-300">
                  {closingBalance}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <Button
          type="primary"
          onClick={handleSave}
          loading={loading}
          style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
          Save Summary
        </Button>
      </div>
    </div>
  );
};

export default DailySummary;
