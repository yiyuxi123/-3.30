import { create } from 'zustand';
import { Account, Budget, Category, Transaction, TransactionTemplate, SavingGoal } from '../types';
import { firestoreService } from '../services/firestoreService';

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

  // Firebase Sync Setters
  setAccounts: (accounts: Account[]) => void;
  setCategories: (categories: Category[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setTemplates: (templates: TransactionTemplate[]) => void;
  setGoals: (goals: SavingGoal[]) => void;
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
  (set, get) => ({
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    templates: [],
    goals: [],
    showReimbursables: true,

    setAccounts: (accounts) => set({ accounts }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setBudgets: (budgets) => set({ budgets }),
    setTemplates: (templates) => set({ templates }),
    setGoals: (goals) => set({ goals }),

    toggleShowReimbursables: () => set((state) => ({ showReimbursables: !state.showReimbursables })),

    markPreviousAsReimbursed: async () => {
      await firestoreService.markPreviousAsReimbursed(get().transactions);
    },

    addTransaction: async (transaction) => {
      await firestoreService.addTransaction(transaction, get().accounts, get().transactions);
    },

    updateTransaction: async (id, updatedFields) => {
      const oldTransaction = get().transactions.find((t) => t.id === id);
      if (!oldTransaction) return;
      await firestoreService.updateTransaction(id, updatedFields, oldTransaction, get().accounts, get().transactions);
    },

    deleteTransaction: async (id) => {
      const transaction = get().transactions.find((t) => t.id === id);
      if (!transaction) return;
      await firestoreService.deleteTransaction(id, transaction, get().accounts, get().transactions);
    },

    addAccount: async (account) => await firestoreService.addDocument('accounts', account),
    updateAccount: async (id, account) => await firestoreService.updateDocument('accounts', id, account),
    deleteAccount: async (id) => await firestoreService.deleteDocument('accounts', id),

    addCategory: async (category) => await firestoreService.addDocument('categories', category),
    updateCategory: async (id, category) => await firestoreService.updateDocument('categories', id, category),
    deleteCategory: async (id) => await firestoreService.deleteDocument('categories', id),

    addBudget: async (budget) => await firestoreService.addDocument('budgets', budget),
    updateBudget: async (id, budget) => await firestoreService.updateDocument('budgets', id, budget),
    deleteBudget: async (id) => await firestoreService.deleteDocument('budgets', id),

    addTemplate: async (template) => await firestoreService.addDocument('templates', template),
    deleteTemplate: async (id) => await firestoreService.deleteDocument('templates', id),

    addGoal: async (goal) => await firestoreService.addDocument('goals', goal),
    updateGoal: async (id, goal) => await firestoreService.updateDocument('goals', id, goal),
    deleteGoal: async (id) => await firestoreService.deleteDocument('goals', id),
  })
);
