import React from "react";
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
} from "date-fns";
import type { Transaction } from "../types";
import { Info } from "lucide-react";

interface ExpenseToIncomeRatioProps {
  transactions: Transaction[];
}

export function ExpenseToIncomeRatioTracker({
  transactions,
}: ExpenseToIncomeRatioProps) {
  const calculateMonthlyRatios = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, "MMM yyyy"),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      };
    }).reverse();

    return months.map(({ month, startDate, endDate }) => {
      const monthlyTransactions = transactions.filter((t) =>
        isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
      );

      const income = monthlyTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthlyTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const ratio = income > 0 ? (expenses / income) * 100 : 0;
      const savingsRate = 100 - ratio;

      return {
        month,
        income,
        expenses,
        ratio: parseFloat(Math.min(ratio, 100).toFixed(1)),
        savingsRate: parseFloat(Math.max(savingsRate, 0).toFixed(1)),
      };
    });
  };

  const data = calculateMonthlyRatios();
  const current = data[data.length - 1];
  const previous = data[data.length - 2] || current;

  const ratioChange = current.ratio - previous.ratio;
  const savingsChange = current.savingsRate - previous.savingsRate;

  const getStatusBadge = () => {
    if (current.ratio <= 70)
      return (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
          Healthy
        </span>
      );
    if (current.ratio <= 85)
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
          Caution
        </span>
      );
    return (
      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
        Critical
      </span>
    );
  };

  const getTip = () => {
    if (current.ratio > 90)
      return "Your expenses are very high. Try cutting non-essentials or setting spending limits.";
    if (current.ratio > 75)
      return "Consider reviewing recurring expenses like subscriptions or dining out.";
    if (current.ratio < 60)
      return "Great job! Consider putting extra savings into an emergency fund or investment.";
    return "You're doing well. Stay consistent and track big-ticket spending.";
  };

  const savingsTarget = current.income * 0.2; // 20% goal
  const recommendation =
    current.expenses > current.income - savingsTarget
      ? `To meet a 20% savings goal, aim to spend less than ₹${(
          current.income - savingsTarget
        ).toFixed(0)}`
      : "You're meeting your 20% savings target. Keep it up!";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">
              Expense-to-Income Ratio
            </h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 md:w-96 shadow-lg">
                
                <p className="font-semibold text-blue-300 mb-1">
                  Key Formulas:
                </p>
                <p className="mb-1">
                  <strong>Expense Ratio</strong> = (Total Expenses / Total
                  Income) x 100
                </p>
                <p className="mb-1">
                  <strong>Savings Rate</strong> = 100 - Expense Ratio
                </p>
                <p className="text-gray-300 mt-1">
                  Example: If you earn ₹50,000 and spend ₹35,000 → Expense Ratio
                  = 70%, Savings Rate = 30%
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Track how much of your salary you're spending and saving each month.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            It tracks how much of your income is being spent and how much is
            saved, helping you understand your financial discipline.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            A lower expense ratio indicates better control, while a higher
            savings rate suggests future stability.
          </p>
          
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {current.ratio}%
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            Current Expense Ratio
            {getStatusBadge()}
          </div>
          <div className="text-lg font-medium text-green-600 mt-1">
            {current.savingsRate}%
          </div>
          <div className="text-sm text-gray-500">Current Savings Rate</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(value: any) => [`${value}%`, ""]} />
          <Legend />
          <Line
            type="monotone"
            dataKey="ratio"
            name="Expense Ratio"
            stroke="#ef4444"
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="savingsRate"
            name="Savings Rate"
            stroke="#10b981"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Trend since last month:</span>
          <span
            className={`text-sm font-medium ${
              ratioChange < 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {ratioChange > 0
              ? `↑ Expense ↑ ${ratioChange.toFixed(1)}%`
              : `↓ Expense ↓ ${Math.abs(ratioChange).toFixed(1)}%`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Savings trend:</span>
          <span
            className={`text-sm font-medium ${
              savingsChange > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {savingsChange >= 0
              ? `↑ Savings ↑ ${savingsChange.toFixed(1)}%`
              : `↓ Savings ↓ ${Math.abs(savingsChange).toFixed(1)}%`}
          </span>
        </div>
        <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 mt-2">
          💡 <strong>Smart Tip:</strong> {getTip()}
        </div>
        <div className="text-sm text-blue-800 bg-blue-50 px-3 py-2 rounded border border-blue-200">
          🎯 <strong>Recommendation:</strong> {recommendation}
        </div>
      </div>
    </div>
  );
}
