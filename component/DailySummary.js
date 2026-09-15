"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button, message } from "antd";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "./DailyOps.css";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Format date as Bangladesh (Asia/Dhaka) YYYY-MM-DD for API */
const toBangladeshDateStr = (date) => dayjs(date).tz("Asia/Dhaka").format("YYYY-MM-DD");

const fmt = (n) => Number(n || 0).toLocaleString();

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

  const getPreviousDateStr = (date) =>
    dayjs(date).tz("Asia/Dhaka").subtract(1, "day").format("YYYY-MM-DD");

  const getPreviousClosingBalance = async (date) => {
    try {
      const prevDateStr = getPreviousDateStr(date);
      const prevRes = await coreAxios.get(`/daily-summary/${prevDateStr}`);
      if (prevRes.status === 200 && prevRes.data) {
        return Number(prevRes.data?.closingBalance) || 0;
      }
      return 0;
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error("Failed to fetch previous day summary", err);
      }
      return 0;
    }
  };

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
          const prevClosing = await getPreviousClosingBalance(selectedDate);
          // Keep carry-forward rule deterministic: today's opening = previous day's closing.
          setOpeningBalance(prevClosing);
          setDailyIncomeState(Number(data.dailyIncome) || 0);
        } else {
          const prevClosing = await getPreviousClosingBalance(selectedDate);
          setOpeningBalance(prevClosing);
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error("Failed to fetch daily summary", err);
        }
        const prevClosing = await getPreviousClosingBalance(selectedDate);
        setOpeningBalance(prevClosing);
      }
      setDailyIncomeState(Number(dailyIncome) || 0);
    };

    loadSummary();
    fetchDailyExpensesByDate(selectedDate);
  }, [selectedDate, dailyIncome]);

  const handleSave = async () => {
    try {
      if (!selectedDate) return;
      setLoading(true);
      const carryOpeningBalance = await getPreviousClosingBalance(selectedDate);
      const recalculatedTotalBalance = carryOpeningBalance + effectiveDailyIncome;
      const recalculatedClosingBalance = recalculatedTotalBalance - dailyExpenses;

      // Send deterministic carry-forward values from frontend.
      const payload = {
        date: toBangladeshDateStr(selectedDate),
        openingBalance: carryOpeningBalance,
        dailyIncome: effectiveDailyIncome,
        totalBalance: recalculatedTotalBalance,
        dailyExpenses,
        closingBalance: recalculatedClosingBalance,
      };

      const res = await coreAxios.post("/daily-summary", payload);

      if (res.status === 200 || res.status === 201) {
        setOpeningBalance(carryOpeningBalance);
        setTotalBalance(recalculatedTotalBalance);
        setClosingBalance(recalculatedClosingBalance);
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

  const dateLabel = selectedDate
    ? dayjs(selectedDate).tz("Asia/Dhaka").format("D MMM YYYY")
    : "";

  return (
    <div className="hs-dsum">
      <div className="hs-dsum__panel">
        <div className="hs-dsum__head">
          <h3>Daily Summary</h3>
          <span>{dateLabel || "Cash position"}</span>
        </div>
        <table className="hs-dsum__table">
          <tbody>
            <tr>
              <td className="hs-dsum__label">Opening Balance</td>
              <td className="hs-dsum__value">{fmt(openingBalance)}</td>
            </tr>
            <tr>
              <td className="hs-dsum__label">Daily Income</td>
              <td className="hs-dsum__value">{fmt(effectiveDailyIncome)}</td>
            </tr>
            <tr className="is-total">
              <td className="hs-dsum__label">Total Balance</td>
              <td className="hs-dsum__value">{fmt(totalBalance)}</td>
            </tr>
            <tr className="is-expense">
              <td className="hs-dsum__label">Daily Expenses</td>
              <td className="hs-dsum__value">{fmt(dailyExpenses)}</td>
            </tr>
            <tr className="is-closing">
              <td className="hs-dsum__label">Closing Balance</td>
              <td className="hs-dsum__value">{fmt(closingBalance)}</td>
            </tr>
          </tbody>
        </table>
        {!hideSave && (
          <div className="hs-dsum__footer no-print">
            <Button type="primary" onClick={handleSave} loading={loading} block>
              Save Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export default DailySummary;
