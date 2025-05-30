import React from "react";
import {
  Info,
  ShieldCheck,
  PiggyBank,
  Wallet,
  TrendingDown,
  TrendingUp,
  PieChart,
  CreditCard,
  BadgeDollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BalanceExplanationProps {
  bankAmount: number;
  bankLimit: number;
  totalPlanned: number;
  totalActualSpent: number;
  totalSavingsContributions: number;
  remainingPlanned: number;
  usableBalance?: number; // Optional, can be calculated
  safeBalance?: number; // Optional, can be calculated
  totalActualSpentOnPlanned: number; // Optional, can be calculated
}

export const BalanceExplanation: React.FC<BalanceExplanationProps> = ({
  bankAmount,
  bankLimit,
  totalPlanned,
  totalActualSpent,
  totalSavingsContributions,
  remainingPlanned,
  totalActualSpentOnPlanned,
}) => {
  // Calculations
  const usableBalance = bankAmount - bankLimit - totalSavingsContributions;
  const safeBalance = usableBalance - remainingPlanned;

  const chartData = [
    {
      name: "Bank Balance",
      amount: bankAmount,
    },
    {
      name: "After Bank Limit",
      amount: bankAmount - bankLimit,
    },
    {
      name: "After Savings",
      amount: usableBalance,
    },
    {
      name: "After Budget (Safe)",
      amount: safeBalance,
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Info className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          How Safe and Usable Balances are Calculated
        </h2>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Component</th>
              <th className="text-right px-4 py-2">Amount (₹)</th>
              <th className="text-left px-4 py-2">Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">1</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Wallet size={16} /> Bank Balance
              </td>
              <td className="px-4 py-2 text-right">
                {bankAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2">Your current bank balance.</td>
            </tr>
            <tr>
              <td className="px-4 py-2">2</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <ShieldCheck size={16} /> Bank Limit
              </td>
              <td className="px-4 py-2 text-right">
                - {bankLimit.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount you want to reserve as a limit.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">3</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <PiggyBank size={16} /> Savings Contributions
              </td>
              <td className="px-4 py-2 text-right">
                - {totalSavingsContributions.toLocaleString()}
              </td>
              <td className="px-4 py-2">Amount allocated to Savings Goals.</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="px-4 py-2">4</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingUp size={16} /> Usable Balance
              </td>
              <td className="px-4 py-2 text-right">
                {usableBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Remaining money after bank limit and savings are excluded.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">5</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <PieChart size={16} /> Total Planned Budget
              </td>
              <td className="px-4 py-2 text-right">
                {" "}
                {totalPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount you've planned to spend, based on the Budget Planning.
              </td>
            </tr>

            <tr>
              <td className="px-4 py-2">5</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <CreditCard size={16} /> Total Actual Spent On Planned Budget
              </td>
              <td className="px-4 py-2 text-right">
                {" "}
                {totalActualSpentOnPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount you've spent on the Budget Planning.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">5</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <BadgeDollarSign  size={16} /> Remaining Planned Budget
              </td>
              <td className="px-4 py-2 text-right">
                - {remainingPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount yet to spend on the Budget Planning.
              </td>
            </tr>

            <tr className="bg-green-100 font-semibold">
              <td className="px-4 py-2">6</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingDown size={16} /> Safe Balance
              </td>
              <td className="px-4 py-2 text-right">
                {safeBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                What's left after including planned expenses, savings, and
                limits.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Line Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
