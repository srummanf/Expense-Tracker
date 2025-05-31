import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Wallet,
  LayoutDashboard,
  Calendar,
  PieChart,
  BarChart2,
  TrendingUp,
  List,
  Target,
  Shield,
  Clock,
  Briefcase,
  PiggyBank,
  Bell,
  ArrowDownToLine,
  Menu,
  X,
  BadgeDollarSign,
  Settings,
} from "lucide-react";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { FinancialChart } from "./components/FinancialChart";
import { SpendingBreakdown } from "./components/SpendingBreakdown";
import { BudgetIndicator } from "./components/BudgetIndicator";
import { ExpenseAnalysis } from "./components/ExpenseAnalysis";
import { BigCalendar } from "./components/BigCalendar";
import { NetWorthTimeline } from "./components/NetWorthTimeline";
import { ExpenseForecast } from "./components/ExpenseForecast";
import type { Transaction, TransactionFormData, BudgetLimit } from "./types";
import { CashFlowWaterfall } from "./components/CashFlowWaterfall";
import { MonthlySpendingHeatmap } from "./components/MonthlySpendingHeatmap";
import { RecurringTransactionsAnalysis } from "./components/RecurringTransactionsAnalysis";
import { WeeklySpendingTrends } from "./components/WeeklySpendingTrends";
import { MonthlySpendingCalendar } from "./components/MonthlySpendingCalendar";
import { SavingsGoalTracker } from "./components/SavingsGoalTracker";
import FinancialHealthScore from "./components/FinancialHealthScore";
import BillReminders from "./components/BillReminders";
import { InvestmentPortfolioTracker } from "./components/InvestmentPortfolioTracker";
import { ExpenseToIncomeRatioTracker } from "./components/ExpenseToIncomeRatioTracker";
import { DiscretionarySpendingAnalysis } from "./components/DiscretionarySpendingAnalysis";
import BudgetOverview from "./components/BudgetOverview";
import PlannedAmountsManager from "./components/PlannedAmountsManager";
import { EMISIPTracker } from "./components/EMISIPTracker";

