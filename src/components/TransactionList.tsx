import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Trash2,
  Edit2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Tag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Disclosure, Listbox, Transition } from "@headlessui/react";
import type { Transaction } from "../types";
import { Button } from "./ui/button";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const ITEMS_PER_PAGE = 10;
// const CATEGORIES = [
//   "Food & Dining",
//   "Transportation",
//   "Housing",
//   "Utilities",
//   "Healthcare",
//   "Entertainment",
//   "Shopping",
//   "Travel",
//   "Education",
//   "Amount Received",
//   "Other",
// ];

type SortOrder = "asc" | "desc";
type SortField = "date" | "amount" | "none";

interface FilterState {
  sortField: SortField;
  sortOrder: SortOrder;
  typeFilter: "all" | "expense" | "revenue";
  categoryFilters: string[];
}

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
}: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    sortField: "date",
    sortOrder: "desc",
    typeFilter: "all",
    categoryFilters: [],
  });

  const CATEGORIES = useMemo(() => {
  const stored = localStorage.getItem("transactionCategories");
  let customCategories: string[] = [];

  try {
    if (stored) {
      customCategories = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Invalid categories in localStorage", error);
  }

  const predefined = [
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

  const allCategories = Array.from(new Set([...predefined, ...customCategories]));
  return allCategories;
}, []);


  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply type filter
    if (filters.typeFilter !== "all") {
      result = result.filter((t) => t.type === filters.typeFilter);
    }

    // Apply category filters
    if (filters.categoryFilters.length > 0) {
      result = result.filter((t) =>
        filters.categoryFilters.includes(t.category || "Other")
      );
    }

    // Apply sorting
    if (filters.sortField !== "none") {
      result.sort((a, b) => {
        let comparison = 0;
        
        if (filters.sortField === "date") {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (filters.sortField === "amount") {
          comparison = a.amount - b.amount;
        }
        
        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [transactions, filters]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  const handleSortFieldChange = (field: SortField) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const handleCategoryFilterChange = (category: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      categoryFilters: checked
        ? [...prev.categoryFilters, category]
        : prev.categoryFilters.filter((c) => c !== category),
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      sortField: "date",
      sortOrder: "desc",
      typeFilter: "all",
      categoryFilters: [],
    });
  };

  const getSortIcon = (field: SortField) => {
    if (filters.sortField !== field) return null;
    return filters.sortOrder === "desc" ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronUp className="h-4 w-4" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filters Section */}
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left text-sm font-medium text-gray-900 border-b border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters & Sorting</span>
                {(filters.typeFilter !== "all" || 
                  filters.categoryFilters.length > 0 || 
                  filters.sortField !== "date" || 
                  filters.sortOrder !== "desc") && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-gray-500`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Sort by Date
                  </label>
                  <button
                    onClick={() => handleSortFieldChange("date")}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm ${
                      filters.sortField === "date"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700"
                    } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <span>
                      {filters.sortField === "date"
                        ? filters.sortOrder === "desc"
                          ? "Newest First"
                          : "Oldest First"
                        : "Date"}
                    </span>
                    {getSortIcon("date")}
                  </button>
                </div>

                {/* Amount Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Sort by Amount
                  </label>
                  <button
                    onClick={() => handleSortFieldChange("amount")}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm ${
                      filters.sortField === "amount"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700"
                    } hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <span>
                      {filters.sortField === "amount"
                        ? filters.sortOrder === "desc"
                          ? "High to Low"
                          : "Low to High"
                        : "Amount"}
                    </span>
                    {getSortIcon("amount")}
                  </button>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Transaction Type
                  </label>
                  <Listbox
                    value={filters.typeFilter}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, typeFilter: value }))
                    }
                  >
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                        <span className="block truncate">
                          {filters.typeFilter === "all"
                            ? "All Types"
                            : filters.typeFilter === "expense"
                            ? "Expenses Only"
                            : "Revenue Only"}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDown
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={React.Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          <Listbox.Option
                            value="all"
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  All Types
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                          <Listbox.Option
                            value="expense"
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  <TrendingDown className="h-4 w-4 inline mr-2 text-red-500" />
                                  Expenses Only
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                          <Listbox.Option
                            value="revenue"
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                  <TrendingUp className="h-4 w-4 inline mr-2 text-green-500" />
                                  Revenue Only
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Categories ({filters.categoryFilters.length} selected)
                  </label>
                  <Listbox
                    value={filters.categoryFilters}
                    onChange={(value) =>
                      setFilters((prev) => ({ ...prev, categoryFilters: value }))
                    }
                    multiple
                  >
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                        <span className="block truncate">
                          {filters.categoryFilters.length === 0
                            ? "All Categories"
                            : `${filters.categoryFilters.length} selected`}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronDown
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={React.Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {CATEGORIES.map((category) => (
                            <Listbox.Option
                              key={category}
                              value={category}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                  active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                                }`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => {}}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`ml-3 block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                      {category}
                                    </span>
                                  </div>
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </Button>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {paginatedTransactions.length} of {filteredAndSortedTransactions.length} transactions
          {filteredAndSortedTransactions.length !== transactions.length && (
            <span className="text-blue-600 ml-1">(filtered from {transactions.length} total)</span>
          )}
        </p>
      </div>

      {/* Transaction Table */}
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

      {/* No Results Message */}
      {filteredAndSortedTransactions.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500">
            <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-sm">Try adjusting your filters to see more results.</p>
          </div>
        </div>
      )}

      {/* Pagination */}
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