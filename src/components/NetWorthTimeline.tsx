import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from "date-fns";
import type { Transaction } from "../types";
import { Info } from "lucide-react";

interface NetWorthTimelineProps {
  transactions: Transaction[];
  months?: number;
}

export function NetWorthTimeline({
  transactions,
  months = 12,
}: NetWorthTimelineProps) {
  const [timeframe, setTimeframe] = useState<number>(months);

  const netWorthData = useMemo(() => {
    // Generate timeline data for the past X months
    const today = new Date();
    const data = [];

    // Create an array of the past X months
    for (let i = timeframe - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Get all transactions up to this month's end
      const relevantTransactions = transactions.filter(
        (t) => new Date(t.date) <= monthEnd
      );

      // Calculate net worth at the end of this month
      const totalRevenue = relevantTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = relevantTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const netWorth = totalRevenue - totalExpenses;

      // Calculate monthly income/expense
      const monthlyTransactions = relevantTransactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
      );

      const monthlyIncome = monthlyTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpense = monthlyTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: format(monthDate, "MMM yyyy"),
        netWorth,
        monthlyIncome,
        monthlyExpense,
        savings: monthlyIncome - monthlyExpense,
      });
    }

    return data;
  }, [transactions, timeframe]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Net Worth Timeline</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This chart shows your net worth over the selected timeframe. Net
                worth is calculated as total revenue minus total expenses for
                each month.
              </p>
              <p className="mb-1">
                You can select different timeframes to view your financial
                progress.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Timeframe: </span>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
          >
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
            <option value={24}>24 Months</option>
            <option value={36}>36 Months</option>
          </select>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={netWorthData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`₹ ${value.toFixed(2)}`, ""]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="savings"
              name="Monthly Savings"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {netWorthData.length > 0 && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">
                Current Net Worth
              </p>
              <p className="text-xl font-bold">
                ₹{netWorthData[netWorthData.length - 1].netWorth.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">
                Last Month Income
              </p>
              <p className="text-xl font-bold">
                ₹
                {netWorthData[netWorthData.length - 1].monthlyIncome.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                Last Month Expenses
              </p>
              <p className="text-xl font-bold">
                ₹
                {netWorthData[netWorthData.length - 1].monthlyExpense.toFixed(
                  2
                )}
              </p>
            </div>
            <div
              className={`${
                netWorthData[netWorthData.length - 1].savings >= 0
                  ? "bg-emerald-50"
                  : "bg-amber-50"
              } p-4 rounded-lg`}
            >
              <p
                className={`text-sm ${
                  netWorthData[netWorthData.length - 1].savings >= 0
                    ? "text-emerald-600"
                    : "text-amber-600"
                } font-medium`}
              >
                Last Month Savings
              </p>
              <p className="text-xl font-bold">
                ₹{netWorthData[netWorthData.length - 1].savings.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
