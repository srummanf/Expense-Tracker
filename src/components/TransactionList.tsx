import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Trash2,
  Edit2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Transaction } from "../types";
import { Button } from "./ui/button";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const ITEMS_PER_PAGE = 10;
const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Travel",
  "Education",
  "Amount Received",
  "Other",
];

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
}: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Transaction | null>(null);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleEditClick = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm(transaction);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditSave = () => {
    if (editForm) {
      onEdit(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Date
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Type
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Amount
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Reason
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedTransactions.map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border-t border-gray-200"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === transaction.id ? (
                      <input
                        type="date"
                        value={editForm?.date || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, date: e.target.value } : null
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded-md"
                      />
                    ) : (
                      format(new Date(transaction.date), "MMM dd, yyyy")
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {editingId === transaction.id ? (
                      <select
                        value={editForm?.type || "expense"}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  type: e.target.value as "expense" | "revenue",
                                }
                              : null
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded-md"
                      >
                        <option value="expense">Expense</option>
                        <option value="revenue">Revenue</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === "revenue"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.type === "revenue" ? "Revenue" : "Expense"}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-medium ${
                      transaction.type === "revenue"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {editingId === transaction.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm?.amount || 0}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, amount: parseFloat(e.target.value) }
                              : null
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded-md"
                      />
                    ) : (
                      `$${transaction.amount.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === transaction.id ? (
                      <select
                        value={editForm?.category || "Other"}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, category: e.target.value } : null
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded-md"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      transaction.category || "Other"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === transaction.id ? (
                      <input
                        type="text"
                        value={editForm?.reason || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, reason: e.target.value } : null
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded-md"
                      />
                    ) : (
                      transaction.reason
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {editingId === transaction.id ? (
                        <>
                          <Button
                            onClick={handleEditSave}
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={handleEditCancel}
                            variant="ghost"
                            size="icon"
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleEditClick(transaction)}
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => onDelete(transaction.id)}
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex w-[100px] justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8"
              >
                {page}
              </Button>
            ))}
          </div>
          <div className="flex w-[100px] justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
