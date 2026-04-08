import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Wallet, CreditCard, Smartphone, MessageCircle, Banknote, Download } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import CategoryManagementModal from '../components/CategoryManagementModal';
import GoalModal from '../components/GoalModal';
import { Account, SavingGoal } from '../types';
import { format, parseISO } from 'date-fns';

export default function Accounts() {
  const { accounts, transactions, categories } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

  const { totalBalance, totalAssets, totalLiabilities } = useMemo(() => {
    let balance = 0;
    let assets = 0;
    let liabilities = 0;
    accounts.forEach(a => {
      balance += a.balance;
      if (a.balance > 0) assets += a.balance;
      if (a.balance < 0) liabilities += Math.abs(a.balance);
    });
    return { totalBalance: balance, totalAssets: assets, totalLiabilities: liabilities };
  }, [accounts]);

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
    const headers = ['交易ID', '类型', '金额', '日期', '分类', '付款账户', '收款账户', '备注', '标签'];
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
        escapeCSV(t.note),
        escapeCSV(t.tags ? t.tags.join(', ') : '')
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

  const handleBackup = () => {
    const data = {
      accounts,
      transactions,
      categories,
      version: 1,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money_tracker_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.accounts && data.transactions && data.categories) {
          if (window.confirm('恢复数据将覆盖当前所有数据，确定要继续吗？')) {
            try {
              const { firestoreService } = await import('../services/firestoreService');
              await firestoreService.restoreData(data);
              alert('数据恢复成功！');
            } catch (err) {
              console.error('Restore failed:', err);
              alert('数据恢复失败，请检查网络或权限。');
            }
          }
        } else {
          alert('无效的备份文件格式。');
        }
      } catch (error) {
        alert('读取备份文件失败，请确保文件格式正确。');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (window.confirm('警告：此操作将清空所有账户、账单和分类数据，且不可恢复！确定要继续吗？')) {
      if (window.confirm('再次确认：您真的要清空所有数据吗？')) {
        try {
          const { firestoreService } = await import('../services/firestoreService');
          await firestoreService.clearAllData();
          alert('所有数据已清空。');
        } catch (err) {
          console.error('Clear failed:', err);
          alert('清空数据失败，请检查网络或权限。');
        }
      }
    }
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
          {accounts.map((account, index) => {
            const IconComponent = (Icons as any)[account.icon] || Icons.Wallet;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                key={account.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer transition-all"
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
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">存钱目标</h3>
          <button 
            onClick={() => setIsAddGoalOpen(true)}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            添加目标
          </button>
        </div>
        
        {useStore(state => state.goals || []).length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icons.Target size={24} className="text-emerald-500" />
            </div>
            <p className="text-gray-500 text-sm">还没有存钱目标，定个小目标吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {useStore(state => state.goals || []).map((goal, index) => {
              const IconComponent = (Icons as any)[goal.icon] || Icons.Target;
              const linkedAccount = goal.accountId ? accounts.find(a => a.id === goal.accountId) : null;
              const currentAmount = linkedAccount ? linkedAccount.balance : goal.currentAmount;
              const percent = Math.min(100, Math.max(0, (currentAmount / goal.targetAmount) * 100));
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  key={goal.id} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all"
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-inner"
                        style={{ backgroundColor: goal.color }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{goal.name}</h4>
                        {goal.deadline && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            目标日期: {goal.deadline.split('T')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">¥{currentAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">/ ¥{goal.targetAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-gray-900">系统设置</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCategoryOpen(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
          >
            <Icons.Tags size={24} className="text-purple-500" />
            <span className="text-sm font-medium">分类管理</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const { templates, deleteTemplate } = useStore.getState();
              if (templates && templates.length > 0) {
                const templateNames = templates.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
                const idToDelete = prompt(`当前有以下模板：\n${templateNames}\n\n请输入要删除的模板编号 (1-${templates.length})，或点击取消：`);
                if (idToDelete) {
                  const index = parseInt(idToDelete) - 1;
                  if (index >= 0 && index < templates.length) {
                    deleteTemplate(templates[index].id);
                    alert('模板已删除');
                  } else {
                    alert('无效的编号');
                  }
                }
              } else {
                alert('暂无快捷记账模板');
              }
            }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
          >
            <Icons.Zap size={24} className="text-yellow-500" />
            <span className="text-sm font-medium">模板管理</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportTransactions}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
          >
            <Download size={24} className="text-emerald-500" />
            <span className="text-sm font-medium">导出账单</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportAccounts}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
          >
            <Download size={24} className="text-blue-500" />
            <span className="text-sm font-medium">导出资产</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackup}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
          >
            <Icons.Save size={24} className="text-indigo-500" />
            <span className="text-sm font-medium">备份数据</span>
          </motion.button>
          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleRestore} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              title="恢复数据"
            />
            <motion.div 
              whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              className="bg-white h-full p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700"
            >
              <Icons.Upload size={24} className="text-orange-500" />
              <span className="text-sm font-medium">恢复数据</span>
            </motion.div>
          </div>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearAll}
            className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center justify-center space-y-2 transition-all text-red-600 hover:bg-red-50"
          >
            <Icons.Trash2 size={24} className="text-red-500" />
            <span className="text-sm font-medium">清空数据</span>
          </motion.button>
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              import('../firebase').then(({ logout }) => logout());
            }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-2 transition-all text-gray-700 hover:bg-gray-50"
          >
            <Icons.LogOut size={24} className="text-gray-500" />
            <span className="text-sm font-medium">退出登录</span>
          </motion.button>
        </div>
      </div>

      {isAddOpen && <AddAccountModal onClose={() => setIsAddOpen(false)} />}
      {isCategoryOpen && <CategoryManagementModal onClose={() => setIsCategoryOpen(false)} />}
      {selectedAccount && <EditAccountModal account={selectedAccount} onClose={() => setSelectedAccount(null)} />}
      <GoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
      <GoalModal isOpen={!!selectedGoal} onClose={() => setSelectedGoal(null)} goal={selectedGoal} />
    </div>
  );
}
