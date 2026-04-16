import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, ClipboardCheck, LogOut, Settings, HardDrive, Cloud, Key } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { isTauri, getStorageMode, setStorageMode } from '../../store';
import { LicenseContext } from '../../App';

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const storageMode = getStorageMode();
  const licenseStatus = useContext(LicenseContext);
  const isTrial = licenseStatus.status === 'trial';
  const isLocal = storageMode === 'local';
  const [confirmSwitch, setConfirmSwitch] = useState(null);

  const isPortfolio = location.pathname === '/' || location.pathname.startsWith('/stock/');
  const isReview = location.pathname === '/review';

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function confirmSwitchStorage() {
    if (confirmSwitch) {
      setStorageMode(confirmSwitch);
      setConfirmSwitch(null);
    }
  }

  return (
    <div className="w-14 h-screen bg-surface border-r border-border flex flex-col items-center py-4 shrink-0">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-6 hover:bg-accent/20 transition-colors"
      >
        <TrendingUp size={18} className="text-accent" />
      </button>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        <NavItem
          icon={<TrendingUp size={18} />}
          active={isPortfolio}
          onClick={() => navigate('/')}
          tooltip="组合总览"
        />
        <NavItem
          icon={<ClipboardCheck size={18} />}
          active={isReview}
          onClick={() => navigate('/review')}
          tooltip="阶段复盘"
        />
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        {/* Tauri: trial badge */}
        {isTauri && isTrial && (
          <button
            onClick={() => licenseStatus.showActivation?.()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors"
            title={`试用 ${licenseStatus.daysLeft} 天`}
          >
            <Key size={16} />
          </button>
        )}

        {/* Settings (Tauri only) */}
        {isTauri && (
          <div className="relative">
            <NavItem
              icon={<Settings size={18} />}
              active={showSettings}
              onClick={() => setShowSettings(!showSettings)}
              tooltip="设置"
            />
            {showSettings && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => { setShowSettings(false); setConfirmSwitch(null); }} />
                <div className="absolute left-full bottom-0 ml-2 z-30 w-56 bg-surface border border-border rounded-lg shadow-lg p-3">
                  <p className="text-xs text-text-tertiary mb-2">数据存储方式</p>
                  <button
                    onClick={() => { if ('local' !== storageMode) setConfirmSwitch('local'); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isLocal ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                  >
                    <HardDrive size={14} />
                    <span>本地存储</span>
                    {isLocal && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => { if ('cloud' !== storageMode) setConfirmSwitch('cloud'); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-1 ${!isLocal ? 'bg-accent/10 text-accent' : 'text-text hover:bg-surface-hover'}`}
                  >
                    <Cloud size={14} />
                    <span>云端同步</span>
                    {!isLocal && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  {confirmSwitch && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-text-secondary mb-2">
                        {confirmSwitch === 'local'
                          ? '切换到本地存储后，数据将保存在本机。'
                          : '切换到云端存储后，需要登录账号。'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmSwitch(null)} className="flex-1 px-2 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-hover">取消</button>
                        <button onClick={confirmSwitchStorage} className="flex-1 px-2 py-1.5 rounded-md text-xs bg-accent text-white hover:bg-accent-hover">确定切换</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Logout */}
        {(!isTauri || !isLocal) && (
          <NavItem
            icon={<LogOut size={18} />}
            onClick={handleLogout}
            tooltip="退出登录"
          />
        )}
      </div>
    </div>
  );
}

function NavItem({ icon, active, onClick, tooltip }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
        active
          ? 'bg-accent/10 text-accent'
          : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
      }`}
    >
      {icon}
    </button>
  );
}
