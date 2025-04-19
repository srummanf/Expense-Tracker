import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { Transaction } from '../types';


interface DiscretionarySpendingProps {
  transactions: Transaction[];
}

// Define which categories are essential vs discretionary
const essentialCategories = ['Housing', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Transportation'];

export function DiscretionarySpendingAnalysis({ transactions }: DiscretionarySpendingProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2023, i, 1);
    return { value: i, label: date.toLocaleString('default', { month: 'long' }) };
  });
  
  const years = Array.from(
    { length: 5 }, 
    (_, i) => new Date().getFullYear() - i
  ).sort((a, b) => b - a);
  
  const getMonthlySpending = () => {
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth));
    
    const monthlyExpenses = transactions.filter(
      t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: startDate, end: endDate })
    );
    
    let essentialTotal = 0;
    let discretionaryTotal = 0;
    
    monthlyExpenses.forEach(expense => {
      if (essentialCategories.includes(expense.category || '')) {
        essentialTotal += expense.amount;
      } else {
        discretionaryTotal += expense.amount;
      }
    });
    
    const total = essentialTotal + discretionaryTotal;
    
    return {
      essential: {
        amount: essentialTotal,
        percentage: total ? (essentialTotal / total) * 100 : 0
      },
      discretionary: {
        amount: discretionaryTotal,
        percentage: total ? (discretionaryTotal / total) * 100 : 0
      },
      total
    };
  };
  
  const spending = getMonthlySpending();
  
  const data = [
    { name: 'Essential', value: spending.essential.amount, color: '#3b82f6' },
    { name: 'Discretionary', value: spending.discretionary.amount, color: '#f97316' }
  ];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Essential vs Discretionary Spending</h2>
          <p className="text-sm text-gray-500">Analyze your needs vs wants spending</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-col justify-center space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Monthly Expenses</h3>
            <p className="text-2xl font-bold">${spending.total.toFixed(2)}</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-600">Essential Spending</h3>
              <span className="text-sm font-medium">{spending.essential.percentage.toFixed(1)}%</span>
            </div>
            <p className="text-xl font-semibold">${spending.essential.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Housing, Utilities, Groceries, etc.</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-orange-600">Discretionary Spending</h3>
              <span className="text-sm font-medium">{spending.discretionary.percentage.toFixed(1)}%</span>
            </div>
            <p className="text-xl font-semibold">${spending.discretionary.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Entertainment, Dining out, Shopping, etc.</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Tip: Focus on reducing discretionary spending to increase your savings rate.
              Aim for a 50/30/20 budget: 50% needs, 30% wants, 20% savings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}