import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, LogOut, Settings, HardDrive, Cloud, Key, Sun, Moon, Palette } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { supabase } from '../../supabaseClient';
import { isTauri, getStorageMode, setStorageMode } from '../../store';
import { LicenseContext } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';

const THEME_META = {
  paper: { label: '暖纸', icon: Sun, desc: '明亮温暖' },
  midnight: { label: '夜间', icon: Moon, desc: '深色护眼' },
  kraft: { label: '牛皮纸', icon: Palette, desc: '复古质感' },
};

export default function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const storageMode = getStorageMode();
  const licenseStatus = useContext(LicenseContext);
  const isTrial = licenseStatus.status === 'trial';
  const isLocal = storageMode === 'local';
  const [confirmSwitch, setConfirmSwitch] = useState(null);
  const { theme, setTheme, themes } = useTheme();

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
    <div className="w-16 h-screen flex flex-col items-center py-4 shrink-0 border-r"
      style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="mb-4 bg-transparent border-0 cursor-pointer"
        title="FollowMind"
      >
        <Logo size={22} withBg />
      </button>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-0.5 flex-1">
        <NavItem
          icon={<svg width={18} height={18} viewBox="0 0 32 32" fill="none"><path d="M4 24 C 12 24, 17 14, 26 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/><circle cx="26" cy="9" r="3.5" fill="currentColor"/><circle cx="4" cy="24" r="1.6" fill="currentColor"/></svg>}
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
      <div className="flex flex-col items-center gap-0.5">
        {/* Tauri: trial badge */}
        {isTauri && isTrial && (
          <button
            onClick={() => licenseStatus.showActivation?.()}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-0"
            style={{ color: 'var(--gold)', background: 'transparent' }}
            title={`试用 ${licenseStatus.daysLeft} 天`}
          >
            <Key size={16} />
          </button>
        )}

        {/* Settings */}
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
              <div className="absolute left-full bottom-0 ml-2 z-30 w-56 rounded-xl overflow-hidden border"
                style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)', boxShadow: 'var(--shadow-card)' }}>

                {/* Theme switcher */}
                <div className="p-3 border-b" style={{ borderColor: 'var(--line)' }}>
                  <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--ink-faint)' }}>主题</p>
                  <div className="flex gap-1">
                    {themes.map(t => {
                      const meta = THEME_META[t];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          title={meta.desc}
                          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border-0"
                          style={{
                            background: theme === t ? 'var(--accent-soft)' : 'transparent',
                            color: theme === t ? 'var(--accent)' : 'var(--ink-soft)',
                          }}
                        >
                          <Icon size={14} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Storage (Tauri only) */}
                {isTauri && (
                  <div className="p-3">
                    <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--ink-faint)' }}>数据存储</p>
                    <button
                      onClick={() => { if ('local' !== storageMode) setConfirmSwitch('local'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer border-0"
                      style={{
                        background: isLocal ? 'var(--accent-soft)' : 'transparent',
                        color: isLocal ? 'var(--accent)' : 'var(--ink)',
                      }}
                    >
                      <HardDrive size={14} />
                      <span>本地存储</span>
                      {isLocal && <span className="ml-auto text-xs">✓</span>}
                    </button>
                    <button
                      onClick={() => { if ('cloud' !== storageMode) setConfirmSwitch('cloud'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mt-0.5 cursor-pointer border-0"
                      style={{
                        background: !isLocal ? 'var(--accent-soft)' : 'transparent',
                        color: !isLocal ? 'var(--accent)' : 'var(--ink)',
                      }}
                    >
                      <Cloud size={14} />
                      <span>云端同步</span>
                      {!isLocal && <span className="ml-auto text-xs">✓</span>}
                    </button>
                    {confirmSwitch && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                        <p className="text-xs mb-2" style={{ color: 'var(--ink-soft)' }}>
                          {confirmSwitch === 'local'
                            ? '切换到本地存储后，数据将保存在本机。'
                            : '切换到云端存储后，需要登录账号。'}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmSwitch(null)}
                            className="flex-1 px-2 py-1.5 rounded-md text-xs cursor-pointer border-0"
                            style={{ background: 'transparent', color: 'var(--ink-soft)' }}>取消</button>
                          <button onClick={confirmSwitchStorage}
                            className="flex-1 px-2 py-1.5 rounded-md text-xs cursor-pointer border-0"
                            style={{ background: 'var(--accent)', color: 'var(--bg)' }}>确定切换</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Tauri: no storage section, just close area below theme */}
              </div>
            </>
          )}
        </div>

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
      className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-0 relative"
      style={{
        background: active ? 'var(--bg-sunken)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
      }}
    >
      {active && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full" style={{ background: 'var(--accent)' }} />
      )}
      {icon}
    </button>
  );
}
