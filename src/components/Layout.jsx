import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Layout() {
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
          <button
            onClick={handleLogout}
            className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
