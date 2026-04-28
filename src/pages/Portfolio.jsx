import { useState, useEffect } from 'react';
import { Plus, ArrowUpDown, RefreshCw, Download, Upload } from 'lucide-react';
import { useStockData } from '../contexts/StockDataContext';
import { useAccount } from '../contexts/AccountContext';
import { seedDemo } from '../seedDemo';
import { getStocks, getAllEntries } from '../store';
import AddStockModal from '../components/stock/AddStockModal';
import StockCard from '../components/stock/StockCard';
import PortfolioCharts from '../components/layout/PortfolioCharts';
import { PortfolioSkeleton } from '../components/ui/Skeleton';
import { Logo } from '../components/ui/Logo';

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

export default function Portfolio() {
  const isDesktop = useIsDesktop();
  if (isDesktop) return <DesktopPortfolio />;
  return <MobilePortfolio />;
}

// ─── Desktop: Overview page (stock list is in AppShell sidebar) ───

function DesktopPortfolio() {
  const { holdingStocks, stocks, cashBalance, handleSaveCash, loading } = useStockData();
  const { activeAccount } = useAccount();
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');

  if (loading) return <PortfolioSkeleton />;

  const watchCount = stocks.filter(s => s.status === 'watching').length;
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const cashNum = parseFloat(cashBalance);
  const hasCash = !isNaN(cashNum) && cashNum > 0;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Page header */}
      <div className="pb-5 border-b border-[var(--line)] mb-6">
        <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--ink-faint)] mb-1.5">Portfolio · 统计</div>
        <h1 className="font-serif text-[30px] font-semibold tracking-tight leading-tight">
          组合统计
          {activeAccount && (
            <span className="ml-3 font-mono text-[14px] font-normal" style={{ color: 'var(--ink-faint)' }}>
              · {activeAccount.name}
            </span>
          )}
        </h1>
        <div className="mt-1.5 text-[13px] text-[var(--ink-soft)]">
          截至 {dateStr} · {holdingStocks.length} 只持仓{watchCount > 0 ? ` · ${watchCount} 只观察中` : ''}
        </div>
      </div>

      {holdingStocks.length > 0 ? (
        <div>
          {/* Cash row */}
          <CashRow
            cashBalance={cashBalance}
            editingCash={editingCash}
            cashInput={cashInput}
            setCashInput={setCashInput}
            setEditingCash={setEditingCash}
            handleSaveCash={handleSaveCash}
          />
          <PortfolioCharts holdingStocks={holdingStocks} cashBalance={cashBalance} />
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center mx-auto mb-4 text-[var(--ink-faint)]">
            <Logo size={24} />
          </div>
          <p className="text-[var(--ink-soft)] mb-1">还没有持仓股票</p>
          <p className="text-sm text-[var(--ink-faint)]">在左侧添加股票并设为持仓后，这里会显示组合统计</p>
        </div>
      )}
    </div>
  );
}

// ─── Cash Row (shared) ───

