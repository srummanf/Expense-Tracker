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
                <BadgeDollarSign size={16} /> Remaining Planned Budget
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
      {/* Number Line Visualization */}
      <div className="mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <Wallet className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">Bank Balance</div>
            <div className="text-gray-700 text-xs">
              ₹{bankAmount.toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">After Limit</div>
            <div className="text-gray-700 text-xs">
              ₹{(bankAmount - bankLimit).toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <PiggyBank className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">After Savings</div>
            <div className="text-gray-700 text-xs">
              ₹{usableBalance.toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center">
            <PieChart className="text-green-600 mb-1" />
            <div className="font-semibold text-sm">After Budget</div>
            <div className="text-gray-700 text-xs">
              ₹{safeBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Optional: Mini bar below showing % of transition */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${(safeBalance / bankAmount) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
