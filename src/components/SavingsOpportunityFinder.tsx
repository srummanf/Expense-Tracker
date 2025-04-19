import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, X } from 'lucide-react';
import { format, subMonths, startOfMonth, isWithinInterval, differenceInMonths } from 'date-fns';
import type { Transaction } from '../types';

interface SavingsOpportunityProps {
  transactions: Transaction[];
}

export function SavingsOpportunityFinder({ transactions }: SavingsOpportunityProps) {
  const [opportunities, setOpportunities] = useState<Array<{
    id: string;
    type: 'spike' | 'recurring' | 'subscription';
    description: string;
    potentialSavings: number;
    category?: string;
  }>>([]);
  
  const [dismissedOpportunities, setDismissedOpportunities] = useState<string[]>([]);
  
  useEffect(() => {
    // Find spending opportunities based on transaction data
    findOpportunities();
  }, [transactions]);
  
  const findOpportunities = () => {
    const newOpportunities = [];
    
    // 1. Find spending spikes (categories where spending is >50% higher than 3-month average)
    const spikes = findSpendingSpikes();
    newOpportunities.push(...spikes);
    
    // 2. Find potentially unnecessary recurring expenses
    const recurring = findRecurringExpenses();
    newOpportunities.push(...recurring);
    
    // 3. Find potential subscription services
    const subscriptions = findPotentialSubscriptions();
    newOpportunities.push(...subscriptions);
    
    setOpportunities(newOpportunities);
  };
  
  const findSpendingSpikes = () => {
    const currentMonth = new Date();
    const previousMonths = Array.from({ length: 3 }, (_, i) => subMonths(currentMonth, i + 1));
    
    // Group transactions by category
    const categories = [...new Set(transactions.map(t => t.category || 'Other'))];
    
    return categories.map(category => {
      const currentMonthStart = startOfMonth(currentMonth);
      const currentMonthSpending = transactions
        .filter(t => 
          t.type === 'expense' && 
          (t.category || 'Other') === category &&
          isWithinInterval(new Date(t.date), { 
            start: currentMonthStart, 
            end: new Date() 
          })
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate average spending for previous 3 months
      const previousSpending = previousMonths.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = startOfMonth(subMonths(monthStart, -1));
        
        return transactions
          .filter(t => 
            t.type === 'expense' && 
            (t.category || 'Other') === category &&
            isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })
          )
          .reduce((sum, t) => sum + t.amount, 0);
      });
      
      const averagePreviousSpending = previousSpending.reduce((sum, amount) => sum + amount, 0) / previousSpending.length;
      
      // If current spending is >50% higher than average, flag it
      if (averagePreviousSpending > 0 && currentMonthSpending > averagePreviousSpending * 1.5) {
        const potentialSavings = currentMonthSpending - averagePreviousSpending;
        return {
          id: `spike-${category}`,
          type: 'spike' as const,
          description: `Your ${category} spending is ${Math.round((currentMonthSpending / averagePreviousSpending - 1) * 100)}% higher than usual this month.`,
          potentialSavings,
          category
        };
      }
      return null;
    }).filter(Boolean) as any[];
  };
  
  const findRecurringExpenses = () => {
    // Find transactions with similar amounts that occur monthly
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Group by rounded amount
    const amountGroups: Record<string, Transaction[]> = {};
    
    expenseTransactions.forEach(transaction => {
      // Round to nearest dollar
      const roundedAmount = Math.round(transaction.amount);
      const key = `${roundedAmount}`;
      
      if (!amountGroups[key]) {
        amountGroups[key] = [];
      }
      
      amountGroups[key].push(transaction);
    });
    
    // Find groups that occur monthly for at least 3 months
    return Object.entries(amountGroups)
      .filter(([_, group]) => group.length >= 3)
      .map(([amount, group]) => {
        // Sort by date
        const sortedTransactions = [...group].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Check if they're roughly monthly
        let isMonthly = true;
        for (let i = 1; i < sortedTransactions.length; i++) {
          const months = differenceInMonths(
            new Date(sortedTransactions[i].date),
            new Date(sortedTransactions[i-1].date)
          );
          
          if (months < 0.5 || months > 1.5) {
            isMonthly = false;
            break;
          }
        }
        
        if (isMonthly && parseFloat(amount) > 20) {
          const latestTransaction = sortedTransactions[sortedTransactions.length - 1];
          return {
            id: `recurring-${latestTransaction.id}`,
            type: 'recurring' as const,
            description: `Recurring ${latestTransaction.category || ''} expense: "${latestTransaction.reason}" ($${parseFloat(amount).toFixed(2)}/month)`,
            potentialSavings: parseFloat(amount) * 12,
            category: latestTransaction.category
          };
        }
        
        return null;
      })
      .filter(Boolean) as any[];
  };
  
  const findPotentialSubscriptions = () => {
    // Find potential subscription keywords in transaction reasons
    const subscriptionKeywords = ['subscription', 'netflix', 'hulu', 'spotify', 'prime', 'disney', 'hbo', 'gym', 'membership'];
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        subscriptionKeywords.some(keyword => 
          t.reason.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .map(transaction => ({
        id: `subscription-${transaction.id}`,
        type: 'subscription' as const,
        description: `Potential subscription: "${transaction.reason}" ($${transaction.amount.toFixed(2)})`,
        potentialSavings: transaction.amount * 12,
        category: transaction.category
      }));
  };
  
  const dismissOpportunity = (id: string) => {
    setDismissedOpportunities(prev => [...prev, id]);
  };
  
  const visibleOpportunities = opportunities.filter(opp => !dismissedOpportunities.includes(opp.id));
  
  // Calculate total potential savings
  const totalPotentialSavings = visibleOpportunities.reduce(
    (sum, opp) => sum + opp.potentialSavings, 
    0
  );
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Savings Opportunities</h2>
          <p className="text-sm text-gray-500">Discover ways to save money based on your spending patterns</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">${totalPotentialSavings.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Potential Annual Savings</div>
        </div>
      </div>
      
      {visibleOpportunities.length > 0 ? (
        <div className="space-y-4">
          {visibleOpportunities.map(opportunity => (
            <div key={opportunity.id} className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
              <div className="mt-1">
                {opportunity.type === 'spike' && (
                  <TrendingUp className="text-orange-500" size={20} />
                )}
                {(opportunity.type === 'recurring' || opportunity.type === 'subscription') && (
                  <Lightbulb className="text-yellow-500" size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{opportunity.description}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Potential savings: ${opportunity.potentialSavings.toFixed(2)} per year
                </p>
                {opportunity.type === 'spike' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Try to keep your {opportunity.category} spending closer to your average of 
                    ${(opportunity.potentialSavings / ((currentMonthSpending / averagePreviousSpending) - 1)).toFixed(2)} per month.
                  </p>
                )}
                {opportunity.type === 'recurring' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Review if this recurring expense is necessary or if you can find a better deal.
                  </p>
                )}
                {opportunity.type === 'subscription' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Do you still use this subscription? Consider if it provides enough value.
                  </p>
                )}
              </div>
              <button 
                onClick={() => dismissOpportunity(opportunity.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No savings opportunities found at this time. Check back after more transactions are recorded.
          </p>
        </div>
      )}
    </div>
  );
}