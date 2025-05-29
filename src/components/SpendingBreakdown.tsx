import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps,
} from "recharts";
import type { Transaction, CategoryTotal } from "../types";
import { Info } from "lucide-react";

interface SpendingBreakdownProps {
  transactions: Transaction[];
}

// Custom Tooltip Content
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow border text-sm">
        <div>
          <strong>{data.category}</strong>
        </div>
        <div>₹ {data.amount.toFixed(2)}</div>
      </div>
    );
  }
  return null;
};

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#6366F1",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
];

export function SpendingBreakdown({ transactions }: SpendingBreakdownProps) {
  const getCategoryTotals = (): CategoryTotal[] => {
    const expenseOnly = transactions.filter((t) => t.type === "expense");
    const totalExpenses = expenseOnly.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = expenseOnly.reduce<Record<string, number>>((acc, t) => {
      const category = t.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

    return Object.entries(categoryMap)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryTotals = getCategoryTotals();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* ToolTip */}
      <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
        <h2 className="whitespace-normal break-words">Spending By Category</h2>
        <div className="group relative">
          <Info size={16} className="text-gray-400 cursor-help" />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-64 sm:w-72 md:w-96 shadow-lg">
            This chart shows your spending categorized by type. Hover over each
            segment to see the individual spending.
          </div>
        </div>
      </div>

      <div className="h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryTotals}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent, payload }) =>
                `${payload.category} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={200}
              fill="#8884d8"
              dataKey="amount"
            >
              {categoryTotals.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {categoryTotals.map((category) => (
          <div
            key={category.category}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-600">{category.category}</span>
            </div>
            <span className="text-sm font-medium">
              ${category.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
