import React, { useState, useEffect } from "react";
import { CalendarClock, Bell, X } from "lucide-react";
import type { Transaction } from "../types";

type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isRecurring: boolean;
  frequency?: "weekly" | "monthly" | "quarterly" | "annually";
  isPaid: boolean;
  notes?: string;
};

export const BillReminders = ({ transactions }: { transactions: Transaction[] }) => {
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem("bills");
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        name: "Rent",
        amount: 1200,
        dueDate: "2025-05-01",
        category: "Housing",
        isRecurring: true,
        frequency: "monthly",
        isPaid: false
      },
      {
        id: "2",
        name: "Internet",
        amount: 75,
        dueDate: "2025-04-25",
        category: "Utilities",
        isRecurring: true,
        frequency: "monthly",
        isPaid: false
      }
    ];
  });

  const [newBill, setNewBill] = useState<Omit<Bill, "id" | "isPaid">>({
    name: "",
    amount: 0,
    dueDate: "",
    category: "",
    isRecurring: false,
    frequency: "monthly"
  });

  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const billToAdd = {
      ...newBill,
      id: crypto.randomUUID(),
      isPaid: false
    };
    setBills([...bills, billToAdd]);
    setNewBill({
      name: "",
      amount: 0,
      dueDate: "",
      category: "",
      isRecurring: false,
      frequency: "monthly"
    });
  };

  const handleTogglePaid = (id: string) => {
    setBills(bills.map(bill =>
      bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
    ));
  };

  const handleDeleteBill = (id: string) => {
    setBills(bills.filter(bill => bill.id !== id));
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyClass = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "text-red-600";
    if (daysUntilDue <= 3) return "text-orange-500";
    if (daysUntilDue <= 7) return "text-yellow-500";
    return "text-green-500";
  };

  const unpaidBills = bills
    .filter(bill => !bill.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const paidBills = bills.filter(bill => bill.isPaid);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Bill Reminders</h3>
        <Bell className="text-blue-500" size={24} />
      </div>

      <div className="space-y-4">
        {[...unpaidBills, ...paidBills].length === 0 ? (
          <p className="text-center text-gray-500 py-8">No bills to show</p>
        ) : (
          [...unpaidBills, ...paidBills].map(bill => {
            const daysUntilDue = getDaysUntilDue(bill.dueDate);
            const urgencyClass = getUrgencyClass(daysUntilDue);
            const isPaidClass = bill.isPaid ? "line-through text-gray-400" : "";

            return (
              <div
                key={bill.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${bill.isPaid ? "bg-gray-50" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={bill.isPaid}
                    onChange={() => handleTogglePaid(bill.id)}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <div>
                    <h4 className={`font-medium ${isPaidClass}`}>{bill.name}</h4>
                    <div className={`flex items-center text-sm ${isPaidClass}`}>
                      <span className="mr-2">${bill.amount.toFixed(2)}</span>
                      {!bill.isPaid && (
                        <span className={`flex items-center ${urgencyClass}`}>
                          <CalendarClock size={14} className="mr-1" />
                          {daysUntilDue < 0
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0
                              ? "Due today"
                              : `Due in ${daysUntilDue} days`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {bill.category}
                  </span>
                  {bill.isRecurring && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {bill.frequency}
                    </span>
                  )}
                  {bill.isPaid && (
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete paid bill"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleAddBill} className="mt-6 border-t pt-6">
        <h4 className="font-medium mb-4">Add New Bill</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Bill Name"
            className="px-3 py-2 border rounded-md"
            value={newBill.name}
            onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Amount"
            className="px-3 py-2 border rounded-md"
            value={newBill.amount || ""}
            onChange={(e) => setNewBill({ ...newBill, amount: parseFloat(e.target.value) || 0 })}
            required
          />
          <input
            type="date"
            className="px-3 py-2 border rounded-md"
            value={newBill.dueDate}
            onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Category"
            className="px-3 py-2 border rounded-md"
            value={newBill.category}
            onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
            required
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={newBill.isRecurring}
              onChange={(e) => setNewBill({ ...newBill, isRecurring: e.target.checked })}
            />
            <label htmlFor="isRecurring">Recurring Bill</label>
          </div>
          {newBill.isRecurring && (
            <select
              className="px-3 py-2 border rounded-md"
              value={newBill.frequency}
              onChange={(e) => setNewBill({ ...newBill, frequency: e.target.value as any })}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          )}
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 md:col-span-2"
          >
            Add Bill
          </button>
        </div>
      </form>
    </div>
  );
};
