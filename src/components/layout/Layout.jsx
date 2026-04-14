import { useContext } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, LogOut, ClipboardCheck, Settings, HardDrive, Cloud, Key } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { isTauri, getStorageMode, setStorageMode } from '../../store';
import { LicenseContext } from '../../App';

export default function Layout() {
  const [showSettings, setShowSettings] = useState(false);
  const storageMode = getStorageMode();
  const licenseStatus = useContext(LicenseContext);
  const isTrial = licenseStatus.status === 'trial';
  const isLocal = storageMode === 'local';

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

  function handleActivate() {
    // 跳转到激活流程：清除 trial 标记让 App 重新检查
    window.location.reload();
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
                {isLocal ? '本地' : '云端'}
              </span>
            )}
            {isTauri && isTrial && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-normal">
                试用 {licenseStatus.daysLeft} 天
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2.5">
            <Link to="/review" className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors" title="复盘">
              <ClipboardCheck size={16} />
            </Link>

            {/* 试用期：显示激活入口 */}
            {isTauri && isTrial && (
              <button
                onClick={handleActivate}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent-light transition-colors"
                title="输入 License Key"
              >
                <Key size={13} /> 激活
              </button>
            )}

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
                        onClick={() => handleSwitchStorage('local')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isLocal ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                      >
                        <HardDrive size={14} />
                        <span>本地存储</span>
                        {isLocal && <span className="ml-auto text-xs">✓</span>}
                      </button>
                      <button
                        onClick={() => handleSwitchStorage('cloud')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-1 ${!isLocal ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                      >
                        <Cloud size={14} />
                        <span>云端同步</span>
                        {!isLocal && <span className="ml-auto text-xs">✓</span>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 云端模式才显示登出按钮 */}
            {(!isTauri || !isLocal) && (
              <button
                onClick={handleLogout}
                className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors"
                title="退出登录"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
