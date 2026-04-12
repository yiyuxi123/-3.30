import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { auth, db, loginWithGoogle } from '../firebase';
import { useStore } from '../store/useStore';
import { Wallet } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const initialCategories = [
  { name: '餐饮', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
  { name: '交通', type: 'expense', icon: 'Bus', color: '#3b82f6' },
  { name: '购物', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { name: '居住', type: 'expense', icon: 'Home', color: '#10b981' },
  { name: '工资', type: 'income', icon: 'Wallet', color: '#10b981' },
  { name: '理财', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { name: '报销款', type: 'income', icon: 'Receipt', color: '#f59e0b' },
];

const initialAccounts = [
  { name: '现金', type: 'cash', balance: 1000, color: '#10b981', icon: 'Banknote' },
  { name: '支付宝', type: 'alipay', balance: 5000, color: '#3b82f6', icon: 'Smartphone' },
  { name: '微信', type: 'wechat', balance: 3000, color: '#22c55e', icon: 'MessageCircle' },
  { name: '招商银行', type: 'bank', balance: 20000, color: '#ef4444', icon: 'CreditCard' },
];

let isInitializing = false;

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  const { setAccounts, setCategories, setTransactions, setBudgets, setTemplates, setGoals, syncSettings, syncToCloudNow } = useStore();

  useEffect(() => {
    if (user && syncSettings.storageMode === 'cloud' && syncSettings.syncFrequency === 'daily') {
      const now = Date.now();
      const lastSync = syncSettings.lastSyncTime || 0;
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastSync > oneDay) {
        syncToCloudNow().catch(console.error);
      }
    }
  }, [user, syncSettings.storageMode, syncSettings.syncFrequency, syncSettings.lastSyncTime, syncToCloudNow]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && syncSettings.storageMode === 'cloud') {
        // Check if new user and bootstrap
        const userId = currentUser.uid;
        if (!isInitializing) {
          isInitializing = true;
          try {
            const categoriesSnap = await getDocs(collection(db, `users/${userId}/categories`));
            if (categoriesSnap.empty) {
              const localCategories = useStore.getState().categories;
              const localAccounts = useStore.getState().accounts;
              const hasBootstrapped = useStore.getState().hasBootstrapped;
              
              if (localCategories.length > 0 || localAccounts.length > 0) {
                // If user already has local data but cloud is empty, push local data to cloud
                await useStore.getState().syncToCloudNow();
              } else if (!hasBootstrapped) {
                // Bootstrap default data
                const batch = writeBatch(db);
                initialCategories.forEach((cat, index) => {
                  const id = uuidv4();
                  batch.set(doc(db, `users/${userId}/categories`, id), { ...cat, id, userId, order: index });
                });
                initialAccounts.forEach((acc, index) => {
                  const id = uuidv4();
                  batch.set(doc(db, `users/${userId}/accounts`, id), { ...acc, id, userId, order: index });
                });
                batch.set(doc(db, `users/${userId}/budgets`, uuidv4()), { amount: 5000, period: 'monthly', userId });
                await batch.commit();
                useStore.getState().setHasBootstrapped(true);
              }
            }
          } catch (error) {
            console.error("Error during initialization:", error);
          } finally {
            // Keep it true for a short time to prevent immediate re-runs in strict mode
            setTimeout(() => { isInitializing = false; }, 2000);
          }
        }
      }
      
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [syncSettings.storageMode]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    if (syncSettings.storageMode === 'local') return;
    if (syncSettings.syncFrequency !== 'realtime') return;

    const userId = user.uid;

    const unsubAccounts = onSnapshot(collection(db, `users/${userId}/accounts`), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    const unsubCategories = onSnapshot(collection(db, `users/${userId}/categories`), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    const unsubTransactions = onSnapshot(query(collection(db, `users/${userId}/transactions`), orderBy('date', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    const unsubBudgets = onSnapshot(collection(db, `users/${userId}/budgets`), (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    const unsubTemplates = onSnapshot(collection(db, `users/${userId}/templates`), (snapshot) => {
      setTemplates(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    const unsubGoals = onSnapshot(collection(db, `users/${userId}/goals`), (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any)));
    });

    return () => {
      unsubAccounts();
      unsubCategories();
      unsubTransactions();
      unsubBudgets();
      unsubTemplates();
      unsubGoals();
    };
  }, [isAuthReady, user, setAccounts, setCategories, setTransactions, setBudgets, setTemplates, setGoals, syncSettings.storageMode, syncSettings.syncFrequency]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin text-emerald-500">
          <Wallet size={48} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Wallet size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用记账本</h1>
        <p className="text-gray-500 mb-8 text-center max-w-sm">
          记录点滴，理清财务。请登录以同步您的账单数据。
        </p>
        <button
          onClick={loginWithGoogle}
          className="px-8 py-4 bg-white border border-gray-200 rounded-xl shadow-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          <span>使用 Google 账号登录</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
