import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from 'date-fns';
import type { Transaction } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CashFlowWaterfallProps {
  transactions: Transaction[];
  initialBalance?: number;
}

export function CashFlowWaterfall({ transactions, initialBalance = 0 }: CashFlowWaterfallProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [balance, setBalance] = useState(initialBalance);

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Process the transactions for the waterfall chart
  const chartData = useMemo(() => {
    // Filter transactions for current month
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    // Sort transactions by date
    monthTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate running balance for the waterfall chart
    let runningBalance = balance;
    
    // Group by day
    const transactionsByDay: {[key: string]: Transaction[]} = {};
    
    monthTransactions.forEach(t => {
      const day = format(new Date(t.date), 'yyyy-MM-dd');
      if (!transactionsByDay[day]) {
        transactionsByDay[day] = [];
      }
      transactionsByDay[day].push(t);
    });

    // Create data points for each day with transactions
    const data = Object.keys(transactionsByDay).map(day => {
      const dayTransactions = transactionsByDay[day];
      const income = dayTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const net = income - expense;
      const previousBalance = runningBalance;
      runningBalance += net;
      
      return {
        date: format(new Date(day), 'MMM dd'),
        income,
        expense: -expense, // Negative for visualization
        balance: runningBalance,
        previousBalance
      };
    });

    // Add starting balance as first item
    if (data.length > 0) {
      data.unshift({
        date: 'Start',
        income: 0,
        expense: 0,
        balance: balance,
        previousBalance: balance
      });
    }

    return data;
  }, [transactions, currentMonth, balance]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setBalance(value);
  };

  // Format currency for chart tooltip
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload[0]?.payload.income > 0 && (
            <p className="text-green-600">Income: ${payload[0]?.payload.income.toFixed(2)}</p>
          )}
          {payload[0]?.payload.expense < 0 && (
            <p className="text-red-600">Expense: ${Math.abs(payload[0]?.payload.expense).toFixed(2)}</p>
          )}
          <p className="text-blue-600 font-medium">Balance: ${payload[0]?.payload.balance.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Cash Flow Waterfall</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Starting Balance:</label>
            <input
              type="number"
              value={balance}
              onChange={handleBalanceChange}
              className="w-24 px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={prevMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
            <button 
              onClick={nextMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {chartData.length > 1 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={formatCurrency}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} stroke="#000" />
              <Bar dataKey="income" stackId="a" fill="#4ade80" name="Income" />
              <Bar dataKey="expense" stackId="a" fill="#f87171" name="Expense" />
              <Bar 
                dataKey="balance" 
                fill="#60a5fa" 
                name="Balance" 
                type="monotone" 
                legendType="none" 
                hide 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No transactions available for {format(currentMonth, 'MMMM yyyy')}
        </div>
      )}
    </div>
  );
}