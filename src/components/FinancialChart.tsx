import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import type { Transaction } from '../types';
import { Info } from 'lucide-react';

interface FinancialChartProps {
  transactions: Transaction[];
}

export function FinancialChart({ transactions }: FinancialChartProps) {
  const chartData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<{ date: string; expenses: number; revenue: number; balance: number }[]>((acc, transaction) => {
      const date = format(new Date(transaction.date), 'MMM dd');
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      const amount = parseFloat(transaction.amount.toString());
      
      const newBalance = transaction.type === 'revenue' 
        ? lastBalance + amount 
        : lastBalance - amount;

      acc.push({
        date,
        expenses: transaction.type === 'expense' ? amount : 0,
        revenue: transaction.type === 'revenue' ? amount : 0,
        balance: newBalance
      });

      return acc;
    }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      
      <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Financial Overview</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This chart visualizes your financial transactions over time, showing revenue,
                expenses, and balance changes.
              </p>
              <p>
                <strong>Revenue</strong> is shown in green, <strong>Expenses</strong> in red, and <strong>Balance</strong> in blue.
              </p>
            </div>
          </div>
        </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#22C55E"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorExpenses)"
              stackId="2"
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}