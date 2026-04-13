import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, LogOut, ClipboardCheck, Settings, HardDrive, Cloud } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { isTauri, getStorageMode, setStorageMode } from '../store';

export default function Layout() {
  const [showSettings, setShowSettings] = useState(false);
  const storageMode = getStorageMode();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function handleSwitchStorage(mode) {
    if (mode === storageMode) return;
    if (mode === 'local') {
      if (!confirm('切换到本地存储后，数据将保存在本机，不再与云端同步。\n\n已有的云端数据不会自动迁移，你可以先导出再导入。\n\n确定切换？')) return;
    } else {
      if (!confirm('切换到云端存储后，需要登录账号，数据将同步到云端。\n\n本地数据不会自动迁移，你可以先导出再导入。\n\n确定切换？')) return;
    }
    setStorageMode(mode);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-text no-underline">
            <TrendingUp size={20} className="text-accent" />
            <span className="font-semibold text-base tracking-tight">Follow</span>
            {isTauri && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-tertiary font-normal">
                {storageMode === 'local' ? '本地' : '云端'}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2.5">
            <Link to="/review" className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors" title="复盘">
              <ClipboardCheck size={16} />
            </Link>
            {isTauri && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  title="设置"
                >
                  <Settings size={16} />
                </button>
                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSettings(false)} />
                    <div className="absolute right-0 top-full mt-1 z-30 w-56 bg-bg border border-border rounded-lg shadow-lg p-3">
                      <p className="text-xs text-text-tertiary mb-2">数据存储方式</p>
                      <button
                        onClick={() => handleSwitchStorage('cloud')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${storageMode === 'cloud' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                      >
                        <Cloud size={14} />
                        <span>云端同步</span>
                        {storageMode === 'cloud' && <span className="ml-auto text-xs">✓</span>}
                      </button>
                      <button
                        onClick={() => handleSwitchStorage('local')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-1 ${storageMode === 'local' ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                      >
                        <HardDrive size={14} />
                        <span>本地存储</span>
                        <span className="ml-auto text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">Pro</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
