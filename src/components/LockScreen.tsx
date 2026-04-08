import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Lock, Delete } from 'lucide-react';
import { motion } from 'motion/react';

export default function LockScreen() {
  const { passcode, isLocked, unlock } = useStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
      if (input === passcode) {
        unlock();
        setInput('');
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 500);
      }
    }
  }, [input, passcode, unlock]);

  if (!isLocked || !passcode) return null;

  const handleNumberClick = (num: string) => {
    if (input.length < 4) {
      setInput(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-emerald-500 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center w-full max-w-xs"
      >
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <Lock size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-8">输入密码解锁</h1>
        
        <motion.div 
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex space-x-4 mb-12"
        >
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-colors ${
                i < input.length ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-4 w-full px-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="w-16 h-16 rounded-full bg-white/10 text-white text-2xl font-medium hover:bg-white/20 active:bg-white/30 transition-colors mx-auto flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-full bg-white/10 text-white text-2xl font-medium hover:bg-white/20 active:bg-white/30 transition-colors mx-auto flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-white/10 text-white text-2xl font-medium hover:bg-white/20 active:bg-white/30 transition-colors mx-auto flex items-center justify-center"
          >
            <Delete size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
