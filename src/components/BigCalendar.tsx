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
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

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
        <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">
            Transaction Calendar
          </h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-64 sm:w-72 md:w-96 shadow-lg">
              This calendar shows your transactions for the current month. Click
              on a day to see details.
            </div>
          </div>
        </div>
        {/* Months Toggle Button */}
        <div className="flex items-center justify-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200 shadow-sm">
  <button
    onClick={prevMonth}
    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed group"
    title="Previous month"
  >
    <ChevronLeft 
      size={16} 
      className="transform group-hover:-translate-x-0.5 transition-transform duration-200"
    />
  </button>
  
  <div className="flex items-center justify-center min-w-[140px] px-4 py-2">
    <div className="text-center">
      <div className="font-semibold text-gray-900 text-lg leading-tight">
        {monthHeader}
      </div>
    </div>
  </div>
  
  <button
    onClick={nextMonth}
    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed group"
    title="Next month"
  >
    <ChevronRight 
      size={16} 
      className="transform group-hover:translate-x-0.5 transition-transform duration-200"
    />
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
                      ₹{expense.toFixed(0)}
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
                            {transaction.type === "expense" ? "-" : "+"} ₹
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
