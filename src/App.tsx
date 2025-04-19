import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Wallet } from "lucide-react";
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
import NavigationButtons from "./components/NavigationButtons";
import { SavingsGoalTracker } from "./components/SavingsGoalTracker";
import { FinancialHealthScore } from "./components/FinancialHealthScore";
import { BillReminders } from "./components/BillReminders";

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

  const exportToCSV = () => {
    const headers = ["Date,Type,Amount,Reason,Category\n"];
    const csvData = transactions.map(
      (transaction) =>
        `${transaction.date},${transaction.type},${transaction.amount},${
          transaction.reason
        },${transaction.category || "Other"}\n`
    );
    const blob = new Blob([...headers, ...csvData], { type: "text/csv" });

    // Get the current date
    const now = new Date();
    const day = now.getDate();
    const monthName = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();
    const formattedDate = `${day}_${monthName}_${year}`;

    // Set the filename with the formatted date
    const filename = `financial_transaction_${formattedDate}.csv`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = transactions
    .filter((t) => t.type === "revenue")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalRevenue - totalExpenses;

  const handleBudgetChange = (amount: number) => {
    setBudgetLimit((prev) => ({ ...prev, amount }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Expense Tracker
              </h1>
              <div className="mt-2 space-y-1">
                <p className="text-gray-600">
                  Total Revenue:{" "}
                  <span className="text-green-600 font-medium">
                    ${totalRevenue.toFixed(2)}
                  </span>
                </p>
                <p className="text-gray-600">
                  Total Expenses:{" "}
                  <span className="text-red-600 font-medium">
                    ${totalExpenses.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                  balance >= 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <Wallet size={24} />
                <div>
                  <p className="text-sm font-medium">Current Balance</p>
                  <p className="text-lg font-bold">${balance.toFixed(2)}</p>
                </div>
              </motion.div>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Download size={20} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <TransactionForm
            onSubmit={handleAddTransaction}
            onImportCSV={handleImportCSV}
          />

          {transactions.length > 0 && (
            <>
              {/* Navigation Buttons */}
              <NavigationButtons />
              
              {/* Calendar View */}
              <section id="calendar" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Calendar View</h2>
                <BigCalendar transactions={transactions} />
              </section>
              
              {/* Net Worth Timeline */}
              <section id="netWorthTimeline" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Net Worth Timeline</h2>
                <NetWorthTimeline transactions={transactions} />
              </section>

              {/* Expense Forecast */}
              <section id="expenseForecast" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Expense Forecast</h2>
                <ExpenseForecast transactions={transactions} />
              </section>

              {/* Monthly Calendar */}
              <section id="monthlyCalendar" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Spending Calendar</h2>
                <MonthlySpendingCalendar transactions={transactions} />
              </section>
              
              {/* Weekly Trends */}
              <section id="weeklyTrends" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Spending Trends</h2>
                <WeeklySpendingTrends transactions={transactions} />
              </section>

              {/* Cash Flow Waterfall */}
              <section id="cashflowWaterfall" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Cash Flow Waterfall</h2>
                <CashFlowWaterfall transactions={transactions} />
              </section>
              
              {/* Recurring Transactions */}
              <section id="recurringTransactions" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recurring Transactions Analysis</h2>
                <RecurringTransactionsAnalysis transactions={transactions} />
              </section>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Indicator */}
                <section id="budgetIndicator" className="pt-4 mt-2">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Budget Indicator</h2>
                  <BudgetIndicator
                    transactions={transactions}
                    budgetLimit={budgetLimit}
                    onBudgetChange={handleBudgetChange}
                  />
                </section>
                
                {/* Spending Breakdown */}
                <section id="spendingBreakdown" className="pt-4 mt-2">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Spending Breakdown</h2>
                  <SpendingBreakdown transactions={transactions} />
                </section>
              </div>
              
              {/* Expense Analysis */}
              <section id="expenseAnalysis" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Expense Analysis</h2>
                <ExpenseAnalysis transactions={transactions} />
              </section>
              
              {/* Savings Goal Tracker */}
              <section id="savingGoalTracker" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Savings Goal Tracker</h2>
                <SavingsGoalTracker transactions={transactions} />
              </section>
              
              {/* Financial Health Score */}
              <section id="FinancialHealthScore" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Financial Health Score</h2>
                <FinancialHealthScore transactions={transactions} />
              </section>

              {/* Bill Reminders */}
              <section id="BillReminders" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Bill Reminders</h2>
                <BillReminders transactions={transactions} />
              </section>
              
              {/* Financial Chart */}
              <section id="financialChart" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Financial Chart</h2>
                <FinancialChart transactions={transactions} />
              </section>
              
              {/* Transaction List */}
              <section id="transactionList" className="pt-4 mt-2">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction List</h2>
                <TransactionList
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
                />
              </section>
            </>
          )}

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No transactions yet. Add your first transaction above!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default App;