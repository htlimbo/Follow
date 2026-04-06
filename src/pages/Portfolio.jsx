import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, X, TrendingUp, Eye, Archive, Briefcase, Download, Upload, ArrowUpDown, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getStocks, addStock, getAllEntries, exportData, importData, refreshPrices, searchStock } from '../store';
import { seedDemo } from '../seedDemo';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#6366f1', '#0d9488'];

const STATUS_CONFIG = {
  holding: { label: '持仓', icon: Briefcase, color: 'text-accent', bg: 'bg-accent-light' },
  watching: { label: '观察', icon: Eye, color: 'text-warning', bg: 'bg-warning-light' },
  closed: { label: '已清仓', icon: Archive, color: 'text-text-tertiary', bg: 'bg-surface-hover' },
};

function AddStockModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('holding');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // { code, name, market } | 'not_found'
  const searchTimer = useRef(null);

  function handleCodeChange(val) {
    setCode(val);
    setSearchResult(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = val.trim();
    if (!trimmed) return;
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchStock(trimmed);
        setSearchResult(result || 'not_found');
        if (result) {
          setCode(result.code);
          if (!name.trim()) setName(result.name);
        }
      } catch { setSearchResult('not_found'); }
      finally { setSearching(false); }
    }, 500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), code: code.trim(), status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border shadow-lg w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">添加股票</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">股票代码</label>
            <input type="text" value={code} onChange={e => handleCodeChange(e.target.value)} placeholder="如：300750 或 00700" autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors" />
            {searching && <p className="text-xs text-text-tertiary mt-1">查询中...</p>}
            {searchResult === 'not_found' && <p className="text-xs text-negative mt-1">未找到该股票代码</p>}
            {searchResult && searchResult !== 'not_found' && (
              <p className="text-xs text-positive mt-1">
                {searchResult.name}（{searchResult.market === 'HK' ? '港股' : 'A股'}）
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">股票名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="输入代码后自动填充"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">状态</label>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setStatus(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    status === key ? 'border-accent bg-accent-light text-accent' : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={!name.trim()}
            className="mt-1 w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            添加
          </button>
        </form>
      </div>
    </div>
  );
}

function formatPnl(value) {
  if (value >= 0) return `+${value.toFixed(2)}%`;
  return `${value.toFixed(2)}%`;
}

function formatMoney(value) {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
}

function StockCard({ stock, latestEntry, entryCount }) {
  const cfg = STATUS_CONFIG[stock.status] || STATUS_CONFIG.holding;
  const StatusIcon = cfg.icon;

  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;

  return (
    <Link to={`/stock/${stock.id}`}
      className="block bg-surface rounded-xl border border-border hover:border-border-light hover:shadow-sm transition-all no-underline text-text group">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold">{stock.name}</span>
            {stock.code && <span className="text-xs text-text-tertiary font-mono">{stock.code}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
              <StatusIcon size={12} />
              {cfg.label}
            </span>
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
          </div>
        </div>

        {(hasPrice || hasShares) && (
          <div className="flex items-baseline gap-4 mb-3 flex-wrap">
            {hasPrice && (
              <>
                <span className="text-sm text-text-secondary font-mono">{current.toFixed(2)}</span>
                <span className={`text-sm font-medium ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatPnl(pnlPct)}
                </span>
              </>
            )}
            {pnlAmount !== null && (
              <span className={`text-sm ${pnlAmount >= 0 ? 'text-positive' : 'text-negative'}`}>
                {pnlAmount >= 0 ? '+' : ''}{formatMoney(pnlAmount)}
              </span>
            )}
            {hasShares && (
              <span className="text-xs text-text-tertiary">{shares}股</span>
            )}
          </div>
        )}

        {latestEntry ? (
          <div className="pt-3 border-t border-border-light">
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{latestEntry.content}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-text-tertiary">{formatTime(latestEntry.createdAt)}</span>
              {entryCount > 1 && <span className="text-xs text-text-tertiary">共{entryCount}条记录</span>}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-border-light">
            <p className="text-sm text-text-tertiary italic">还没有思考记录，点击添加</p>
          </div>
        )}
      </div>
    </Link>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  if (hr < 24) return `${hr}小时前`;
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // updated | pnl | name
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, e] = await Promise.all([getStocks(), getAllEntries()]);
        setStocks(s);
        setEntries(e);

        // 自动刷新A股现价
        try {
          const prices = await refreshPrices(s);
          if (Object.keys(prices).length > 0) {
            setStocks(prev => prev.map(stock => {
              const quote = prices[stock.code];
              if (quote && quote.price != null) {
                return { ...stock, currentPrice: String(quote.price) };
              }
              return stock;
            }));
          }
        } catch { /* 行情刷新失败不影响页面加载 */ }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAdd(data) {
    try {
      const stock = await addStock(data);
      setStocks(prev => [stock, ...prev]);
    } catch (err) {
      console.error('Failed to add stock:', err);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const prices = await refreshPrices(stocks);
      if (Object.keys(prices).length > 0) {
        setStocks(prev => prev.map(stock => {
          const quote = prices[stock.code];
          if (quote && quote.price != null) {
            return { ...stock, currentPrice: String(quote.price) };
          }
          return stock;
        }));
      }
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleExport() {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `follow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const ok = await importData(ev.target.result);
      if (ok) {
        const [s, en] = await Promise.all([getStocks(), getAllEntries()]);
        setStocks(s);
        setEntries(en);
      } else {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const latestEntryMap = {};
  const entryCountMap = {};
  entries.forEach(e => {
    if (!latestEntryMap[e.stockId]) latestEntryMap[e.stockId] = e;
    entryCountMap[e.stockId] = (entryCountMap[e.stockId] || 0) + 1;
  });

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

  // Portfolio summary
  const holdingStocks = stocks.filter(s => s.status === 'holding');
  let totalMarketValue = 0;
  let totalCost = 0;
  let totalPnl = 0;
  let hasPnlData = false;

  holdingStocks.forEach(s => {
    const cost = parseFloat(s.costPrice);
    const current = parseFloat(s.currentPrice);
    const shares = parseFloat(s.shares);
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
      totalMarketValue += current * shares;
      totalCost += cost * shares;
      totalPnl += (current - cost) * shares;
      hasPnlData = true;
    }
  });

  const totalAbsCost = Math.abs(totalCost);
  const totalPnlPct = totalAbsCost > 0 ? (totalPnl / totalAbsCost * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-tertiary">加载中...</p>
      </div>
    );
  }

  // Chart data: holding distribution (pie) & per-stock P&L (bar)
  const pieData = [];
  const barData = [];
  holdingStocks.forEach(s => {
    const current = parseFloat(s.currentPrice);
    const shares = parseFloat(s.shares);
    const cost = parseFloat(s.costPrice);
    if (!isNaN(current) && !isNaN(shares) && shares > 0) {
      const mv = current * shares;
      pieData.push({ name: s.name, value: Math.round(mv) });
    }
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
      const pnl = (current - cost) * shares;
      barData.push({ name: s.name, pnl: Math.round(pnl) });
    }
  });
  barData.sort((a, b) => b.pnl - a.pnl);

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
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-text-secondary py-1 pr-1"
            >
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

      {/* Desktop: left-right layout; Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left: Stock list */}
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
                <StockCard key={stock.id} stock={stock} latestEntry={latestEntryMap[stock.id]} entryCount={entryCountMap[stock.id] || 0} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Stats + Charts (only when there are holding stocks with data) */}
        {holdingStocks.length > 0 && (
          <div className="flex flex-col gap-4">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface rounded-xl border border-border p-2.5">
                <p className="text-xs text-text-tertiary mb-1">持仓</p>
                <p className="text-lg font-semibold">{holdingStocks.length}</p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-2.5">
                <p className="text-xs text-text-tertiary mb-1">总市值</p>
                <p className="text-lg font-semibold truncate">
                  {hasPnlData ? formatMoney(totalMarketValue) : '—'}
                </p>
              </div>
              <div className="bg-surface rounded-xl border border-border p-2.5">
                <p className="text-xs text-text-tertiary mb-1">总盈亏</p>
                {hasPnlData ? (
                  <div>
                    <p className={`text-lg font-semibold truncate ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)}
                    </p>
                    <p className={`text-xs ${totalPnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatPnl(totalPnlPct)}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-semibold">—</p>
                )}
              </div>
            </div>

            {/* Pie chart: position distribution */}
            {pieData.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">持仓分布</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={75} innerRadius={40} paddingAngle={2} stroke="none">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {pieData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bar chart: per-stock P&L */}
            {barData.length > 0 && (
              <div className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">个股盈亏</h3>
                <ResponsiveContainer width="100%" height={Math.max(150, barData.length * 36)}>
                  <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
