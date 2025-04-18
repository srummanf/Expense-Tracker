import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  startOfWeek,
  addDays,
} from "date-fns";
import type { Transaction } from "../types";

interface BigCalendarProps {
  transactions: Transaction[];
}

export function BigCalendar({ transactions }: BigCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);

  // Generate all dates to display
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 41), // 6 weeks (to ensure we have enough days)
  });

  // Format header as "Month Year" (e.g., "April 2025")
  const monthHeader = format(currentMonth, "MMMM yyyy");

  // Navigate to previous/next month
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Get transactions for a specific day
  const getTransactionsForDay = (day: Date) => {
    return transactions.filter((transaction) =>
      isSameDay(new Date(transaction.date), day)
    );
  };

  // Check if a day has transactions
  const hasTransactions = (day: Date) => {
    return getTransactionsForDay(day).length > 0;
  };

  // Get total expense amount for a specific day
  const getDailyExpense = (day: Date) => {
    return transactions
      .filter((t) => t.type === "expense" && isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate the highest expense amount in the month for normalization
  const maxExpense = calendarDays
    .map((day) => getDailyExpense(day))
    .reduce((max, expense) => (expense > max ? expense : max), 0);

  // Generate color intensity based on expense amount (0-255)
  const getHeatIntensity = (expense: number) => {
    // Return transparent if no expense
    if (expense === 0) return "rgba(255, 99, 71, 0)";

    // Calculate intensity (0.1-0.9) with non-linear scaling for better visuals
    const intensity = 0.1 + 0.8 * Math.pow(expense / (maxExpense || 1), 0.7);
    return `rgba(255, 99, 71, ${intensity})`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Transaction Calendar
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            &lt;
          </button>
          <div className="flex flex-col items-center justify-center">
            <div className="font-medium">{monthHeader}</div>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Calendar Header (Days of week) */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm text-gray-500 font-medium py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dayTransactions = getTransactionsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const expense = getDailyExpense(day);
          const backgroundColor = getHeatIntensity(expense);
          const hasTx = hasTransactions(day);

          return (
            <Popover.Root key={i}>
              <Popover.Trigger asChild>
                <div
                  className={`
                    relative h-24 p-2 border rounded-md cursor-pointer
                    ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                    ${hasTx ? "border-blue-300" : "border-gray-200"}
                    hover:bg-gray-50 transition-colors
                  `}
                  style={{ backgroundColor }}
                >
                  <div className="text-right">{format(day, "d")}</div>
                  {expense > 0 && (
                    <div
                      className={`text-sm mt-2 font-medium ${
                        expense > maxExpense * 0.5
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      ${expense.toFixed(0)}
                    </div>
                  )}
                  {hasTx && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    </div>
                  )}
                </div>
              </Popover.Trigger>

              {hasTx && (
                <Popover.Portal>
                  <Popover.Content
                    className="bg-white rounded-lg shadow-lg p-4 w-72 border border-gray-200 z-50"
                    sideOffset={5}
                    align="center"
                  >
                    <div className="mb-2 font-medium">
                      {format(day, "MMMM d, yyyy")}
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {dayTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-3 border rounded-md bg-gray-50"
                        >
                          <div className="font-medium">
                            {transaction.reason}
                          </div>
                          <div
                            className={`text-${
                              transaction.type === "expense" ? "red" : "green"
                            }-600`}
                          >
                            {transaction.type === "expense" ? "-" : "+"} $
                            {transaction.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.category}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Popover.Arrow className="fill-white" />
                  </Popover.Content>
                </Popover.Portal>
              )}
            </Popover.Root>
          );
        })}
      </div>
    </div>
  );
}
