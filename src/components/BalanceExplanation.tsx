import React from "react";
import {
  Info,
  ShieldCheck,
  PiggyBank,
  Wallet,
  TrendingDown,
  TrendingUp,
  PieChart,
  CreditCard,
  BadgeDollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Activity
  
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Legend,
  Pie
} from "recharts";

interface BalanceExplanationProps {
  bankAmount: number;
  bankLimit: number;
  totalPlanned: number;
  totalActualSpent: number;
  totalSavingsContributions: number;
  remainingPlanned: number;
  usableBalance?: number; // Optional, can be calculated
  safeBalance?: number; // Optional, can be calculated
  totalActualSpentOnPlanned: number; // Optional, can be calculated
  totalSIPAmount: number; // Optional, can be calculated
  totalEMIAmount: number; // Optional, can be calculated
}

export const BalanceExplanation: React.FC<BalanceExplanationProps> = ({
  bankAmount,
  bankLimit,
  totalPlanned,
  totalSavingsContributions,
  remainingPlanned,
  totalActualSpentOnPlanned,
  totalSIPAmount,
  totalEMIAmount
  
}) => {
  // Calculations
  const usableBalance = bankAmount - bankLimit - totalSavingsContributions - totalSIPAmount - totalEMIAmount;
  const safeBalance = usableBalance - remainingPlanned;

  // Balance Score Calculation (0-100)
  const calculateBalanceScore = () => {
    let score = 0;
    
    // Positive factors
    if (safeBalance > 0) score += 30; // Has safe balance
    if (usableBalance > bankAmount * 0.3) score += 20; // Good usable balance ratio
    if (totalSavingsContributions > 0) score += 15; // Has savings
    if (bankLimit > 0) score += 10; // Has emergency buffer
    if (totalSIPAmount > 0) score += 10; // Has investments
    if (remainingPlanned <= usableBalance) score += 15; // Can afford planned expenses
    
    return Math.min(score, 100);
  };

  const balanceScore = calculateBalanceScore();

  // Get score status
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { status: "Excellent", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle };
    if (score >= 60) return { status: "Good", color: "text-blue-600", bgColor: "bg-blue-100", icon: Activity };
    if (score >= 40) return { status: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: AlertCircle };
    return { status: "Needs Attention", color: "text-red-600", bgColor: "bg-red-100", icon: AlertTriangle };
  };

  const scoreStatus = getScoreStatus(balanceScore);
  const StatusIcon = scoreStatus.icon;

  // Data for charts
  const balanceBreakdownData = [
    { name: "Bank Limit", value: bankLimit, color: "#ef4444" },
    { name: "Savings", value: totalSavingsContributions, color: "#10b981" },
    { name: "SIP", value: totalSIPAmount, color: "#3b82f6" },
    { name: "EMI", value: totalEMIAmount, color: "#f59e0b" },
    { name: "Remaining Planned", value: remainingPlanned, color: "#8b5cf6" },
    { name: "Safe Balance", value: Math.max(safeBalance, 0), color: "#06b6d4" }
  ];

  const flowData = [
    { name: "Bank Balance", amount: bankAmount, cumulative: bankAmount },
    { name: "After Bank Limit", amount: bankAmount - bankLimit, cumulative: bankAmount - bankLimit },
    { name: "After Savings", amount: usableBalance, cumulative: usableBalance },
    { name: "Safe Balance", amount: safeBalance, cumulative: safeBalance }
  ];

  const scoreRadialData = [
    { name: "Score", value: balanceScore, fill: balanceScore >= 60 ? "#10b981" : balanceScore >= 40 ? "#f59e0b" : "#ef4444" }
  ];

  const ratioData = [
    { name: "Savings Rate", percentage: (totalSavingsContributions / bankAmount) * 100 },
    { name: "Investment Rate", percentage: (totalSIPAmount / bankAmount) * 100 },
    { name: "Safe Balance Rate", percentage: Math.max((safeBalance / bankAmount) * 100, 0) },
    { name: "Buffer Rate", percentage: (bankLimit / bankAmount) * 100 }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      
      <div className="flex items-center gap-2 mb-4">
        <Info className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          How Safe and Usable Balances are Calculated
        </h2>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Component</th>
              <th className="text-right px-4 py-2">Amount (₹)</th>
              <th className="text-left px-4 py-2">Explanation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">1</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Wallet size={16} /> Bank Balance
              </td>
              <td className="px-4 py-2 text-right">
                {bankAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2">Your current bank balance.</td>
            </tr>
            <tr>
              <td className="px-4 py-2">2</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <ShieldCheck size={16} /> Bank Limit
              </td>
              <td className="px-4 py-2 text-right">
                - {bankLimit.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount you want to reserve as a limit.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">3</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <PiggyBank size={16} /> Savings Contributions
              </td>
              <td className="px-4 py-2 text-right">
                - {totalSavingsContributions.toLocaleString()}
              </td>
              <td className="px-4 py-2">Amount allocated to Savings Goals.</td>
            </tr>
            <tr>
              <td className="px-4 py-2">4</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Target size={16} /> EMI Contributions
              </td>
              <td className="px-4 py-2 text-right">
                - {totalEMIAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2">Amount allocated to EMI Goals.</td>
            </tr>
            <tr>
              <td className="px-4 py-2">5</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Target size={16} /> SIP (Mututal Fund) Contributions
              </td>
              <td className="px-4 py-2 text-right">
                - {totalSIPAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2">Amount allocated to SIP in Mutual Funds.</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="px-4 py-2">6</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingUp size={16} /> Usable Balance
              </td>
              <td className="px-4 py-2 text-right">
                {usableBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Remaining money after bank limit and savings are excluded.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">7</td>
              <td className="px-4 py-2 flex items-center gap-1 text-gray-600" >
                <PieChart size={16} /> Total Planned Budget
              </td>
              <td className="px-4 py-2 text-right text-gray-600">
                {" "}
                {totalPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-gray-600">
                Amount you've planned to spend, based on the Budget Planning.
              </td>
            </tr>

            <tr className="text-gray-600">
              <td className="px-4 py-2">8</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <CreditCard size={16} /> Total Actual Spent On Planned Budget
              </td>
              <td className="px-4 py-2 text-right">
                {" "}
                {totalActualSpentOnPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount you've spent on the Budget Planning.
              </td>
            </tr>
            <tr className="text-gray-900 font-semibold">
              <td className="px-4 py-2">9</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <BadgeDollarSign size={16} /> Remaining Planned Budget
              </td>
              <td className="px-4 py-2 text-right">
                - {remainingPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                Amount yet to spend on the Budget Planning.
              </td>
            </tr>

            <tr className="bg-green-100 font-semibold">
              <td className="px-4 py-2">10</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingDown size={16} /> Safe Balance
              </td>
              <td className="px-4 py-2 text-right">
                {safeBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                What's left after including planned expenses, savings, and
                limits.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Info className="text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">
          Bank Balance Score Dashboard
        </h2>
      </div>

      {/* Balance Score Card */}
      <div className={`p-6 rounded-lg ${scoreStatus.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${scoreStatus.color}`} />
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{balanceScore}/100</h3>
              <p className={`font-semibold ${scoreStatus.color}`}>{scoreStatus.status}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Balance Health</p>
            <p className="font-semibold text-gray-800">₹{safeBalance.toLocaleString()} Safe Balance</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown Radial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Balance Score</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={scoreRadialData}>
              <RadialBar dataKey="value" cornerRadius={10} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                {balanceScore}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Usable Balance</span>
              <span className="font-semibold">₹{usableBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Safe Balance</span>
              <span className={`font-semibold ${safeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{safeBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Savings Rate</span>
              <span className="font-semibold">{((totalSavingsContributions / bankAmount) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Investment Rate</span>
              <span className="font-semibold">{((totalSIPAmount / bankAmount) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Breakdown Pie Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Balance Allocation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={balanceBreakdownData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {balanceBreakdownData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      {/* Balance Flow Chart */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Balance Flow Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(2)}k`} />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
            <Bar dataKey="amount" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Component</th>
              <th className="text-right px-4 py-2">Amount (₹)</th>
              <th className="text-right px-4 py-2">% of Bank Balance</th>
              <th className="text-left px-4 py-2">Impact on Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2">1</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Wallet size={16} /> Bank Balance
              </td>
              <td className="px-4 py-2 text-right font-semibold">
                {bankAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">100.0%</td>
              <td className="px-4 py-2">Base amount</td>
            </tr>
            <tr>
              <td className="px-4 py-2">2</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <ShieldCheck size={16} /> Bank Limit
              </td>
              <td className="px-4 py-2 text-right text-red-600">
                - {bankLimit.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((bankLimit / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-green-600">+10 pts (Emergency buffer)</td>
            </tr>
            <tr>
              <td className="px-4 py-2">3</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <PiggyBank size={16} /> Savings
              </td>
              <td className="px-4 py-2 text-right text-red-600">
                - {totalSavingsContributions.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((totalSavingsContributions / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-green-600">+15 pts (Future security)</td>
            </tr>
            <tr>
              <td className="px-4 py-2">4</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Target size={16} /> SIP Investments
              </td>
              <td className="px-4 py-2 text-right text-red-600">
                - {totalSIPAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((totalSIPAmount / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-green-600">+10 pts (Wealth building)</td>
            </tr>
            <tr>
              <td className="px-4 py-2">5</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <Target size={16} /> EMI Obligations
              </td>
              <td className="px-4 py-2 text-right text-red-600">
                - {totalEMIAmount.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((totalEMIAmount / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-gray-600">Neutral (Obligation)</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="px-4 py-2">6</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingUp size={16} /> Usable Balance
              </td>
              <td className="px-4 py-2 text-right">
                {usableBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((usableBalance / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-blue-600">
                {usableBalance > bankAmount * 0.3 ? '+20 pts (Good ratio)' : 'Low ratio'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">7</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <BadgeDollarSign size={16} /> Remaining Planned
              </td>
              <td className="px-4 py-2 text-right text-red-600">
                - {remainingPlanned.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((remainingPlanned / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2 text-purple-600">
                {remainingPlanned <= usableBalance ? '+15 pts (Affordable)' : 'Over budget'}
              </td>
            </tr>
            <tr className="bg-green-100 font-semibold">
              <td className="px-4 py-2">8</td>
              <td className="px-4 py-2 flex items-center gap-1">
                <TrendingDown size={16} /> Safe Balance
              </td>
              <td className="px-4 py-2 text-right">
                {safeBalance.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">{((safeBalance / bankAmount) * 100).toFixed(1)}%</td>
              <td className="px-4 py-2">
                {safeBalance > 0 ? 
                  <span className="text-green-600">+30 pts (Positive balance)</span> : 
                  <span className="text-red-600">Deficit situation</span>
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Info className="text-blue-600" />
          Recommendations to Improve Your Score
        </h3>
        <div className="space-y-2 text-sm">
          {balanceScore < 80 && (
            <>
              {safeBalance <= 0 && (
                <p className="text-red-600">• Your safe balance is negative. Consider reducing planned expenses or increasing income.</p>
              )}
              {totalSavingsContributions === 0 && (
                <p className="text-yellow-600">• Start saving regularly to improve financial security (+15 points).</p>
              )}
              {totalSIPAmount === 0 && (
                <p className="text-yellow-600">• Consider starting SIP investments for wealth building (+10 points).</p>
              )}
              {bankLimit === 0 && (
                <p className="text-yellow-600">• Set up an emergency fund buffer (+10 points).</p>
              )}
              {usableBalance <= bankAmount * 0.3 && (
                <p className="text-yellow-600">• Try to maintain at least 30% of your bank balance as usable amount (+20 points).</p>
              )}
            </>
          )}
          {balanceScore >= 80 && (
            <p className="text-green-600">• Excellent financial health! Keep maintaining this balance.</p>
          )}
        </div>
      </div>

      {/* Line Chart */}
      {/* Number Line Visualization */}
      <div className="mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <Wallet className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">Bank Balance</div>
            <div className="text-gray-700 text-xs">
              ₹{bankAmount.toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">After Limit</div>
            <div className="text-gray-700 text-xs">
              ₹{(bankAmount - bankLimit).toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <PiggyBank className="text-blue-600 mb-1" />
            <div className="font-semibold text-sm">After Savings, EMI, SIP</div>
            <div className="text-gray-700 text-xs">
              ₹{usableBalance.toLocaleString()}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <div className="w-10 h-1 bg-blue-500" />
            <span className="mx-2 text-xl">→</span>
            <div className="w-10 h-1 bg-blue-500" />
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center">
            <PieChart className="text-green-600 mb-1" />
            <div className="font-semibold text-sm">Safe Balance (After Budget)</div>
            <div className="text-gray-700 text-xs">
              ₹{safeBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Optional: Mini bar below showing % of transition */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-4">
          
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${(safeBalance / bankAmount) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
