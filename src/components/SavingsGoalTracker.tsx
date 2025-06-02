import React, { useState, useEffect } from "react";
import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { Target, Info, Pencil, Trash2Icon, Trash, DollarSign } from "lucide-react";
import type { Transaction } from "../types";


type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
};

export const SavingsGoalTracker = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem("savingsGoals");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "Emergency Fund",
            targetAmount: 10000,
            currentAmount: 3500,
            deadline: "2025-12-31",
            category: "Savings",
          },
          {
            id: "2",
            name: "Vacation",
            targetAmount: 3000,
            currentAmount: 1200,
            deadline: "2025-08-15",
            category: "Travel",
          },
        ];
  });

  const [contributions, setContributions] = useState<Record<string, number>>(
    {}
  );

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    category: "",
  });

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    category: "",
  });

  useEffect(() => {
    localStorage.setItem("savingsGoals", JSON.stringify(goals));
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const goalToAdd = {
      ...newGoal,
      id: crypto.randomUUID(),
    };
    setGoals([...goals, goalToAdd]);
    setNewGoal({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: "",
      category: "",
    });
  };

  const handleUpdateGoal = (id: string, amount: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id
          ? { ...goal, currentAmount: goal.currentAmount + amount }
          : goal
      )
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setEditGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      category: goal.category,
    });
  };

  const handleSaveEditGoal = (id: string) => {
    setGoals(
      goals.map((goal) => (goal.id === id ? { ...goal, ...editGoal } : goal))
    );
    setEditingGoalId(null);
  };

  const handleCancelEditGoal = () => {
    setEditingGoalId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Savings Goal Tracker</h3>
        <Target className="text-blue-500" size={24} />
      </div>

      <div className="grid gap-6">
        {goals.map((goal) => {
          const progress = Math.min(
            (goal.currentAmount / goal.targetAmount) * 100,
            100
          );
          const daysLeft = Math.ceil(
            (new Date(goal.deadline).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const isEditing = editingGoalId === goal.id;

          return (
            <div key={goal.id} className="border rounded-lg p-4 shadow-sm bg-gray-50">
              <div className="flex justify-between mb-2 items-center">
                {isEditing ? (
                  <input
                    type="text"
                    className="font-medium text-gray-700 border px-2 py-1 rounded w-1/2"
                    value={editGoal.name}
                    onChange={(e) => setEditGoal({ ...editGoal, name: e.target.value })}
                  />
                ) : (
                  <h4 className="font-medium text-gray-700">{goal.name}</h4>
                )}
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {isEditing ? (
                    <input
                      type="text"
                      className="text-xs border px-1 py-0.5 rounded"
                      value={editGoal.category}
                      onChange={(e) => setEditGoal({ ...editGoal, category: e.target.value })}
                    />
                  ) : (
                    goal.category
                  )}
                </span>
              </div>

              <Progress.Root
                className="relative overflow-hidden bg-gray-200 rounded-full w-full h-3"
                value={progress}
              >
                <Progress.Indicator
                  className={cn(
                    "bg-blue-600 h-full transition-all duration-500 ease-in-out"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </Progress.Root>

              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        className="border px-1 py-0.5 rounded w-20 mr-1"
                        value={editGoal.currentAmount}
                        onChange={(e) =>
                          setEditGoal({ ...editGoal, currentAmount: parseFloat(e.target.value) || 0 })
                        }
                      />
                      of
                      <input
                        type="number"
                        className="border px-1 py-0.5 rounded w-20 ml-1"
                        value={editGoal.targetAmount}
                        onChange={(e) =>
                          setEditGoal({ ...editGoal, targetAmount: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </>
                  ) : (
                    <>
                      ₹{goal.currentAmount.toFixed(2)} of ₹{goal.targetAmount.toFixed(2)}
                    </>
                  )}
                </span>
                <span>
                  {isEditing ? (
                    <input
                      type="date"
                      className="border px-1 py-0.5 rounded"
                      value={editGoal.deadline}
                      onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
                    />
                  ) : (
                    `${daysLeft} days left`
                  )}
                </span>
              </div>

              <div className="flex gap-2 mt-4 items-end">
                {isEditing ? (
                  <>
                    <button
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      onClick={() => handleSaveEditGoal(goal.id)}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-2 bg-gray-400 text-white text-sm rounded-md hover:bg-gray-500"
                      onClick={handleCancelEditGoal}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        Contribution Amount
                        <div className="group relative inline-block">
                          <Info size={14} className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            Add savings towards this goal
                          </div>
                        </div>
                      </label>
                      <input
                        type="number"
                        className="px-3 py-2 border rounded-md text-sm"
                        placeholder="₹0"
                        value={contributions[goal.id] || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setContributions((prev) => ({
                            ...prev,
                            [goal.id]: isNaN(value) ? 0 : value,
                          }));
                        }}
                      />
                    </div>

                    <button
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      onClick={() => {
                        const amount = contributions[goal.id] || 0;
                        if (amount > 0) {
                          handleUpdateGoal(goal.id, amount);
                          setContributions((prev) => ({ ...prev, [goal.id]: 0 }));
                        }
                      }}
                    >
                      {/* <DollarSign size={16}/> */}
                      ₹ Contribute
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <Pencil size={16}/>
                      Edit
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash size={16}/>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddGoal} className="mt-8 border-t pt-6">
        <h4 className="font-medium mb-4 text-gray-700">Add New Goal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Goal Name</label>
            <input
              type="text"
              placeholder="Emergency Fund"
              className="px-3 py-2 border rounded-md text-sm"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Target Amount</label>
            <input
              type="number"
              placeholder="10000"
              className="px-3 py-2 border rounded-md text-sm"
              value={newGoal.targetAmount || ""}
              onChange={(e) =>
                setNewGoal({
                  ...newGoal,
                  targetAmount: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Current Amount</label>
            <input
              type="number"
              placeholder="0"
              className="px-3 py-2 border rounded-md text-sm"
              value={newGoal.currentAmount || ""}
              onChange={(e) =>
                setNewGoal({
                  ...newGoal,
                  currentAmount: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Deadline</label>
            <input
              type="date"
              className="px-3 py-2 border rounded-md text-sm"
              value={newGoal.deadline}
              onChange={(e) =>
                setNewGoal({ ...newGoal, deadline: e.target.value })
              }
              required
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-xs text-gray-500 mb-1">Category</label>
            <input
              type="text"
              placeholder="e.g., Travel, Emergency, Education"
              className="px-3 py-2 border rounded-md text-sm"
              value={newGoal.category}
              onChange={(e) =>
                setNewGoal({ ...newGoal, category: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add Goal
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
