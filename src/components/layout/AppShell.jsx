import { useState, useEffect, useContext, createContext } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowUpDown, RefreshCw, Download, Upload, TrendingUp, ClipboardCheck, LogOut } from 'lucide-react';

// 沉浸写作模式 context
export const ImmersiveContext = createContext({ immersive: false, setImmersive: () => {} });
import SideNav from './SideNav';
import StockCard from '../stock/StockCard';
import AddStockModal from '../stock/AddStockModal';
import { useStockData } from '../../contexts/StockDataContext';
import { PortfolioSkeleton } from '../ui/Skeleton';
import { seedDemo } from '../../seedDemo';
import { getStocks, getAllEntries, isTauri, getStorageMode } from '../../store';
import { supabase } from '../../supabaseClient';
import { LicenseContext } from '../../App';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function AppShell() {
  const isDesktop = useIsDesktop();

  if (isDesktop) return <DesktopShell />;
  return <MobileShell />;
}

// ─── Desktop: SideNav | StockList | Detail ───

function DesktopShell() {
  const location = useLocation();
  const isReview = location.pathname === '/review';
  const [immersive, setImmersive] = useState(false);

  return (
    <ImmersiveContext.Provider value={{ immersive, setImmersive }}>
      <div className="flex h-screen overflow-hidden bg-bg">
        {!immersive && <SideNav />}
        {!isReview && !immersive && <StockListPanel />}
        <main className="flex-1 overflow-y-auto">
          <div className={`p-6 ${immersive ? 'max-w-3xl mx-auto' : 'max-w-4xl'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </ImmersiveContext.Provider>
  );
}

// ─── Mobile: top nav + full page routes ───

function MobileShell() {
  return (
    <div className="min-h-screen">
      <MobileTopNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function MobileTopNav() {
  const licenseStatus = useContext(LicenseContext);
  const isTrial = licenseStatus.status === 'trial';
  const isLocal = isTauri && getStorageMode() === 'local';

  return (
    <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-text no-underline">
          <TrendingUp size={20} className="text-accent" />
          <span className="font-semibold text-base tracking-tight">Follow</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <Link to="/review" className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors" title="复盘">
            <ClipboardCheck size={16} />
          </Link>
          {(!isTauri || !isLocal) && (
            <button onClick={() => supabase.auth.signOut()} className="text-text-tertiary hover:text-text p-2 rounded-lg hover:bg-surface-hover transition-colors" title="退出登录">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Stock List Panel (middle column on desktop) ───

function StockListPanel() {
  const {
    stocks, loading, refreshing, latestEntryMap, entryCountMap, priceHistoryMap,
    handleAdd, handleRefresh, handleExport, handleImport, fileInputRef,
    setStocks, setEntries, setLoading,
  } = useStockData();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which stock is selected from URL
  const stockIdMatch = location.pathname.match(/^\/stock\/(.+)/);
  const selectedStockId = stockIdMatch ? stockIdMatch[1] : null;

  function getPnlPct(s) {
    const cost = parseFloat(s.costPrice);
    const current = parseFloat(s.currentPrice);
    if (isNaN(cost) || isNaN(current) || cost === 0) return -Infinity;
    return (current - cost) / Math.abs(cost) * 100;
  }

  function getLastActivity(s) {
    const entry = latestEntryMap[s.id];
    return entry ? new Date(entry.createdAt).getTime() : new Date(s.updatedAt).getTime();
  }

  const baseList = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);
  const filtered = [...baseList].sort((a, b) => {
    if (sortBy === 'pnl') return getPnlPct(b) - getPnlPct(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    return getLastActivity(b) - getLastActivity(a);
  });

  if (loading) {
    return (
      <div className="w-80 xl:w-96 border-r border-border bg-surface/50 overflow-y-auto shrink-0 p-4">
        <PortfolioSkeleton />
      </div>
    );
  }

  return (
    <div className="w-80 xl:w-96 border-r border-border bg-surface/50 overflow-y-auto shrink-0 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-surface/80 backdrop-blur-sm z-10 px-4 pt-4 pb-2 border-b border-border-light">
        {/* Title + Add */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-semibold">组合总览</h1>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors">
            <Plus size={14} /> 添加
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'holding', label: '持仓' },
            { key: 'watching', label: '观察' },
            { key: 'closed', label: '已清仓' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2 py-1 rounded-md text-xs transition-colors ${
                filter === f.key ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-text-tertiary">
            <ArrowUpDown size={12} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-text-secondary py-0.5">
              <option value="updated">最近活跃</option>
              <option value="pnl">按盈亏</option>
              <option value="name">按名称</option>
            </select>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={handleRefresh} disabled={refreshing} title="刷新行情"
              className="text-text-tertiary hover:text-text-secondary p-1.5 rounded-md hover:bg-surface-hover transition-colors disabled:opacity-40">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExport} title="导出数据"
              className="text-text-tertiary hover:text-text-secondary p-1.5 rounded-md hover:bg-surface-hover transition-colors">
              <Download size={14} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="导入数据"
              className="text-text-tertiary hover:text-text-secondary p-1.5 rounded-md hover:bg-surface-hover transition-colors">
              <Upload size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>
      </div>

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={20} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary mb-1">
              {stocks.length === 0 ? '还没有添加股票' : '这个分类下没有股票'}
            </p>
            {stocks.length === 0 && (
              <button
                onClick={async () => {
                  setLoading(true);
                  await seedDemo();
                  const [s, e] = await Promise.all([getStocks(), getAllEntries()]);
                  setStocks(s);
                  setEntries(e);
                  setLoading(false);
                }}
                className="text-xs text-accent hover:underline mt-2"
              >
                加载演示数据
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(stock => (
              <StockCard
                key={stock.id}
                stock={stock}
                latestEntry={latestEntryMap[stock.id]}
                entryCount={entryCountMap[stock.id] || 0}
                priceHistory={priceHistoryMap[stock.id]}
                compact
                selected={stock.id === selectedStockId}
                onSelect={() => navigate(`/stock/${stock.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
