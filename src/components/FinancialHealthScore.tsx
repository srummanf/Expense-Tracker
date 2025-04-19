import React, { useMemo } from "react";
import { GaugeCircle } from "lucide-react";
import type { Transaction } from "../types";

export const FinancialHealthScore = ({ transactions }: { transactions: Transaction[] }) => {
  const score = useMemo(() => {
    // Sample scoring algorithm (in real app would be more sophisticated)
    if (transactions.length === 0) return { score: 0, breakdown: {} };
    
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const recentTransactions = transactions.filter(
      t => new Date(t.date) >= oneMonthAgo
    );
    
    const totalRevenue = recentTransactions
      .filter(t => t.type === "revenue")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = recentTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate various financial metrics
    const savingsRatio = totalRevenue > 0 ? 
      Math.min(Math.max(0, (totalRevenue - totalExpenses) / totalRevenue), 1) : 0;
    
    // Calculate diversity of income sources
    const incomeSources = new Set(
      recentTransactions
        .filter(t => t.type === "revenue")
        .map(t => t.category)
    ).size;
    const incomeSourceScore = Math.min(incomeSources / 3, 1); // Normalize to max of 1
    
    // Calculate expense distribution
    const expenseCategories = recentTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const expenseValues = Object.values(expenseCategories);
    const totalExpenseValue = expenseValues.reduce((a, b) => a + b, 0);
    
    // Calculate expense diversity (lower concentration is better)
    const expenseConcentration = expenseValues.reduce((acc, val) => {
      const proportion = val / totalExpenseValue;
      return acc + proportion * proportion;
    }, 0);
    const expenseDiversityScore = 1 - Math.min(expenseConcentration, 1);
    
    // Calculate final score (0-100)
    const rawScore = (
      savingsRatio * 0.5 + 
      incomeSourceScore * 0.3 + 
      expenseDiversityScore * 0.2
    );
    const finalScore = Math.round(rawScore * 100);
    
    return {
      score: finalScore,
      breakdown: {
        savingsRatio: Math.round(savingsRatio * 100),
        incomeSourceScore: Math.round(incomeSourceScore * 100),
        expenseDiversityScore: Math.round(expenseDiversityScore * 100)
      }
    };
  }, [transactions]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Financial Health Score</h3>
        <GaugeCircle className="text-blue-500" size={24} />
      </div>
      
      <div className="flex flex-col items-center">
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(score.score)}`}>
          {score.score}
        </div>
        <div className={`text-lg font-medium ${getScoreColor(score.score)}`}>
          {getScoreText(score.score)}
        </div>
        
        <div className="w-full mt-8 space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Savings Rate</span>
              <span className="text-sm font-medium">{score.breakdown.savingsRatio}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${score.breakdown.savingsRatio}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Income Diversity</span>
              <span className="text-sm font-medium">{score.breakdown.incomeSourceScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${score.breakdown.incomeSourceScore}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Expense Balance</span>
              <span className="text-sm font-medium">{score.breakdown.expenseDiversityScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${score.breakdown.expenseDiversityScore}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-600 text-center">
          <p>Your financial health score is calculated based on your savings rate, income diversity, and spending patterns.</p>
          <p className="mt-2">Improve your score by increasing your savings rate and diversifying both income sources and expenses.</p>
        </div>
      </div>
    </div>
  );
};