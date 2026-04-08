import React, { useState } from 'react';
import { Home, List, PieChart, User, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics from './pages/Statistics';
import Accounts from './pages/Accounts';
import AddTransactionModal from './components/AddTransactionModal';
import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -10, scale: 0.98 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };

  return (
    <FirebaseProvider>
      <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-full pb-24"
          >
            {activeTab === 'home' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'statistics' && <Statistics />}
            {activeTab === 'accounts' && <Accounts />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200/50 px-6 py-3 flex justify-between items-center z-10 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
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
        <div className="relative -top-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-500 text-white p-4 rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center justify-center"
          >
            <PlusCircle size={32} />
          </motion.button>
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
      <AnimatePresence>
        {isAddModalOpen && (
          <AddTransactionModal 
            key="add-transaction-modal"
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
          />
        )}
      </AnimatePresence>
      </div>
    </FirebaseProvider>
  );
}

const NavItem = React.memo(function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 w-16 transition-colors duration-200 ${isActive ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <motion.div
        animate={{ 
          y: isActive ? -2 : 0,
          scale: isActive ? 1.1 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[10px] font-medium transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
});
