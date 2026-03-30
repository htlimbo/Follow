import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const MARKET_KEY = 'follow_market_mode';

export default function Layout() {
  const [isCN, setIsCN] = useState(() => {
    return localStorage.getItem(MARKET_KEY) !== 'us';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('cn-market', isCN);
  }, [isCN]);

  function toggleMarket() {
    const next = !isCN;
    setIsCN(next);
    localStorage.setItem(MARKET_KEY, next ? 'cn' : 'us');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-text no-underline">
            <TrendingUp size={20} className="text-accent" />
            <span className="font-semibold text-base tracking-tight">Follow</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleMarket}
              className="relative w-10 h-[22px] rounded-full transition-colors duration-200 focus:outline-none"
              style={{ backgroundColor: isCN ? '#dc2626' : '#16a34a' }}
              title={isCN ? '点击切换美股' : '点击切换A股'}
            >
              <span
                className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: isCN ? 'translateX(0)' : 'translateX(18px)' }}
              />
            </button>
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
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
