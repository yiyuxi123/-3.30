import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Budget, Category, Transaction, TransactionTemplate, SavingGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  templates: TransactionTemplate[];
  goals: SavingGoal[];

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addTemplate: (template: Omit<TransactionTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;

  addGoal: (goal: Omit<SavingGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<SavingGoal>) => void;
  deleteGoal: (id: string) => void;

  showReimbursables: boolean;
  toggleShowReimbursables: () => void;

  privacyMode: boolean;
  togglePrivacyMode: () => void;

  passcode: string | null;
  setPasscode: (code: string | null) => void;
  isLocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const initialCategories: Category[] = [
  { id: '1', name: '餐饮', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
  { id: '2', name: '交通', type: 'expense', icon: 'Bus', color: '#3b82f6' },
  { id: '3', name: '购物', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: '4', name: '居住', type: 'expense', icon: 'Home', color: '#10b981' },
  { id: '5', name: '工资', type: 'income', icon: 'Wallet', color: '#10b981' },
  { id: '6', name: '理财', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: '7', name: '报销款', type: 'income', icon: 'Receipt', color: '#f59e0b' },
];

const initialAccounts: Account[] = [
  { id: '1', name: '现金', type: 'cash', balance: 1000, color: '#10b981', icon: 'Banknote' },
  { id: '2', name: '支付宝', type: 'alipay', balance: 5000, color: '#3b82f6', icon: 'Smartphone' },
  { id: '3', name: '微信', type: 'wechat', balance: 3000, color: '#22c55e', icon: 'MessageCircle' },
  { id: '4', name: '招商银行', type: 'bank', balance: 20000, color: '#ef4444', icon: 'CreditCard' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      accounts: initialAccounts,
      categories: initialCategories,
      transactions: [],
      budgets: [
        { id: '1', amount: 5000, period: 'monthly' } // Default total monthly budget
      ],
      templates: [],
      goals: [],
      showReimbursables: true,
      privacyMode: false,
      passcode: null,
      isLocked: false,

      toggleShowReimbursables: () => set((state) => ({ showReimbursables: !state.showReimbursables })),
      togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
      setPasscode: (code) => set({ passcode: code, isLocked: !!code }),
      unlock: () => set({ isLocked: false }),
      lock: () => set((state) => ({ isLocked: !!state.passcode })),

      markPreviousAsReimbursed: () => set((state) => ({
        transactions: state.transactions.map(t => 
          t.isReimbursable && !t.isReimbursed ? { ...t, isReimbursed: true } : t
        )
      })),

      addTransaction: (transaction) =>
        set((state) => {
          const newTransaction = { ...transaction, id: uuidv4() };
          
          let updatedTransactions = [newTransaction, ...state.transactions];

          if (newTransaction.reimbursedTxIds && newTransaction.reimbursedTxIds.length > 0) {
            updatedTransactions = updatedTransactions.map(t => {
              if (newTransaction.reimbursedTxIds!.includes(t.id)) {
                return { ...t, isReimbursed: true, reimbursedByTxId: newTransaction.id };
              }
              return t;
            });
          }

          // Update account balances
          const updatedAccounts = state.accounts.map((acc) => {
            if (transaction.type === 'expense' && acc.id === transaction.fromAccountId) {
              return { ...acc, balance: acc.balance - transaction.amount };
            }
            if (transaction.type === 'income' && acc.id === transaction.toAccountId) {
              return { ...acc, balance: acc.balance + transaction.amount };
            }
            if (transaction.type === 'transfer') {
              if (acc.id === transaction.fromAccountId) {
                return { ...acc, balance: acc.balance - transaction.amount };
              }
              if (acc.id === transaction.toAccountId) {
                return { ...acc, balance: acc.balance + transaction.amount };
              }
            }
            return acc;
          });

          return {
            transactions: updatedTransactions,
            accounts: updatedAccounts,
          };
        }),

      updateTransaction: (id, updatedFields) =>
        set((state) => {
          const oldTransaction = state.transactions.find((t) => t.id === id);
          if (!oldTransaction) return state;

          const changes: { field: string; oldValue: any; newValue: any }[] = [];
          (Object.keys(updatedFields) as (keyof Transaction)[]).forEach((key) => {
            if (updatedFields[key] !== oldTransaction[key] && key !== 'history') {
              changes.push({
                field: key,
                oldValue: oldTransaction[key],
                newValue: updatedFields[key],
              });
            }
          });

          const newHistory = changes.length > 0
            ? [
                ...(oldTransaction.history || []),
                { date: new Date().toISOString(), changes },
              ]
            : oldTransaction.history;

          const newTransaction = { ...oldTransaction, ...updatedFields, history: newHistory };

          let updatedTransactions = state.transactions.map((t) => (t.id === id ? newTransaction : t));

          if (oldTransaction.reimbursedTxIds !== newTransaction.reimbursedTxIds) {
            const oldIds = oldTransaction.reimbursedTxIds || [];
            const newIds = newTransaction.reimbursedTxIds || [];
            
            const removedIds = oldIds.filter(tid => !newIds.includes(tid));
            const addedIds = newIds.filter(tid => !oldIds.includes(tid));

            updatedTransactions = updatedTransactions.map(t => {
              if (removedIds.includes(t.id)) {
                return { ...t, isReimbursed: false, reimbursedByTxId: undefined };
              }
              if (addedIds.includes(t.id)) {
                return { ...t, isReimbursed: true, reimbursedByTxId: newTransaction.id };
              }
              return t;
            });
          }

          // Revert old transaction effect on accounts
          let updatedAccounts = state.accounts.map((acc) => {
            let balance = acc.balance;
            if (oldTransaction.type === 'expense' && acc.id === oldTransaction.fromAccountId) balance += oldTransaction.amount;
            if (oldTransaction.type === 'income' && acc.id === oldTransaction.toAccountId) balance -= oldTransaction.amount;
            if (oldTransaction.type === 'transfer') {
              if (acc.id === oldTransaction.fromAccountId) balance += oldTransaction.amount;
              if (acc.id === oldTransaction.toAccountId) balance -= oldTransaction.amount;
            }
            return { ...acc, balance };
          });

          // Apply new transaction effect on accounts
          updatedAccounts = updatedAccounts.map((acc) => {
            let balance = acc.balance;
            if (newTransaction.type === 'expense' && acc.id === newTransaction.fromAccountId) balance -= newTransaction.amount;
            if (newTransaction.type === 'income' && acc.id === newTransaction.toAccountId) balance += newTransaction.amount;
            if (newTransaction.type === 'transfer') {
              if (acc.id === newTransaction.fromAccountId) balance -= newTransaction.amount;
              if (acc.id === newTransaction.toAccountId) balance += newTransaction.amount;
            }
            return { ...acc, balance };
          });

          return {
            transactions: updatedTransactions,
            accounts: updatedAccounts,
          };
        }),

      deleteTransaction: (id) =>
        set((state) => {
          const transaction = state.transactions.find((t) => t.id === id);
          if (!transaction) return state;

          let updatedTransactions = state.transactions.filter((t) => t.id !== id);

          if (transaction.reimbursedTxIds && transaction.reimbursedTxIds.length > 0) {
            updatedTransactions = updatedTransactions.map(t => {
              if (transaction.reimbursedTxIds!.includes(t.id)) {
                return { ...t, isReimbursed: false, reimbursedByTxId: undefined };
              }
              return t;
            });
          }

          if (transaction.reimbursedByTxId) {
             updatedTransactions = updatedTransactions.map(t => {
               if (t.id === transaction.reimbursedByTxId) {
                 return { ...t, reimbursedTxIds: t.reimbursedTxIds?.filter(tid => tid !== id) };
               }
               return t;
             });
          }

          // Revert transaction effect on accounts
          const updatedAccounts = state.accounts.map((acc) => {
            let balance = acc.balance;
            if (transaction.type === 'expense' && acc.id === transaction.fromAccountId) balance += transaction.amount;
            if (transaction.type === 'income' && acc.id === transaction.toAccountId) balance -= transaction.amount;
            if (transaction.type === 'transfer') {
              if (acc.id === transaction.fromAccountId) balance += transaction.amount;
              if (acc.id === transaction.toAccountId) balance -= transaction.amount;
            }
            return { ...acc, balance };
          });

          return {
            transactions: updatedTransactions,
            accounts: updatedAccounts,
          };
        }),

      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, { ...account, id: uuidv4() }] })),
      updateAccount: (id, account) => set((state) => ({ accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...account } : a)) })),
      deleteAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, { ...category, id: uuidv4() }] })),
      updateCategory: (id, category) => set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)) })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),

      addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, { ...budget, id: uuidv4() }] })),
      updateBudget: (id, budget) => set((state) => ({ budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)) })),
      deleteBudget: (id) => set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

      addTemplate: (template) => set((state) => ({ templates: [...(state.templates || []), { ...template, id: uuidv4() }] })),
      deleteTemplate: (id) => set((state) => ({ templates: (state.templates || []).filter((t) => t.id !== id) })),

      addGoal: (goal) => set((state) => ({ goals: [...(state.goals || []), { ...goal, id: uuidv4() }] })),
      updateGoal: (id, goal) => set((state) => ({ goals: (state.goals || []).map((g) => (g.id === id ? { ...g, ...goal } : g)) })),
      deleteGoal: (id) => set((state) => ({ goals: (state.goals || []).filter((g) => g.id !== id) })),
    }),
    {
      name: 'bookkeeping-storage',
    }
  )
);
