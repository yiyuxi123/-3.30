import React, { useState } from 'react';
import { X, Plus, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as Icons from 'lucide-react';
import EditCategoryModal from './EditCategoryModal';
import { Category } from '../types';

export default function CategoryManagementModal({ onClose }: { onClose: () => void }) {
  const { categories } = useStore();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">分类管理</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex space-x-2 bg-gray-50">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                type === t 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'expense' ? '支出分类' : '收入分类'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCategories.map(cat => {
            const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
            return (
              <div 
                key={cat.id}
                onClick={() => setEditingCategory(cat)}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <IconComponent size={24} />
                  </div>
                  <span className="font-bold text-gray-900">{cat.name}</span>
                </div>
                <Settings size={20} className="text-gray-400" />
              </div>
            );
          })}
          
          <button 
            onClick={() => setEditingCategory('new')}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium flex items-center justify-center space-x-2 hover:bg-gray-50 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
          >
            <Plus size={20} />
            <span>添加新分类</span>
          </button>
        </div>
      </div>

      {editingCategory && (
        <EditCategoryModal 
          category={editingCategory === 'new' ? null : editingCategory} 
          defaultType={type}
          onClose={() => setEditingCategory(null)} 
        />
      )}
    </div>
  );
}
