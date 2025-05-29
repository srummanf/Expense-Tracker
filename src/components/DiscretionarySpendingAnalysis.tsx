import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { Transaction } from "../types";

// Essential Categories for 50/30/20 budgeting
const essentialCategories = [
  "Housing",
  "Utilities",
  "Groceries",
  "Healthcare",
  "Insurance",
  "Transportation",
];

interface DiscretionarySpendingProps {
  transactions: Transaction[];
}

export function DiscretionarySpendingAnalysis({
  transactions,
}: DiscretionarySpendingProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [income, setIncome] = useState<number>(0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2023, i, 1);
    return {
      value: i,
      label: date.toLocaleString("default", { month: "long" }),
    };
  });

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Calculate monthly spending for the selected month/year
  const getMonthlySpending = () => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

    const monthlyExpenses = transactions.filter(
      (t) =>
        t.type === "expense" &&
        isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
    );

    let essentialTotal = 0;
    let discretionaryTotal = 0;

    monthlyExpenses.forEach((expense) => {
      if (essentialCategories.includes(expense.category || "")) {
        essentialTotal += expense.amount;
      } else {
        discretionaryTotal += expense.amount;
      }
    });

    const total = essentialTotal + discretionaryTotal;

    return {
      essential: {
        amount: essentialTotal,
        percentage: total ? (essentialTotal / total) * 100 : 0,
      },
      discretionary: {
        amount: discretionaryTotal,
        percentage: total ? (discretionaryTotal / total) * 100 : 0,
      },
      total,
    };
  };

  const spending = getMonthlySpending();

  // 50/30/20 budgeting targets based on income input
  const targets = {
    needs: income * 0.5,
    wants: income * 0.3,
    savings: income * 0.2,
  };

  const unallocated = Math.max(
    0,
    income - spending.essential.amount - spending.discretionary.amount
  );

  // Pie chart data including "unallocated" money (income - expenses)
  const chartData = [
    {
      name: "Needs (Essential)",
      value: spending.essential.amount,
      color: "#3b82f6",
    },
    {
      name: "Wants (Discretionary)",
      value: spending.discretionary.amount,
      color: "#f97316",
    },
    { name: "Unallocated / Savings", value: unallocated, color: "#10b981" },
  ].filter((item) => item.value > 0);

  // Bar chart data for comparison
  const comparisonData = [
    {
      category: "Needs",
      actual: spending.essential.amount,
      target: targets.needs,
      status: spending.essential.amount <= targets.needs ? "good" : "over",
    },
    {
      category: "Wants",
      actual: spending.discretionary.amount,
      target: targets.wants,
      status: spending.discretionary.amount <= targets.wants ? "good" : "over",
    },
    {
      category: "Savings",
      actual: unallocated,
      target: targets.savings,
      status: unallocated >= targets.savings ? "good" : "under",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-emerald-600";
      case "over":
        return "text-red-500";
      case "under":
        return "text-amber-500";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return "✓";
      case "over":
        return "⚠";
      case "under":
        return "⚡";
      default:
        return "";
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: '10px 15px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          color,
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold' }}>{name}</p>
        <p style={{ margin: 0 }}>{`₹ ${value.toFixed(2)}`}</p>
      </div>
    );
  }

  return null;
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Smart Budget Analysis
                  </h1>
                  <p className="text-gray-500 text-sm">
                    50/30/20 Rule & Spending Insights
                  </p>
                </div>
              </div>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                Analyze your monthly spending patterns with intelligent
                categorization. Track your
                <span className="font-semibold text-blue-600">
                  {" "}
                  essential needs
                </span>{" "}
                versus
                <span className="font-semibold text-orange-600">
                  {" "}
                  discretionary wants
                </span>
                , and optimize your budget using the proven
                <span className="font-semibold text-emerald-600">
                  {" "}
                  50/30/20 budgeting strategy
                </span>
                .
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Income Input */}
          <div className="mt-8 max-w-md">
            <label className="block text-gray-700 font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">💵</span>
              Monthly Income
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                value={income || ""}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                placeholder="Enter your monthly income"
                className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-8">
            {/* Pie Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Spending Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(1)}%`
                      }
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart Comparison */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Budget vs Actual Comparison
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `₹ ${Number(value).toFixed(2)}`,
                        name === "actual" ? "Actual" : "Target",
                      ]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="target"
                      fill="#e5e7eb"
                      name="target"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actual"
                      fill="#3b82f6"
                      name="actual"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column - Summary Cards */}
          <div className="space-y-6">
            {/* Period Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">📅</span>
                {months[selectedMonth].label} {selectedYear}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-300 text-sm">Total Expenses</p>
                  <p className="text-3xl font-bold">
                    ₹{spending.total.toFixed(2)}
                  </p>
                </div>
                {income > 0 && (
                  <div className="pt-4 border-t border-slate-600">
                    <p className="text-slate-300 text-sm">Income Utilization</p>
                    <p className="text-xl font-bold">
                      {spending.total > 0
                        ? ((spending.total / income) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Needs Card */}
            <div className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-500 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  Needs (Essential)
                </h4>
                <span
                  className={`text-2xl ${getStatusColor(
                    comparisonData[0].status
                  )}`}
                >
                  {getStatusIcon(comparisonData[0].status)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{spending.essential.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {spending.essential.percentage.toFixed(1)}% of total
                    spending
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    INCLUDES
                  </p>
                  <p className="text-sm text-blue-800">
                    Housing, Utilities, Groceries, Healthcare, Insurance,
                    Transportation
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Target (50% of income):
                    </span>
                    <span className="font-semibold">
                      ₹{targets.needs.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        spending.essential.amount <= targets.needs
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          targets.needs > 0
                            ? (spending.essential.amount / targets.needs) * 100
                            : 0
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p
                    className={`text-xs font-semibold ${getStatusColor(
                      comparisonData[0].status
                    )}`}
                  >
                    {spending.essential.amount <= targets.needs
                      ? "✓ Within budget for essential needs"
                      : "⚠ Exceeding recommended budget"}
                  </p>
                </div>
              </div>
            </div>

            {/* Wants Card */}
            <div className="bg-white rounded-2xl shadow-xl border-l-4 border-orange-500 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Wants (Discretionary)
                </h4>
                <span
                  className={`text-2xl ${getStatusColor(
                    comparisonData[1].status
                  )}`}
                >
                  {getStatusIcon(comparisonData[1].status)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{spending.discretionary.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {spending.discretionary.percentage.toFixed(1)}% of total
                    spending
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-700 font-medium mb-1">
                    INCLUDES
                  </p>
                  <p className="text-sm text-orange-800">
                    Entertainment, Dining out, Shopping, Subscriptions, Travel
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Target (30% of income):
                    </span>
                    <span className="font-semibold">
                      ₹{targets.wants.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        spending.discretionary.amount <= targets.wants
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          targets.wants > 0
                            ? (spending.discretionary.amount / targets.wants) *
                                100
                            : 0
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p
                    className={`text-xs font-semibold ${getStatusColor(
                      comparisonData[1].status
                    )}`}
                  >
                    {spending.discretionary.amount <= targets.wants
                      ? "✓ Discretionary spending on track"
                      : "⚠ Consider reducing discretionary expenses"}
                  </p>
                </div>
              </div>
            </div>

            {/* Savings Card */}
            <div className="bg-white rounded-2xl shadow-xl border-l-4 border-emerald-500 p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  Savings
                </h4>
                <span
                  className={`text-2xl ${getStatusColor(
                    comparisonData[2].status
                  )}`}
                >
                  {getStatusIcon(comparisonData[2].status)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{unallocated.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Available for savings</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Target (20% of income):
                    </span>
                    <span className="font-semibold">
                      ₹{targets.savings.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        unallocated >= targets.savings
                          ? "bg-green-500"
                          : "bg-amber-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          targets.savings > 0
                            ? (unallocated / targets.savings) * 100
                            : 0
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p
                    className={`text-xs font-semibold ${getStatusColor(
                      comparisonData[2].status
                    )}`}
                  >
                    {unallocated >= targets.savings
                      ? "✓ Meeting or exceeding savings goal"
                      : "⚡ Try to increase savings to 20%"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tip Card */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Smart Tip
              </h4>
              <p className="text-sm leading-relaxed mb-4">
                Review this analysis monthly to identify spending patterns.
                Focus on optimizing discretionary expenses to boost your savings
                rate.
              </p>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-xs font-semibold mb-1">REMEMBER</p>
                <p className="text-sm">
                  The 50/30/20 rule is flexible — adjust based on your personal
                  financial goals and circumstances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Old Component Code

// This code is a React component that analyzes discretionary spending by comparing essential and discretionary expenses.

// import React, { useState } from 'react';
// import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
// import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
// import type { Transaction } from '../types';

// interface DiscretionarySpendingProps {
//   transactions: Transaction[];
// }

// // Define which categories are essential vs discretionary
// const essentialCategories = ['Housing', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Transportation'];

// export function DiscretionarySpendingAnalysis({ transactions }: DiscretionarySpendingProps) {
//   const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
//   const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

//   const months = Array.from({ length: 12 }, (_, i) => {
//     const date = new Date(2023, i, 1);
//     return { value: i, label: date.toLocaleString('default', { month: 'long' }) };
//   });

//   const years = Array.from(
//     { length: 5 },
//     (_, i) => new Date().getFullYear() - i
//   ).sort((a, b) => b - a);

//   const getMonthlySpending = () => {
//     const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
//     const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

//     const monthlyExpenses = transactions.filter(
//       t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
//     );

//     let essentialTotal = 0;
//     let discretionaryTotal = 0;

//     monthlyExpenses.forEach(expense => {
//       if (essentialCategories.includes(expense.category || '')) {
//         essentialTotal += expense.amount;
//       } else {
//         discretionaryTotal += expense.amount;
//       }
//     });

//     const total = essentialTotal + discretionaryTotal;

//     return {
//       essential: {
//         amount: essentialTotal,
//         percentage: total ? (essentialTotal / total) * 100 : 0
//       },
//       discretionary: {
//         amount: discretionaryTotal,
//         percentage: total ? (discretionaryTotal / total) * 100 : 0
//       },
//       total
//     };
//   };

//   const spending = getMonthlySpending();

//   const data = [
//     { name: 'Essential', value: spending.essential.amount, color: '#3b82f6' },
//     { name: 'Discretionary', value: spending.discretionary.amount, color: '#f97316' }
//   ];

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-lg font-medium text-gray-900">Essential vs Discretionary Spending</h2>
//           <p className="text-sm text-gray-500">Analyze your needs vs wants spending</p>
//         </div>
//         <div className="flex gap-2">
//           <select
//             value={selectedMonth}
//             onChange={(e) => setSelectedMonth(Number(e.target.value))}
//             className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//           >
//             {months.map(month => (
//               <option key={month.value} value={month.value}>{month.label}</option>
//             ))}
//           </select>
//           <select
//             value={selectedYear}
//             onChange={(e) => setSelectedYear(Number(e.target.value))}
//             className="px-3 py-2 border border-gray-300 rounded-md text-sm"
//           >
//             {years.map(year => (
//               <option key={year} value={year}>{year}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="flex flex-col justify-center">
//           <ResponsiveContainer width="100%" height={250}>
//             <PieChart>
//               <Pie
//                 data={data}
//                 innerRadius={60}
//                 outerRadius={90}
//                 paddingAngle={5}
//                 dataKey="value"
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//               >
//                 {data.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="flex flex-col justify-center space-y-4">
//           <div>
//             <h3 className="text-sm font-medium text-gray-500">Total Monthly Expenses</h3>
//             <p className="text-2xl font-bold">${spending.total.toFixed(2)}</p>
//           </div>

//           <div>
//             <div className="flex justify-between items-center">
//               <h3 className="text-sm font-medium text-blue-600">Essential Spending</h3>
//               <span className="text-sm font-medium">{spending.essential.percentage.toFixed(1)}%</span>
//             </div>
//             <p className="text-xl font-semibold">${spending.essential.amount.toFixed(2)}</p>
//             <p className="text-xs text-gray-500 mt-1">Housing, Utilities, Groceries, etc.</p>
//           </div>

//           <div>
//             <div className="flex justify-between items-center">
//               <h3 className="text-sm font-medium text-orange-600">Discretionary Spending</h3>
//               <span className="text-sm font-medium">{spending.discretionary.percentage.toFixed(1)}%</span>
//             </div>
//             <p className="text-xl font-semibold">${spending.discretionary.amount.toFixed(2)}</p>
//             <p className="text-xs text-gray-500 mt-1">Entertainment, Dining out, Shopping, etc.</p>
//           </div>

//           <div className="p-4 bg-blue-50 rounded-lg">
//             <p className="text-sm text-blue-800">
//               Tip: Focus on reducing discretionary spending to increase your savings rate.
//               Aim for a 50/30/20 budget: 50% needs, 30% wants, 20% savings.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
