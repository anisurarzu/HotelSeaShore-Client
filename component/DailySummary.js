"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button, message } from "antd";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Format date as Bangladesh (Asia/Dhaka) YYYY-MM-DD for API */
const toBangladeshDateStr = (date) => dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");

const DailySummary = forwardRef(function DailySummary(
  { selectedDate, dailyIncome, hideSave = false },
  ref
) {
  const [openingBalance, setOpeningBalance] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dailyIncomeState, setDailyIncomeState] = useState(0);

  // Date-wise total expense from GET /expenses/sum/daily — shown here and sent on Save
  const fetchDailyExpensesByDate = async (date) => {
    if (!date) return;
    try {
      const dateStr = toBangladeshDateStr(date);
      const res = await coreAxios.get(`/expenses/sum/daily?date=${dateStr}`);
      if (res.status === 200) {
        setDailyExpenses(Number(res.data?.totalAmount) || 0);
      } else {
        setDailyExpenses(0);
      }
    } catch (err) {
      console.error("Failed to fetch daily expenses", err);
      setDailyExpenses(0);
    }
  };

  // When parent passes dailyIncome (e.g. Daily Statement Daily Cash total), use it; else use state from API
  const effectiveDailyIncome =
    dailyIncome !== undefined && dailyIncome !== null
      ? Number(dailyIncome)
      : dailyIncomeState;

  // Calculate balances when values change
  useEffect(() => {
    const total = openingBalance + effectiveDailyIncome;
    const closing = total - dailyExpenses;
    setTotalBalance(total);
    setClosingBalance(closing);
  }, [openingBalance, effectiveDailyIncome, dailyExpenses]);

  // Selected date only: GET daily-summary + GET expenses/sum/daily (date-wise total)
  useEffect(() => {
    if (!selectedDate) return;

    const dateStr = toBangladeshDateStr(selectedDate);

    const loadSummary = async () => {
      try {
        const res = await coreAxios.get(`/daily-summary/${dateStr}`);
        if (res.status === 200 && res.data) {
          const data = res.data || {};
          setOpeningBalance(Number(data.openingBalance) || 0);
        } else {
          setOpeningBalance(0);
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error("Failed to fetch daily summary", err);
        }
        setOpeningBalance(0);
      }
      setDailyIncomeState(Number(dailyIncome) || 0);
    };

    loadSummary();
    fetchDailyExpensesByDate(selectedDate);
  }, [selectedDate, dailyIncome]);

  const handleSave = async () => {
    try {
      setLoading(true);
      // Backend createOrUpdateDailySummary resolves openingBalance from previous day's closing
      const payload = {
        date: toBangladeshDateStr(selectedDate),
        dailyIncome: effectiveDailyIncome,
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

  useImperativeHandle(ref, () => ({
    save: () => handleSave(),
  }), [selectedDate, effectiveDailyIncome, totalBalance, dailyExpenses, closingBalance]);

  return (
    <div className="mt-6">
      <div className="w-full sm:w-1/2 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: "11px", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ backgroundColor: '#2563eb' }}>
                <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-tight border border-blue-700" style={{ color: '#ffffff', backgroundColor: '#2563eb', fontWeight: 600 }}>
                  Daily Summary
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
                  {effectiveDailyIncome}
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

      {!hideSave && (
        <div className="mt-4 no-print">
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
            Save Summary
          </Button>
        </div>
      )}
    </div>
  );
});

export default DailySummary;
