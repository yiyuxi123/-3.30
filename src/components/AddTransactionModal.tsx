import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Mic } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '../types';

export default function AddTransactionModal({ isOpen, onClose, initialTransaction }: { isOpen: boolean, onClose: () => void, initialTransaction?: Transaction }) {
  const { categories, accounts, addTransaction, updateTransaction } = useStore();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isReimbursable, setIsReimbursable] = useState(false);

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
      } else {
        // Set defaults
        const defaultExpenseCat = categories.find(c => c.type === 'expense');
        const defaultIncomeCat = categories.find(c => c.type === 'income');
        const defaultAccount = accounts[0];
        
        if (type === 'expense' && defaultExpenseCat) setCategoryId(defaultExpenseCat.id);
        if (type === 'income' && defaultIncomeCat) setCategoryId(defaultIncomeCat.id);
        if (defaultAccount) setFromAccountId(defaultAccount.id);
        if (accounts.length > 1) setToAccountId(accounts[1].id);
      }
    }
  }, [isOpen, initialTransaction, type, categories, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const selectedCategory = categories.find(c => c.id === categoryId);

    const txData = {
      type,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      categoryId: type !== 'transfer' ? categoryId : undefined,
      fromAccountId: type !== 'income' ? fromAccountId : undefined,
      toAccountId: type !== 'expense' ? toAccountId : undefined,
      note,
      isReimbursable: type === 'expense' && selectedCategory?.name === '交通' ? isReimbursable : undefined
    };

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount === '0' && num !== '.') {
      setAmount(num);
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.')) {
        const [, decimal] = amount.split('.');
        if (decimal && decimal.length >= 2) return;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
        
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
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num)}
                  className={`bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100 ${num === '0' ? 'col-span-2' : ''}`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleDelete}
                className="bg-gray-200 text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-300 flex items-center justify-center"
              >
                <Icons.Delete size={24} />
              </button>
              <button
                type="button"
                onClick={() => setShowNumpad(false)}
                className="col-span-4 bg-emerald-500 text-white text-lg font-bold py-3 rounded-xl shadow-sm active:bg-emerald-600"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
