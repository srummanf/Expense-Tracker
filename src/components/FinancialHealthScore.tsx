import React, { useMemo, useState } from "react";
import { GaugeCircle, Info, TrendingUp, PieChart, Target, DollarSign } from "lucide-react";

// Mock Transaction type for demo
type Transaction = {
  id: string;
  amount: number;
  type: "revenue" | "expense";
  category: string;
  date: string;
  description: string;
};

// Sample data for demonstration
const sampleTransactions: Transaction[] = [
  { id: "1", amount: 5000, type: "revenue", category: "Salary", date: "2025-05-15", description: "Monthly salary" },
  { id: "2", amount: 1200, type: "revenue", category: "Freelance", date: "2025-05-10", description: "Web development project" },
  { id: "3", amount: 800, type: "expense", category: "Rent", date: "2025-05-01", description: "Monthly rent" },
  { id: "4", amount: 300, type: "expense", category: "Groceries", date: "2025-05-05", description: "Weekly groceries" },
  { id: "5", amount: 150, type: "expense", category: "Utilities", date: "2025-05-03", description: "Electricity bill" },
  { id: "6", amount: 200, type: "expense", category: "Entertainment", date: "2025-05-12", description: "Movies and dining" },
  { id: "7", amount: 500, type: "expense", category: "Transportation", date: "2025-05-08", description: "Monthly transport pass" },
];

const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -translate-x-1/2 left-1/2">
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
};

