import React, { useState } from 'react';
import { Home, List, PieChart, User, PlusCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Accounts from './pages/Accounts';
import AddTransactionModal from './components/AddTransactionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'statistics' && <Statistics />}
        {activeTab === 'accounts' && <Accounts />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-10 safe-area-pb">
        <NavItem 
          icon={<Home size={24} />} 
          label="首页" 
          isActive={activeTab === 'home'} 
          onClick={() => setActiveTab('home')} 
        />
        <NavItem 
          icon={<List size={24} />} 
          label="明细" 
          isActive={activeTab === 'transactions'} 
          onClick={() => setActiveTab('transactions')} 
        />
        
        {/* Add Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center"
            style={{ backgroundColor: '#10b981' }}
          >
            <PlusCircle size={32} />
          </button>
        </div>

        <NavItem 
          icon={<PieChart size={24} />} 
          label="统计" 
          isActive={activeTab === 'statistics'} 
          onClick={() => setActiveTab('statistics')} 
        />
        <NavItem 
          icon={<User size={24} />} 
          label="资产" 
          isActive={activeTab === 'accounts'} 
          onClick={() => setActiveTab('accounts')} 
        />
      </nav>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <AddTransactionModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 w-16 ${isActive ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
