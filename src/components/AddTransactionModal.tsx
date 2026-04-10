import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Mic } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';
import { motion } from 'motion/react';
import Numpad from './Numpad';

export default function AddTransactionModal({ isOpen, onClose, initialTransaction }: { isOpen: boolean, onClose: () => void, initialTransaction?: Transaction, key?: string | number }) {
  const { categories, accounts, addTransaction, updateTransaction, transactions } = useStore();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [selectedReimbursableIds, setSelectedReimbursableIds] = useState<string[]>([]);
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(Number(initialTransaction.amount.toFixed(2)).toString());
        setCategoryId(initialTransaction.categoryId || '');
        setFromAccountId(initialTransaction.fromAccountId || '');
        setToAccountId(initialTransaction.toAccountId || '');
        setNote(initialTransaction.note || '');
        setTagsInput(initialTransaction.tags ? initialTransaction.tags.join(', ') : '');
        setDate(format(parseISO(initialTransaction.date), "yyyy-MM-dd'T'HH:mm"));
        setIsReimbursable(initialTransaction.isReimbursable || false);
        setSelectedReimbursableIds(initialTransaction.reimbursedTxIds || []);
        setFee('');
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
        setTagsInput('');
        setFee('');
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

    if (type !== 'transfer' && !categoryId) {
      alert('请选择分类');
      return;
    }
    if (type !== 'income' && !fromAccountId) {
      alert('请选择付款账户');
      return;
    }
    if (type !== 'expense' && !toAccountId) {
      alert('请选择收款账户');
      return;
    }

    const tags = tagsInput.split(/[,，\s]+/).map(t => t.trim()).filter(t => t);

    const txData = {
      type,
      amount: Math.round(Number(amount) * 100) / 100,
      date: new Date(date).toISOString(),
      categoryId: type !== 'transfer' ? categoryId : undefined,
      fromAccountId: type !== 'income' ? fromAccountId : undefined,
      toAccountId: type !== 'expense' ? toAccountId : undefined,
      note,
      tags: tags.length > 0 ? tags : undefined,
      isReimbursable: type === 'expense' && selectedCategory?.name === '交通' ? isReimbursable : undefined,
      reimbursedTxIds: type === 'income' && selectedCategory?.name === '报销款' ? selectedReimbursableIds : undefined
    };

    if (initialTransaction && initialTransaction.id) {
      updateTransaction(initialTransaction.id, txData);
    } else {
      addTransaction(txData);
      
      // Handle transfer fee
      if (type === 'transfer' && fee && !isNaN(Number(fee)) && Number(fee) > 0) {
        // Find a fee category or use the first expense category
        let feeCategory = categories.find(c => c.type === 'expense' && (c.name.includes('手续费') || c.name.includes('转账')));
        if (!feeCategory) {
          feeCategory = categories.find(c => c.type === 'expense');
        }
        
        if (feeCategory) {
          addTransaction({
            type: 'expense',
            amount: Number(fee),
            date: new Date(date).toISOString(),
            categoryId: feeCategory.id,
            fromAccountId: fromAccountId,
            note: `${note ? note + ' - ' : ''}转账手续费`,
            tags: tags.length > 0 ? tags : undefined,
          });
        }
      }
    }
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const [showNumpad, setShowNumpad] = useState(false);

  const availableTags = React.useMemo(() => {
    const tags = new Set<string>();
    transactions.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [transactions]);

  const handleTagClick = (tag: string) => {
    const currentTags = tagsInput.split(/[,，\s]+/).map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      setTagsInput(currentTags.length > 0 ? `${currentTags.join(' ')} ${tag}` : tag);
    }
  };

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

          {/* Date & Note & Tags */}
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
          
          {type === 'transfer' && !initialTransaction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">转账手续费 (选填)</label>
              <input 
                type="number" 
                value={fee}
                onChange={e => setFee(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签 (用空格或逗号分隔)</label>
            <input 
              type="text" 
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="例如: 旅游 聚餐"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm mb-2"
            />
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
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
          <Numpad
            value={amount}
            onChange={setAmount}
            onComplete={() => setShowNumpad(false)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
