import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Wallet, CreditCard, Smartphone, MessageCircle, Banknote, Download } from 'lucide-react';
import * as Icons from 'lucide-react';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import CategoryManagementModal from '../components/CategoryManagementModal';
import { Account } from '../types';
import { format, parseISO } from 'date-fns';

export default function Accounts() {
  const { accounts, transactions, categories } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const exportToCSV = (filename: string, rows: string[][]) => {
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeCSV = (str: string | undefined) => `"${String(str || '').replace(/"/g, '""')}"`;

  const handleExportTransactions = () => {
    const headers = ['交易ID', '类型', '金额', '日期', '分类', '付款账户', '收款账户', '备注'];
    const rows = transactions.map(t => {
      const category = categories.find(c => c.id === t.categoryId)?.name || '';
      const fromAcc = accounts.find(a => a.id === t.fromAccountId)?.name || '';
      const toAcc = accounts.find(a => a.id === t.toAccountId)?.name || '';
      return [
        escapeCSV(t.id),
        escapeCSV(t.type === 'expense' ? '支出' : t.type === 'income' ? '收入' : '转账'),
        escapeCSV(t.amount.toString()),
        escapeCSV(format(parseISO(t.date), 'yyyy-MM-dd HH:mm:ss')),
        escapeCSV(category),
        escapeCSV(fromAcc),
        escapeCSV(toAcc),
        escapeCSV(t.note)
      ];
    });
    exportToCSV(`transactions_${format(new Date(), 'yyyyMMdd')}.csv`, [headers, ...rows]);
  };

  const handleExportAccounts = () => {
    const headers = ['账户ID', '账户名称', '类型', '当前余额'];
    const rows = accounts.map(a => [
      escapeCSV(a.id),
      escapeCSV(a.name),
      escapeCSV(a.type === 'cash' ? '现金' : a.type === 'bank' ? '银行卡' : a.type === 'alipay' ? '支付宝' : a.type === 'wechat' ? '微信' : '信用卡'),
      escapeCSV(a.balance.toString())
    ]);
    exportToCSV(`accounts_${format(new Date(), 'yyyyMMdd')}.csv`, [headers, ...rows]);
  };

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="pt-4 pb-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">资产管理</h1>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="p-2 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Net Worth Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg text-white">
        <p className="text-emerald-100 text-sm font-medium mb-1">净资产 (CNY)</p>
        <h2 className="text-4xl font-bold mb-6">¥{totalBalance.toFixed(2)}</h2>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-400/30">
          <div>
            <p className="text-emerald-100 text-xs font-medium mb-1">总资产</p>
            <p className="text-lg font-bold">¥{totalAssets.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-emerald-100 text-xs font-medium mb-1">总负债</p>
            <p className="text-lg font-bold">¥{totalLiabilities.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">我的账户</h3>
        
        <div className="grid grid-cols-1 gap-3">
          {accounts.map(account => {
            const IconComponent = (Icons as any)[account.icon] || Icons.Wallet;
            
            return (
              <div 
                key={account.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedAccount(account)}
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-inner"
                    style={{ backgroundColor: account.color }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{account.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${account.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    ¥{account.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-gray-900">系统设置</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Icons.Tags size={24} className="text-purple-500" />
            <span className="text-sm font-medium">分类管理</span>
          </button>
          <button 
            onClick={handleExportTransactions}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download size={24} className="text-emerald-500" />
            <span className="text-sm font-medium">导出账单</span>
          </button>
          <button 
            onClick={handleExportAccounts}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Download size={24} className="text-blue-500" />
            <span className="text-sm font-medium">导出资产</span>
          </button>
        </div>
      </div>

      {isAddOpen && <AddAccountModal onClose={() => setIsAddOpen(false)} />}
      {isCategoryOpen && <CategoryManagementModal onClose={() => setIsCategoryOpen(false)} />}
      {selectedAccount && <EditAccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} />}
    </div>
  );
}
