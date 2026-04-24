import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowUpDown, RefreshCw, Download, Upload, ClipboardCheck, LogOut } from 'lucide-react';
import { Logo, Wordmark } from '../ui/Logo';

// 沉浸写作模式 context
export const ImmersiveContext = createContext({ immersive: false, setImmersive: () => {} });
import SideNav from './SideNav';
import StockCard from '../stock/StockCard';
import AddStockModal from '../stock/AddStockModal';
import ResizeHandle from '../ui/ResizeHandle';
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
  const [listWidth, setListWidth] = useState(320); // 默认 320px

  const handleListResize = useCallback((delta) => {
    setListWidth(prev => Math.max(240, Math.min(480, prev + delta)));
  }, []);

  return (
    <ImmersiveContext.Provider value={{ immersive, setImmersive }}>
      <div className="flex h-screen overflow-hidden bg-bg">
        {!immersive && <SideNav />}
        {!isReview && !immersive && (
          <>
            <StockListPanel width={listWidth} />
            <ResizeHandle onResize={handleListResize} />
          </>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className={`p-6 ${immersive ? 'max-w-3xl mx-auto' : ''}`}>
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
          <Wordmark />
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

function StockListPanel({ width }) {
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
      <div style={{ width }} className="border-r border-border bg-surface/50 overflow-y-auto shrink-0 p-4">
        <PortfolioSkeleton />
      </div>
    );
  }

  const tabs = [
    { key: 'all', label: '全部', count: stocks.length },
    { key: 'holding', label: '持仓', count: stocks.filter(s => s.status === 'holding').length },
    { key: 'watching', label: '观察', count: stocks.filter(s => s.status === 'watching').length },
    { key: 'closed', label: '已清仓', count: stocks.filter(s => s.status === 'closed').length },
  ];

  return (
    <div style={{ width }} className="border-r border-[var(--line)] bg-[var(--bg)] overflow-hidden shrink-0 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 flex flex-col gap-3.5 border-b border-[var(--line)]">
        {/* Title + Add */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] tracking-widest uppercase text-[var(--ink-faint)]">My Portfolio</div>
            <h2 className="font-serif text-[22px] font-semibold tracking-tight leading-tight">组合总览</h2>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            <Plus size={12} /> 添加
          </button>
        </div>

        {/* Pill tabs with counts */}
        <div className="flex gap-0.5 text-[13px]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors cursor-pointer border-0"
              style={filter === t.key
                ? { background: 'var(--ink)', color: 'var(--bg)' }
                : { background: 'transparent', color: 'var(--ink-soft)' }
              }>
              {t.label}
              <span className={`text-[11px] font-mono ${filter === t.key ? 'opacity-70' : 'opacity-60'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Sort + actions */}
        <div className="flex items-center justify-between text-xs text-[var(--ink-faint)]">
          <div className="flex items-center gap-1 cursor-pointer">
            <ArrowUpDown size={12} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer text-[var(--ink-faint)] text-xs py-0.5">
              <option value="updated">最近活跃</option>
              <option value="pnl">按盈亏</option>
              <option value="name">按名称</option>
            </select>
          </div>
          <div className="inline-flex gap-0.5">
            <button onClick={handleRefresh} disabled={refreshing} title="刷新行情"
              className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-40">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExport} title="导出数据"
              className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer">
              <Download size={14} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="导入数据"
              className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer">
              <Upload size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>
      </div>

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[var(--line)]">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3 text-text-tertiary">
              <Logo size={20} />
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
          <div className="flex flex-col gap-0.5">
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

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} existingCodes={stocks.map(s => s.code)} />}
    </div>
  );
}
