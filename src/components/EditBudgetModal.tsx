import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function EditBudgetModal({ onClose }: { onClose: () => void }) {
  const { budgets, updateBudget, addBudget } = useStore();
  const [amount, setAmount] = useState('');

  const totalBudget = budgets.find(b => !b.categoryId);

  useEffect(() => {
    if (totalBudget) {
      setAmount(totalBudget.amount.toString());
    }
  }, [totalBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return;

    if (totalBudget) {
      updateBudget(totalBudget.id, { amount: numAmount });
    } else {
      addBudget({ amount: numAmount, period: 'monthly' });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">设置月度预算</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center border-b-2 border-emerald-500 py-2">
            <span className="text-3xl font-bold text-gray-900 mr-2">¥</span>
            <input 
              type="number" 
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-4xl font-bold text-gray-900 focus:outline-none placeholder-gray-300 bg-transparent"
              autoFocus
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center space-x-2"
          >
            <Check size={20} />
            <span>保存预算</span>
          </button>
        </form>
      </div>
    </div>
  );
}
