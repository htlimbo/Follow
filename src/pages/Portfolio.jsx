import { useState, useEffect } from 'react';
import { Plus, TrendingUp, ArrowUpDown, RefreshCw, Download, Upload } from 'lucide-react';
import { useStockData } from '../contexts/StockDataContext';
import { seedDemo } from '../seedDemo';
import { getStocks, getAllEntries } from '../store';
import AddStockModal from '../components/stock/AddStockModal';
import StockCard from '../components/stock/StockCard';
import PortfolioCharts from '../components/layout/PortfolioCharts';
import { PortfolioSkeleton } from '../components/ui/Skeleton';

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

// ─── Desktop: only charts + cash (stock list is in AppShell) ───

function DesktopPortfolio() {
  const { holdingStocks, cashBalance, handleSaveCash, loading } = useStockData();
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');

  if (loading) return <PortfolioSkeleton />;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">组合统计</h2>

      {holdingStocks.length > 0 ? (
        <div>
          {/* 现金仓位编辑 */}
          <div className="bg-surface rounded-xl border border-border p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">现金仓位</span>
              {editingCash ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={cashInput}
                    onChange={e => setCashInput(e.target.value)}
                    placeholder="输入现金金额"
                    className="w-32 px-2 py-1 rounded-lg border border-border text-sm text-right focus:outline-none focus:border-accent"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') { handleSaveCash(cashInput); setEditingCash(false); }
                      if (e.key === 'Escape') setEditingCash(false);
                    }}
                  />
                  <button onClick={() => { handleSaveCash(cashInput); setEditingCash(false); }} className="text-xs text-accent hover:underline">保存</button>
                  <button onClick={() => setEditingCash(false)} className="text-xs text-text-tertiary hover:underline">取消</button>
                </div>
              ) : (
                <button
                  onClick={() => { setCashInput(cashBalance); setEditingCash(true); }}
                  className="text-sm font-medium text-text hover:text-accent transition-colors"
                >
                  {cashBalance && parseFloat(cashBalance) > 0
                    ? `${parseFloat(cashBalance).toLocaleString('zh-CN')} 元`
                    : '点击设置'}
                </button>
              )}
            </div>
          </div>
          <PortfolioCharts holdingStocks={holdingStocks} cashBalance={cashBalance} />
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-text-tertiary" />
          </div>
          <p className="text-text-secondary mb-1">还没有持仓股票</p>
          <p className="text-sm text-text-tertiary">在左侧添加股票并设为持仓后，这里会显示组合统计</p>
        </div>
      )}
    </div>
  );
}

// ─── Mobile: full portfolio page (original layout) ───

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

  const baseList = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);
  const filtered = [...baseList].sort((a, b) => {
    if (sortBy === 'pnl') return getPnlPct(b) - getPnlPct(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    return getLastActivity(b) - getLastActivity(a);
  });

  if (loading) return <PortfolioSkeleton />;

  return (
    <div>
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'holding', label: '持仓' },
            { key: 'watching', label: '观察' },
            { key: 'closed', label: '已清仓' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-text-tertiary">
            <ArrowUpDown size={13} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-text-secondary py-1 pr-1">
              <option value="updated">最近活跃</option>
              <option value="pnl">按盈亏</option>
              <option value="name">按名称</option>
            </select>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} title="刷新行情"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-40">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} title="导出数据"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Download size={16} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="导入数据"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Upload size={16} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
            <Plus size={16} /> 添加
          </button>
        </div>
      </div>

      {/* Stock list + Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-text-tertiary" />
              </div>
              <p className="text-text-secondary mb-1">
                {stocks.length === 0 ? '还没有添加股票' : '这个分类下没有股票'}
              </p>
              <p className="text-sm text-text-tertiary mb-4">
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
                  className="text-sm text-accent hover:underline"
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
        </div>

        {holdingStocks.length > 0 && (
          <div>
            <div className="bg-surface rounded-xl border border-border p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">现金仓位</span>
                {editingCash ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={cashInput} onChange={e => setCashInput(e.target.value)} placeholder="输入现金金额"
                      className="w-32 px-2 py-1 rounded-lg border border-border text-sm text-right focus:outline-none focus:border-accent"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') { handleSaveCash(cashInput); setEditingCash(false); }
                        if (e.key === 'Escape') setEditingCash(false);
                      }}
                    />
                    <button onClick={() => { handleSaveCash(cashInput); setEditingCash(false); }} className="text-xs text-accent hover:underline">保存</button>
                    <button onClick={() => setEditingCash(false)} className="text-xs text-text-tertiary hover:underline">取消</button>
                  </div>
                ) : (
                  <button onClick={() => { setCashInput(cashBalance); setEditingCash(true); }} className="text-sm font-medium text-text hover:text-accent transition-colors">
                    {cashBalance && parseFloat(cashBalance) > 0 ? `${parseFloat(cashBalance).toLocaleString('zh-CN')} 元` : '点击设置'}
                  </button>
                )}
              </div>
            </div>
            <PortfolioCharts holdingStocks={holdingStocks} cashBalance={cashBalance} />
          </div>
        )}
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
