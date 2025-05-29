import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  subMonths,
} from "date-fns";
import { TrendingUp, TrendingDown, Calendar, Info } from "lucide-react";
import type { Transaction } from "../types";

interface ExpenseForecastProps {
  transactions: Transaction[];
  forecastMonths?: number;
}

interface Category {
  name: string;
  monthlyAverage: number;
  trend: number; // positive means increasing, negative means decreasing
}

export function ExpenseForecast({
  transactions,
  forecastMonths = 3,
}: ExpenseForecastProps) {
  const [viewMode, setViewMode] = useState<"category" | "total">("total");

  // Calculate recurring expenses and trends by analyzing past transactions
  const { categories, forecastData } = useMemo(() => {
    // Get transactions from the past 6 months to analyze patterns
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);

    const recentTransactions = transactions.filter(
      (t) => t.type === "expense" && new Date(t.date) >= sixMonthsAgo
    );

    // Group transactions by category
    const categoryMap = new Map<string, Transaction[]>();

    recentTransactions.forEach((transaction) => {
      const category = transaction.category || "Other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)?.push(transaction);
    });

    // Calculate monthly averages and trends for each category
    const categoryData: Category[] = [];

    categoryMap.forEach((transactions, categoryName) => {
      // Group by month
      const monthlyTotals = new Map<string, number>();

      transactions.forEach((t) => {
        const monthKey = format(new Date(t.date), "yyyy-MM");
        monthlyTotals.set(
          monthKey,
          (monthlyTotals.get(monthKey) || 0) + t.amount
        );
      });

      // Convert to array and sort by month
      const monthlyData = Array.from(monthlyTotals.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate average
      const monthlyAverage =
        monthlyData.reduce((sum, data) => sum + data.total, 0) /
        Math.max(monthlyData.length, 1);

      // Calculate trend (simple linear trend based on last few months)
      let trend = 0;
      if (monthlyData.length >= 2) {
        const recentMonths = monthlyData.slice(-3); // Last 3 months or whatever is available
        if (recentMonths.length >= 2) {
          const firstMonth = recentMonths[0].total;
          const lastMonth = recentMonths[recentMonths.length - 1].total;
          trend = (lastMonth - firstMonth) / firstMonth; // As percentage
        }
      }

      categoryData.push({
        name: categoryName,
        monthlyAverage,
        trend,
      });
    });

    // Sort categories by monthly average (highest first)
    categoryData.sort((a, b) => b.monthlyAverage - a.monthlyAverage);

    // Generate forecast data for the next X months
    const forecast = [];
    const totalMonthlyAverage = categoryData.reduce(
      (sum, category) => sum + category.monthlyAverage,
      0
    );
    const overallTrend =
      categoryData.reduce(
        (sum, category) => sum + category.trend * category.monthlyAverage,
        0
      ) / totalMonthlyAverage;

    for (let i = 0; i < forecastMonths; i++) {
      const forecastDate = addMonths(today, i);
      const monthName = format(forecastDate, "MMM yyyy");

      const monthData: any = {
        month: monthName,
        totalForecast: totalMonthlyAverage * (1 + overallTrend * i),
      };

      // Add individual category forecasts
      categoryData.forEach((category) => {
        monthData[category.name] =
          category.monthlyAverage * (1 + category.trend * i);
      });

      forecast.push(monthData);
    }

    return { categories: categoryData, forecastData: forecast };
  }, [transactions, forecastMonths]);

  // Generate colors for categories
  const categoryColors = useMemo(() => {
    const colorSet = [
      "#3b82f6",
      "#ef4444",
      "#f97316",
      "#a855f7",
      "#ec4899",
      "#14b8a6",
      "#84cc16",
      "#eab308",
      "#06b6d4",
      "#8b5cf6",
    ];

    const colors: Record<string, string> = {};
    categories.forEach((category, index) => {
      colors[category.name] = colorSet[index % colorSet.length];
    });

    return colors;
  }, [categories]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Expense Forecast</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This chart shows your projected expenses for the next few months
                based on your spending patterns.
              </p>
              {/* <p className="mb-1">
                You can select different timeframes to view your financial
                progress.
              </p> */}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "total"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setViewMode("total")}
          >
            Total
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "category"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setViewMode("category")}
          >
            By Category
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "total" ? (
            <BarChart
              data={forecastData}
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
              <Bar
                dataKey="totalForecast"
                name="Projected Expenses"
                fill="#3b82f6"
              />
            </BarChart>
          ) : (
            <BarChart
              data={forecastData}
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
              {categories.slice(0, 5).map((category) => (
                <Bar
                  key={category.name}
                  dataKey={category.name}
                  name={category.name}
                  stackId="a"
                  fill={categoryColors[category.name]}
                />
              ))}
              {categories.length > 5 && (
                <Bar
                  dataKey="Other"
                  name="Other Categories"
                  stackId="a"
                  fill="#9ca3af"
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-700 mb-3">
          Top Expense Categories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.slice(0, 3).map((category) => (
            <div key={category.name} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  {category.name}
                </span>
                <div
                  className={`flex items-center ${
                    category.trend > 0
                      ? "text-red-500"
                      : category.trend < 0
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                >
                  {category.trend > 0 ? (
                    <TrendingUp size={16} className="mr-1" />
                  ) : category.trend < 0 ? (
                    <TrendingDown size={16} className="mr-1" />
                  ) : (
                    <Calendar size={16} className="mr-1" />
                  )}
                  <span className="text-xs font-medium">
                    {category.trend !== 0
                      ? `${Math.abs(category.trend * 100).toFixed(1)}%`
                      : "Stable"}
                  </span>
                </div>
              </div>
              <p className="text-lg font-bold mt-1">
                ₹ {category.monthlyAverage.toFixed(2)}/month
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Calendar size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-700">
              Next Month's Forecast
            </h3>
            <p className="text-blue-600 mt-1">
              Based on your spending patterns, you're projected to spend{" "}
              <span className="font-bold">
                ₹ {forecastData[0]?.totalForecast.toFixed(2)}
              </span>{" "}
              next month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
