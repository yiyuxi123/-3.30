export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'alipay' | 'wechat' | 'credit';
  balance: number;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  categoryId?: string; // For expense/income
  fromAccountId?: string; // For expense/transfer
  toAccountId?: string; // For income/transfer
  note: string;
}

export interface Budget {
  id: string;
  categoryId?: string; // If undefined, it's a total budget
  amount: number;
  period: 'monthly' | 'yearly';
}
