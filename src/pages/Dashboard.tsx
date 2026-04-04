import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Wallet, TrendingDown, TrendingUp, ChevronRight, Eye, EyeOff } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import EditBudgetModal from '../components/EditBudgetModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { Transaction } from '../types';

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { transactions, accounts, budgets, categories, showReimbursables, toggleShowReimbursables } = useStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const isReimbursableTx = (t: Transaction) => {
    if (t.type === 'expense' && t.isReimbursable) return true;
    if (t.type === 'income') {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat?.name === '报销款') return true;
    }
    return false;
  };

  const filteredTransactions = transactions.filter(t => {
    if (!showReimbursables && isReimbursableTx(t)) return false;
    return true;
  });

  const currentMonthTransactions = filteredTransactions.filter(t => {
    const d = new Date(t.date);
    return isWithinInterval(d, { start, end });
  });

  const expense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const income = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentDay = now.getDate();
  const dailyAverage = expense / currentDay;

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBudget = budgets.find(b => !b.categoryId)?.amount || 0;
  const budgetRemaining = totalBudget - expense;
  const budgetPercent = totalBudget > 0 ? (expense / totalBudget) * 100 : 0;

  const reimbursableAmount = transactions
    .filter(t => t.type === 'expense' && t.isReimbursable && !t.isReimbursed)
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">记账本</h1>
          <p className="text-sm text-gray-500">{format(now, 'yyyy年MM月')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleShowReimbursables}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showReimbursables 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {showReimbursables ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{showReimbursables ? '含报销' : '不含报销'}</span>
          </button>
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <Wallet size={20} />
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-all"
        >
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-sm font-medium">本月支出</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{expense.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">日均 ¥{dailyAverage.toFixed(2)}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-all"
        >
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-sm font-medium">本月收入</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">¥{income.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Reimbursable Banner */}
      {reimbursableAmount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center space-x-2 text-amber-700">
            <Icons.Receipt size={18} />
            <span className="text-sm font-medium">待报销金额</span>
          </div>
          <p className="text-lg font-bold text-amber-700">¥{reimbursableAmount.toFixed(2)}</p>
        </motion.div>
      )}

      {/* Budget Progress */}
      <motion.div 
        whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
        whileTap={{ scale: 0.98 }}
        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all"
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
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
          />
        </div>
      </motion.div>

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
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-sm font-medium shrink-0 ${t.isReimbursed ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                              {t.isReimbursed ? '已报销' : '待报销'}
                            </span>
                          )}
                        </p>
                        <div className="mt-0.5 flex flex-col space-y-1">
                          <p className="text-xs text-gray-500 truncate">{format(new Date(t.date), 'MM-dd HH:mm')}</p>
                          {t.note && (
                            <p className="text-xs text-gray-600 truncate bg-gray-100/80 px-1.5 py-0.5 rounded w-fit max-w-full">
                              {t.note}
                            </p>
                          )}
                        </div>
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
