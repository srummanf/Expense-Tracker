import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Transaction, BudgetLimit } from '../types';
import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  endOfDay, 
  endOfWeek, 
  endOfMonth,
  isWithinInterval 
} from 'date-fns';

interface BudgetIndicatorProps {
  transactions: Transaction[];
  budgetLimit: BudgetLimit;
}

export function BudgetIndicator({ transactions, budgetLimit }: BudgetIndicatorProps) {
  const getCurrentPeriodExpenses = () => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (budgetLimit.period) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'weekly':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    return transactions
      .filter(t => 
        t.type === 'expense' && 
        isWithinInterval(new Date(t.date), { start, end })
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currentExpenses = getCurrentPeriodExpenses();
  const isOverBudget = currentExpenses > budgetLimit.amount;
  const percentage = (currentExpenses / budgetLimit.amount) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            {budgetLimit.period.charAt(0).toUpperCase() + budgetLimit.period.slice(1)} Budget:
          </span>
          <span className="font-medium">${budgetLimit.amount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Current Spending:</span>
          <span className="font-medium">${currentExpenses.toFixed(2)}</span>
        </div>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                {percentage.toFixed(1)}% Used
              </span>
            </div>
            {isOverBudget ? (
              <div className="flex items-center text-red-600">
                <AlertTriangle size={16} className="mr-1" />
                <span className="text-xs font-semibold">Over Budget</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600">
                <CheckCircle size={16} className="mr-1" />
                <span className="text-xs font-semibold">Within Budget</span>
              </div>
            )}
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${Math.min(percentage, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                isOverBudget ? 'bg-red-500' : 'bg-blue-500'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}