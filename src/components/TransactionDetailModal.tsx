import React, { useState } from 'react';
import { X, Trash2, Calendar, Tag, CreditCard, AlignLeft, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import * as Icons from 'lucide-react';

export default function TransactionDetailModal({ transaction, onClose }: { transaction: Transaction | null, onClose: () => void }) {
  const { deleteTransaction, categories, accounts } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const fromAccount = accounts.find(a => a.id === transaction.fromAccountId);
  const toAccount = accounts.find(a => a.id === transaction.toAccountId);
  const IconComponent = category ? (Icons as any)[category.icon] : Icons.ArrowRightLeft;

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    onClose();
  };

  const typeLabel = transaction.type === 'expense' ? '支出' : transaction.type === 'income' ? '收入' : '转账';
  const typeColor = transaction.type === 'expense' ? 'text-gray-900' : transaction.type === 'income' ? 'text-emerald-500' : 'text-blue-500';
  const sign = transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        
        {/* Top decorative bar */}
        <div className={`h-3 w-full ${transaction.type === 'expense' ? 'bg-gray-800' : transaction.type === 'income' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">账单详情</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white mb-4 shadow-inner ring-4 ring-gray-50"
              style={{ backgroundColor: transaction.type === 'transfer' ? '#6b7280' : category?.color || '#9ca3af' }}
            >
              {IconComponent && <IconComponent size={36} strokeWidth={1.5} />}
            </div>
            <p className="text-gray-500 font-medium mb-2 flex items-center space-x-1">
              <Tag size={14} />
              <span>{transaction.type === 'transfer' ? '转账' : category?.name || '未知分类'}</span>
              {transaction.isReimbursable && (
                <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-sm font-medium">可报销</span>
              )}
            </p>
            <h3 className={`text-5xl font-bold tracking-tight ${typeColor}`}>
              {sign}¥{transaction.amount.toFixed(2)}
            </h3>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 mb-8 border border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <Calendar size={18} />
                <span className="text-sm">记录时间</span>
              </div>
              <span className="text-gray-900 font-medium">{format(parseISO(transaction.date), 'yyyy-MM-dd HH:mm')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <Tag size={18} />
                <span className="text-sm">交易类型</span>
              </div>
              <span className="text-gray-900 font-medium">{typeLabel}</span>
            </div>

            {transaction.type === 'transfer' ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <CreditCard size={18} />
                  <span className="text-sm">转账路径</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-900 font-medium">
                  <span>{fromAccount?.name || '-'}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                  <span>{toAccount?.name || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <CreditCard size={18} />
                  <span className="text-sm">{transaction.type === 'expense' ? '付款账户' : '收款账户'}</span>
                </div>
                <span className="text-gray-900 font-medium">{transaction.type === 'expense' ? fromAccount?.name : toAccount?.name || '-'}</span>
              </div>
            )}

            {transaction.note && (
              <div className="flex justify-between items-start pt-3 mt-3 border-t border-gray-200/60">
                <div className="flex items-center space-x-2 text-gray-500 mt-0.5 shrink-0">
                  <AlignLeft size={18} />
                  <span className="text-sm">备注</span>
                </div>
                <span className="text-gray-900 font-medium text-right max-w-[60%] break-words">{transaction.note}</span>
              </div>
            )}
          </div>

          {showConfirm ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-center text-red-500 font-medium mb-2 text-sm">删除后将退回账户余额，确定删除吗？</p>
              <div className="flex space-x-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  取消
                </button>
                <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                  确认删除
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full py-4 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 size={20} />
              <span>删除记录</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
