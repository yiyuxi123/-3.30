import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Mic } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';
import { motion } from 'motion/react';

export default function AddTransactionModal({ isOpen, onClose, initialTransaction }: { isOpen: boolean, onClose: () => void, initialTransaction?: Transaction }) {
  const { categories, accounts, addTransaction, updateTransaction, transactions } = useStore();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [selectedReimbursableIds, setSelectedReimbursableIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(initialTransaction.amount.toString());
        setCategoryId(initialTransaction.categoryId || '');
        setFromAccountId(initialTransaction.fromAccountId || '');
        setToAccountId(initialTransaction.toAccountId || '');
        setNote(initialTransaction.note || '');
        setDate(format(parseISO(initialTransaction.date), "yyyy-MM-dd'T'HH:mm"));
        setIsReimbursable(initialTransaction.isReimbursable || false);
        setSelectedReimbursableIds(initialTransaction.reimbursedTxIds || []);
      } else {
        // Set defaults
        const defaultExpenseCat = categories.find(c => c.type === 'expense');
        const defaultIncomeCat = categories.find(c => c.type === 'income');
        const defaultAccount = accounts[0];
        
        if (type === 'expense' && defaultExpenseCat) setCategoryId(defaultExpenseCat.id);
        if (type === 'income' && defaultIncomeCat) setCategoryId(defaultIncomeCat.id);
        if (defaultAccount) setFromAccountId(defaultAccount.id);
        if (accounts.length > 1) setToAccountId(accounts[1].id);
        setIsReimbursable(false);
        setSelectedReimbursableIds([]);
        setAmount('');
      }
    }
  }, [isOpen, initialTransaction, type, categories, accounts]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (type === 'income' && selectedCategory?.name === '报销款') {
      const total = selectedReimbursableIds.reduce((sum, id) => {
        const tx = transactions.find(t => t.id === id);
        return sum + (tx?.amount || 0);
      }, 0);
      if (total > 0) {
        setAmount(total.toString());
      } else if (selectedReimbursableIds.length === 0 && !initialTransaction) {
        setAmount('');
      }
    }
  }, [selectedReimbursableIds, type, selectedCategory?.name, transactions, initialTransaction]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const txData = {
      type,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      categoryId: type !== 'transfer' ? categoryId : undefined,
      fromAccountId: type !== 'income' ? fromAccountId : undefined,
      toAccountId: type !== 'expense' ? toAccountId : undefined,
      note,
      isReimbursable: type === 'expense' && selectedCategory?.name === '交通' ? isReimbursable : undefined,
      reimbursedTxIds: type === 'income' && selectedCategory?.name === '报销款' ? selectedReimbursableIds : undefined
    };

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount === '0' && num !== '.') {
      setAmount(num === '00' ? '0' : num);
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.')) {
        const [, decimal] = amount.split('.');
        if (decimal && decimal.length >= 2) return;
        if (num === '00' && decimal && decimal.length === 1) {
          setAmount(prev => prev + '0');
          return;
        }
      }
      setAmount(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  const [showNumpad, setShowNumpad] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  type === t 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'expense' ? '支出' : t === 'income' ? '收入' : '转账'}
              </button>
            ))}
          </div>
          <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full">
            <Mic size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Amount Input */}
          <div 
            className="flex items-center border-b-2 border-emerald-500 py-2 cursor-pointer"
            onClick={() => setShowNumpad(true)}
          >
            <span className="text-3xl font-bold text-gray-900 mr-2">¥</span>
            <div className={`w-full text-4xl font-bold ${amount ? 'text-gray-900' : 'text-gray-300'}`}>
              {amount || '0.00'}
            </div>
          </div>

          {/* Categories Grid */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">分类</label>
              <div className="grid grid-cols-4 gap-4">
                {filteredCategories.map(cat => {
                  const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className="flex flex-col items-center space-y-2 group"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: isSelected ? cat.color : `${cat.color}20`,
                          color: isSelected ? 'white' : cat.color,
                          borderColor: cat.color
                        }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accounts */}
          <div className="space-y-4">
            {type !== 'income' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'transfer' ? '转出账户' : '付款账户'}
                </label>
                <select 
                  value={fromAccountId} 
                  onChange={e => setFromAccountId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (余额: ¥{acc.balance})</option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'transfer' ? '转入账户' : '收款账户'}
                </label>
                <select 
                  value={toAccountId} 
                  onChange={e => setToAccountId(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (余额: ¥{acc.balance})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input 
                type="datetime-local" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <input 
                type="text" 
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="写点什么..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Reimbursable Checkbox */}
          {type === 'expense' && selectedCategory?.name === '交通' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="reimbursable"
                checked={isReimbursable}
                onChange={(e) => setIsReimbursable(e.target.checked)}
                className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="reimbursable" className="text-sm font-medium text-gray-700">
                可报销
              </label>
            </div>
          )}

          {/* Reimbursable Selection for Income */}
          {type === 'income' && selectedCategory?.name === '报销款' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">选择要报销的记录</label>
                {transactions.filter(t => t.type === 'expense' && t.isReimbursable && (!t.isReimbursed || t.reimbursedByTxId === initialTransaction?.id)).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const availableTxs = transactions.filter(t => t.type === 'expense' && t.isReimbursable && (!t.isReimbursed || t.reimbursedByTxId === initialTransaction?.id));
                      if (selectedReimbursableIds.length === availableTxs.length) {
                        setSelectedReimbursableIds([]);
                      } else {
                        setSelectedReimbursableIds(availableTxs.map(t => t.id));
                      }
                    }}
                    className="text-xs text-emerald-600 font-medium"
                  >
                    {selectedReimbursableIds.length === transactions.filter(t => t.type === 'expense' && t.isReimbursable && (!t.isReimbursed || t.reimbursedByTxId === initialTransaction?.id)).length ? '取消全选' : '全选'}
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                {transactions.filter(t => t.type === 'expense' && t.isReimbursable && (!t.isReimbursed || t.reimbursedByTxId === initialTransaction?.id)).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">没有待报销的记录</p>
                ) : (
                  transactions
                    .filter(t => t.type === 'expense' && t.isReimbursable && (!t.isReimbursed || t.reimbursedByTxId === initialTransaction?.id))
                    .map(t => (
                      <div key={t.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-100">
                        <input
                          type="checkbox"
                          checked={selectedReimbursableIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReimbursableIds(prev => [...prev, t.id]);
                            } else {
                              setSelectedReimbursableIds(prev => prev.filter(id => id !== t.id));
                            }
                          }}
                          className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {format(parseISO(t.date), 'MM-dd')} {t.note || categories.find(c => c.id === t.categoryId)?.name}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">¥{t.amount.toFixed(2)}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center space-x-2"
          >
            <Check size={20} />
            <span>保存记录</span>
          </button>
        </div>

        {/* Custom Numpad */}
        {showNumpad && (
          <div className="bg-gray-50 border-t border-gray-200 p-4 shrink-0 animate-in slide-in-from-bottom-10">
            <div className="grid grid-cols-4 gap-2">
              <button type="button" onClick={() => handleNumberClick('1')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">1</button>
              <button type="button" onClick={() => handleNumberClick('2')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">2</button>
              <button type="button" onClick={() => handleNumberClick('3')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">3</button>
              <button type="button" onClick={handleDelete} className="bg-gray-200 text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-300 flex items-center justify-center"><Icons.Delete size={24} /></button>
              
              <button type="button" onClick={() => handleNumberClick('4')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">4</button>
              <button type="button" onClick={() => handleNumberClick('5')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">5</button>
              <button type="button" onClick={() => handleNumberClick('6')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">6</button>
              <button type="button" onClick={handleClear} className="bg-gray-200 text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-300">C</button>
              
              <button type="button" onClick={() => handleNumberClick('7')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">7</button>
              <button type="button" onClick={() => handleNumberClick('8')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">8</button>
              <button type="button" onClick={() => handleNumberClick('9')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">9</button>
              <button type="button" onClick={() => setShowNumpad(false)} className="row-span-2 bg-emerald-500 text-white text-xl font-bold rounded-xl shadow-sm active:bg-emerald-600 flex items-center justify-center">完成</button>
              
              <button type="button" onClick={() => handleNumberClick('.')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">.</button>
              <button type="button" onClick={() => handleNumberClick('0')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">0</button>
              <button type="button" onClick={() => handleNumberClick('00')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">00</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
