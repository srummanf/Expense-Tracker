import React, { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Plus, Trash2, Calculator, PieChart, Pencil } from "lucide-react";

type EMI = {
  id: string;
  name: string;
  monthlyAmount: number;
  totalDuration: number; // in months
  startDate: string;
};

type SIP = {
  id: string;
  name: string;
  sipAmount: number;
  duration: number; // in years
  expectedReturn: number; // percentage
  startDate: string;
};

export const EMISIPTracker = () => {
  const [activeTab, setActiveTab] = useState<'emi' | 'sip'>('emi');
  
  // EMI State
  const [emis, setEmis] = useState<EMI[]>(() => {
    const saved = localStorage.getItem("emiData");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newEmi, setNewEmi] = useState({
    name: "",
    monthlyAmount: 0,
    totalDuration: 0,
    startDate: "",
  });

  // SIP State
  const [sips, setSips] = useState<SIP[]>(() => {
    const saved = localStorage.getItem("sipData");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newSip, setNewSip] = useState({
    name: "",
    sipAmount: 0,
    duration: 0,
    expectedReturn: 0,
    startDate: "",
  });

  // Edit state for EMI
  const [editingEmiId, setEditingEmiId] = useState<string | null>(null);
  const [editEmi, setEditEmi] = useState({
    name: "",
    monthlyAmount: 0,
    totalDuration: 0,
    startDate: "",
  });

  // Edit state for SIP
  const [editingSipId, setEditingSipId] = useState<string | null>(null);
  const [editSip, setEditSip] = useState({
    name: "",
    sipAmount: 0,
    duration: 0,
    expectedReturn: 0,
    startDate: "",
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("emiData", JSON.stringify(emis));
  }, [emis]);

  useEffect(() => {
    localStorage.setItem("sipData", JSON.stringify(sips));
  }, [sips]);

  // EMI Functions
  const handleAddEmi = () => {
    if (newEmi.name && newEmi.monthlyAmount && newEmi.totalDuration && newEmi.startDate) {
      const emiToAdd = {
        ...newEmi,
        id: crypto.randomUUID(),
      };
      setEmis([...emis, emiToAdd]);
      setNewEmi({
        name: "",
        monthlyAmount: 0,
        totalDuration: 0,
        startDate: "",
      });
    }
  };

  const handleDeleteEmi = (id: string) => {
    setEmis(emis.filter((emi) => emi.id !== id));
  };

  const handleEditEmi = (emi: EMI) => {
    setEditingEmiId(emi.id);
    setEditEmi({
      name: emi.name,
      monthlyAmount: emi.monthlyAmount,
      totalDuration: emi.totalDuration,
      startDate: emi.startDate,
    });
  };
  const handleSaveEditEmi = (id: string) => {
    setEmis(emis.map(emi => emi.id === id ? { ...emi, ...editEmi } : emi));
    setEditingEmiId(null);
  };
  const handleCancelEditEmi = () => {
    setEditingEmiId(null);
  };

  // SIP Functions
  const handleAddSip = () => {
    if (newSip.name && newSip.sipAmount && newSip.duration && newSip.expectedReturn && newSip.startDate) {
      const sipToAdd = {
        ...newSip,
        id: crypto.randomUUID(),
      };
      setSips([...sips, sipToAdd]);
      setNewSip({
        name: "",
        sipAmount: 0,
        duration: 0,
        expectedReturn: 0,
        startDate: "",
      });
    }
  };

  const handleDeleteSip = (id: string) => {
    setSips(sips.filter((sip) => sip.id !== id));
  };

  const handleEditSip = (sip: SIP) => {
    setEditingSipId(sip.id);
    setEditSip({
      name: sip.name,
      sipAmount: sip.sipAmount,
      duration: sip.duration,
      expectedReturn: sip.expectedReturn,
      startDate: sip.startDate,
    });
  };
  const handleSaveEditSip = (id: string) => {
    setSips(sips.map(sip => sip.id === id ? { ...sip, ...editSip } : sip));
    setEditingSipId(null);
  };
  const handleCancelEditSip = () => {
    setEditingSipId(null);
  };

  // Calculate EMI progress
  const calculateEmiProgress = (emi: EMI) => {
    const startDate = new Date(emi.startDate);
    const currentDate = new Date();
    const monthsPassed = Math.max(0, 
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (currentDate.getMonth() - startDate.getMonth())
    );
    const progress = Math.min((monthsPassed / emi.totalDuration) * 100, 100);
    const remainingMonths = Math.max(0, emi.totalDuration - monthsPassed);
    const totalAmount = emi.monthlyAmount * emi.totalDuration;
    const paidAmount = emi.monthlyAmount * Math.min(monthsPassed, emi.totalDuration);
    
    return { progress, remainingMonths, totalAmount, paidAmount };
  };

  // Calculate SIP projections
  const calculateSipProjection = (sip: SIP) => {
    const monthlyRate = sip.expectedReturn / 100 / 12;
    const months = sip.duration * 12;
    const totalInvestment = sip.sipAmount * months;
    
    // Future Value of SIP calculation
    const futureValue = sip.sipAmount * 
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    const gains = futureValue - totalInvestment;
    const gainsPercentage = (gains / totalInvestment) * 100;
    
    return { totalInvestment, futureValue, gains, gainsPercentage };
  };

  // Calculate total monthly outflow for EMIs
  const totalEmiOutflow = emis.reduce((sum, emi) => {
    const { remainingMonths } = calculateEmiProgress(emi);
    return sum + (remainingMonths > 0 ? emi.monthlyAmount : 0);
  }, 0);

  // Calculate total monthly SIP investment
  const totalSipInvestment = sips.reduce((sum, sip) => sum + sip.sipAmount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">EMI & SIP Tracker</h3>
        <div className="flex gap-2">
          <CreditCard className="text-red-500" size={24} />
          <TrendingUp className="text-green-500" size={24} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-red-500" size={20} />
            <h4 className="font-medium text-red-700">Monthly EMI Outflow</h4>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{totalEmiOutflow.toLocaleString()}</p>
          <p className="text-sm text-red-600">{emis.length} active EMIs</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-500" size={20} />
            <h4 className="font-medium text-green-700">Monthly SIP Investment</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{totalSipInvestment.toLocaleString()}</p>
          <p className="text-sm text-green-600">{sips.length} active SIPs</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'emi'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('emi')}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={16} />
            EMI Tracker
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sip'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sip')}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            SIP Tracker
          </div>
        </button>
      </div>

      {/* EMI Tab Content */}
      {activeTab === 'emi' && (
        <div>
          {/* EMI List */}
          <div className="space-y-4 mb-8">
            {emis.map((emi) => {
              const { progress, remainingMonths, totalAmount, paidAmount } = calculateEmiProgress(emi);
              const isEditing = editingEmiId === emi.id;
              
              return (
                <div key={emi.id} className="border rounded-lg p-4 shadow-sm bg-red-50">
                  <div className="flex justify-between items-start mb-3">
                    {isEditing ? (
                      <input
                        type="text"
                        className="font-medium text-gray-700 border px-2 py-1 rounded"
                        value={editEmi.name}
                        onChange={e => setEditEmi({ ...editEmi, name: e.target.value })}
                      />
                    ) : (
                      <h4 className="font-medium text-gray-700">{emi.name}</h4>
                    )}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEditEmi(emi.id)} className="text-green-600 hover:text-green-800 text-xs font-semibold">Save</button>
                          <button onClick={handleCancelEditEmi} className="text-gray-500 hover:text-gray-700 text-xs font-semibold">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditEmi(emi)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteEmi(emi.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Monthly EMI</p>
                      {isEditing ? (
                        <input
                          type="number"
                          className="font-semibold border px-2 py-1 rounded w-full"
                          value={editEmi.monthlyAmount}
                          onChange={e => setEditEmi({ ...editEmi, monthlyAmount: parseFloat(e.target.value) || 0 })}
                        />
                      ) : (
                        <p className="font-semibold">₹{emi.monthlyAmount.toLocaleString()}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Remaining</p>
                      {isEditing ? (
                        <input
                          type="number"
                          className="font-semibold border px-2 py-1 rounded w-full"
                          value={editEmi.totalDuration}
                          onChange={e => setEditEmi({ ...editEmi, totalDuration: parseInt(e.target.value) || 0 })}
                        />
                      ) : (
                        <p className="font-semibold">{remainingMonths} months</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      {isEditing ? (
                        <input
                          type="date"
                          className="font-semibold border px-2 py-1 rounded w-full"
                          value={editEmi.startDate}
                          onChange={e => setEditEmi({ ...editEmi, startDate: e.target.value })}
                        />
                      ) : (
                        <p className="font-semibold">{emi.startDate}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Total Amount</p>
                      <p className="font-semibold">₹{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add EMI Form */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 text-gray-700 flex items-center gap-2">
              <Plus size={16} />
              Add New EMI
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">EMI Name</label>
                <input
                  type="text"
                  placeholder="Home Loan"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newEmi.name}
                  onChange={(e) => setNewEmi({ ...newEmi, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monthly Amount</label>
                <input
                  type="number"
                  placeholder="25000"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newEmi.monthlyAmount || ""}
                  onChange={(e) => setNewEmi({ ...newEmi, monthlyAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total Duration (Months)</label>
                <input
                  type="number"
                  placeholder="240"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newEmi.totalDuration || ""}
                  onChange={(e) => setNewEmi({ ...newEmi, totalDuration: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newEmi.startDate}
                  onChange={(e) => setNewEmi({ ...newEmi, startDate: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  onClick={handleAddEmi}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add EMI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIP Tab Content */}
      {activeTab === 'sip' && (
        <div>
          {/* SIP List */}
          <div className="space-y-4 mb-8">
            {sips.map((sip) => {
              const { totalInvestment, futureValue, gains, gainsPercentage } = calculateSipProjection(sip);
              const isEditing = editingSipId === sip.id;
              
              return (
                <div key={sip.id} className="border rounded-lg p-4 shadow-sm bg-green-50">
                  <div className="flex justify-between items-start mb-3">
                    {isEditing ? (
                      <input
                        type="text"
                        className="font-medium text-gray-700 border px-2 py-1 rounded"
                        value={editSip.name}
                        onChange={e => setEditSip({ ...editSip, name: e.target.value })}
                      />
                    ) : (
                      <h4 className="font-medium text-gray-700">{sip.name}</h4>
                    )}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEditSip(sip.id)} className="text-green-600 hover:text-green-800 text-xs font-semibold">Save</button>
                          <button onClick={handleCancelEditSip} className="text-gray-500 hover:text-gray-700 text-xs font-semibold">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditSip(sip)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteSip(sip.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Monthly SIP</p>
                        {isEditing ? (
                          <input
                            type="number"
                            className="text-lg font-semibold text-green-600 border px-2 py-1 rounded w-full"
                            value={editSip.sipAmount}
                            onChange={e => setEditSip({ ...editSip, sipAmount: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <p className="text-lg font-semibold text-green-600">₹{sip.sipAmount.toLocaleString()}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        {isEditing ? (
                          <input
                            type="number"
                            className="font-semibold border px-2 py-1 rounded w-full"
                            value={editSip.duration}
                            onChange={e => setEditSip({ ...editSip, duration: parseInt(e.target.value) || 0 })}
                          />
                        ) : (
                          <p className="font-semibold">{sip.duration} years</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expected Return</p>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            className="font-semibold border px-2 py-1 rounded w-full"
                            value={editSip.expectedReturn}
                            onChange={e => setEditSip({ ...editSip, expectedReturn: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <p className="font-semibold">{sip.expectedReturn}% p.a.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Total Investment</p>
                        <p className="text-lg font-semibold">₹{totalInvestment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Projected Value</p>
                        <p className="text-lg font-semibold text-green-600">₹{futureValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expected Gains</p>
                        <p className="font-semibold text-green-600">
                          +₹{gains.toLocaleString()} ({gainsPercentage.toFixed(2)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        {isEditing ? (
                          <input
                            type="date"
                            className="font-semibold border px-2 py-1 rounded w-full"
                            value={editSip.startDate}
                            onChange={e => setEditSip({ ...editSip, startDate: e.target.value })}
                          />
                        ) : (
                          <p className="font-semibold">{sip.startDate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add SIP Form */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4 text-gray-700 flex items-center gap-2">
              <Plus size={16} />
              Add New SIP
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">SIP Name</label>
                <input
                  type="text"
                  placeholder="Large Cap Fund"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newSip.name}
                  onChange={(e) => setNewSip({ ...newSip, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Monthly SIP Amount</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newSip.sipAmount || ""}
                  onChange={(e) => setNewSip({ ...newSip, sipAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Duration (Years)</label>
                <input
                  type="number"
                  placeholder="5"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newSip.duration || ""}
                  onChange={(e) => setNewSip({ ...newSip, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expected Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newSip.expectedReturn || ""}
                  onChange={(e) => setNewSip({ ...newSip, expectedReturn: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newSip.startDate}
                  onChange={(e) => setNewSip({ ...newSip, startDate: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  onClick={handleAddSip}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add SIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};