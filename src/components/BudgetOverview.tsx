import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Info,
  Edit,
  Save,
  X,
  BadgeDollarSign,
} from "lucide-react";
import { SavingsGoalTracker } from "./SavingsGoalTracker";
import { BalanceExplanation } from "./BalanceExplanation";

// Import Transaction type
interface Transaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: "expense" | "revenue";
  category?: string;
}

// Extended types for the expense tracker
interface ExpenseCategory {
  category: string;
  planned: number;
  actual?: number;
}

interface FinancialTrackerProps {
  bankAmount: number;
  bankLimit: number;
  categories: string[]; // Dynamic categories from TransactionForm
  transactions: Transaction[]; // Actual transactions from localStorage
  initialPlannedAmounts?: Record<string, number>; // Initial planned amounts per category
  onPlannedAmountChange?: (category: string, amount: number) => void;
  onBankLimitChange?: (limit: number) => void;
}

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

export default function FinancialExpenseTracker({
  bankAmount,
  bankLimit,
  categories,
  transactions = [],
  initialPlannedAmounts = {},
  onPlannedAmountChange,
  onBankLimitChange,
}: FinancialTrackerProps) {
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, number>>(
    initialPlannedAmounts
  );
  const [currentBankLimit, setCurrentBankLimit] = useState(bankLimit);
  const [viewMode, setViewMode] = useState<"planned" | "actual">("actual");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showSavingsGoals, setShowSavingsGoals] = useState(false);

  // Update internal state when props change
  useEffect(() => {
    setCurrentBankLimit(bankLimit);
  }, [bankLimit]);

  useEffect(() => {
    setPlannedAmounts((prev) => ({ ...prev, ...initialPlannedAmounts }));
  }, [initialPlannedAmounts]);

  // Helper function to get current month transactions
  const getCurrentMonthTransactions = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    });
  };

  // Get current month transactions
  const currentMonthTransactions = getCurrentMonthTransactions();

  // Calculate actual spending per category from transactions
  const actualSpendingPerCategory = currentMonthTransactions
    .filter((t) => t.type === "expense" && t.category)
    .reduce((acc, transaction) => {
      const category = transaction.category!;
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate total revenue from transactions
  const totalRevenue = currentMonthTransactions
    .filter((t) => t.type === "revenue")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // FIXED: Create expenses array from ALL categories (original + custom)
  // Combine categories from props and plannedAmounts to include custom categories
  const allCategories = Array.from(
    new Set([
      ...categories, // Original categories
      ...Object.keys(plannedAmounts), // Custom categories from planned amounts
      ...Object.keys(actualSpendingPerCategory), // Categories that have actual spending
    ])
  );

  const expenses: ExpenseCategory[] = allCategories.map((category) => ({
    category,
    planned: plannedAmounts[category] || 0,
    actual: actualSpendingPerCategory[category] || 0,
  }));

  // Dynamic calculations
  const totalPlanned = Object.values(plannedAmounts).reduce(
    (sum, amount) => sum + amount,
    0
  );
  const totalActualSpent = Object.values(actualSpendingPerCategory).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const actualSpendingPerPlannedCategory = Object.entries(
    actualSpendingPerCategory
  )
    .filter(([category]) => plannedAmounts.hasOwnProperty(category))
    .reduce((acc, [category, amount]) => {
      acc[category] = amount;
      return acc;
    }, {} as Record<string, number>);

  // New total actual spent only on planned categories (current month)
  const totalActualSpentOnPlanned = Object.values(
    actualSpendingPerPlannedCategory
  ).reduce((sum, amount) => sum + amount, 0);

  // Effective bank amount (including revenue)
  const effectiveBankAmount = bankAmount;
  // const safeBalance = effectiveBankAmount - totalPlanned - currentBankLimit;

  // Chart data preparation
  const chartData = expenses.map((exp, index) => ({
    ...exp,
    color: COLORS[index % COLORS.length],
    displayAmount: viewMode === "planned" ? exp.planned : exp.actual || 0,
  }));

  const handleEdit = (
    category: string,
    currentValue: number,
    type: "planned" | "bankLimit"
  ) => {
    setEditingCategory(category);
    setEditValue(currentValue.toString());
  };

  const handleSave = (category: string, type: "planned" | "bankLimit") => {
    const newValue = parseFloat(editValue) || 0;

    if (type === "planned") {
      const updatedPlanned = { ...plannedAmounts, [category]: newValue };
      setPlannedAmounts(updatedPlanned);
      onPlannedAmountChange?.(category, newValue);
    } else if (type === "bankLimit") {
      setCurrentBankLimit(newValue);
      onBankLimitChange?.(newValue);
    }

    setEditingCategory(null);
  };

  const handleBankLimitEdit = () => {
    setEditingCategory("bankLimit");
    setEditValue(currentBankLimit.toString());
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  // Calculate spending trend (last 7 days vs previous 7 days) - still using all transactions for trend analysis
  const getSpendingTrend = () => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentSpending = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= last7Days)
      .reduce((sum, t) => sum + t.amount, 0);

    const previousSpending = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) >= previous7Days &&
          new Date(t.date) < last7Days
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const change = recentSpending - previousSpending;
    const percentChange =
      previousSpending > 0 ? (change / previousSpending) * 100 : 0;

    return { recentSpending, change, percentChange };
  };

  const spendingTrend = getSpendingTrend();

  // Calculate total pending savings contributions (amounts entered but not yet contributed)
  const totalSavingsContributions = (() => {
    try {
      const savedContributions = localStorage.getItem("savingsGoals");
      console.log("Saved contributions:", savedContributions);

      if (savedContributions) {
        const contributions = JSON.parse(savedContributions);

        if (Array.isArray(contributions)) {
          return contributions.reduce(
            (total: number, contribution: any) =>
              total + (Number(contribution.currentAmount) || 0),
            0
          );
        }
      }
    } catch (error) {
      console.error("Error reading pending savings contributions:", error);
    }

    return 0;
  })();

  // Effective bank amount (including revenue)

  const usableBalance =
    effectiveBankAmount - currentBankLimit - totalSavingsContributions;

  // const safeBalance =
  //   effectiveBankAmount -
  //   totalPlanned -
  //   currentBankLimit -
  //   totalSavingsContributions;

  const remainingPlanned = Math.max(
    totalPlanned - totalActualSpentOnPlanned,
    0
  );

  const safeBalance = usableBalance - remainingPlanned;

  // Status determination
  const getStatus = () => {
    if (usableBalance < 0)
      return {
        status: "danger",
        text: "Overspent",
        color: "text-red-600 bg-red-100",
      };
    if (usableBalance < effectiveBankAmount * 0.1)
      return {
        status: "warning",
        text: "Low Funds",
        color: "text-yellow-600 bg-yellow-100",
      };
    return {
      status: "safe",
      text: "Safe",
      color: "text-green-600 bg-green-100",
    };
  };

  const statusInfo = getStatus();

  // Helper function to get current month display
  const getCurrentMonthDisplay = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Month Display */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Budget for {getCurrentMonthDisplay()}
        </h2>
        <p className="text-sm text-gray-600">
          Budget resets automatically each month
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">
            Total Planned Budget
          </h3>
          <p className="text-2xl font-bold text-blue-900">
            ₹{totalPlanned.toLocaleString()}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Spent This Month</h3>
          <p className="text-2xl font-bold text-red-900">
            ₹{totalActualSpentOnPlanned.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">
            Remaining Budget
          </h3>
          <p className="text-2xl font-bold text-green-900">
            ₹{remainingPlanned.toLocaleString()}
          </p>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Budget Progress
          </span>
          <span className="text-sm text-gray-500">
            {totalPlanned > 0
              ? Math.round((totalActualSpentOnPlanned / totalPlanned) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              totalPlanned > 0 && totalActualSpentOnPlanned / totalPlanned > 0.8
                ? "bg-red-600"
                : totalPlanned > 0 &&
                  totalActualSpentOnPlanned / totalPlanned > 0.6
                ? "bg-yellow-600"
                : "bg-green-600"
            }`}
            style={{
              width: `${
                totalPlanned > 0
                  ? Math.min(
                      (totalActualSpentOnPlanned / totalPlanned) * 100,
                      100
                    )
                  : 0
              }%`,
            }}
          ></div>
        </div>
      </div>
      {/* Bank Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BadgeDollarSign className="text-blue-600" />
            Budget Overview
          </h2>
          <div className="flex items-center gap-3">
            {/* <button
              onClick={() => setShowSavingsGoals(!showSavingsGoals)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showSavingsGoals
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-blue-200"
              }`}
            >
              {showSavingsGoals ? "Hide" : "Show"} Savings Goals
            </button> */}
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}
            >
              {statusInfo.text}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Bank Limit</div>
            <div className="flex items-center gap-2">
              {editingCategory === "bankLimit" ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-600">₹</span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave("bankLimit", "bankLimit")}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold text-red-600">
                    ₹{currentBankLimit.toLocaleString()}
                  </div>
                  <button
                    onClick={handleBankLimitEdit}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Planned Budget</div>
            <div className="text-xl font-bold text-blue-600">
              ₹{totalPlanned.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Spent This Month</div>
            <div className="text-xl font-bold text-purple-600">
              ₹{totalActualSpentOnPlanned.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              Remaining Budget
            </div>
            <div className="text-xl font-bold text-purple-600">
              ₹{remainingPlanned.toLocaleString()}
            </div>
          </div>
          {/* <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Spent (Expenses)</div>
            <div className="text-xl font-bold text-purple-600">
              ₹{totalActualSpent.toLocaleString()}
            </div>
          </div> */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              Total Savings Contributions
            </div>
            <div className="text-xl font-bold text-cyan-700">
              ₹{totalSavingsContributions.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              Current Bank Balance
              <div className="group relative">
                <Info size={14} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  Current bank amount including revenue added
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-indigo-600">
              ₹{effectiveBankAmount.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#e3ede0] p-4 rounded-lg shadow-md">
            <div className="flex flex-wrap items-center gap-2 mb-1 text-sm font-medium text-gray-900">
              <h2 className="whitespace-normal break-words">Safe Balance</h2>
              <div className="group relative">
                <Info size={16} className="text-gray-900 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                  <p className="mb-1">
                    Amount safe to spend based on planned expenses.
                  </p>
                  <p className="mb-1">
                    It shows how much you can spend without touching your bank
                    limit and fulfiling the planned expenses.
                  </p>
                  <p className="mb-1">
                    Usable Balance - Remaining
                    Planned
                  </p>
                  <p className="mb-1">
                    Scroll Bottom to see how this is calculated.
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`text-xl font-bold ${
                safeBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{safeBalance.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              Usable Balance
              <div className="group relative">
                <Info size={14} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  <p className="mb-1">
                    Actual remaining balance after expenses.
                  </p>

                  <p className="mb-1">
                    Bank Balance - Bank Limit - Total Savings
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`text-xl font-bold ${
                usableBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{usableBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Spending Trend */}
        {spendingTrend.change !== 0 && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              7-Day Spending Trend
            </div>
            <div className="flex items-center gap-2">
              {spendingTrend.change > 0 ? (
                <TrendingUp className="text-red-500" size={16} />
              ) : (
                <TrendingDown className="text-green-500" size={16} />
              )}
              <span
                className={`font-semibold ${
                  spendingTrend.change > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {spendingTrend.change > 0 ? "+" : ""}₹
                {Math.abs(spendingTrend.change).toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                ({spendingTrend.percentChange > 0 ? "+" : ""}
                {spendingTrend.percentChange.toFixed(1)}% vs last week)
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Savings Goals Section - Conditionally Rendered */}
      {showSavingsGoals && (
        <div className="animate-in slide-in-from-top duration-300">
          <SavingsGoalTracker transactions={transactions} />
        </div>
      )}
      {/* Alerts & Warnings */}
      {(usableBalance < 0 || safeBalance < 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Budget Alert!</span>
          </div>
          <div className="text-red-700 space-y-1">
            {usableBalance < 0 && (
              <p>
                ⚠️ You've exceeded your safe limit by ₹
                {Math.abs(usableBalance).toLocaleString()}!
              </p>
            )}
            {safeBalance < 0 && (
              <p>
                💡 Consider reducing discretionary spending in categories like
                entertainment or dining.
              </p>
            )}
            <p className="text-sm">
              💡 Tip: Bank Limit (₹{currentBankLimit.toLocaleString()}) is your
              emergency buffer - keep it untouched!
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Expense Breakdown
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("planned")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "planned"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => setViewMode("actual")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "actual"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Actual
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {expenses.map((expense, index) => {
              const actualAmount = expense.actual || 0;
              const plannedAmount = expense.planned || 0;
              // 🔒 Only render if there's a planned amount
              if (plannedAmount <= 0) return null;
              const difference = actualAmount - plannedAmount;
              const percentageChange =
                plannedAmount > 0 ? (difference / plannedAmount) * 100 : 0;
              const isOverBudget = difference > 0;

              return (
                <div
                  key={expense.category}
                  className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="font-medium text-gray-900">
                        {expense.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Planned: </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600">
                          ₹{plannedAmount.toLocaleString()}
                        </span>
                        <button
                          onClick={() =>
                            handleEdit(
                              `planned-${expense.category}`,
                              plannedAmount,
                              "planned"
                            )
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {/* <Edit size={12} /> */}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Actual: </span>
                      <span className="font-medium text-purple-600">
                        ₹{actualAmount.toLocaleString()}
                      </span>
                      {actualAmount > 0 && (
                        <span className="text-xs text-gray-500 ml-1">
                          (
                          {
                            transactions.filter(
                              (t) =>
                                t.type === "expense" &&
                                t.category === expense.category
                            ).length
                          }{" "}
                          transactions)
                        </span>
                      )}
                    </div>
                  </div>

                  {difference !== 0 && plannedAmount > 0 && (
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      {isOverBudget ? (
                        <TrendingUp size={14} className="text-red-500" />
                      ) : (
                        <TrendingDown size={14} className="text-green-500" />
                      )}
                      <span
                        className={
                          isOverBudget ? "text-red-600" : "text-green-600"
                        }
                      >
                        {isOverBudget ? "Over by " : "Under by "}₹
                        {Math.abs(difference).toLocaleString()}(
                        {Math.abs(percentageChange).toFixed(1)}%)
                      </span>
                    </div>
                  )}

                  {/* Visual progress bar */}
                  {plannedAmount > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isOverBudget ? "bg-red-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (actualAmount / plannedAmount) * 100,
                              100
                            )}%`,
                          }}
                        />
                        {isOverBudget && (
                          <div className="text-xs text-red-600 mt-1">
                            {((actualAmount / plannedAmount) * 100).toFixed(0)}%
                            of planned budget used
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show message if no planned amount set */}
                  {plannedAmount === 0 && (
                    <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded">
                      Set a planned amount to track this category
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Charts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Expense Distribution
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PieChart size={16} />
              {viewMode === "planned" ? "Planned" : "Actual"} View
            </div>
          </div>

          {/* Simple Pie Chart Representation */}
          <div className="space-y-3">
            {chartData
              .filter((item) => item.displayAmount > 0) // Only show categories with spending
              .sort((a, b) => b.displayAmount - a.displayAmount) // Sort by amount descending
              .map((item, index) => {
                const total = chartData
                  .filter((exp) => exp.displayAmount > 0)
                  .reduce((sum, exp) => sum + exp.displayAmount, 0);
                const percentage =
                  total > 0 ? (item.displayAmount / total) * 100 : 0;

                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: item.color,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-600 w-20 text-right">
                        ₹{item.displayAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}

            {chartData.filter((item) => item.displayAmount > 0).length ===
              0 && (
              <div className="text-center py-8 text-gray-500">
                <PieChart size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No expenses recorded yet</p>
                <p className="text-sm">
                  Start adding transactions to see the breakdown
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Active Categories: </span>
                <span className="font-semibold">
                  {chartData.filter((item) => item.displayAmount > 0).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Avg per category: </span>
                <span className="font-semibold">
                  ₹
                  {chartData.filter((item) => item.displayAmount > 0).length > 0
                    ? Math.round(
                        totalActualSpent /
                          chartData.filter((item) => item.displayAmount > 0)
                            .length
                      ).toLocaleString()
                    : "0"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Total Transactions: </span>
                <span className="font-semibold">
                  {transactions.filter((t) => t.type === "expense").length}{" "}
                  expenses,{" "}
                  {transactions.filter((t) => t.type === "revenue").length}{" "}
                  revenue
                </span>
              </div>
            </div>
          </div>
        </div>{" "}
      </div>{" "}
      <BalanceExplanation
        bankAmount={effectiveBankAmount}
        bankLimit={currentBankLimit}
        totalPlanned={totalPlanned}
        totalActualSpent={totalActualSpent} // optional: not used in current calc
        totalSavingsContributions={totalSavingsContributions}
        remainingPlanned={remainingPlanned}
        totalActualSpentOnPlanned={totalActualSpentOnPlanned}
      />
    </div>
  );
}

// const usableBalance =
//     effectiveBankAmount - currentBankLimit - totalSavingsContributions;

// const remainingPlanned = Math.max(totalPlanned - totalActualSpentOnPlanned, 0);

// const safeBalance = usableBalance - remainingPlanned;