export const FinancialHealthScore = ({ transactions = sampleTransactions }: { transactions?: Transaction[] }) => {
  const analysis = useMemo(() => {
    if (transactions.length === 0) return { 
      score: 0, 
      breakdown: {}, 
      metrics: { totalRevenue: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 } 
    };

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

    const netSavings = totalRevenue - totalExpenses;
    const savingsRate = totalRevenue > 0 ? (netSavings / totalRevenue) * 100 : 0;

    const savingsRatio = totalRevenue > 0 ?
      Math.min(Math.max(0, (totalRevenue - totalExpenses) / totalRevenue), 1) : 0;

    const incomeSources = new Set(
      recentTransactions.filter(t => t.type === "revenue").map(t => t.category)
    ).size;
    const incomeSourceScore = Math.min(incomeSources / 3, 1);

    const expenseCategories = recentTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expenseValues = Object.values(expenseCategories);
    const totalExpenseValue = expenseValues.reduce((a, b) => a + b, 0);

    const expenseConcentration = expenseValues.length > 0 ? expenseValues.reduce((acc, val) => {
      const proportion = val / totalExpenseValue;
      return acc + proportion * proportion;
    }, 0) : 0;
    const expenseDiversityScore = 1 - Math.min(expenseConcentration, 1);

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
      },
      metrics: {
        totalRevenue,
        totalExpenses,
        netSavings,
        savingsRate: Math.round(savingsRate),
        incomeSourceCount: incomeSources,
        expenseCategoryCount: Object.keys(expenseCategories).length
      }
    };
  }, [transactions]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-green-600";
    if (score >= 60) return "from-blue-500 to-indigo-600";
    if (score >= 40) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return "🌟 Excellent";
    if (score >= 60) return "✅ Good";
    if (score >= 40) return "⚠️ Fair";
    return "🚨 Needs Attention";
  };

  const getRecommendations = (score: number, breakdown: any) => {
    const recommendations = [];
    
    if (breakdown.savingsRatio < 50) {
      recommendations.push("💡 Try to reduce expenses or increase income to improve your savings rate");
    }
    if (breakdown.incomeSourceScore < 70) {
      recommendations.push("💡 Consider diversifying your income sources for better financial stability");
    }
    if (breakdown.expenseDiversityScore < 60) {
      recommendations.push("💡 Balance your spending across different categories to avoid over-concentration");
    }
    
    return recommendations;
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = "blue",
    tooltip 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    tooltip?: string;
  }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        
        <div className={`flex gap-x-1 p-[0.35rem] rounded-lg bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={20} />
          <h1>{title}</h1>
        </div>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info size={16} className="text-gray-400 hover:text-gray-600" />
          </Tooltip>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );

  const MetricBar = ({
    label,
    value,
    color,
    emoji,
    tooltip
  }: {
    label: string;
    value: number;
    color: string;
    emoji?: string;
    tooltip?: string;
  }) => (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info size={14} className="text-gray-400 hover:text-gray-600" />
            </Tooltip>
          )}
        </div>
        <span className="text-sm font-bold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  const recommendations = getRecommendations(analysis.score, analysis.breakdown);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Score Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Financial Health Score</h3>
          <div className="flex items-center gap-2">
            <GaugeCircle className="text-blue-500" size={28} />
            <Tooltip content="Your overall financial health based on savings rate, income diversity, and spending patterns over the last 30 days">
              <Info size={20} className="text-gray-400 hover:text-gray-600" />
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Score Display */}
          <div className="relative mb-6">
            <div className={`text-8xl font-extrabold mb-2 bg-gradient-to-r ${getScoreGradient(analysis.score)} bg-clip-text text-transparent`}>
              {analysis.score}
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
          </div>
          
          <div className={`text-xl font-semibold mb-2 ${getScoreColor(analysis.score)}`}>
            {getScoreText(analysis.score)}
          </div>
          
          <div className="text-gray-600 text-center max-w-md">
            Based on your financial activity over the past 30 days
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Income"
          value={`$${analysis.metrics.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          tooltip="Total revenue from all income sources in the past 30 days"
        />
        <MetricCard
          title="Total Expenses"
          value={`$${analysis.metrics.totalExpenses.toLocaleString()}`}
          icon={DollarSign}
          color="red"
          tooltip="Total amount spent across all categories in the past 30 days"
        />
        <MetricCard
          title="Net Savings"
          value={`$${analysis.metrics.netSavings.toLocaleString()}`}
          subtitle={`${analysis.metrics.savingsRate}% of income`}
          icon={Target}
          color={analysis.metrics.netSavings >= 0 ? "green" : "red"}
          tooltip="Amount saved after all expenses (Income - Expenses)"
        />
        <MetricCard
          title="Income Sources"
          value={analysis.metrics.incomeSourceCount}
          subtitle={`${analysis.metrics.expenseCategoryCount} expense categories`}
          icon={PieChart}
          color="blue"
          tooltip="Number of different income sources and expense categories"
        />
      </div>

      {/* Breakdown Metrics */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h4 className="text-xl font-bold text-gray-900 mb-6">Score Breakdown</h4>
        <div className="space-y-6">
          <MetricBar
            label="Savings Rate"
            value={analysis.breakdown.savingsRatio}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            emoji="💰"
            tooltip="Percentage of income saved after expenses. Higher is better for financial stability."
          />
          <MetricBar
            label="Income Diversity"
            value={analysis.breakdown.incomeSourceScore}
            color="bg-gradient-to-r from-emerald-500 to-green-600"
            emoji="📈"
            tooltip="Measures how diversified your income sources are. Multiple sources reduce financial risk."
          />
          <MetricBar
            label="Spending Balance"
            value={analysis.breakdown.expenseDiversityScore}
            color="bg-gradient-to-r from-purple-500 to-indigo-600"
            emoji="⚖️"
            tooltip="How well-balanced your expenses are across categories. Avoiding over-concentration in one area."
          />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-100">
          <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-blue-600" size={24} />
            Recommendations for Improvement
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <div className="text-blue-600 mt-0.5">•</div>
                <div className="text-gray-700">{rec}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="text-sm text-gray-600 text-center leading-relaxed">
          <p className="mb-2">
            Your score reflects your <strong>savings behavior</strong> (50% weight),
            <strong> income variety</strong> (30% weight), and <strong>spending balance</strong> (20% weight).
          </p>
          <p>
            Scores are calculated using the last 30 days of transaction data. Update regularly for the most accurate assessment.
          </p>
        </div>
      </div>
    </div>
  );
};