import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import type { Transaction } from "../types";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

interface CashFlowWaterfallProps {
  transactions: Transaction[];
  initialBalance?: number;
}

export function CashFlowWaterfall({
  transactions,
  initialBalance = 0,
}: CashFlowWaterfallProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [balance, setBalance] = useState(initialBalance);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const chartData = useMemo(() => {
    const monthTransactions = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = balance;
    const transactionsByDay: { [key: string]: Transaction[] } = {};

    monthTransactions.forEach((t) => {
      const day = format(new Date(t.date), "yyyy-MM-dd");
      if (!transactionsByDay[day]) transactionsByDay[day] = [];
      transactionsByDay[day].push(t);
    });

    const data = Object.keys(transactionsByDay).map((day) => {
      const dayTransactions = transactionsByDay[day];
      const income = dayTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      runningBalance += net;

      return {
        date: format(new Date(day), "MMM dd"),
        income,
        expense: -expense,
        balance: runningBalance,
      };
    });

    if (data.length > 0) {
      data.unshift({
        date: "Start",
        income: 0,
        expense: 0,
        balance,
      });
    }

    return data;
  }, [transactions, currentMonth, balance]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBalance(parseFloat(e.target.value) || 0);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded border shadow-md text-sm space-y-1">
          <p className="font-medium">{label}</p>
          {data.income > 0 && <p className="text-green-600">Income: {formatCurrency(data.income)}</p>}
          {data.expense < 0 && <p className="text-red-600">Expense: {formatCurrency(Math.abs(data.expense))}</p>}
          <p className="text-blue-600 font-medium">Balance: {formatCurrency(data.balance)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Cash Flow Waterfall</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This chart visualizes your cash flow for the selected month.
              </p>
              <p>
                A cash flow waterfall breaks down how money enters (income) and exits
                (expenses) your account in sequence, showing balance changes step-by-step.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Starting Balance:</label>
            <input
              type="number"
              value={balance}
              onChange={handleBalanceChange}
              className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 rounded-md border hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-gray-700">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-md border hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {chartData.length > 1 ? (
        <div className="h-[22rem] sm:h-[26rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="income" stackId="a" fill="#4ade80" name="Income" />
              <Bar dataKey="expense" stackId="a" fill="#f87171" name="Expense" />
              {/* Balance hidden in chart but shown in tooltip */}
              <Bar dataKey="balance" hide />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No transactions available for {format(currentMonth, "MMMM yyyy")}
        </div>
      )}
    </div>
  );
}
