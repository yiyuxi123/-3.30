import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Wallet, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import EditBudgetModal from '../components/EditBudgetModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { Transaction } from '../types';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { transactions, accounts, budgets, categories } = useStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return isWithinInterval(d, { start, end });
  });

  const expense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const income = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBudget = budgets.find(b => !b.categoryId)?.amount || 0;
  const budgetRemaining = totalBudget - expense;
  const budgetPercent = totalBudget > 0 ? (expense / totalBudget) * 100 : 0;

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">记账本</h1>
          <p className="text-sm text-gray-500">{format(now, 'yyyy年MM月')}</p>
        </div>
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <Wallet size={20} />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm font-medium">本月支出</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{expense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm font-medium">本月收入</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{income.toFixed(2)}</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div 
        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsBudgetModalOpen(true)}
      >
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">剩余预算</p>
            <p className="text-3xl font-bold text-gray-900">¥{budgetRemaining.toFixed(2)}</p>
          </div>
          <p className="text-sm text-gray-400">总预算 ¥{totalBudget}</p>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
          <div 
            className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">最近记录</h2>
          <button 
            onClick={() => onNavigate('transactions')}
            className="text-sm text-emerald-600 font-medium flex items-center"
          >
            查看全部 <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">暂无记录，快去记一笔吧！</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTransactions.map(t => {
                const category = categories.find(c => c.id === t.categoryId);
                const IconComponent = category ? (Icons as any)[category.icon] : Icons.HelpCircle;
                
                return (
                  <div 
                    key={t.id} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(t)}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: category?.color || '#9ca3af' }}
                      >
                        {IconComponent && <IconComponent size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{category?.name || '未知'}</span>
                          {t.isReimbursable && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-sm font-medium shrink-0">可报销</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{format(new Date(t.date), 'MM-dd HH:mm')} {t.note && `| ${t.note}`}</p>
                      </div>
                    </div>
                    <div className={`font-bold shrink-0 ml-4 ${t.type === 'expense' ? 'text-gray-900' : t.type === 'income' ? 'text-emerald-500' : 'text-blue-500'}`}>
                      {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}¥{t.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isBudgetModalOpen && <EditBudgetModal onClose={() => setIsBudgetModalOpen(false)} />}
      {selectedTx && <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
