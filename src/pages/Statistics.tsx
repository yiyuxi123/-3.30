import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, subMonths, addMonths, subYears, addYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector, AreaChart, Area } from 'recharts';
import * as Icons from 'lucide-react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 ease-out"
      />
    </g>
  );
};

export default function Statistics() {
  const { transactions, categories, budgets, accounts } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMetrics, setVisibleMetrics] = useState({
    insights: true,
    category: true,
    trend: true,
    fixedVsVariable: true,
    account: false,
    assetTrend: true,
  });

  const toggleMetric = (key: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [activeIndexCategory, setActiveIndexCategory] = useState<number | undefined>(undefined);
  const [activeIndexFixed, setActiveIndexFixed] = useState<number | undefined>(undefined);
  const [activeIndexAccount, setActiveIndexAccount] = useState<number | undefined>(undefined);

  const { start, end } = useMemo(() => {
    return {
      start: period === 'month' ? startOfMonth(selectedDate) : startOfYear(selectedDate),
      end: period === 'month' ? endOfMonth(selectedDate) : endOfYear(selectedDate)
    };
  }, [period, selectedDate]);

  const handlePrev = () => {
    setSelectedDate(prev => period === 'month' ? subMonths(prev, 1) : subYears(prev, 1));
  };

  const handleNext = () => {
    setSelectedDate(prev => period === 'month' ? addMonths(prev, 1) : addYears(prev, 1));
  };

  const dateLabel = useMemo(() => period === 'month' ? format(selectedDate, 'yyyy年MM月') : format(selectedDate, 'yyyy年'), [period, selectedDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === type && isWithinInterval(d, { start, end });
    });
  }, [transactions, type, start, end]);

  const total = useMemo(() => filteredTransactions.reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);

  // Group by category
  const chartData = useMemo(() => {
    const categoryData = filteredTransactions.reduce((acc, t) => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (!cat) return acc;
      
      if (!acc[cat.id]) {
        acc[cat.id] = { name: cat.name, value: 0, color: cat.color, icon: cat.icon };
      }
      acc[cat.id].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string, value: number, color: string, icon: string }>);

    return Object.values(categoryData).sort((a: any, b: any) => b.value - a.value);
  }, [filteredTransactions, categories]);

  // Trend data for bar chart
  const barData = useMemo(() => {
    const trendData = filteredTransactions.reduce((acc, t) => {
      const key = period === 'month' ? format(parseISO(t.date), 'dd') : format(parseISO(t.date), 'MM');
      if (!acc[key]) acc[key] = { name: key, value: 0 };
      acc[key].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string, value: number }>);

    return Object.values(trendData).sort((a: any, b: any) => Number(a.name) - Number(b.name));
  }, [filteredTransactions, period]);

  // Fixed vs Variable data
  const fixedVsVariableChartData = useMemo(() => {
    const fixedData = filteredTransactions.reduce((acc, t) => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat?.isFixed) {
        acc.fixed += t.amount;
      } else {
        acc.variable += t.amount;
      }
      return acc;
    }, { fixed: 0, variable: 0 });

    return [
      { name: '固定支出', value: fixedData.fixed, color: '#3b82f6' },
      { name: '浮动支出', value: fixedData.variable, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [filteredTransactions, categories]);

  // Account data
  const accountChartData = useMemo(() => {
    const accountData = filteredTransactions.reduce((acc, t) => {
      const accountId = type === 'expense' ? t.fromAccountId : t.toAccountId;
      if (!accountId) return acc;
      const account = accounts.find(a => a.id === accountId);
      if (!account) return acc;
      
      if (!acc[account.id]) {
        acc[account.id] = { name: account.name, value: 0, color: account.color, icon: account.icon };
      }
      acc[account.id].value += t.amount;
      return acc;
    }, {} as Record<string, { name: string, value: number, color: string, icon: string }>);

    return Object.values(accountData).sort((a: any, b: any) => b.value - a.value);
  }, [filteredTransactions, type, accounts]);

  // Insights calculations
  const maxCategory = useMemo(() => chartData.length > 0 ? chartData[0] : null, [chartData]);
  const maxTrend = useMemo(() => barData.length > 0 ? barData.reduce((max, d) => d.value > max.value ? d : max, barData[0]) : null, [barData]);
  const totalBudget = useMemo(() => {
    const baseBudget = budgets.find(b => !b.categoryId)?.amount || 0;
    return period === 'month' ? baseBudget : baseBudget * 12;
  }, [budgets, period]);

  // Total Asset Trend (Past 12 Months)
  const assetTrendData = useMemo(() => {
    const currentTotalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    
    const last12Months = Array.from({ length: 12 }).map((_, i) => {
      return format(subMonths(new Date(), i), 'yyyy-MM');
    }).reverse();

    return last12Months.map(month => {
      const futureNetFlow = transactions
        .filter(t => format(parseISO(t.date), 'yyyy-MM') > month)
        .reduce((sum, t) => {
          if (t.type === 'income') return sum + t.amount;
          if (t.type === 'expense') return sum - t.amount;
          return sum;
        }, 0);
        
      return {
        name: `${parseInt(month.split('-')[1])}月`,
        fullMonth: month,
        value: currentTotalBalance - futureNetFlow
      };
    });
  }, [accounts, transactions]);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">统计分析</h1>
        
        {/* Period & Type Controls */}
        <div className="space-y-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-full max-w-xs mx-auto">
            {(['month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'month' ? '月度统计' : '年度统计'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between bg-white rounded-xl p-2 shadow-sm border border-gray-100">
            <button onClick={handlePrev} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-gray-900">{dateLabel}</span>
            <button onClick={handleNext} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

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

          {/* Metrics Toggles */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button onClick={() => toggleMetric('insights')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.insights ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>智能洞察</button>
            <button onClick={() => toggleMetric('category')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.category ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>分类占比</button>
            <button onClick={() => toggleMetric('trend')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.trend ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>收支趋势</button>
            <button onClick={() => toggleMetric('assetTrend')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.assetTrend ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>资产趋势</button>
            {type === 'expense' && (
              <button onClick={() => toggleMetric('fixedVsVariable')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.fixedVsVariable ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>固定/浮动</button>
            )}
            <button onClick={() => toggleMetric('account')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${visibleMetrics.account ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>账户分布</button>
          </div>
        </div>
      </header>

      {/* Total Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center"
      >
        <p className="text-gray-500 text-sm font-medium mb-2">{period === 'month' ? '本月' : '本年'}总{type === 'expense' ? '支出' : '收入'}</p>
        <h2 className={`text-4xl font-bold ${type === 'expense' ? 'text-gray-900' : 'text-emerald-500'}`}>
          ¥{total.toFixed(2)}
        </h2>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {/* Smart Insights */}
        {visibleMetrics.insights && type === 'expense' && filteredTransactions.length > 0 && (
          <motion.div 
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-sm text-white space-y-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <h3 className="text-lg font-bold">{period === 'month' ? '本月' : '本年'}消费洞察</h3>
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
              
              {maxTrend && (
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <p className="text-indigo-100 text-xs mb-1">📅 最高消费{period === 'month' ? '日' : '月'}</p>
                  <p className="font-medium">
                    <span className="text-xl font-bold">{maxTrend.name}{period === 'month' ? '日' : '月'}</span> 
                    <span className="ml-2">¥{maxTrend.value.toFixed(2)}</span>
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
          </motion.div>
        )}

        {/* Pie Chart */}
        {visibleMetrics.category && (chartData.length > 0 ? (
          <motion.div 
            key="category-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
          >
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
                  activeIndex={activeIndexCategory}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndexCategory(index)}
                  onClick={(_, index) => setActiveIndexCategory(index)}
                  onMouseLeave={() => setActiveIndexCategory(undefined)}
                  isAnimationActive={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`category-cell-${index}`} fill={entry.color} className="outline-none" />
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
        </motion.div>
      ) : (
        <motion.div 
          key="category-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400"
        >
          暂无数据
        </motion.div>
      ))}

      {/* Fixed vs Variable Chart */}
      {visibleMetrics.fixedVsVariable && type === 'expense' && fixedVsVariableChartData.length > 0 && (
        <motion.div 
          key="fixed-variable"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">固定 vs 浮动支出</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fixedVsVariableChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  activeIndex={activeIndexFixed}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndexFixed(index)}
                  onClick={(_, index) => setActiveIndexFixed(index)}
                  onMouseLeave={() => setActiveIndexFixed(undefined)}
                  isAnimationActive={true}
                >
                  {fixedVsVariableChartData.map((entry, index) => (
                    <Cell key={`fixed-cell-${index}`} fill={entry.color} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-2">
            {fixedVsVariableChartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-bold text-gray-900">¥{item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bar Chart */}
      {visibleMetrics.trend && barData.length > 0 && (
        <motion.div 
          key="trend"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">收支趋势</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, type === 'expense' ? '支出' : '收入']}
                  labelFormatter={(label) => `${label}${period === 'month' ? '日' : '月'}`}
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
        </motion.div>
      )}

      {/* Total Asset Trend Chart */}
      {visibleMetrics.assetTrend && (
        <motion.div 
          key="asset-trend"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">总资产趋势 (近12个月)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assetTrendData}>
                <defs>
                  <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }} 
                  minTickGap={20}
                />
                <YAxis 
                  hide 
                  domain={['auto', 'auto']} 
                />
                <Tooltip 
                  formatter={(value: number) => [`¥${value.toFixed(2)}`, '总资产']}
                  labelFormatter={(label, payload) => payload && payload.length > 0 ? payload[0].payload.fullMonth : label}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAsset)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Account Breakdown Chart */}
      {visibleMetrics.account && (accountChartData.length > 0 ? (
        <motion.div 
          key="account-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">账户分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accountChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  activeIndex={activeIndexAccount}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndexAccount(index)}
                  onClick={(_, index) => setActiveIndexAccount(index)}
                  onMouseLeave={() => setActiveIndexAccount(undefined)}
                  isAnimationActive={true}
                >
                  {accountChartData.map((entry, index) => (
                    <Cell key={`account-cell-${index}`} fill={entry.color} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Account List */}
          <div className="mt-4 space-y-3">
            {accountChartData.map((item, index) => {
              const IconComponent = (Icons as any)[item.icon] || Icons.Wallet;
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
        </motion.div>
      ) : (
        <motion.div 
          key="account-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400"
        >
          暂无数据
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
