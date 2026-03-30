import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, X, TrendingUp, Eye, Archive, Briefcase, Download, Upload } from 'lucide-react';
import { getStocks, addStock, getAllEntries, exportData, importData } from '../store';

const STATUS_CONFIG = {
  holding: { label: '持仓', icon: Briefcase, color: 'text-accent', bg: 'bg-accent-light' },
  watching: { label: '观察', icon: Eye, color: 'text-warning', bg: 'bg-warning-light' },
  closed: { label: '已清仓', icon: Archive, color: 'text-text-tertiary', bg: 'bg-surface-hover' },
};

function AddStockModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('holding');

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
            <label className="block text-sm text-text-secondary mb-1.5">股票名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="如：宁德时代" autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">股票代码</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="如：300750"
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

function StockCard({ stock, latestEntry }) {
  const cfg = STATUS_CONFIG[stock.status] || STATUS_CONFIG.holding;
  const StatusIcon = cfg.icon;

  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost > 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / cost * 100) : null;
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
            <p className="text-xs text-text-tertiary mt-1.5">{formatTime(latestEntry.createdAt)}</p>
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
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, e] = await Promise.all([getStocks(), getAllEntries()]);
        setStocks(s);
        setEntries(e);
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

  const filtered = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);

  const latestEntryMap = {};
  entries.forEach(e => {
    if (!latestEntryMap[e.stockId]) latestEntryMap[e.stockId] = e;
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
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost > 0 && shares > 0) {
      totalMarketValue += current * shares;
      totalCost += cost * shares;
      totalPnl += (current - cost) * shares;
      hasPnlData = true;
    }
  });

  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-tertiary">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      {holdingStocks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface rounded-xl border border-border p-3.5">
            <p className="text-xs text-text-tertiary mb-1">持仓数量</p>
            <p className="text-xl font-semibold">{holdingStocks.length}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3.5">
            <p className="text-xs text-text-tertiary mb-1">总市值</p>
            <p className="text-xl font-semibold">
              {hasPnlData ? formatMoney(totalMarketValue) : '—'}
            </p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-3.5">
            <p className="text-xs text-text-tertiary mb-1">总盈亏</p>
            {hasPnlData ? (
              <div>
                <p className={`text-xl font-semibold ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)}
                </p>
                <p className={`text-xs ${totalPnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatPnl(totalPnlPct)}
                </p>
              </div>
            ) : (
              <p className="text-xl font-semibold">—</p>
            )}
          </div>
        </div>
      )}

      {/* Header + filter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'holding', label: '持仓' },
            { key: 'watching', label: '观察' },
            { key: 'closed', label: '已清仓' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
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

      {/* Stock list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-text-tertiary" />
          </div>
          <p className="text-text-secondary mb-1">
            {stocks.length === 0 ? '还没有添加股票' : '这个分类下没有股票'}
          </p>
          <p className="text-sm text-text-tertiary">
            {stocks.length === 0 ? '点击上方「添加」开始跟踪你的投资思考' : '切换筛选条件试试'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(stock => (
            <StockCard key={stock.id} stock={stock} latestEntry={latestEntryMap[stock.id]} />
          ))}
        </div>
      )}

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
