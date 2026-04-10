import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Account } from '../types';

export default function EditAccountModal({ account, onClose }: { account: Account, onClose: () => void }) {
  const { updateAccount, deleteAccount } = useStore();
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<'cash' | 'bank' | 'alipay' | 'wechat' | 'credit'>(account.type);
  const [balance, setBalance] = useState(Number(account.balance.toFixed(2)).toString());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setName(account.name);
    setType(account.type);
    setBalance(Number(account.balance.toFixed(2)).toString());
    setShowConfirm(false);
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    let icon = 'CreditCard';
    let color = '#3b82f6';
    
    if (type === 'cash') { icon = 'Banknote'; color = '#10b981'; }
    if (type === 'alipay') { icon = 'Smartphone'; color = '#3b82f6'; }
    if (type === 'wechat') { icon = 'MessageCircle'; color = '#22c55e'; }
    if (type === 'credit') { icon = 'CreditCard'; color = '#f59e0b'; }
    if (type === 'bank') { icon = 'Landmark'; color = '#ef4444'; }

    updateAccount(account.id, {
      name,
      type,
      balance: Math.round((Number(balance) || 0) * 100) / 100,
      color,
      icon
    });
    onClose();
  };

  const handleDelete = () => {
    deleteAccount(account.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">编辑账户</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户名称</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：招商银行储蓄卡"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">账户类型</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value as any)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="bank">银行卡</option>
              <option value="cash">现金</option>
              <option value="alipay">支付宝</option>
              <option value="wechat">微信</option>
              <option value="credit">信用卡</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前余额</label>
            <input 
              type="number" 
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center space-x-2"
            >
              <Check size={20} />
              <span>保存修改</span>
            </button>

            {showConfirm ? (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="text-center text-red-500 font-medium text-sm">删除账户将无法恢复，确定删除吗？</p>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    取消
                  </button>
                  <button type="button" onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">
                    确认删除
                  </button>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 size={20} />
                <span>删除账户</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
