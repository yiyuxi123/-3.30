import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Lock, Unlock, Download, Upload, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { passcode, setPasscode } = useStore();
  const [isSettingPasscode, setIsSettingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSetPasscode = () => {
    if (newPasscode.length !== 4 || confirmPasscode.length !== 4) {
      setError('密码必须是4位数字');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setError('两次输入的密码不一致');
      return;
    }
    setPasscode(newPasscode);
    setIsSettingPasscode(false);
    setNewPasscode('');
    setConfirmPasscode('');
    setError('');
  };

  const handleRemovePasscode = () => {
    setPasscode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">设置</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Security Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">安全</h3>
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      {passcode ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">应用锁</p>
                      <p className="text-xs text-gray-500">{passcode ? '已开启' : '未开启'}</p>
                    </div>
                  </div>
                  {passcode ? (
                    <button 
                      onClick={handleRemovePasscode}
                      className="text-sm text-red-500 font-medium hover:text-red-600"
                    >
                      关闭
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsSettingPasscode(true)}
                      className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      开启
                    </button>
                  )}
                </div>

                {isSettingPasscode && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="输入4位数字密码"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg"
                    />
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="再次输入确认"
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg"
                    />
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setIsSettingPasscode(false);
                          setNewPasscode('');
                          setConfirmPasscode('');
                          setError('');
                        }}
                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium"
                      >
                        取消
                      </button>
                      <button 
                        onClick={handleSetPasscode}
                        className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-medium"
                      >
                        确认
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
