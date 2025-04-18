import React, { useState } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  startOfWeek,
  addDays,
  parse
} from 'date-fns';
import type { Transaction } from '../types';

interface MonthlySpendingHeatmapProps {
  transactions: Transaction[];
}

export function MonthlySpendingHeatmap({ transactions }: MonthlySpendingHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days for current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  
  // Generate all dates to display
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 41) // 6 weeks to ensure we have enough days
  });

  // Navigate to previous/next month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get total expense amount for a specific day
  const getDailyExpense = (day: Date) => {
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        isSameDay(new Date(t.date), day)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate the highest expense amount in the month for normalization
  const maxExpense = calendarDays
    .map(day => getDailyExpense(day))
    .reduce((max, expense) => expense > max ? expense : max, 0);

  // Generate color intensity based on expense amount (0-255)
  const getHeatIntensity = (expense: number) => {
    // Return transparent if no expense
    if (expense === 0) return 'rgba(255, 99, 71, 0)';
    
    // Calculate intensity (0.1-0.9) with non-linear scaling for better visuals
    const intensity = 0.1 + 0.8 * Math.pow(expense / (maxExpense || 1), 0.7);
    return `rgba(255, 99, 71, ${intensity})`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Monthly Spending Heatmap</h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            &lt;
          </button>
          <div className="font-medium">{format(currentMonth, 'MMMM yyyy')}</div>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Calendar Header (Days of week) */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm text-gray-500 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days with Heat Map */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const expense = getDailyExpense(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const backgroundColor = getHeatIntensity(expense);
          
          return (
            <div
              key={i}
              className={`
                relative h-24 p-2 border rounded-md
                ${isCurrentMonth ? '' : 'text-gray-300'}
                border-gray-200
              `}
              style={{ backgroundColor }}
            >
              <div className={`text-right font-medium ${expense > 0 ? 'text-white' : ''}`}>
                {format(day, 'd')}
              </div>
              {expense > 0 && (
                <div className={`text-sm mt-2 font-medium ${expense > maxExpense * 0.5 ? 'text-white' : 'text-gray-800'}`}>
                  ${expense.toFixed(0)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 gap-2">
        <div className="text-sm text-gray-500">Less</div>
        <div className="flex gap-0.5 h-4">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
            <div 
              key={intensity} 
              className="w-6 h-full" 
              style={{ backgroundColor: `rgba(255, 99, 71, ${intensity})` }}
            />
          ))}
        </div>
        <div className="text-sm text-gray-500">More</div>
      </div>
    </div>
  );
}