import React, { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isSameWeek,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval,
} from "date-fns";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
} from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import type { Transaction, CategoryTotal } from "../types";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  Calendar,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#F06292",
  "#BA68C8",
  "#4DB6AC",
  "#FFB74D",
];

interface Props {
  transactions: Transaction[];
}

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
  const [monthlyComparison, setMonthlyComparison] = useState<
    MonthlyComparison[]
  >([]);
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([]);
  const [categoryGrowth, setCategoryGrowth] = useState<CategoryGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  // Weekly Spending Data
  const getWeeklyData = () => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = subWeeks(new Date(), i);
      const weekTransactions = transactions.filter((t) =>
        isSameWeek(parseISO(t.date), date)
      );

      return {
        week: `Week ${4 - i}`,
        expenses: Math.abs(
          weekTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        revenue: weekTransactions
          .filter((t) => t.type === "revenue")
          .reduce((sum, t) => sum + t.amount, 0),
      };
    }).reverse();

    return last4Weeks;
  };

  // Current Week Daily Expenses
  const getCurrentWeekExpenses = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return daysOfWeek.map((day, index) => {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + index);

      const dayExpenses = transactions
        .filter((t) => {
          const transactionDate = parseISO(t.date);
          return (
            t.type === "expense" &&
            transactionDate >= startOfDay(currentDay) &&
            transactionDate <= endOfDay(currentDay)
          );
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        day,
        expenses: dayExpenses,
      };
    });
  };

  // Daily Spending Pattern Data
  const getDailyPatternData = () => {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const today = new Date();
    const lastMonday = startOfWeek(today, { weekStartsOn: 1 }); // Get the most recent Monday

    // Filter transactions for the most recent Monday-Sunday period
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = parseISO(t.date);
      return (
        isWithinInterval(transactionDate, { start: lastMonday, end: today }) &&
        t.type === "expense"
      );
    });

    const dailyTotals: number[] = new Array(7).fill(0);

    filteredTransactions.forEach((t) => {
      const dayIndex = (parseISO(t.date).getDay() + 6) % 7; // Shift Sunday (0) to last position (6)
      dailyTotals[dayIndex] += Math.abs(t.amount);
    });

    return daysOfWeek.map((day, index) => ({
      day,
      amount: dailyTotals[index] || 0,
    }));
  };

  // Monthly Comparison Data
  const getMonthlyData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthTransactions = transactions.filter((t) =>
        isSameMonth(parseISO(t.date), date)
      );

      return {
        month: format(date, "MMM yyyy"),
        expenses: Math.abs(
          monthTransactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0)
        ),
        revenue: monthTransactions
          .filter((t) => t.type === "revenue")
          .reduce((sum, t) => sum + t.amount, 0),
      };
    }).reverse();

    return last6Months;
  };

  //  Expense-to-Income Ratio Over Time
  // Function to calculate Expense-to-Income ratio over time
  const getExpenseToIncomeData = () => {
    const monthlyData: Record<
      string,
      { income: number; expense: number; ratio: number }
    > = {};

    transactions.forEach((t) => {
      const month = format(parseISO(t.date), "yyyy-MM"); // Extract YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0, ratio: 0 };
      }
      if (t.type === "revenue") {
        monthlyData[month].income += t.amount;
      } else if (t.type === "expense") {
        monthlyData[month].expense += Math.abs(t.amount);
      }

      // Calculate Expense-to-Income Ratio (Percentage)
      monthlyData[month].ratio = monthlyData[month].income
        ? (monthlyData[month].expense / monthlyData[month].income) * 100
        : 0;
    });

    return Object.entries(monthlyData).map(
      ([month, { income, expense, ratio }]) => ({
        month,
        income,
        expense,
        ratio,
      })
    );
  };

  // Savings Trend Over Time
  // Function to calculate Savings Data over time
  const getSavingsData = () => {
    const monthlyData: Record<
      string,
      { income: number; expense: number; savings: number; savingsRate: number }
    > = {};

    transactions.forEach((t) => {
      const month = format(parseISO(t.date), "yyyy-MM"); // Extract YYYY-MM format
      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          expense: 0,
          savings: 0,
          savingsRate: 0,
        };
      }
      if (t.type === "revenue") {
        monthlyData[month].income += t.amount;
      } else if (t.type === "expense") {
        monthlyData[month].expense += Math.abs(t.amount);
      }

      // Calculate Savings & Savings Rate
      monthlyData[month].savings =
        monthlyData[month].income - monthlyData[month].expense;
      monthlyData[month].savingsRate = monthlyData[month].income
        ? (monthlyData[month].savings / monthlyData[month].income) * 100
        : 0;
    });

    return Object.entries(monthlyData).map(
      ([month, { income, expense, savings, savingsRate }]) => ({
        name: month, // Month name for X-Axis
        income,
        expense,
        savings,
        savingsRate,
      })
    );
  };

  // Sample data (replace this with actual getSavingsData())
  const data = getSavingsData();

  // Category Data
  const getCategoryData = () => {
    const categoryTotals = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const total = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
      color: COLORS[index % COLORS.length],
    }));
  };

  // Cumulative Data
  const getCumulativeData = () => {
    let cumulative = 0;
    return transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => {
        cumulative += t.type === "expense" ? -t.amount : t.amount;
        return {
          date: format(parseISO(t.date), "MMM dd"),
          balance: cumulative,
        };
      });
  };

  // Function to compute cumulative spending for the latest Monday-to-Sunday week
  const getCumulativeDailyPatternData = () => {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const dailyTotals: number[] = new Array(7).fill(0);

    // Get today's date and the latest Monday (start of the week)
    const today = new Date();
    const latestMonday = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday

    // Define the date range: from latest Monday to today
    const weekStart = latestMonday;
    const weekEnd = today;

    // Filter transactions for the latest Monday-to-Sunday week
    const filteredTransactions = transactions.filter((t) => {
      const txnDate = parseISO(t.date);
      return (
        isWithinInterval(txnDate, { start: weekStart, end: weekEnd }) &&
        t.type === "expense"
      );
    });

    // Populate daily totals based on the filtered transactions
    filteredTransactions.forEach((t) => {
      const dayIndex = parseISO(t.date).getDay(); // Get day index (0 = Sunday, ..., 6 = Saturday)

      // Adjust index for Monday-first week
      const adjustedIndex = (dayIndex + 6) % 7;
      dailyTotals[adjustedIndex] += Math.abs(t.amount);
    });

    // Compute Cumulative Totals
    let cumulativeSum = 0;
    return daysOfWeek.map((day, index) => {
      cumulativeSum += dailyTotals[index];
      return {
        day,
        amount: cumulativeSum,
      };
    });
  };

  // Category Comparison Radar Data
  const getRadarData = () => {
    return getCategoryData().map(({ category, amount }) => ({
      category,
      amount: amount,
    }));
  };

  // Expense Trend Data
  const getExpenseTrendData = () => {
    const monthlyData = getMonthlyData();
    return monthlyData.map((data) => ({
      month: data.month,
      expenses: data.expenses,
      revenue: data.revenue,
      savings: data.revenue - data.expenses,
    }));
  };

  useEffect(() => {
    analyzeExpenses();
    analyzeMonthlyTrends();
    analyzeWeeklyPatterns();
    analyzeCategoryGrowth();
  }, [transactions]);

  const preprocessData = () => {
    const expensesByDay = new Map<string, number>();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const date = format(parseISO(t.date), "yyyy-MM-dd");
        expensesByDay.set(date, (expensesByDay.get(date) || 0) + t.amount);
      });

    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);

    const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });
    const data = allDays.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      amount: expensesByDay.get(format(day, "yyyy-MM-dd")) || 0,
    }));

    return data;
  };

  const analyzeMonthlyTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) =>
      subMonths(new Date(), i)
    );

    const monthlyData = last6Months
      .map((month) => {
        const monthTransactions = transactions.filter((t) =>
          isSameMonth(parseISO(t.date), month)
        );

        const expenses = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        const revenue = monthTransactions
          .filter((t) => t.type === "revenue")
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: format(month, "MMM yyyy"),
          expenses,
          revenue,
          balance: revenue - expenses,
        };
      })
      .reverse();

    setMonthlyComparison(monthlyData);
  };

  const analyzeWeeklyPatterns = () => {
    const expensesByDay = transactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, { total: number; count: number }>>((acc, t) => {
        const dayOfWeek = format(parseISO(t.date), "EEEE");
        if (!acc[dayOfWeek]) {
          acc[dayOfWeek] = { total: 0, count: 0 };
        }
        acc[dayOfWeek].total += t.amount;
        acc[dayOfWeek].count += 1;
        return acc;
      }, {});

    const patterns = Object.entries(expensesByDay).map(
      ([day, { total, count }]) => ({
        day,
        averageExpense: total / count,
        frequency: count,
      })
    );

    setWeeklyPatterns(patterns);
  };

  const analyzeCategoryGrowth = () => {
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);

    const currentMonthExpenses = transactions.filter(
      (t) => t.type === "expense" && isSameMonth(parseISO(t.date), currentMonth)
    );

    const previousMonthExpenses = transactions.filter(
      (t) =>
        t.type === "expense" && isSameMonth(parseISO(t.date), previousMonth)
    );

    const categories = [...new Set(transactions.map((t) => t.category))];

    const growth = categories.map((category) => {
      const currentTotal = currentMonthExpenses
        .filter((t) => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const previousTotal = previousMonthExpenses
        .filter((t) => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const growthRate =
        previousTotal === 0
          ? 100
          : ((currentTotal - previousTotal) / previousTotal) * 100;

      return {
        category: category || "Other",
        previousMonth: previousTotal,
        currentMonth: currentTotal,
        growth: growthRate,
      };
    });

    setCategoryGrowth(
      growth.sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth))
    );
  };

  const analyzeExpenses = async () => {
    setLoading(true);
    try {
      const data = preprocessData();

      // TensorFlow model setup and training
      const values = data.map((d) => d.amount);
      const tensorData = tf.tensor2d(
        values.map((_, i) => [i]),
        [values.length, 1]
      );
      const tensorLabels = tf.tensor2d(values, [values.length, 1]);

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

      model.compile({
        optimizer: tf.train.adam(0.1),
        loss: "meanSquaredError",
      });

      await model.fit(tensorData, tensorLabels, {
        epochs: 100,
        verbose: 0,
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
        date: format(
          new Date(lastDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          "MMM dd"
        ),
        predicted: Math.max(0, predictedValues[i]),
      }));

      setPredictions(predictions);

      // Generate insights
      const insights = [
        analyzeCategoryTrends(transactions),
        analyzeSpendingTrend(data),
        ...detectAnomalies(data),
        ...generateAdvancedInsights(),
      ];

      setInsights(insights);
      setLoading(false);
    } catch (error) {
      console.error("Error analyzing expenses:", error);
      setLoading(false);
    }
  };

  const generateAdvancedInsights = () => {
    const insights: string[] = [];

    // Analyze spending velocity
    const recentTransactions = transactions
      .filter((t) => t.type === "expense")
      .slice(0, 10);

    const averageRecentAmount =
      recentTransactions.reduce((sum, t) => sum + t.amount, 0) /
      recentTransactions.length;

    if (averageRecentAmount > 100) {
      insights.push(
        "Your recent transactions show higher than usual spending. Consider reviewing your recent purchases."
      );
    }

    // Analyze category diversity
    const categories = new Set(transactions.map((t) => t.category));
    if (categories.size < 3) {
      insights.push(
        "Your spending is concentrated in few categories. Diversifying your budget across more categories might help better financial planning."
      );
    }

    // Weekend vs Weekday spending
    const weekendSpending = transactions
      .filter((t) => {
        const date = parseISO(t.date);
        const day = date.getDay();
        return t.type === "expense" && (day === 0 || day === 6);
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const weekdaySpending = transactions
      .filter((t) => {
        const date = parseISO(t.date);
        const day = date.getDay();
        return t.type === "expense" && day !== 0 && day !== 6;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (weekendSpending > weekdaySpending) {
      insights.push(
        "Your weekend spending is higher than weekday spending. Setting a weekend budget might help control expenses."
      );
    }

    return insights;
  };

  const analyzeCategoryTrends = (transactions: Transaction[]) => {
    const categoryTotals = transactions
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        const category = t.category || "Other";
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    );

    const topCategory = sortedCategories[0];
    return `Your highest spending category is ${
      topCategory[0]
    } at $${topCategory[1].toFixed(
      2
    )}. Consider setting a specific budget for this category.`;
  };

  const analyzeSpendingTrend = (data: { date: string; amount: number }[]) => {
    const recentDays = data.slice(-7);
    const average =
      recentDays.reduce((sum, day) => sum + day.amount, 0) / recentDays.length;

    const trend =
      average > 50
        ? "Your daily spending average is high. Try to identify non-essential expenses."
        : "Your daily spending is within a reasonable range.";

    return trend;
  };

  const detectAnomalies = (data: { date: string; amount: number }[]) => {
    const amounts = data.map((d) => d.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        amounts.length
    );

    const threshold = mean + 2 * stdDev;
    const anomalies = data.filter((d) => d.amount > threshold);

    return anomalies.map(
      (a) =>
        `Unusual spending of $${a.amount.toFixed(2)} detected on ${format(
          parseISO(a.date),
          "MMM dd"
        )}. This is significantly above your average spending.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Weekly Spending */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">Weekly Spending</h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                <p className="mb-1">
                  This chart shows your expenses and revenue over the last four
                  weeks. Hover over each bar to see the details for that week.
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getWeeklyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
              <Bar dataKey="revenue" fill="#00C49F" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">
              Monthly Comparison
            </h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                <p className="mb-1">
                  This chart compares your expenses and revenue over the last
                  six months. Hover over each bar to see the details for that
                  month.
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
              <Bar dataKey="revenue" fill="#00C49F" name="Revenue" />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#FF8042"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4"></h3>
          <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">
              Spending by Category
            </h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                <p className="mb-1">
                  This pie chart shows your spending distribution across different
                  categories. Hover over each segment to see the
                  total spending for that category.
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getCategoryData()}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percentage }) =>
                  `${category}: ${percentage.toFixed(1)}%`
                }
              >
                {getCategoryData().map((entry, index) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Spending Pattern */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">
              Daily Spending Pattern (Current week)
            </h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                <p className="mb-1">
                  This chart shows your daily spending pattern for the current
                  week. Hover over each point to
                  see the spending amount for that day.
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getDailyPatternData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                fill="#8884d8"
                stroke="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Spending Pattern */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-1 text-lg font-medium text-gray-900">
            <h2 className="whitespace-normal break-words">
              Cumultive Daily Spending Pattern
            </h2>
            <div className="group relative">
              <Info size={16} className="text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg py-2 px-4 z-10 w-72 sm:w-72 md:w-96 shadow-lg">
                <p className="mb-1">
                  This chart shows the cumulative spending pattern for the
                  current week, starting from the most recent Monday. Hover over
                  each point to see the cumulative spending amount for that day.
                </p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getCumulativeDailyPatternData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                fill="#8884d8"
                stroke="#8884d8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Current Week Daily Expenses */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            Current Week Daily Expenses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getCurrentWeekExpenses()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="expenses" fill="#FF8042" name="Daily Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Comparison Radar */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Category Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={getRadarData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis />
              <Radar
                name="Spending"
                dataKey="amount"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Trends */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Expense Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={getExpenseTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="expenses"
                fill="#FF8042"
                stroke="#FF8042"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                fill="#00C49F"
                stroke="#00C49F"
              />
              <Line type="monotone" dataKey="savings" stroke="#8884d8" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Expense-to-Income Ratio Over Time */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            Expense-to-Income Ratio Over Time
          </h3>
          <ComposedChart
            data={getExpenseToIncomeData()}
            width={500}
            height={400}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />

            {/* Stacked Bars for Income and Expense */}
            <Bar dataKey="income" stackId="a" fill="#4CAF50" name="Income" />
            <Bar dataKey="expense" stackId="a" fill="#F44336" name="Expense" />

            {/* Dashed Line for Expense-to-Income Ratio */}
            <Line
              type="monotone"
              dataKey="ratio"
              stroke="#FF9800"
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Expense-to-Income Ratio (%)"
            />
          </ComposedChart>
        </div>

        {/* Savings Trend Over Time */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            Savings Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={data}
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid stroke="#f5f5f5" />
              <XAxis dataKey="name" scale="band" />
              <YAxis />
              <Tooltip />
              <Legend />

              {/* Area Chart for Savings */}
              <Area
                type="monotone"
                dataKey="savings"
                fill="#64B5F6"
                stroke="#1E88E5"
                name="Savings"
              />

              {/* Stacked Bars for Income and Expense */}
              <Bar dataKey="income" barSize={20} fill="#4CAF50" name="Income" />
              <Bar
                dataKey="expense"
                barSize={20}
                fill="#F44336"
                name="Expense"
              />

              {/* Dashed Line for Savings Rate (%) */}
              <Line
                type="monotone"
                dataKey="savingsRate"
                stroke="#FF9800"
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Savings Rate (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Balance */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Cumulative Balance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getCumulativeData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#8884d8"
                dot={false}
                name="Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Overview */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">
                Total Income
              </h4>
              <p className="text-2xl font-bold text-blue-900">
                $
                {transactions
                  .filter((t) => t.type === "revenue")
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">
                Total Expenses
              </h4>
              <p className="text-2xl font-bold text-red-900">
                $
                {Math.abs(
                  transactions
                    .filter((t) => t.type === "expense")
                    .reduce((sum, t) => sum + t.amount, 0)
                ).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">
                Net Balance
              </h4>
              <p className="text-2xl font-bold text-green-900">
                $
                {transactions
                  .reduce(
                    (sum, t) =>
                      sum + (t.type === "expense" ? -t.amount : t.amount),
                    0
                  )
                  .toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-700">
                Transactions
              </h4>
              <p className="text-2xl font-bold text-purple-900">
                {transactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">
            AI Expense Analysis
          </h2>
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
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3B82F6"
                  name="Balance"
                />
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
                <Bar
                  dataKey="averageExpense"
                  fill="#3B82F6"
                  name="Average Expense"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Category Growth (vs Last Month)
        </h3>
        <div className="space-y-4">
          {categoryGrowth.map((category) => (
            <div
              key={category.category}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.category}</span>
                  {category.growth > 0 ? (
                    <ArrowUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-green-500" />
                  )}
                  <span
                    className={`text-sm ${
                      category.growth > 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {Math.abs(category.growth).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Current: ${category.currentMonth.toFixed(2)} | Previous: $
                  {category.previousMonth.toFixed(2)}
                </div>
              </div>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    category.growth > 0 ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(Math.abs(category.growth), 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
