import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Transaction, CategoryTotal } from '../types';

interface SpendingBreakdownProps {
  transactions: Transaction[];
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
  '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4'
];

export function SpendingBreakdown({ transactions }: SpendingBreakdownProps) {
  const getCategoryTotals = (): CategoryTotal[] => {
    const expenseOnly = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseOnly.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryMap = expenseOnly.reduce<Record<string, number>>((acc, t) => {
      const category = t.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {});

    return Object.entries(categoryMap)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryTotals = getCategoryTotals();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryTotals}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent, payload }) => `${payload.category} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {categoryTotals.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {categoryTotals.map((category) => (
          <div key={category.category} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm text-gray-600">{category.category}</span>
            </div>
            <span className="text-sm font-medium">${category.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}