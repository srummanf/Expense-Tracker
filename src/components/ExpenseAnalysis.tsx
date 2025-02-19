import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isSameMonth, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Area } from 'recharts';
import type { Transaction } from '../types';
import { Brain, TrendingUp, AlertTriangle, BarChart2, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface ExpenseAnalysisProps {
  transactions: Transaction[];
}

interface Prediction {
  date: string;
  predicted: number;
  actual?: number;
}

interface MonthlyComparison {
  month: string;
  expenses: number;
  revenue: number;
  balance: number;
}

interface WeeklyPattern {
  day: string;
  averageExpense: number;
  frequency: number;
}

interface CategoryGrowth {
  category: string;
  previousMonth: number;
  currentMonth: number;
  growth: number;
}

export function ExpenseAnalysis({ transactions }: ExpenseAnalysisProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([]);
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([]);
  const [categoryGrowth, setCategoryGrowth] = useState<CategoryGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeExpenses();
    analyzeMonthlyTrends();
    analyzeWeeklyPatterns();
    analyzeCategoryGrowth();
  }, [transactions]);

  const preprocessData = () => {
    const expensesByDay = new Map<string, number>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const date = format(parseISO(t.date), 'yyyy-MM-dd');
        expensesByDay.set(date, (expensesByDay.get(date) || 0) + t.amount);
      });

    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);
    
    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });
    const data = allDays.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      amount: expensesByDay.get(format(day, 'yyyy-MM-dd')) || 0
    }));

    return data;
  };

  const analyzeMonthlyTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    
    const monthlyData = last6Months.map(month => {
      const monthTransactions = transactions.filter(t => 
        isSameMonth(parseISO(t.date), month)
      );

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const revenue = monthTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM yyyy'),
        expenses,
        revenue,
        balance: revenue - expenses
      };
    }).reverse();

    setMonthlyComparison(monthlyData);
  };

  const analyzeWeeklyPatterns = () => {
    const expensesByDay = transactions
      .filter(t => t.type === 'expense')
      .reduce<Record<string, { total: number; count: number }>>((acc, t) => {
        const dayOfWeek = format(parseISO(t.date), 'EEEE');
        if (!acc[dayOfWeek]) {
          acc[dayOfWeek] = { total: 0, count: 0 };
        }
        acc[dayOfWeek].total += t.amount;
        acc[dayOfWeek].count += 1;
        return acc;
      }, {});

    const patterns = Object.entries(expensesByDay).map(([day, { total, count }]) => ({
      day,
      averageExpense: total / count,
      frequency: count
    }));

    setWeeklyPatterns(patterns);
  };

  const analyzeCategoryGrowth = () => {
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);

    const currentMonthExpenses = transactions.filter(t => 
      t.type === 'expense' && isSameMonth(parseISO(t.date), currentMonth)
    );

    const previousMonthExpenses = transactions.filter(t => 
      t.type === 'expense' && isSameMonth(parseISO(t.date), previousMonth)
    );

    const categories = [...new Set(transactions.map(t => t.category))];

    const growth = categories.map(category => {
      const currentTotal = currentMonthExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const previousTotal = previousMonthExpenses
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const growthRate = previousTotal === 0 
        ? 100 
        : ((currentTotal - previousTotal) / previousTotal) * 100;

      return {
        category: category || 'Other',
        previousMonth: previousTotal,
        currentMonth: currentTotal,
        growth: growthRate
      };
    });

    setCategoryGrowth(growth.sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth)));
  };

  const analyzeExpenses = async () => {
    setLoading(true);
    try {
      const data = preprocessData();
      
      // TensorFlow model setup and training
      const values = data.map(d => d.amount);
      const tensorData = tf.tensor2d(values.map((_, i) => [i]), [values.length, 1]);
      const tensorLabels = tf.tensor2d(values, [values.length, 1]);

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      
      model.compile({
        optimizer: tf.train.adam(0.1),
        loss: 'meanSquaredError'
      });

      await model.fit(tensorData, tensorLabels, {
        epochs: 100,
        verbose: 0
      });

      // Predictions
      const futureDays = 7;
      const predictionInput = tf.tensor2d(
        Array.from({ length: futureDays }, (_, i) => [values.length + i]),
        [futureDays, 1]
      );

      const predictionResult = model.predict(predictionInput) as tf.Tensor;
      const predictedValues = await predictionResult.data();

      const lastDate = parseISO(data[data.length - 1].date);
      const predictions = Array.from({ length: futureDays }, (_, i) => ({
        date: format(new Date(lastDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000), 'MMM dd'),
        predicted: Math.max(0, predictedValues[i])
      }));

      setPredictions(predictions);

      // Generate insights
      const insights = [
        analyzeCategoryTrends(transactions),
        analyzeSpendingTrend(data),
        ...detectAnomalies(data),
        ...generateAdvancedInsights()
      ];

      setInsights(insights);
      setLoading(false);
    } catch (error) {
      console.error('Error analyzing expenses:', error);
      setLoading(false);
    }
  };

  const generateAdvancedInsights = () => {
    const insights: string[] = [];

    // Analyze spending velocity
    const recentTransactions = transactions
      .filter(t => t.type === 'expense')
      .slice(0, 10);
    
    const averageRecentAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
    
    if (averageRecentAmount > 100) {
      insights.push('Your recent transactions show higher than usual spending. Consider reviewing your recent purchases.');
    }

    // Analyze category diversity
    const categories = new Set(transactions.map(t => t.category));
    if (categories.size < 3) {
      insights.push('Your spending is concentrated in few categories. Diversifying your budget across more categories might help better financial planning.');
    }

    // Weekend vs Weekday spending
    const weekendSpending = transactions
      .filter(t => {
        const date = parseISO(t.date);
        const day = date.getDay();
        return t.type === 'expense' && (day === 0 || day === 6);
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const weekdaySpending = transactions
      .filter(t => {
        const date = parseISO(t.date);
        const day = date.getDay();
        return t.type === 'expense' && day !== 0 && day !== 6;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (weekendSpending > weekdaySpending) {
      insights.push('Your weekend spending is higher than weekday spending. Setting a weekend budget might help control expenses.');
    }

    return insights;
  };

  const analyzeCategoryTrends = (transactions: Transaction[]) => {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    const topCategory = sortedCategories[0];
    return `Your highest spending category is ${topCategory[0]} at $${topCategory[1].toFixed(2)}. Consider setting a specific budget for this category.`;
  };

  const analyzeSpendingTrend = (data: { date: string; amount: number }[]) => {
    const recentDays = data.slice(-7);
    const average = recentDays.reduce((sum, day) => sum + day.amount, 0) / recentDays.length;
    
    const trend = average > 50 
      ? 'Your daily spending average is high. Try to identify non-essential expenses.'
      : 'Your daily spending is within a reasonable range.';

    return trend;
  };

  const detectAnomalies = (data: { date: string; amount: number }[]) => {
    const amounts = data.map(d => d.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
    );

    const threshold = mean + 2 * stdDev;
    const anomalies = data.filter(d => d.amount > threshold);

    return anomalies.map(a => 
      `Unusual spending of $${a.amount.toFixed(2)} detected on ${format(parseISO(a.date), 'MMM dd')}. This is significantly above your average spending.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">AI Expense Analysis</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expense Predictions (Next 7 Days)
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                AI Insights
              </h3>
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-blue-50 rounded-md text-sm text-blue-800"
                  >
                    {insight}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Monthly Comparison
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="revenue" fill="#22C55E" name="Revenue" />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" name="Balance" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Spending Patterns
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageExpense" fill="#3B82F6" name="Average Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Category Growth (vs Last Month)</h3>
        <div className="space-y-4">
          {categoryGrowth.map(category => (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.category}</span>
                  {category.growth > 0 ? (
                    <ArrowUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm ${
                    category.growth > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {Math.abs(category.growth).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Current: ${category.currentMonth.toFixed(2)} | Previous: ${category.previousMonth.toFixed(2)}
                </div>
              </div>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    category.growth > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(Math.abs(category.growth), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}