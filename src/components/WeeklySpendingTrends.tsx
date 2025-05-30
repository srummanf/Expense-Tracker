import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import type { Transaction } from '../types';

interface WeeklySpendingTrendsProps {
  transactions: Transaction[];
}

type DayData = {
  name: string;
  fullDate: string;
  expenses: number;
  revenue: number;
  dailyTransactions: Transaction[];
  trend: 'up' | 'down' | 'same';
  changePercentage: number;
};

export function WeeklySpendingTrends({ transactions }: WeeklySpendingTrendsProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [maxAmount, setMaxAmount] = useState(0);
  
  // Move to previous week
  const prevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    setSelectedDay(null);
  };
  
  // Move to next week
  const nextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    setSelectedDay(null);
  };
  
  // Calculate week dates
  const weekEnd = endOfWeek(currentWeekStart);
  const daysOfWeek = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  
  // Get previous week for comparison
  const prevWeekStart = subWeeks(currentWeekStart, 1);
  const prevWeekEnd = endOfWeek(prevWeekStart);
  const prevDaysOfWeek = eachDayOfInterval({ start: prevWeekStart, end: prevWeekEnd });
  
  // Process transactions for current and previous week
  const weekData = useMemo(() => {
    const currentWeekData: Record<string, DayData> = {};
    const prevWeekData: Record<string, { expenses: number; revenue: number }> = {};
    
    // Initialize current week data
    daysOfWeek.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const weekdayName = format(day, 'EEE');
      
      currentWeekData[dayStr] = {
        name: weekdayName,
        fullDate: format(day, 'MMM d'),
        expenses: 0,
        revenue: 0,
        dailyTransactions: [],
        trend: 'same',
        changePercentage: 0
      };
    });
    
    // Initialize previous week data
    prevDaysOfWeek.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      prevWeekData[dayStr] = {
        expenses: 0,
        revenue: 0
      };
    });
    
    // Populate data from transactions
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.date);
      const txDateStr = format(txDate, 'yyyy-MM-dd');
      
      // Check if transaction belongs to current week
      if (daysOfWeek.some(day => isSameDay(day, txDate))) {
        if (transaction.type === 'expense') {
          currentWeekData[txDateStr].expenses += transaction.amount;
        } else {
          currentWeekData[txDateStr].revenue += transaction.amount;
        }
        currentWeekData[txDateStr].dailyTransactions.push(transaction);
      }
      
      // Check if transaction belongs to previous week
      if (prevDaysOfWeek.some(day => isSameDay(day, txDate))) {
        if (transaction.type === 'expense') {
          prevWeekData[txDateStr].expenses += transaction.amount;
        } else {
          prevWeekData[txDateStr].revenue += transaction.amount;
        }
      }
    });
    
    // Calculate trends by comparing current week to previous week
    daysOfWeek.forEach((day, index) => {
      const currentDayStr = format(day, 'yyyy-MM-dd');
      const prevDayStr = format(prevDaysOfWeek[index], 'yyyy-MM-dd');
      
      const currentExpense = currentWeekData[currentDayStr].expenses;
      const prevExpense = prevWeekData[prevDayStr]?.expenses || 0;
      
      // Only calculate trend if there were expenses in either week
      if (currentExpense > 0 || prevExpense > 0) {
        if (currentExpense > prevExpense) {
          currentWeekData[currentDayStr].trend = 'up';
          const increase = currentExpense - prevExpense;
          const percentage = prevExpense > 0 ? (increase / prevExpense) * 100 : 100;
          currentWeekData[currentDayStr].changePercentage = percentage;
        } else if (currentExpense < prevExpense) {
          currentWeekData[currentDayStr].trend = 'down';
          const decrease = prevExpense - currentExpense;
          const percentage = prevExpense > 0 ? (decrease / prevExpense) * 100 : 100;
          currentWeekData[currentDayStr].changePercentage = percentage;
        }
      }
    });
    
    // Convert to array and calculate max amount for scaling
    const dataArray = Object.values(currentWeekData);
    const maxValue = Math.max(
      ...dataArray.map(day => Math.max(day.expenses, day.revenue))
    );
    setMaxAmount(maxValue);
    
    return dataArray;
  }, [transactions, currentWeekStart]);
  
  // Get selected day's transactions
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return weekData.find(day => day.fullDate === selectedDay)?.dailyTransactions || [];
  }, [selectedDay, weekData]);
  
  // Calculate total weekly expenses and income
  const weeklyTotals = useMemo(() => {
    return weekData.reduce((acc, day) => {
      return {
        expenses: acc.expenses + day.expenses,
        revenue: acc.revenue + day.revenue
      };
    }, { expenses: 0, revenue: 0 });
  }, [weekData]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹ ${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Weekly Spending Trends</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This chart shows your spending trends over the past week. You can
                click on any day to view detailed transactions for that day.
              </p>
              {/* <p className="mb-1">
                You can select different timeframes to view your financial
                progress.
              </p> */}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-base font-medium">
            {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
          <button
            onClick={nextWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekData} maxBarSize={50}>
            <XAxis 
              dataKey="fullDate" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => value.split(' ')[0]}
            />
            <YAxis 
              domain={[0, maxAmount * 1.1]}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              formatter={(value: number, name) => {
                let label = '';
                if (name === 'expenses') label = 'Expenses';
                else if (name === 'revenue') label = 'Income';
                else label = String(name);
                return [formatCurrency(value), label];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar 
              dataKey="revenue" 
              name="Income" 
              fill="#1ba64f" 
              radius={[4, 4, 0, 0]}
              onClick={(data) => setSelectedDay(data.fullDate)} 
            />
            <Bar 
              dataKey="expenses" 
              name="Expenses" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]}
              onClick={(data) => setSelectedDay(data.fullDate)} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-7 gap-3 mb-6">
        {weekData.map((day, index) => {
          const isCurrent = selectedDay === day.fullDate;
          const hasTransactions = day.expenses > 0 || day.revenue > 0;
          
          return (
            <div 
              key={index}
              className={`p-3 rounded-md border cursor-pointer transition-all ${
                isCurrent ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'
              } ${hasTransactions ? 'bg-gray-50' : 'bg-white'}`}
              onClick={() => setSelectedDay(day.fullDate)}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{day.name}</p>
                <p className="text-xs text-gray-500">{day.fullDate}</p>
                
                {hasTransactions && (
                  <div className="mt-2">
                    {day.expenses > 0 && (
                      <p className="text-xs text-red-600 font-medium">
                        -{formatCurrency(day.expenses)}
                      </p>
                    )}
                    {day.revenue > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        +{formatCurrency(day.revenue)}
                      </p>
                    )}
                  </div>
                )}
                
                {hasTransactions && day.trend !== 'same' && (
                  <div className={`flex justify-center items-center mt-1 text-xs ${
                    day.trend === 'up' ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {day.trend === 'up' ? (
                      <ArrowUp size={12} className="mr-1" />
                    ) : (
                      <ArrowDown size={12} className="mr-1" />
                    )}
                    <span>{Math.round(day.changePercentage)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedDay && (
        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-2">
            Transactions on {selectedDay}
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
                    {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Weekly Income</p>
            <p className="text-lg text-blue-700 font-bold">{formatCurrency(weeklyTotals.revenue)}</p>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Weekly Expenses</p>
            <p className="text-lg text-red-700 font-bold">{formatCurrency(weeklyTotals.expenses)}</p>
          </div>
          
          <div className={`p-3 rounded-lg ${
            weeklyTotals.revenue >= weeklyTotals.expenses ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <p className={`text-sm font-medium ${
              weeklyTotals.revenue >= weeklyTotals.expenses ? 'text-green-700' : 'text-amber-700'
            }`}>Weekly Balance</p>
            <p className={`text-lg font-bold ${
              weeklyTotals.revenue >= weeklyTotals.expenses ? 'text-green-700' : 'text-amber-700'
            }`}>{formatCurrency(weeklyTotals.revenue - weeklyTotals.expenses)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}