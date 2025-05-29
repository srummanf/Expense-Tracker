import React, { useState, useRef, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { PlusCircle, MinusCircle, Upload, Trash2, Pencil } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import type { TransactionFormData } from "../types";

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Healthcare",
  "Groceries",
  "Entertainment",
  "Shopping",
  "Travel",
  "Education",
  "Amount Received",
  "Insurance",
  "Personal Care",
  "Other",
];

const LOCAL_STORAGE_KEY = "transactionCategories";

interface TransactionFormProps {
  onSubmit: (transaction: TransactionFormData) => void;
  onImportCSV: (file: File) => void;
}

export function TransactionForm({
  onSubmit,
  onImportCSV,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: "",
    reason: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    category: "Food & Dining",
  });

  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategory, setEditedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCategories([
            ...DEFAULT_CATEGORIES,
            ...parsed.filter((cat) => !DEFAULT_CATEGORIES.includes(cat)),
          ]);
        }
      } catch (e) {
        console.error("Failed to parse stored categories:", e);
      }
    }
  }, []);

  const persistCategories = (updated: string[]) => {
    setCategories(updated);
    const userOnly = updated.filter((c) => !DEFAULT_CATEGORIES.includes(c));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userOnly));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      amount: "",
      reason: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      category: "Other",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportCSV(file);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      persistCategories(updated);
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    persistCategories(updated);
    if (formData.category === cat) {
      setFormData({ ...formData, category: "Other" });
    }
  };

  const handleEditCategory = (oldName: string) => {
    const trimmed = editedCategory.trim();
    if (!trimmed || trimmed === oldName || categories.includes(trimmed)) {
      setEditingCategory(null);
      return;
    }
    const updated = categories.map((c) => (c === oldName ? trimmed : c));
    persistCategories(updated);
    if (formData.category === oldName) {
      setFormData({ ...formData, category: trimmed });
    }
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "expense" | "revenue",
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Listbox
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
            >
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
                  <span className="block truncate">{formData.category}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                    />
                    {filteredCategories.map((category) => (
                      <Listbox.Option
                        key={category}
                        value={category}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-3 pr-10 ${
                            active
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            {editingCategory === category ? (
                              <input
                                type="text"
                                value={editedCategory}
                                onChange={(e) =>
                                  setEditedCategory(e.target.value)
                                }
                                onBlur={() => handleEditCategory(category)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleEditCategory(category);
                                  } else if (e.key === "Escape") {
                                    setEditingCategory(null);
                                  }
                                }}
                                autoFocus
                                className="w-full bg-white border border-gray-300 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="block truncate">{category}</span>
                            )}

                            {!DEFAULT_CATEGORIES.includes(category) && (
                              <div
                                className="absolute inset-y-0 right-2 flex items-center space-x-5 z-10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Pencil
                                  size={24}
                                  className="cursor-pointer text-blue-500 hover:text-blue-800 border border-blue-300 p-1 rounded-md hover:shadow transition-shadow"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditedCategory(category);
                                  }}
                                />
                                <Trash2
                                  size={24}
                                  className="cursor-pointer text-red-500 hover:text-red-800 border border-red-300 p-1 rounded-md hover:shadow transition-shadow"
                                  onClick={() => handleDeleteCategory(category)}
                                />
                              </div>
                            )}

                            {selected && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason"
            />
          </div>
        </div>

        {/* Add Category */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add new category"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className={`flex-1 flex items-center justify-center space-x-2 ${
              formData.type === "revenue"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white px-4 py-2 rounded-md transition-colors`}
          >
            {formData.type === "revenue" ? (
              <PlusCircle size={20} />
            ) : (
              <MinusCircle size={20} />
            )}
            <span>
              Add {formData.type === "revenue" ? "Revenue" : "Expense"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Upload size={20} />
            <span>Import CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </motion.form>
  );
}
