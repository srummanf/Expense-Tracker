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
import { ChevronLeft, ChevronRight, Info, TrendingUp, TrendingDown, Wallet } from "lucide-react";

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

  // Get daily chart data for a specific day
  const getDailyChartData = (day: Date) => {
    const dayTransactions = getTransactionsForDay(day);
    
    // Sort transactions by date to maintain chronological order
    const sortedTransactions = dayTransactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get running balance up to this day (all transactions before this day)
    const previousTransactions = transactions
      .filter((t) => new Date(t.date) < day)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    previousTransactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount.toString());
      runningBalance += transaction.type === 'revenue' ? amount : -amount;
    });

    // Calculate totals for this day
    const dayExpenses = sortedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const dayRevenue = sortedTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Calculate end-of-day balance
    const endDayBalance = runningBalance + dayRevenue - dayExpenses;

    return {
      expenses: dayExpenses,
      revenue: dayRevenue,
      startBalance: runningBalance,
      endBalance: endDayBalance,
      netChange: dayRevenue - dayExpenses
    };
  };

  // Calculate the highest expense and revenue amounts in the month for normalization
  const maxExpense = calendarDays
    .map((day) => getDailyExpense(day))
    .reduce((max, expense) => (expense > max ? expense : max), 0);

  const maxRevenue = calendarDays
    .map((day) => transactions
      .filter((t) => t.type === "revenue" && isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + t.amount, 0))
    .reduce((max, revenue) => (revenue > max ? revenue : max), 0);

  // Generate gradient color based on both expense and revenue amounts
  const getHeatIntensity = (day: Date) => {
    const expense = getDailyExpense(day);
    const revenue = transactions
      .filter((t) => t.type === "revenue" && isSameDay(new Date(t.date), day))
      .reduce((sum, t) => sum + t.amount, 0);

    // If no transactions, return transparent
    if (expense === 0 && revenue === 0) {
      return "rgba(255, 255, 255, 0)";
    }

    // Normalize values (0-1)
    const expenseRatio = maxExpense > 0 ? expense / maxExpense : 0;
    const revenueRatio = maxRevenue > 0 ? revenue / maxRevenue : 0;

    // Calculate net ratio (-1 to 1, where negative means more expense, positive means more revenue)
    const netRatio = revenueRatio - expenseRatio;

    // Base intensity (0.2-0.8) based on the magnitude of activity
    const activityMagnitude = Math.max(expenseRatio, revenueRatio);
    const intensity = 0.2 + 0.6 * Math.pow(activityMagnitude, 0.7);

    if (netRatio > 0) {
      // More revenue than expense - green tones
      return `rgba(34, 197, 94, ${intensity})`;
    } else if (netRatio < 0) {
      // More expense than revenue - red tones
      return `rgba(239, 68, 68, ${intensity})`;
    } else {
      // Equal or mixed - neutral tone
      return `rgba(156, 163, 175, ${intensity})`;
    }
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
          const backgroundColor = getHeatIntensity(day);
          const hasTx = hasTransactions(day);
          const chartData = getDailyChartData(day);

          return (
            <Popover.Root key={i}>
              <Popover.Trigger asChild>
                <div
                  className={`
                    relative h-[4.1rem] p-2 border rounded-md cursor-pointer
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
                    className="bg-white rounded-lg shadow-lg p-4 w-80 border border-gray-200 z-50"
                    sideOffset={5}
                    align="center"
                    collisionPadding={10}
                    avoidCollisions={true}
                    sticky="always"
                  >
                    {/* <div className="mb-3 font-medium text-lg">
                      {format(day, "MMMM d, yyyy")}
                    </div> */}
                    
                    {/* Financial Summary */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Daily Summary</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={16} className="text-red-500" />
                          <div>
                            <div className="text-gray-600">Expenses</div>
                            <div className="font-semibold text-red-600">
                              ₹{chartData.expenses.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-green-500" />
                          <div>
                            <div className="text-gray-600">Revenue</div>
                            <div className="font-semibold text-green-600">
                              ₹{chartData.revenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        {/* <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-blue-500" />
                          <div>
                            <div className="text-gray-600">Net Change</div>
                            <div className={`font-semibold ${
                              chartData.netChange >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {chartData.netChange >= 0 ? "+" : ""}₹{chartData.netChange.toFixed(2)}
                            </div>
                          </div>
                        </div> */}
                        <div className="flex items-center gap-2">
                          <Wallet size={16} className="text-gray-500" />
                          <div>
                            <div className="text-gray-600">Balance</div>
                            <div className={`font-semibold ${
                              chartData.endBalance >= 0 ? "text-gray-800" : "text-red-600"
                            }`}>
                              ₹{chartData.endBalance.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Transactions ({dayTransactions.length})
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
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
                              }-600 font-semibold`}
                            >
                              {transaction.type === "expense" ? "-" : "+"} ₹
                              {transaction.amount.toFixed(2)}
                            </div>
                            {transaction.category && (
                              <div className="text-xs text-gray-500 mt-1">
                                {transaction.category}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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