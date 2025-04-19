import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { Transaction } from '../types';

interface ExpenseToIncomeRatioProps {
  transactions: Transaction[];
}

export function ExpenseToIncomeRatioTracker({ transactions }: ExpenseToIncomeRatioProps) {
  const calculateMonthlyRatios = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM yyyy'),
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      };
    }).reverse();

    return months.map(({ month, startDate, endDate }) => {
      const monthlyTransactions = transactions.filter(t => 
        isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
      );
      
      const income = monthlyTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const ratio = income > 0 ? (expenses / income) * 100 : 0;
      const savingsRate = 100 - ratio;
      
      return {
        month,
        ratio: Math.min(ratio, 100).toFixed(1),
        savingsRate: Math.max(savingsRate, 0).toFixed(1),
      };
    });
  };

  const data = calculateMonthlyRatios();
  const currentRatio = parseFloat(data[data.length - 1]?.ratio || '0');
  const savingsRate = parseFloat(data[data.length - 1]?.savingsRate || '0');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Expense-to-Income Ratio</h2>
          <p className="text-sm text-gray-500">Track how much of your income you spend each month</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{currentRatio}%</div>
          <div className="text-sm text-gray-500">Current Expense Ratio</div>
          <div className="text-lg font-medium text-green-600 mt-1">{savingsRate}%</div>
          <div className="text-sm text-gray-500">Current Savings Rate</div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} unit="%" />
          <Tooltip formatter={(value: any) => [`${value}%`, '']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="ratio" 
            name="Expense Ratio" 
            stroke="#ef4444" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="savingsRate" 
            name="Savings Rate" 
            stroke="#10b981" 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Healthy range:</span>
          <span className="text-sm font-medium">50-70% expense ratio</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Target savings rate:</span>
          <span className="text-sm font-medium">20% or higher</span>
        </div>
      </div>
    </div>
  );
}