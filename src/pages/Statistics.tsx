import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as Icons from 'lucide-react';
import { Sparkles } from 'lucide-react';

export default function Statistics() {
  const { transactions, categories, budgets } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === type && isWithinInterval(d, { start, end });
  });

  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryData = filteredTransactions.reduce((acc, t) => {
    const cat = categories.find(c => c.id === t.categoryId);
    if (!cat) return acc;
    
    if (!acc[cat.id]) {
      acc[cat.id] = { name: cat.name, value: 0, color: cat.color, icon: cat.icon };
    }
    acc[cat.id].value += t.amount;
    return acc;
  }, {} as Record<string, { name: string, value: number, color: string, icon: string }>);

  const chartData = Object.values(categoryData).sort((a, b) => b.value - a.value);

  // Daily data for bar chart
  const dailyData = filteredTransactions.reduce((acc, t) => {
    const day = format(parseISO(t.date), 'dd');
    if (!acc[day]) acc[day] = { name: day, value: 0 };
    acc[day].value += t.amount;
    return acc;
  }, {} as Record<string, { name: string, value: number }>);

  const barData = Object.values(dailyData).sort((a, b) => Number(a.name) - Number(b.name));

  // Insights calculations
  const maxCategory = chartData.length > 0 ? chartData[0] : null;
  const maxDay = barData.length > 0 ? barData.reduce((max, d) => d.value > max.value ? d : max, barData[0]) : null;
  const totalBudget = budgets.find(b => !b.categoryId)?.amount || 0;

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">统计分析</h1>
        
        {/* Type Tabs */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-full max-w-xs mx-auto">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                type === t 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>
      </header>

      {/* Total Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 text-sm font-medium mb-2">本月总{type === 'expense' ? '支出' : '收入'}</p>
        <h2 className={`text-4xl font-bold ${type === 'expense' ? 'text-gray-900' : 'text-emerald-500'}`}>
          ¥{total.toFixed(2)}
        </h2>
      </div>

      {/* Smart Insights */}
      {type === 'expense' && filteredTransactions.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-sm text-white space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="text-lg font-bold">本月消费洞察</h3>
          </div>
          
          <div className="space-y-3">
            {maxCategory && (
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-indigo-100 text-xs mb-1">🔥 最大开销分类</p>
                <p className="font-medium">
                  <span className="text-xl font-bold">{maxCategory.name}</span> 
                  <span className="ml-2">¥{maxCategory.value.toFixed(2)}</span>
                  <span className="text-indigo-200 text-sm ml-2">占 {((maxCategory.value / total) * 100).toFixed(1)}%</span>
                </p>
              </div>
            )}
            
            {maxDay && (
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-indigo-100 text-xs mb-1">📅 最高消费日</p>
                <p className="font-medium">
                  <span className="text-xl font-bold">{maxDay.name}日</span> 
                  <span className="ml-2">¥{maxDay.value.toFixed(2)}</span>
                </p>
              </div>
            )}

            {totalBudget > 0 && (
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-indigo-100 text-xs mb-1">💰 预算健康度</p>
                <p className="font-medium">
                  {total > totalBudget ? (
                    <span className="text-red-300">已超支 ¥{(total - totalBudget).toFixed(2)}，请注意控制！</span>
                  ) : (
                    <span className="text-emerald-300">预算剩余 ¥{(totalBudget - total).toFixed(2)}，继续保持！</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pie Chart */}
      {chartData.length > 0 ? (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">分类占比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="mt-4 space-y-3">
            {chartData.map((item, index) => {
              const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle;
              const percent = ((item.value / total) * 100).toFixed(1);
              
              return (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{percent}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">¥{item.value.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400">
          暂无数据
        </div>
      )}

      {/* Bar Chart */}
      {barData.length > 0 && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">每日趋势</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, type === 'expense' ? '支出' : '收入']}
                  labelFormatter={(label) => `${label}日`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill={type === 'expense' ? '#111827' : '#10b981'} 
                  radius={[4, 4, 0, 0]} 
                  barSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
