import React from 'react';
import { X, Cloud, HardDrive, RefreshCw, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { syncSettings, setSyncSettings, syncToCloudNow, pullFromCloud } = useStore();

  const handleManualSync = async () => {
    await syncToCloudNow();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">同步设置</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Storage Mode */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">数据存储位置</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (syncSettings.storageMode === 'local') {
                    if (window.confirm('切换到云端同步可能会覆盖您在本地未同步的数据。建议先导出备份。是否继续？')) {
                      setSyncSettings({ storageMode: 'cloud' });
                    }
                  } else {
                    setSyncSettings({ storageMode: 'cloud' });
                  }
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                  syncSettings.storageMode === 'cloud' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-100 bg-white text-gray-500 hover:border-emerald-200'
                }`}
              >
                <Cloud size={28} />
                <span className="font-medium">云端同步 (Firestore)</span>
              </button>
              <button
                onClick={() => setSyncSettings({ storageMode: 'local' })}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                  syncSettings.storageMode === 'local' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-100 bg-white text-gray-500 hover:border-blue-200'
                }`}
              >
                <HardDrive size={28} />
                <span className="font-medium">仅本地 (Localhost)</span>
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {syncSettings.storageMode === 'cloud' 
                ? '数据将安全地保存在云端，支持多设备同步。' 
                : '数据仅保存在当前设备，卸载应用或清空缓存会导致数据丢失。'}
            </p>
          </div>

          {/* Sync Frequency */}
          {syncSettings.storageMode === 'cloud' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">同步频率</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSyncSettings({ syncFrequency: 'realtime' })}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                    syncSettings.syncFrequency === 'realtime' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-emerald-200'
                  }`}
                >
                  <RefreshCw size={28} />
                  <span className="font-medium">实时同步</span>
                </button>
                <button
                  onClick={() => setSyncSettings({ syncFrequency: 'daily' })}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 transition-all ${
                    syncSettings.syncFrequency === 'daily' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-100 bg-white text-gray-500 hover:border-orange-200'
                  }`}
                >
                  <Clock size={28} />
                  <span className="font-medium">手动/每日同步</span>
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {syncSettings.syncFrequency === 'realtime' 
                  ? '任何修改都会立即同步到云端。' 
                  : '修改将暂存本地，您可以手动点击下方按钮同步。'}
              </p>
            </div>
          )}

          {/* Manual Sync Buttons */}
          {(syncSettings.storageMode === 'local' || syncSettings.syncFrequency === 'daily') && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">手动云端同步</h3>
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    await pullFromCloud();
                    alert('从云端拉取成功！');
                  }}
                  className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Cloud size={20} />
                  <span>从云端拉取</span>
                </button>
                <button
                  onClick={handleManualSync}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={20} />
                  <span>推送到云端</span>
                </button>
              </div>
              {syncSettings.storageMode === 'local' && (
                <p className="text-xs text-gray-400">
                  即使在本地模式下，您也可以手动将数据备份到云端或从云端恢复。
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
