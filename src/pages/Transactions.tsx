import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, isSameMonth, parseISO } from 'date-fns';
import * as Icons from 'lucide-react';
import { Filter, Search, List, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionCalendar from '../components/TransactionCalendar';
import { Transaction } from '../types';

export default function Transactions() {
  const { transactions, categories, accounts, showReimbursables, toggleShowReimbursables } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Get unique months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      months.add(format(parseISO(t.date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse(); // Newest first
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const isReimbursableTx = (t: Transaction) => {
      if (t.type === 'expense' && t.isReimbursable) return true;
      if (t.type === 'income') {
        const cat = categories.find(c => c.id === t.categoryId);
        if (cat?.name === '报销款') return true;
      }
      return false;
    };

    const lowerSearchTerm = searchTerm.toLowerCase();

    return transactions.filter(t => {
      if (!showReimbursables && isReimbursableTx(t)) return false;
      
      const matchesSearch = t.note.toLowerCase().includes(lowerSearchTerm) || 
                            categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(lowerSearchTerm);
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesMonth = selectedMonth === 'all' || format(parseISO(t.date), 'yyyy-MM') === selectedMonth;
      
      return matchesSearch && matchesType && matchesMonth;
    });
  }, [transactions, categories, showReimbursables, searchTerm, filterType, selectedMonth]);

  // Group by month
  const grouped = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const month = format(parseISO(t.date), 'yyyy-MM');
      if (!acc[month]) acc[month] = [];
      acc[month].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">账单明细</h1>
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
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CalendarIcon size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Search & Filter */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索备注或分类..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium"
            >
              <option value="all">全部月份</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(`${month}-01`), 'yyyy年MM月')}
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'expense', 'income', 'transfer'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === type 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? '全部' : type === 'expense' ? '支出' : type === 'income' ? '收入' : '转账'}
            </button>
          ))}
        </div>
      </header>

      {viewMode === 'calendar' ? (
        <TransactionCalendar />
      ) : (
        /* Transactions List */
        <div className="space-y-6">
          {Object.entries(grouped).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p>没有找到相关记录</p>
            </div>
          ) : (
            (Object.entries(grouped) as [string, Transaction[]][]).map(([month, monthTransactions]) => {
              const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
              const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={month} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Month Header */}
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{format(parseISO(`${month}-01`), 'yyyy年MM月')}</h3>
                    <div className="text-xs text-gray-500 flex space-x-3">
                      <span>支 ¥{monthExpense.toFixed(2)}</span>
                      <span>收 ¥{monthIncome.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-50">
                    {monthTransactions.map(t => {
                      const category = categories.find(c => c.id === t.categoryId);
                      const IconComponent = category ? (Icons as any)[category.icon] : Icons.ArrowRightLeft;
                      const fromAccount = accounts.find(a => a.id === t.fromAccountId);
                      const toAccount = accounts.find(a => a.id === t.toAccountId);
                      
                      return (
                        <motion.div 
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          whileTap={{ scale: 0.98 }}
                          key={t.id} 
                          className="p-4 flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedTx(t)}
                        >
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: t.type === 'transfer' ? '#6b7280' : category?.color || '#9ca3af' }}
                            >
                              {IconComponent && <IconComponent size={20} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>{t.type === 'transfer' ? '转账' : category?.name || '未知'}</span>
                                {t.isReimbursable && (
                                  <span className={`px-1.5 py-0.5 text-[10px] rounded-sm font-medium shrink-0 ${t.isReimbursed ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                                    {t.isReimbursed ? '已报销' : '待报销'}
                                  </span>
                                )}
                                {category?.isFixed && t.type === 'expense' && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-sm font-medium shrink-0">固定</span>
                                )}
                              </p>
                              <div className="mt-0.5 flex flex-col space-y-1">
                                <p className="text-xs text-gray-500 truncate">
                                  {format(parseISO(t.date), 'MM-dd HH:mm')}
                                  {t.type === 'transfer' && fromAccount && toAccount && ` | ${fromAccount.name} -> ${toAccount.name}`}
                                  {t.type !== 'transfer' && fromAccount && ` | ${fromAccount.name}`}
                                  {t.type !== 'transfer' && toAccount && ` | ${toAccount.name}`}
                                </p>
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
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {selectedTx && <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />}
    </div>
  );
}
