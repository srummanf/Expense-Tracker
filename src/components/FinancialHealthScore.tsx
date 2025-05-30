import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, DollarSign, Calendar, Target } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: 'expense' | 'revenue';
  category?: string;
}

interface FinancialHealthScoreProps {
  transactions: Transaction[];
}

const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({ transactions }) => {
  const financialData = useMemo(() => {
    if (!transactions.length) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    // Calculate totals
    const totalIncome = currentMonthTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.category || 'Other';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryExpenses).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }));

    // Calculate health score (0-100)
    let healthScore = 0;
    
    // Savings rate component (40 points max)
    if (savingsRate >= 20) healthScore += 40;
    else if (savingsRate >= 10) healthScore += 30;
    else if (savingsRate >= 5) healthScore += 20;
    else if (savingsRate > 0) healthScore += 10;

    // Expense diversity (20 points max)
    const categoryCount = Object.keys(categoryExpenses).length;
    if (categoryCount >= 5) healthScore += 20;
    else if (categoryCount >= 3) healthScore += 15;
    else if (categoryCount >= 2) healthScore += 10;

    // Income stability (20 points max)
    const incomeTransactions = currentMonthTransactions.filter(t => t.type === 'revenue');
    if (incomeTransactions.length >= 1) healthScore += 20;

    // Spending control (20 points max)
    const largestExpenseCategory = Math.max(...Object.values(categoryExpenses));
    const largestCategoryPercentage = totalExpenses > 0 ? (largestExpenseCategory / totalExpenses) * 100 : 0;
    if (largestCategoryPercentage < 40) healthScore += 20;
    else if (largestCategoryPercentage < 60) healthScore += 15;
    else if (largestCategoryPercentage < 80) healthScore += 10;

    // Monthly trend (last 3 months)
    const monthlyTrends = [];
    for (let i = 2; i >= 0; i--) {
      const targetMonth = new Date(currentYear, currentMonth - i, 1);
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === targetMonth.getMonth() && tDate.getFullYear() === targetMonth.getFullYear();
      });
      
      const monthIncome = monthTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
      const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      monthlyTrends.push({
        month: targetMonth.toLocaleDateString('en-US', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses
      });
    }

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      healthScore: Math.round(healthScore),
      categoryData,
      monthlyTrends,
      largestCategoryPercentage
    };
  }, [transactions]);

  if (!financialData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Available</h3>
          <p className="text-gray-600">Add some transactions to see your financial health score and insights.</p>
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', label: 'Excellent', icon: CheckCircle };
    if (score >= 60) return { grade: 'B', label: 'Good', icon: TrendingUp };
    if (score >= 40) return { grade: 'C', label: 'Fair', icon: AlertTriangle };
    return { grade: 'D', label: 'Needs Improvement', icon: TrendingDown };
  };

  const healthGrade = getHealthScoreGrade(financialData.healthScore);
  const HealthIcon = healthGrade.icon;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff8042'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm">Amount: ₹{data.amount.toLocaleString()}</p>
          <p className="text-sm">Percentage: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Health Score</h2>
        <p className="text-gray-600">Understanding your financial wellness through data-driven insights</p>
      </div>

      {/* Main Score Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <HealthIcon className={`h-8 w-8 ${getHealthScoreColor(financialData.healthScore)}`} />
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-4xl font-bold ${getHealthScoreColor(financialData.healthScore)}`}>
                    {financialData.healthScore}
                  </span>
                  <span className="text-lg text-gray-600">/100</span>
                </div>
                <p className={`text-lg font-medium ${getHealthScoreColor(financialData.healthScore)}`}>
                  Grade {healthGrade.grade} - {healthGrade.label}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">This Month's Savings</p>
              <p className={`text-2xl font-bold ${financialData.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{financialData.netSavings.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {financialData.savingsRate.toFixed(1)}% of income
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Monthly Income</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{financialData.totalIncome.toLocaleString()}</p>
          <p className="text-sm text-blue-700">Total earnings this month</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Monthly Expenses</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{financialData.totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-red-700">Total spending this month</p>
        </div>

        <div className={`${financialData.netSavings >= 0 ? 'bg-green-50' : 'bg-yellow-50'} rounded-lg p-4`}>
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-5 w-5" />
            <h3 className="font-semibold">Savings Rate</h3>
          </div>
          <p className={`text-2xl font-bold ${financialData.netSavings >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
            {financialData.savingsRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-700">
            {financialData.savingsRate >= 20 ? 'Excellent!' : 
             financialData.savingsRate >= 10 ? 'Good progress' :
             financialData.savingsRate >= 5 ? 'Getting there' : 'Needs improvement'}
          </p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">3-Month Financial Trend</h3>
          <div className="ml-2">
            <div className="group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute z-10 w-64 p-2 bg-black text-white text-xs rounded-lg -top-8 left-6">
                Track your income, expenses, and savings over the last 3 months to identify patterns and trends.
              </div>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={financialData.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      {financialData.categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Expense Categories</span>
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={financialData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {financialData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={financialData.categoryData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Educational Insights */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Financial Health Insights & Tips</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💰 Savings Rate</h4>
            <p className="text-sm text-gray-700 mb-2">
              Your current savings rate is {financialData.savingsRate.toFixed(1)}%.
            </p>
            <p className="text-xs text-gray-600">
              {financialData.savingsRate >= 20 ? 
                'Excellent! You\'re saving more than recommended. Consider investing surplus funds.' :
                financialData.savingsRate >= 10 ?
                'Good job! Try to gradually increase to 20% for optimal financial health.' :
                financialData.savingsRate >= 5 ?
                'You\'re on track. Look for areas to reduce expenses and boost savings.' :
                'Focus on reducing expenses and increasing income. Even 5% savings is a good start!'}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📊 Expense Control</h4>
            <p className="text-sm text-gray-700 mb-2">
              Your largest expense category represents {financialData.largestCategoryPercentage.toFixed(1)}% of total spending.
            </p>
            <p className="text-xs text-gray-600">
              {financialData.largestCategoryPercentage < 40 ?
                'Great balance! Your expenses are well-distributed across categories.' :
                financialData.largestCategoryPercentage < 60 ?
                'Good control. Consider if your largest category can be optimized.' :
                'Consider diversifying expenses. One category dominates your spending.'}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📈 Next Steps</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {financialData.healthScore < 40 && <li>• Focus on building an emergency fund</li>}
              {financialData.savingsRate < 10 && <li>• Track all expenses for better awareness</li>}
              {financialData.savingsRate >= 15 && <li>• Consider investing in SIP/mutual funds</li>}
              <li>• Review and categorize expenses monthly</li>
              <li>• Set specific savings goals</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Benchmarks</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Emergency Fund: 6 months expenses</p>
              <p>• Savings Rate: 15-20% of income</p>
              <p>• Housing: &lt;30% of income</p>
              <p>• Investments: 10-15% of income</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthScore;