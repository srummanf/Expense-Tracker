import React, { useState, useEffect } from "react";
import { CalendarClock, Bell, X, Calendar, DollarSign, Tag } from "lucide-react";

type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  frequency?: "weekly" | "monthly" | "quarterly" | "annually";
  isPaid: boolean;
  notes?: string;
  description?: string;
  originalDueDate?: string; // Track original due date for recurring bills
};

type Transaction = {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: "income" | "expense";
};

export default function BillReminders({
  transactions = [],
}: {
  transactions?: Transaction[];
}) {
  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem("bills");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "1",
            name: "Rent",
            amount: 1200,
            dueDate: "2025-06-01",
            originalDueDate: "2025-06-01",
            category: "Housing",
            isRecurring: true,
            frequency: "monthly",
            isPaid: false,
          },
          {
            id: "2",
            name: "Internet",
            amount: 75,
            dueDate: "2025-06-15",
            originalDueDate: "2025-06-15",
            category: "Utilities",
            isRecurring: true,
            frequency: "monthly",
            isPaid: false,
          },
          {
            id: "3",
            name: "Car Insurance",
            amount: 150,
            dueDate: "2025-06-10",
            originalDueDate: "2025-06-10",
            category: "Insurance",
            isRecurring: true,
            frequency: "monthly",
            isPaid: false,
          },
        ];
  });

  const [newBill, setNewBill] = useState<Omit<Bill, "id" | "isPaid" | "originalDueDate">>({
    name: "",
    amount: 0,
    dueDate: "",
   
    isRecurring: false,
    frequency: "monthly",
  });

  // Function to calculate next due date based on frequency
  const getNextDueDate = (currentDueDate: string, frequency: string): string => {
    const date = new Date(currentDueDate);
    
    switch (frequency) {
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "annually":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Function to regenerate recurring bills
  const regenerateRecurringBills = () => {
    setBills(prevBills => {
      const updatedBills = [...prevBills];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prevBills.forEach((bill, index) => {
        if (bill.isRecurring && bill.isPaid) {
          const dueDate = new Date(bill.dueDate);
          const daysSinceDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Regenerate the bill if it's been paid and some time has passed
          let shouldRegenerate = false;
          
          switch (bill.frequency) {
            case "weekly":
              shouldRegenerate = daysSinceDue >= 0; // Regenerate immediately after due date
              break;
            case "monthly":
              shouldRegenerate = daysSinceDue >= 7; // Regenerate 1 week after due date
              break;
            case "quarterly":
              shouldRegenerate = daysSinceDue >= 14; // Regenerate 2 weeks after due date
              break;
            case "annually":
              shouldRegenerate = daysSinceDue >= 30; // Regenerate 1 month after due date
              break;
            default:
              shouldRegenerate = daysSinceDue >= 7;
          }

          if (shouldRegenerate) {
            const nextDueDate = getNextDueDate(bill.dueDate, bill.frequency || "monthly");
            updatedBills[index] = {
              ...bill,
              id: crypto.randomUUID(),
              dueDate: nextDueDate,
              isPaid: false,
            };
          }
        }
      });

      return updatedBills;
    });
  };

  // Check for recurring bills regeneration on component mount and when bills change
  useEffect(() => {
    regenerateRecurringBills();
  }, []);

  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  const handleAddBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    const billToAdd = {
      ...newBill,
      id: crypto.randomUUID(),
      isPaid: false,
      originalDueDate: newBill.dueDate,
    };
    setBills([...bills, billToAdd]);
    setNewBill({
      name: "",
      amount: 0,
      dueDate: "",
      isRecurring: false,
      frequency: "monthly",
    });
  };

  const handleTogglePaid = (id: string) => {
    setBills(prevBills =>
      prevBills.map((bill) => {
        if (bill.id === id) {
          const updatedBill = { ...bill, isPaid: !bill.isPaid };
          
          // If marking as paid and it's recurring, set up for regeneration
          if (!bill.isPaid && bill.isRecurring) {
            // The regeneration will happen in the useEffect
            setTimeout(() => regenerateRecurringBills(), 100);
          }
          
          return updatedBill;
        }
        return bill;
      })
    );
  };

  const handleDeleteBill = (id: string) => {
    setBills(bills.filter((bill) => bill.id !== id));
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUrgencyClass = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "text-red-600 bg-red-50";
    if (daysUntilDue <= 3) return "text-orange-600 bg-orange-50";
    if (daysUntilDue <= 7) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const unpaidBills = bills
    .filter((bill) => !bill.isPaid)
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  const paidBills = bills.filter((bill) => bill.isPaid);

  // const renderBillCard = (bill: Bill) => {
  //   const daysUntilDue = getDaysUntilDue(bill.dueDate);
  //   const urgencyClass = getUrgencyClass(daysUntilDue);
  //   const isPaidClass = bill.isPaid ? "line-through text-gray-400" : "";

  //   return (
  //     <div
  //       key={bill.id}
  //       className={`p-4 border rounded-lg shadow-sm transition-all hover:shadow-md ${
  //         bill.isPaid ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
  //       }`}
  //     >
  //       <div className="flex items-start justify-between">
  //         <div className="flex items-start space-x-3 flex-1">
  //           <input
  //             type="checkbox"
  //             checked={bill.isPaid}
  //             onChange={() => handleTogglePaid(bill.id)}
  //             className="h-5 w-5 rounded border-gray-300 mt-1"
  //           />
  //           <div className="flex-1">
  //             <div className="flex items-center space-x-2 mb-2">
  //               <h4 className={`font-semibold text-lg ${isPaidClass}`}>{bill.name}</h4>
  //               {bill.isRecurring && (
  //                 <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
  //                    {bill.frequency}
  //                 </span>
  //               )}
  //             </div>
              
  //             <div className="space-y-2">
  //               {/* Amount */}
  //               <div className={`flex items-center text-sm ${isPaidClass}`}>
                  
  //                 <span className="font-medium text-lg">₹{bill.amount.toFixed(2)}</span>
  //               </div>

  //               {/* Due Date and Status */}
  //               <div className={`flex items-center text-sm ${isPaidClass}`}>
  //                 <Calendar size={14} className="mr-1 text-blue-600" />
  //                 <span className="font-medium">{formatDate(bill.dueDate)}</span>
  //                 {!bill.isPaid && (
  //                   <span className={`ml-3 flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgencyClass}`}>
  //                     <CalendarClock size={12} className="mr-1" />
  //                     {daysUntilDue < 0
  //                       ? `${Math.abs(daysUntilDue)} days overdue`
  //                       : daysUntilDue === 0
  //                       ? "Due today"
  //                       : `Due in ${daysUntilDue} days`}
  //                   </span>
  //                 )}
  //               </div>

                
  //             </div>
  //           </div>
  //         </div>

  //         {/* Actions */}
  //         <div className="flex items-center space-x-2 ml-4">
  //           {bill.isPaid && (
  //             <button
  //               onClick={() => handleDeleteBill(bill.id)}
  //               className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
  //               title="Delete paid bill"
  //             >
  //               <X size={18} />
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  const renderBillCard = (bill: Bill) => {
  const daysUntilDue = getDaysUntilDue(bill.dueDate);
  const urgencyClass = getUrgencyClass(daysUntilDue);
  const isPaidClass = bill.isPaid ? "line-through text-gray-400" : "";

  return (
    <div
      key={bill.id}
      className={`h-full bg-white border rounded-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-4 ${
        bill.isPaid ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={bill.isPaid}
          onChange={() => handleTogglePaid(bill.id)}
          className="h-5 w-5 mt-1 border-gray-300 rounded"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-lg ${isPaidClass}`}>{bill.name}</h4>
            {bill.isRecurring && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                {bill.frequency}
              </span>
            )}
          </div>

          <div className="text-sm mb-1 font-medium text-gray-700">
            ₹{bill.amount.toFixed(2)}
          </div>

          <div className={`text-sm flex items-center gap-1 ${isPaidClass}`}>
            <Calendar size={14} className="text-blue-600" />
            <span>{formatDate(bill.dueDate)}</span>
          </div>

          {!bill.isPaid && (
            <div
              className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgencyClass}`}
            >
              <CalendarClock size={12} className="mr-1" />
              {daysUntilDue < 0
                ? `${Math.abs(daysUntilDue)} days overdue`
                : daysUntilDue === 0
                ? "Due today"
                : `Due in ${daysUntilDue} days`}
            </div>
          )}
        </div>
        
      </div>

      {/* Delete Action */}
      {bill.isPaid && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleDeleteBill(bill.id)}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
            title="Delete paid bill"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};


  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Bill Reminders</h3>
        <Bell className="text-blue-500" size={28} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm text-gray-600 font-medium">Total Bills</h4>
          <p className="text-2xl font-bold text-blue-700">{bills.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="text-sm text-gray-600 font-medium">Due This Week</h4>
          <p className="text-2xl font-bold text-yellow-600">
            {unpaidBills.filter(b => getDaysUntilDue(b.dueDate) <= 7 && getDaysUntilDue(b.dueDate) >= 0).length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="text-sm text-gray-600 font-medium">Overdue</h4>
          <p className="text-2xl font-bold text-red-600">
            {unpaidBills.filter(b => getDaysUntilDue(b.dueDate) < 0).length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm text-gray-600 font-medium">Total Amount Due</h4>
          <p className="text-2xl font-bold text-green-600">
            ${unpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bill List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Section: Overdue Bills */}
        {unpaidBills.filter(b => getDaysUntilDue(b.dueDate) < 0).length > 0 && (
          <div>
            <h4 className="text-red-600 font-bold text-lg mb-3 flex items-center">
               Overdue ({unpaidBills.filter(b => getDaysUntilDue(b.dueDate) < 0).length})
            </h4>
            <div className="space-y-3">
              {unpaidBills
                .filter(b => getDaysUntilDue(b.dueDate) < 0)
                .map(renderBillCard)}
            </div>
          </div>
        )}

        {/* Section: Due Soon */}
        {unpaidBills.filter(b => getDaysUntilDue(b.dueDate) <= 7 && getDaysUntilDue(b.dueDate) >= 0).length > 0 && (
          <div>
            <h4 className="text-orange-600 font-bold text-lg mb-3 flex items-center">
              Due This Week ({unpaidBills.filter(b => getDaysUntilDue(b.dueDate) <= 7 && getDaysUntilDue(b.dueDate) >= 0).length})
            </h4>
            <div className="space-y-3">
              {unpaidBills
                .filter(b => getDaysUntilDue(b.dueDate) <= 7 && getDaysUntilDue(b.dueDate) >= 0)
                .map(renderBillCard)}
            </div>
          </div>
        )}

        {/* Section: Upcoming */}
        {unpaidBills.filter(b => getDaysUntilDue(b.dueDate) > 7).length > 0 && (
          <div>
            <h4 className="text-green-600 font-bold text-lg mb-3 flex items-center">
              📅 Upcoming ({unpaidBills.filter(b => getDaysUntilDue(b.dueDate) > 7).length})
            </h4>
            <div className="space-y-3">
              {unpaidBills
                .filter(b => getDaysUntilDue(b.dueDate) > 7)
                .map(renderBillCard)}
            </div>
          </div>
        )}

        {/* Paid Bills */}
        {paidBills.length > 0 && (
          <div>
            <h4 className="text-gray-500 font-bold text-lg mb-3 flex items-center">
              ✅ Recently Paid ({paidBills.length})
            </h4>
            <div className="space-y-3">
              {paidBills.map(renderBillCard)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {[...unpaidBills, ...paidBills].length === 0 && (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No bills to show</p>
            <p className="text-gray-400 text-sm">Add your first bill below to get started</p>
          </div>
        )}
      </div>

      {/* Add New Bill Form */}
      <div className="mt-8 border-t pt-6">
        <h4 className="font-bold mb-4 text-xl text-gray-800"> Add New Bill</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bill Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Bill Name</label>
            <input
              type="text"
              placeholder="e.g., Electricity, Phone Bill"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newBill.name}
              onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g., 120.00"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newBill.amount || ""}
              onChange={(e) =>
                setNewBill({
                  ...newBill,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Due Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={newBill.dueDate}
              onChange={(e) =>
                setNewBill({ ...newBill, dueDate: e.target.value })
              }
            />
          </div>

          

          {/* Recurring Checkbox */}
          <div className="flex items-center space-x-2 md:col-span-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={newBill.isRecurring}
              onChange={(e) =>
                setNewBill({ ...newBill, isRecurring: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
               This is a recurring bill
            </label>
          </div>

          {/* Frequency Dropdown */}
          {newBill.isRecurring && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newBill.frequency}
                onChange={(e) =>
                  setNewBill({ ...newBill, frequency: e.target.value as any })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (Every 3 months)</option>
                <option value="annually">Annually (Yearly)</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAddBill}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium md:col-span-2"
          >
            + Add Bill
          </button>
        </div>
      </div>
    </div>
  );
}