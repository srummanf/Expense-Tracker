import React, { useMemo } from 'react';
import { format, addMonths, isSameMonth } from 'date-fns';
import type { Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, Calendar, RepeatIcon, Info } from 'lucide-react';

interface RecurringTransactionsAnalysisProps {
  transactions: Transaction[];
}

interface RecurringItem {
  reason: string;
  category: string;
  amount: number;
  type: 'expense' | 'revenue';
  frequency: string;
  lastDate: string;
  nextDate: string;
  reliability: number;
  occurrences: number;
}

export function RecurringTransactionsAnalysis({ transactions }: RecurringTransactionsAnalysisProps) {
  // Group transactions by reason and category to find recurring ones
  const recurringItems = useMemo(() => {
    // Only consider transactions with a reason
    const filteredTransactions = transactions.filter(t => t.reason.trim() !== '');
    
    // Group by normalized reason (lowercase, trim spaces)
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      const key = `${transaction.reason.toLowerCase().trim()}_${transaction.category || 'Other'}_${transaction.type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });
    
    // Find recurring items (at least 2 occurrences)
    const recurring: RecurringItem[] = [];
    
    Object.entries(groups).forEach(([key, group]) => {
      if (group.length >= 2) {
        // Sort by date
        group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Check if amounts are consistent (within 10% variance)
        const amounts = group.map(t => t.amount);
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const isConsistent = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount <= 0.1);
        
        if (isConsistent) {
          // Calculate frequency
          const dates = group.map(t => new Date(t.date));
          let frequency = 'irregular';
          let reliability = 0;
          
          // Check for monthly pattern
          if (dates.length >= 2) {
            const dayOfMonth = dates[0].getDate();
            const isMonthly = dates.slice(1).every(date => 
              Math.abs(date.getDate() - dayOfMonth) <= 3
            );
            
            if (isMonthly) {
              frequency = 'monthly';
              reliability = 0.9;
            } else {
              // Check weekly pattern
              const dayOfWeek = dates[0].getDay();
              const isWeekly = dates.slice(1).every(date => 
                date.getDay() === dayOfWeek
              );
              
              if (isWeekly) {
                frequency = 'weekly';
                reliability = 0.85;
              } else {
                // Detect quarterly
                if (dates.length >= 3) {
                  const isQuarterly = dates.slice(1).every((date, i) => {
                    const monthsDiff = (date.getMonth() - dates[0].getMonth() + 12) % 12;
                    return monthsDiff % 3 === 0;
                  });
                  
                  if (isQuarterly) {
                    frequency = 'quarterly';
                    reliability = 0.8;
                  } else {
                    // Check for annual
                    const isAnnual = dates.slice(1).every(date => 
                      date.getMonth() === dates[0].getMonth() &&
                      Math.abs(date.getDate() - dates[0].getDate()) <= 5
                    );
                    
                    if (isAnnual) {
                      frequency = 'annual';
                      reliability = 0.9;
                    } else {
                      reliability = 0.6; // Irregular but recurring
                    }
                  }
                }
              }
            }
          }
          
          // Calculate next expected date
          const lastDate = dates[dates.length - 1];
          let nextDate = new Date(lastDate);
          
          switch (frequency) {
            case 'monthly':
              nextDate = addMonths(lastDate, 1);
              break;
            case 'quarterly':
              nextDate = addMonths(lastDate, 3);
              break;
            case 'annual':
              nextDate = addMonths(lastDate, 12);
              break;
            // Weekly and irregular use different logic
            default:
              if (frequency === 'weekly') {
                nextDate = new Date(lastDate);
                nextDate.setDate(lastDate.getDate() + 7);
              } else {
                // For irregular, use the average time between transactions
                const avgDaysBetween = Math.round(
                  (dates[dates.length - 1].getTime() - dates[0].getTime()) / 
                  (1000 * 60 * 60 * 24 * (dates.length - 1))
                );
                nextDate = new Date(lastDate);
                nextDate.setDate(lastDate.getDate() + avgDaysBetween);
              }
          }
          
          const latestTransaction = group[group.length - 1];
          
          recurring.push({
            reason: latestTransaction.reason,
            category: latestTransaction.category || 'Other',
            amount: avgAmount,
            type: latestTransaction.type,
            frequency,
            lastDate: format(new Date(latestTransaction.date), 'yyyy-MM-dd'),
            nextDate: format(nextDate, 'yyyy-MM-dd'),
            reliability,
            occurrences: group.length
          });
        }
      }
    });
    
    // Sort by reliability (highest first)
    return recurring.sort((a, b) => b.reliability - a.reliability);
  }, [transactions]);

  const getReliabilityLabel = (reliability: number) => {
    if (reliability >= 0.9) return 'High';
    if (reliability >= 0.7) return 'Medium';
    return 'Low';
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return 'bg-green-100 text-green-800';
    if (reliability >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Calculate monthly forecast totals
  const monthlySummary = useMemo(() => {
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    
    const expectedExpenses = recurringItems
      .filter(item => item.type === 'expense')
      .filter(item => {
        const date = new Date(item.nextDate);
        return isSameMonth(date, nextMonth);
      })
      .reduce((sum, item) => sum + item.amount, 0);
    
    const expectedRevenue = recurringItems
      .filter(item => item.type === 'revenue')
      .filter(item => {
        const date = new Date(item.nextDate);
        return isSameMonth(date, nextMonth);
      })
      .reduce((sum, item) => sum + item.amount, 0);
    
    return {
      expectedExpenses,
      expectedRevenue,
      balance: expectedRevenue - expectedExpenses
    };
  }, [recurringItems]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-4"></h2>
      <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
          <h2 className="whitespace-normal break-words">Recurring Transactions Analysis</h2>
          <div className="group relative">
            <Info size={16} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
              <p className="mb-1">
                This analysis is based on your recurring transactions. It provides a summary of your expected expenses and revenu
              </p>
            </div>
          </div>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-600 text-sm font-medium mb-1">Next Month Forecast</p>
          <p className="text-2xl font-bold">
            ₹{monthlySummary.balance.toFixed(2)}
          </p>
          <div className="mt-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Income:</span>
              <span className="text-green-600">₹{monthlySummary.expectedRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expenses:</span>
              <span className="text-red-600">₹{monthlySummary.expectedExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium mb-1">Recurring Items</p>
          <p className="text-2xl font-bold">{recurringItems.length}</p>
          <div className="mt-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Expenses:</span>
              <span>{recurringItems.filter(item => item.type === 'expense').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Income:</span>
              <span>{recurringItems.filter(item => item.type === 'revenue').length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-purple-600 text-sm font-medium mb-1">Subscription Alert</p>
          <p className="text-2xl font-bold">
            ₹{recurringItems
              .filter(item => item.type === 'expense' && item.category.toLowerCase().includes('subscription'))
              .reduce((sum, item) => sum + item.amount, 0).toFixed(2)}/mo
          </p>
          <div className="mt-2 text-sm text-gray-600">
            {recurringItems.filter(item => 
              item.type === 'expense' && 
              item.category.toLowerCase().includes('subscription')
            ).length} active subscriptions
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reliability</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recurringItems.slice(0, 10).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      item.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {item.type === 'expense' ? (
                        <ArrowDownRight size={16} className="text-red-600" />
                      ) : (
                        <ArrowUpRight size={16} className="text-green-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.reason}</div>
                      <div className="text-sm text-gray-500">{item.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    item.type === 'expense' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {item.type === 'expense' ? '-' : '+'} ₹{item.amount.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 capitalize">{item.frequency}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(item.nextDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getReliabilityColor(item.reliability)
                  }`}>
                    {getReliabilityLabel(item.reliability)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({item.occurrences} times)
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {recurringItems.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No recurring transactions detected yet.<br />
            Add more transactions to identify patterns.
          </div>
        )}
      </div>
    </div>
  );
}