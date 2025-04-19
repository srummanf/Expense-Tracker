import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import type { Transaction } from '../types';

interface MonthlySpendingCalendarProps {
  transactions: Transaction[];
}

export function MonthlySpendingCalendar({ transactions }: MonthlySpendingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDay(null);
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDay(null);
  };
  
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // Create an array for all days of the calendar view (including previous/next month days)
  const startingDayOfWeek = getDay(firstDayOfMonth);
  const daysToDisplay = [] as Date[];
  
  // Add days from previous month to fill the first row
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysToDisplay.push(new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), -i));
  }
  daysToDisplay.reverse();
  
  // Add all days of current month
  daysToDisplay.push(...daysInMonth);
  
  // Add days from next month to fill the last row
  const remainingDays = 42 - daysToDisplay.length; // 6 rows x 7 days = 42
  for (let i = 1; i <= remainingDays; i++) {
    daysToDisplay.push(new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() + i));
  }
  
  // Calculate daily spending
  const dailySpending = new Map<string, number>();
  const dailyIncome = new Map<string, number>();
  const dailyTransactions = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    const dateKey = transaction.date;
    const transactionDate = new Date(dateKey);
    
    if (isSameMonth(transactionDate, currentMonth)) {
      if (!dailyTransactions.has(dateKey)) {
        dailyTransactions.set(dateKey, []);
      }
      dailyTransactions.get(dateKey)?.push(transaction);
      
      if (transaction.type === 'expense') {
        dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + transaction.amount);
      } else {
        dailyIncome.set(dateKey, (dailyIncome.get(dateKey) || 0) + transaction.amount);
      }
    }
  });
  
  // Find maximum spending/income in the month for color intensity
  const maxSpending = Math.max(...Array.from(dailySpending.values(), v => v || 0), 1);
  const maxIncome = Math.max(...Array.from(dailyIncome.values(), v => v || 0), 1);
  
  // Get selected day transactions
  const selectedDayTransactions = selectedDay 
    ? dailyTransactions.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Monthly Activity Calendar</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-medium">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysToDisplay.map((day, i) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySpending = dailySpending.get(dateKey) || 0;
            const dayIncome = dailyIncome.get(dateKey) || 0;
            const hasTransactions = daySpending > 0 || dayIncome > 0;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            
            // Calculate background colors based on spending/income
            let spendingOpacity = Math.min(daySpending / maxSpending, 1) * 0.6;
            let incomeOpacity = Math.min(dayIncome / maxIncome, 1) * 0.6;
            
            // Style classes
            const baseClasses = "h-24 p-1 border rounded-md relative transition-all";
            const monthClasses = isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400";
            const selectedClasses = isSelected ? "ring-2 ring-blue-500" : "";
            
            return (
              <div
                key={i}
                className={`${baseClasses} ${monthClasses} ${selectedClasses} cursor-pointer hover:bg-gray-50`}
                style={{ 
                  background: hasTransactions 
                    ? `linear-gradient(135deg, rgba(239, 68, 68, ${spendingOpacity}), rgba(59, 130, 246, ${incomeOpacity}))` 
                    : undefined 
                }}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex justify-between">
                  <span className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                  {hasTransactions && (
                    <div className="flex flex-col items-end text-xs">
                      {dayIncome > 0 && (
                        <span className="text-green-600">+${dayIncome.toFixed(0)}</span>
                      )}
                      {daySpending > 0 && (
                        <span className="text-red-600">-${daySpending.toFixed(0)}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {hasTransactions && (
                  <div className="absolute bottom-1 right-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Info size={12} className="mr-1" />
                      {dailyTransactions.get(dateKey)?.length || 0}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedDay && (
        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-2">
            Transactions on {format(selectedDay, 'MMMM d, yyyy')}
          </h3>
          
          {selectedDayTransactions.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDayTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                >
                  <div>
                    <span className="font-medium">{transaction.reason}</span>
                    <p className="text-xs text-gray-500">{transaction.category}</p>
                  </div>
                  <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                    {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No transactions on this day.</p>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-400 mr-1"></div>
              <span className="text-xs text-gray-600">Expenses</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-400 mr-1"></div>
              <span className="text-xs text-gray-600">Income</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {format(currentMonth, 'MMMM yyyy')} Summary:
            <span className="ml-2 text-red-600">-${Array.from(dailySpending.values()).reduce((a, b) => a + b, 0).toFixed(2)}</span>
            <span className="ml-2 text-green-600">+${Array.from(dailyIncome.values()).reduce((a, b) => a + b, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}