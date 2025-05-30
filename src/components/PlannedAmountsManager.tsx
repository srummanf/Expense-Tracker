import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Save,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Target,
  DollarSign,
  Edit3,
  Settings,
  RefreshCw,
} from "lucide-react";

interface PlannedAmountsManagerProps {
  categories: string[];
  initialPlannedAmounts: Record<string, number>;
  onPlannedAmountsChange: (amounts: Record<string, number>) => void;
}

const PlannedAmountsManager: React.FC<PlannedAmountsManagerProps> = ({
  categories,
  initialPlannedAmounts,
  onPlannedAmountsChange,
}) => {
  const [plannedAmounts, setPlannedAmounts] = useState<Record<string, number>>(
    initialPlannedAmounts
  );
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Save to localStorage whenever plannedAmounts changes
  useEffect(() => {
    localStorage.setItem("plannedAmounts", JSON.stringify(plannedAmounts));
    onPlannedAmountsChange(plannedAmounts);
  }, [plannedAmounts, onPlannedAmountsChange]);

  const handleEditStart = (category: string) => {
    setEditingCategory(category);
    setTempValue(plannedAmounts[category]?.toString() || "0");
  };

  const handleEditSave = () => {
    if (editingCategory) {
      const amount = parseFloat(tempValue) || 0;
      setPlannedAmounts((prev) => ({
        ...prev,
        [editingCategory]: amount,
      }));
    }
    setEditingCategory(null);
    setTempValue("");
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setTempValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleAddExistingCategory = (category: string) => {
    if (!plannedAmounts.hasOwnProperty(category)) {
      setPlannedAmounts((prev) => ({
        ...prev,
        [category]: 0,
      }));
    }
  };

  const handleAddNewCategory = () => {
    if (
      newCategoryName.trim() &&
      !categories.includes(newCategoryName.trim())
    ) {
      const categoryName = newCategoryName.trim();
      setPlannedAmounts((prev) => ({
        ...prev,
        [categoryName]: 0,
      }));
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setPlannedAmounts((prev) => {
      const newAmounts = { ...prev };
      delete newAmounts[category];
      return newAmounts;
    });
  };

  const totalPlannedAmount = Object.values(plannedAmounts).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const activeCategoriesCount = Object.keys(plannedAmounts).length;
  const unusedCategories = categories.filter(
    (category) => !plannedAmounts.hasOwnProperty(category)
  );

  const resetAllAmounts = () => {
    if (
      window.confirm("Are you sure you want to reset all planned amounts to 0?")
    ) {
      const resetAmounts: Record<string, number> = {};
      Object.keys(plannedAmounts).forEach((category) => {
        resetAmounts[category] = 0;
      });
      setPlannedAmounts(resetAmounts);
    }
  };

  const loadDefaultAmounts = () => {
    const defaultAmounts = {
      "Food & Dining": 8000,
      Transportation: 3000,
      // Entertainment: 4000,
      // Shopping: 6000,
      // Utilities: 2500,
      // Healthcare: 2000,
      // Travel: 5000,
    };
    setPlannedAmounts((prev) => ({
      ...prev,
      ...defaultAmounts,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8" />
              Budget Planning Manager
            </h1>
            <p className="text-blue-100 mt-2">
              Set and manage your spending targets for each category
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isEditing
                ? "bg-green-500 hover:bg-green-600 shadow-lg"
                : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            }`}
          >
            {isEditing ? <Check size={20} /> : <Edit3 size={20} />}
            <span>{isEditing ? "Save Changes" : "Edit Budgets"}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Total Planned Budget
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{totalPlannedAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Active Categories
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {activeCategoriesCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Average per Category
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ₹
                {activeCategoriesCount > 0
                  ? Math.round(
                      totalPlannedAmount / activeCategoriesCount
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Categories Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Category Budgets</h2>
          <p className="text-gray-600 mt-1">
            Manage your spending limits for each category
          </p>
        </div>

        <div className="p-6">
          {/* Active Categories */}
          <div className="space-y-3">
            <AnimatePresence>
              {Object.entries(plannedAmounts)
                .sort(([, a], [, b]) => b - a) // Sort by amount descending
                .map(([category, amount]) => (
                  <motion.div
                    key={category}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {category}
                      </h3>
                      <div className="flex items-center mt-1">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            amount > 5000
                              ? "bg-green-500"
                              : amount > 2000
                              ? "bg-yellow-500"
                              : amount > 0
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm text-gray-600">
                          {amount > 5000
                            ? "High Budget"
                            : amount > 2000
                            ? "Medium Budget"
                            : amount > 0
                            ? "Low Budget"
                            : "No Budget Set"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {editingCategory === category ? (
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="w-32 pl-8 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                              placeholder="0"
                              min="0"
                              step="100"
                              autoFocus
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleEditSave}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleEditCancel}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </motion.button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{amount.toLocaleString()}
                            </span>
                          </div>
                          {isEditing && (
                            <div className="flex space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditStart(category)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit3 size={18} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveCategory(category)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </motion.button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>

            {Object.keys(plannedAmounts).length === 0 && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No budget categories set up yet
                </p>
                <p className="text-gray-400">
                  Add categories below to start planning your budget
                </p>
              </div>
            )}
          </div>

          {/* Add Categories Section */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              {/* Add Existing Categories */}
              {unusedCategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Add Existing Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {unusedCategories.map((category) => (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddExistingCategory(category)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                      >
                        <Plus size={16} />
                        <span>{category}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Category */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Add Custom Category
                </h4>
                {isAddingCategory ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddNewCategory();
                        if (e.key === "Escape") setIsAddingCategory(false);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Enter category name..."
                      autoFocus
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddNewCategory}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Add
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAddingCategory(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    <span>Add Custom Category</span>
                  </motion.button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetAllAmounts}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors border border-red-200"
                >
                  <RefreshCw size={16} />
                  <span>Reset All</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadDefaultAmounts}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                >
                  <Save size={16} />
                  <span>Load Defaults</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PlannedAmountsManager;