function CashRow({ cashBalance, editingCash, cashInput, setCashInput, setEditingCash, handleSaveCash }) {
  const cashNum = parseFloat(cashBalance);
  const hasCash = !isNaN(cashNum) && cashNum > 0;

  return (
    <div className="flex items-baseline justify-between px-4 py-3.5 bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius)] mb-4">
      <div className="text-xs text-[var(--ink-soft)] tracking-wider">现金仓位</div>
      {editingCash ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={cashInput}
            onChange={e => setCashInput(e.target.value)}
            placeholder="输入现金金额"
            className="w-32 px-2 py-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm text-right focus:outline-none focus:border-[var(--accent)]"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') { handleSaveCash(cashInput); setEditingCash(false); }
              if (e.key === 'Escape') setEditingCash(false);
            }}
          />
          <button onClick={() => { handleSaveCash(cashInput); setEditingCash(false); }} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">保存</button>
          <button onClick={() => setEditingCash(false)} className="text-xs text-[var(--ink-faint)] hover:underline cursor-pointer">取消</button>
        </div>
      ) : (
        <button
          onClick={() => { setCashInput(cashBalance); setEditingCash(true); }}
          className="bg-transparent border-0 cursor-pointer transition-colors hover:text-[var(--accent)]"
        >
          {hasCash ? (
            <>
              <span className="font-mono text-lg font-medium tracking-tight">{cashNum.toLocaleString('zh-CN')}</span>
              <span className="text-xs text-[var(--ink-faint)] ml-1">元</span>
            </>
          ) : (
            <span className="text-sm text-[var(--ink-faint)]">点击设置</span>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Mobile: full portfolio page ───

function MobilePortfolio() {
  const {
    stocks, loading, refreshing, holdingStocks, cashBalance,
    latestEntryMap, entryCountMap, priceHistoryMap, fileInputRef,
    handleAdd, handleRefresh, handleExport, handleImport, handleSaveCash,
    setStocks, setEntries, setLoading,
  } = useStockData();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [showAdd, setShowAdd] = useState(false);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');

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

  const tabs = [
    { key: 'all', label: '全部', count: stocks.length },
    { key: 'holding', label: '持仓', count: stocks.filter(s => s.status === 'holding').length },
    { key: 'watching', label: '观察', count: stocks.filter(s => s.status === 'watching').length },
    { key: 'closed', label: '已清仓', count: stocks.filter(s => s.status === 'closed').length },
  ];

  const baseList = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);
  const filtered = [...baseList].sort((a, b) => {
    if (sortBy === 'pnl') return getPnlPct(b) - getPnlPct(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    return getLastActivity(b) - getLastActivity(a);
  });

  if (loading) return <PortfolioSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--ink-faint)] mb-1">My Portfolio</div>
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-[22px] font-semibold tracking-tight">组合总览</h1>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-0"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            <Plus size={12} /> 添加
          </button>
        </div>
      </div>

      {/* Tabs + Sort + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
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
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-[var(--ink-faint)]">
            <ArrowUpDown size={12} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-[var(--ink-faint)] py-0.5">
              <option value="updated">最近活跃</option>
              <option value="pnl">按盈亏</option>
              <option value="name">按名称</option>
            </select>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} title="刷新行情"
            className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-40">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} title="导出"
            className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer">
            <Download size={14} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="导入"
            className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink)] transition-colors cursor-pointer">
            <Upload size={14} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Stock list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center mx-auto mb-4 text-[var(--ink-faint)]">
            <Logo size={24} />
          </div>
          <p className="text-[var(--ink-soft)] mb-1">
            {stocks.length === 0 ? '还没有添加股票' : '这个分类下没有股票'}
          </p>
          <p className="text-sm text-[var(--ink-faint)] mb-4">
            {stocks.length === 0 ? '点击上方「添加」开始跟踪你的投资思考' : '切换筛选条件试试'}
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
              className="text-sm text-[var(--accent)] hover:underline bg-transparent border-0 cursor-pointer"
            >
              或者加载演示数据看看效果
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(stock => (
            <StockCard key={stock.id} stock={stock} latestEntry={latestEntryMap[stock.id]} entryCount={entryCountMap[stock.id] || 0} priceHistory={priceHistoryMap[stock.id]} />
          ))}
        </div>
      )}

      {/* Charts section */}
      {holdingStocks.length > 0 && (
        <div className="mt-8">
          <CashRow
            cashBalance={cashBalance}
            editingCash={editingCash}
            cashInput={cashInput}
            setCashInput={setCashInput}
            setEditingCash={setEditingCash}
            handleSaveCash={handleSaveCash}
          />
          <PortfolioCharts holdingStocks={holdingStocks} cashBalance={cashBalance} />
        </div>
      )}

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} existingCodes={stocks.map(s => s.code)} />}
    </div>
  );
}
