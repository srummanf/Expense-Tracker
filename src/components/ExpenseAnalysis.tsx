import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../types';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface ExpenseAnalysisProps {
  transactions: Transaction[];
}

interface Prediction {
  date: string;
  predicted: number;
  actual?: number;
}

export function ExpenseAnalysis({ transactions }: ExpenseAnalysisProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeExpenses();
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

  const analyzeExpenses = async () => {
    setLoading(true);
    try {
      const data = preprocessData();
      
      // Prepare data for TensorFlow
      const values = data.map(d => d.amount);
      const tensorData = tf.tensor2d(values.map((_, i) => [i]), [values.length, 1]);
      const tensorLabels = tf.tensor2d(values, [values.length, 1]);

      // Create and train the model
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

      // Make predictions
      const futureDays = 7;
      const predictionInput = tf.tensor2d(
        Array.from({ length: futureDays }, (_, i) => [values.length + i]),
        [futureDays, 1]
      );

      const predictionResult = model.predict(predictionInput) as tf.Tensor;
      const predictedValues = await predictionResult.data();

      // Prepare prediction data
      const lastDate = parseISO(data[data.length - 1].date);
      const predictions = Array.from({ length: futureDays }, (_, i) => ({
        date: format(new Date(lastDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000), 'MMM dd'),
        predicted: Math.max(0, predictedValues[i])
      }));

      setPredictions(predictions);

      // Generate insights
      const categoryAnalysis = analyzeCategoryTrends(transactions);
      const spendingTrend = analyzeSpendingTrend(data);
      const anomalies = detectAnomalies(data);

      setInsights([
        categoryAnalysis,
        spendingTrend,
        ...anomalies
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error analyzing expenses:', error);
      setLoading(false);
    }
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
  );
}