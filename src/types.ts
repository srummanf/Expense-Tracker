export interface Transaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  type: 'expense' | 'revenue';
  category?: string;
}

export interface TransactionFormData {
  amount: string;
  reason: string;
  date: string;
  type: 'expense' | 'revenue';
  category: string;
}

export interface BudgetLimit {
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface CategoryTotal {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}