import React, { useState, useEffect } from "react";
import { TrendingUp, ChevronsUp, ChevronsDown, BarChart, Coins, PlusCircle, Edit, Trash2 } from "lucide-react";
import type { Transaction } from "../types";

type Investment = {
  id: string;
  name: string;
  ticker: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  category: "Stock" | "ETF" | "Mutual Fund" | "Bond" | "Gold" | "Other";
  purchaseDate: string;
  exchange: "NSE" | "BSE" | "Other";
};

export const InvestmentPortfolioTracker = ({ transactions }: { transactions: Transaction[] }) => {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem("investments");
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        name: "Reliance Industries Ltd",
        ticker: "RELIANCE",
        shares: 10,
        purchasePrice: 2467.50,
        currentPrice: 2890.25,
        category: "Stock" as const,
        purchaseDate: "2024-08-15",
        exchange: "NSE" as const
      },
      {
        id: "2",
        name: "HDFC Bank Ltd",
        ticker: "HDFCBANK",
        shares: 15,
        purchasePrice: 1640.30,
        currentPrice: 1725.80,
        category: "Stock" as const,
        purchaseDate: "2024-07-10",
        exchange: "NSE" as const
      },
      {
        id: "3",
        name: "Nifty BeES",
        ticker: "NIFTYBEES",
        shares: 25,
        purchasePrice: 240.50,
        currentPrice: 256.75,
        category: "ETF" as const,
        purchaseDate: "2024-09-01",
        exchange: "NSE" as const
      },
      {
        id: "4",
        name: "SBI Gold Fund",
        ticker: "SBIGL",
        shares: 50,
        purchasePrice: 52.80,
        currentPrice: 58.25,
        category: "Mutual Fund" as const,
        purchaseDate: "2024-06-20",
        exchange: "Other" as const
      }
    ];
  });
  
  const [newInvestment, setNewInvestment] = useState<Omit<Investment, "id">>({
    name: "",
    ticker: "",
    shares: 0,
    purchasePrice: 0,
    currentPrice: 0,
    category: "Stock",
    purchaseDate: "",
    exchange: "NSE"
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("investments", JSON.stringify(investments));
  }, [investments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewInvestment({
      ...newInvestment,
      [name]: name === "shares" || name === "purchasePrice" || name === "currentPrice" 
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      setInvestments(investments.map(inv => 
        inv.id === editingId ? { ...newInvestment, id: editingId } : inv
      ));
      setEditingId(null);
    } else {
      const investmentToAdd = {
        ...newInvestment,
        id: crypto.randomUUID()
      };
      setInvestments([...investments, investmentToAdd]);
    }
    
    setNewInvestment({
      name: "",
      ticker: "",
      shares: 0,
      purchasePrice: 0,
      currentPrice: 0, 
      category: "Stock",
      purchaseDate: "",
      exchange: "NSE"
    });
    setShowForm(false);
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, currentPrice: newPrice } : inv
    ));
  };

  const handleEdit = (investment: Investment) => {
    setNewInvestment({
      name: investment.name,
      ticker: investment.ticker,
      shares: investment.shares,
      purchasePrice: investment.purchasePrice,
      currentPrice: investment.currentPrice,
      category: investment.category,
      purchaseDate: investment.purchaseDate,
      exchange: investment.exchange
    });
    setEditingId(investment.id);
    setShowForm(true);
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
  };

  // Calculate portfolio metrics
  const totalInvestmentValue = investments.reduce(
    (sum, inv) => sum + (inv.shares * inv.currentPrice), 
    0
  );
  
  const totalCostBasis = investments.reduce(
    (sum, inv) => sum + (inv.shares * inv.purchasePrice), 
    0
  );
  
  const totalGainLoss = totalInvestmentValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 
    ? (totalGainLoss / totalCostBasis) * 100 
    : 0;

  // Calculate allocation by category
  const categoryAllocation = investments.reduce((acc, inv) => {
    const value = inv.shares * inv.currentPrice;
    acc[inv.category] = (acc[inv.category] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  // Calculate allocation by exchange
  const exchangeAllocation = investments.reduce((acc, inv) => {
    const value = inv.shares * inv.currentPrice;
    acc[inv.exchange] = (acc[inv.exchange] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  // Color for gain/loss
  const getGainLossColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  // Icon for gain/loss
  const getGainLossIcon = (value: number) => {
    if (value > 0) return <ChevronsUp size={16} />;
    if (value < 0) return <ChevronsDown size={16} />;
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="text-blue-500 mr-2" size={24} />
          Investment Portfolio
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
        >
          <PlusCircle size={16} className="mr-1" />
          {showForm ? "Cancel" : "Add Investment"}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium mb-3">{editingId ? "Edit" : "Add"} Investment</h4>
          <form onSubmit={handleAddInvestment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={newInvestment.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
              <input
                type="text"
                name="ticker"
                value={newInvestment.ticker}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={newInvestment.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Stock">Stock</option>
                <option value="ETF">ETF</option>
                <option value="Mutual Fund">Mutual Fund</option>
                <option value="Bond">Bond</option>
                <option value="Gold">Gold</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange</label>
              <select
                name="exchange"
                value={newInvestment.exchange}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shares/Units</label>
              <input
                type="number"
                name="shares"
                value={newInvestment.shares || ""}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                name="purchasePrice"
                value={newInvestment.purchasePrice || ""}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Price (₹)</label>
              <input
                type="number"
                name="currentPrice"
                value={newInvestment.currentPrice || ""}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={newInvestment.purchaseDate}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                {editingId ? "Update" : "Add"} Investment
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Portfolio Value</p>
          <p className="text-2xl font-bold">₹{totalInvestmentValue.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Gain/Loss</p>
          <p className={`text-2xl font-bold flex items-center ${getGainLossColor(totalGainLoss)}`}>
            {getGainLossIcon(totalGainLoss)}
            ₹{Math.abs(totalGainLoss).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Return</p>
          <p className={`text-2xl font-bold flex items-center ${getGainLossColor(totalGainLossPercent)}`}>
            {getGainLossIcon(totalGainLossPercent)}
            {Math.abs(totalGainLossPercent).toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium mb-3 flex items-center">
            <BarChart size={18} className="mr-2 text-gray-600" />
            Category Allocation
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(categoryAllocation).map(([category, value]) => {
              const percentage = (value / totalInvestmentValue) * 100;
              return (
                <div key={category} className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">{category}</p>
                  <p className="text-sm font-medium">{percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">₹{value.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3 flex items-center">
            <Coins size={18} className="mr-2 text-gray-600" />
            Exchange Allocation
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(exchangeAllocation).map(([exchange, value]) => {
              const percentage = (value / totalInvestmentValue) * 100;
              return (
                <div key={exchange} className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-gray-600">{exchange}</p>
                  <p className="text-sm font-medium">{percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">₹{value.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investments.map(inv => {
              const currentValue = inv.shares * inv.currentPrice;
              const costBasis = inv.shares * inv.purchasePrice;
              const gainLoss = currentValue - costBasis;
              const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
              
              return (
                <tr key={inv.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{inv.name}</div>
                      <div className="text-xs text-gray-500">{inv.ticker}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{inv.category}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{inv.exchange}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{inv.shares}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">₹{inv.purchasePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={inv.currentPrice}
                        onChange={(e) => handleUpdatePrice(inv.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                    ₹{currentValue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={getGainLossColor(gainLoss)}>
                      <div className="flex items-center text-sm">
                        {getGainLossIcon(gainLoss)}
                        ₹{Math.abs(gainLoss).toFixed(2)}
                      </div>
                      <div className="text-xs">
                        {gainLossPercent > 0 ? "+" : ""}{gainLossPercent.toFixed(2)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(inv)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {investments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  No investments added yet. Add your first investment using the form above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Note: This tracker uses manual price updates. Update the "Current" price field to reflect latest market values.</p>
      </div>
    </div>
  );
};