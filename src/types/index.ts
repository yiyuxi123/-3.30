export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isFixed?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'alipay' | 'wechat' | 'credit';
  balance: number;
  color: string;
  icon: string;
}

export interface TransactionHistory {
  date: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
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
  tags?: string[]; // Added tags
  isReimbursable?: boolean;
  isReimbursed?: boolean;
  reimbursedTxIds?: string[];
  reimbursedByTxId?: string;
  history?: TransactionHistory[];
}

export interface Budget {
  id: string;
  categoryId?: string; // If undefined, it's a total budget
  amount: number;
  period: 'monthly' | 'yearly';
}
