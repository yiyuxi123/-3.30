import React from 'react';
import * as Icons from 'lucide-react';

interface NumpadProps {
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onComplete: () => void;
}

export default function Numpad({ onNumberClick, onDelete, onClear, onComplete }: NumpadProps) {
  return (
    <div className="bg-gray-50 border-t border-gray-200 p-4 shrink-0 animate-in slide-in-from-bottom-10">
      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={() => onNumberClick('1')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">1</button>
        <button type="button" onClick={() => onNumberClick('2')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">2</button>
        <button type="button" onClick={() => onNumberClick('3')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">3</button>
        <button type="button" onClick={onDelete} className="bg-gray-200 text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-300 flex items-center justify-center"><Icons.Delete size={24} /></button>
        
        <button type="button" onClick={() => onNumberClick('4')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">4</button>
        <button type="button" onClick={() => onNumberClick('5')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">5</button>
        <button type="button" onClick={() => onNumberClick('6')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">6</button>
        <button type="button" onClick={onClear} className="bg-gray-200 text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-300">C</button>
        
        <button type="button" onClick={() => onNumberClick('7')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">7</button>
        <button type="button" onClick={() => onNumberClick('8')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">8</button>
        <button type="button" onClick={() => onNumberClick('9')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">9</button>
        <button type="button" onClick={onComplete} className="row-span-2 bg-emerald-500 text-white text-xl font-bold rounded-xl shadow-sm active:bg-emerald-600 flex items-center justify-center">完成</button>
        
        <button type="button" onClick={() => onNumberClick('.')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">.</button>
        <button type="button" onClick={() => onNumberClick('0')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">0</button>
        <button type="button" onClick={() => onNumberClick('00')} className="bg-white text-xl font-bold text-gray-900 py-4 rounded-xl shadow-sm active:bg-gray-100">00</button>
      </div>
    </div>
  );
}