// Navigation items configuration
const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "All Transactions", icon: List },
  { id: "calendar", label: "Transaction Calendar", icon: Calendar },
  { id: "budgetOverview", label: "Budget Overview", icon: BadgeDollarSign },
  { id: "discretionary", label: "50/30/20 Rule", icon: PiggyBank },
  { id: "plannedAmounts", label: "Budget Planning", icon: Settings },
  { id: "savings", label: "Saving Goals", icon: Target },
  { id: "emisip", label: "EMI SIP Goals", icon: Target },
  { id: "reminders", label: "Bill Reminders", icon: Bell },
  { id: "weeklyTrends", label: "Weekly Trends", icon: PieChart },
  { id: "recurring", label: "Recurring Transactions", icon: Clock },
  { id: "health", label: "Financial Health", icon: Shield },
  { id: "ratios", label: "Expense Ratio", icon: PieChart },
  { id: "analysis", label: "Graphical Analysis", icon: BarChart2 },
  { id: "netWorth", label: "Net Worth", icon: TrendingUp },
  { id: "forecast", label: "Forecast", icon: BarChart2 },
  // { id: "cashFlow", label: "Cash Flow", icon: ArrowDownToLine },
  // { id: "budget", label: "Budget", icon: Wallet },
  // { id: "spending", label: "Spending", icon: PieChart },
  // { id: "investments", label: "Investments", icon: Briefcase },
  // { id: "chart", label: "Charts", icon: BarChart2 },
];

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [budgetLimit, setBudgetLimit] = useState<BudgetLimit>(() => {
    const saved = localStorage.getItem("budgetLimit");
    return saved
      ? JSON.parse(saved)
      : {
          amount: 1000,
          period: "monthly",
        };
  });

  // Load planned amounts from localStorage
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem("plannedAmounts");
      return saved
        ? JSON.parse(saved)
        : {
            "Food & Dining": 8000,
            Transportation: 3000,
            Entertainment: 4000,
            Shopping: 6000,
            Utilities: 2500,
          };
    }
  );

  // State for sidebar navigation
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("budgetLimit", JSON.stringify(budgetLimit));
  }, [budgetLimit]);

  const handleAddTransaction = (formData: TransactionFormData) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(formData.amount),
      reason: formData.reason,
      date: formData.date,
      type: formData.type,
      category: formData.category,
    };

    setTransactions((prev) => {
      const updated = [...prev, newTransaction];
      return updated.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  };

  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setTransactions((prev) =>
      prev
        .map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(
      transactions.filter((transaction) => transaction.id !== id)
    );
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      const newTransactions: Transaction[] = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",");
          return {
            id: crypto.randomUUID(),
            date: values[headers.indexOf("Date")],
            type: values[headers.indexOf("Type")] as "expense" | "revenue",
            amount: parseFloat(values[headers.indexOf("Amount")]),
            reason: values[headers.indexOf("Reason")],
            category: values[headers.indexOf("Category")] || "Other",
          };
        });

      setTransactions((prev) => {
        const updated = [...prev, ...newTransactions];
        return updated.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    };
    reader.readAsText(file);
  };

  const exportToCSV = async () => {
    try {
      const headers = ["Date,Type,Amount,Reason,Category\n"];
      const csvData = transactions
        .map(
          (transaction) =>
            `${transaction.date},${transaction.type},${transaction.amount},${
              transaction.reason
            },${transaction.category || "Other"}\n`
        )
        .join("");

      const now = new Date();
      const day = now.getDate();
      const monthName = now.toLocaleString("default", { month: "long" });
      const year = now.getFullYear();
      const formattedDate = `${day}_${monthName}_${year}`;
      const filename = `financial_transaction_${formattedDate}.csv`;

      // Show file save picker
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "CSV Files",
            accept: { "text/csv": [".csv"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(headers + csvData);
      await writable.close();

      alert("CSV exported successfully!");
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const totalRevenue = transactions
    .filter((t) => t.type === "revenue")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalRevenue - totalExpenses;

  const saved = localStorage.getItem("safeBalance");
  const parsedSafeBalance = saved ? parseFloat(saved) : 0;

  //   const sampleData = {
  //   bankAmount: balance,
  //   bankLimit: 5000,
  //   expenses: [
  //     { category: "Food & Dining", planned: 8000, actual: 9500 },
  //     { category: "Transportation", planned: 3000, actual: 2800 },
  //     { category: "Entertainment", planned: 4000, actual: 5200 },
  //     { category: "Shopping", planned: 6000 },
  //     { category: "Utilities", planned: 2500, actual: 2400 },
  //   ],
  // };

  // Sample integration with your TransactionForm data
  const categories = [
    "Food & Dining",
    "Transportation",
    "Housing",
    "Utilities",
    "Healthcare",
    "Groceries",
    "Entertainment",
    "Shopping",
    "Travel",
    "Education",
    "Amount Received",
    "Insurance",
    "Personal Care",
    "Other",
  ];

  const transactionss = [
    { category: "Food & Dining", amount: 1200, type: "expense" },
    { category: "Transportation", amount: 450, type: "expense" },
    { category: "Entertainment", amount: 800, type: "expense" },
    // ... more transactions from your TransactionForm
  ];

  const initialPlannedAmounts = {
    "Food & Dining": 8000,
    Transportation: 3000,
    Entertainment: 4000,
    Shopping: 6000,
    Utilities: 2500,
  };

  const handleBudgetChange = (amount: number) => {
    setBudgetLimit((prev) => ({ ...prev, amount }));
  };

  // Handler for planned amounts changes
  const handlePlannedAmountsChange = (amounts: Record<string, number>) => {
    setPlannedAmounts(amounts);
  };

  // Content rendering based on active view
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <TransactionForm
              onSubmit={handleAddTransaction}
              onImportCSV={handleImportCSV}
            />

            {transactions.length > 0 ? (
              <>
                <FinancialChart transactions={transactions} />
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <BudgetIndicator
                      transactions={transactions}
                      budgetLimit={budgetLimit}
                      onBudgetChange={handleBudgetChange}
                    />
                  </div>
                  <div className="col-span-2">
                    <SpendingBreakdown transactions={transactions} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm">
                  Start by adding a transaction or importing a CSV.
                </p>
              </div>
            )}
          </motion.div>
        );
      case "calendar":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BigCalendar transactions={transactions} />
          </motion.div>
        );
      case "plannedAmounts":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PlannedAmountsManager
              categories={categories}
              initialPlannedAmounts={plannedAmounts}
              onPlannedAmountsChange={handlePlannedAmountsChange}
            />
          </motion.div>
        );
      case "budgetOverview":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BudgetOverview
              bankAmount={balance}
              bankLimit={5000}
              categories={categories}
              transactions={transactions}
              initialPlannedAmounts={plannedAmounts}
              onPlannedAmountChange={(category, amount) => {
                console.log(`Planned amount for ${category}: ₹${amount}`);
                // Update your state/backend
              }}
              onBankLimitChange={(limit) => {
                console.log(`New bank limit: ₹${limit}`);
                // Update your state/backend
              }}
            />
          </motion.div>
        );

      case "netWorth":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <NetWorthTimeline transactions={transactions} />
          </motion.div>
        );
      case "forecast":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExpenseForecast transactions={transactions} />
          </motion.div>
        );
      case "weeklyTrends":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WeeklySpendingTrends transactions={transactions} />
          </motion.div>
        );
      case "cashFlow":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CashFlowWaterfall transactions={transactions} />
          </motion.div>
        );
      case "recurring":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <RecurringTransactionsAnalysis transactions={transactions} />
          </motion.div>
        );
      case "budget":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BudgetIndicator
              transactions={transactions}
              budgetLimit={budgetLimit}
              onBudgetChange={handleBudgetChange}
            />
          </motion.div>
        );
      case "spending":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SpendingBreakdown transactions={transactions} />
          </motion.div>
        );
      case "analysis":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExpenseAnalysis transactions={transactions} />
          </motion.div>
        );
      case "savings":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SavingsGoalTracker transactions={transactions} />
          </motion.div>
        );
      case "emisip":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <EMISIPTracker />
          </motion.div>
        );
      case "health":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FinancialHealthScore transactions={transactions} />
          </motion.div>
        );
      case "reminders":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BillReminders />
          </motion.div>
        );
      case "investments":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <InvestmentPortfolioTracker transactions={transactions} />
          </motion.div>
        );
      case "ratios":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ExpenseToIncomeRatioTracker transactions={transactions} />
          </motion.div>
        );
      case "discretionary":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DiscretionarySpendingAnalysis transactions={transactions} />
          </motion.div>
        );
      case "chart":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FinancialChart transactions={transactions} />
          </motion.div>
        );
      case "transactions":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : isMobile ? -300 : -240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed h-full bg-white border-r border-gray-200 z-30 ${
          isSidebarOpen ? "w-64" : isMobile ? "w-0" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-gray-900">
                Expense Tracker
              </h1>
            )}
            {/* <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button> */}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${
                    isSidebarOpen ? "justify-start space-x-3" : "justify-center"
                  } px-3 py-2 mb-1 rounded-lg transition-colors ${
                    activeView === item.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen
            ? isMobile
              ? "ml-0"
              : "ml-64"
            : isMobile
            ? "ml-0"
            : "ml-20"
        }`}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              {isMobile && !isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 mr-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu size={24} />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find((item) => item.id === activeView)?.label}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-sm">
                  <p className="text-gray-600">
                    Revenue:{" "}
                    <span className="text-green-600 font-medium">
                      ₹{totalRevenue.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Expenses:{" "}
                    <span className="text-red-600 font-medium">
                      ₹{totalExpenses.toFixed(2)}
                    </span>
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    balance >= 0
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <Wallet size={20} />
                  <div>
                    <p className="text-xs font-medium">Bank Balance</p>
                    <p className="text-sm font-bold">₹{balance.toFixed(2)}</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    parsedSafeBalance >= 0
                      ? "bg-green-100 text-green-700 shadow-lg border border-green-200"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <Wallet size={20} />
                  <div>
                    <p className="text-xs font-medium">Safe Balance</p>
                    <p className="text-sm font-bold">
                      ₹{parsedSafeBalance.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {transactions.length > 0 ? (
              renderContent()
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <TransactionForm
                  onSubmit={handleAddTransaction}
                  onImportCSV={handleImportCSV}
                />
                <p className="text-gray-500">
                  No transactions yet. Add your first transaction to get
                  started!
                </p>
                <button
                  onClick={() => setActiveView("dashboard")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
