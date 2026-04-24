import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Brain, Edit3, ShoppingCart, LogOut } from 'lucide-react';
import ResizeHandle from '../components/ui/ResizeHandle';
import Sparkline from '../components/ui/Sparkline';
import {
  getStock, updateStock, deleteStock,
  getEntries, addEntry, deleteEntry,
  refreshPrices,
} from '../store';
import { ENTRY_TYPES, formatMoney } from '../utils';
import { useStockData } from '../contexts/StockDataContext';
import ResearchCard from '../components/stock/ResearchCard';
import AnchorsCard from '../components/stock/AnchorsCard';
import AddEntryForm from '../components/stock/AddEntryForm';
import TimelineEntry from '../components/stock/TimelineEntry';
import { StockDetailSkeleton } from '../components/ui/Skeleton';

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

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { updateLocalStock, removeLocalStock, addLocalEntry, removeLocalEntry, priceHistoryMap } = useStockData();

  const [stock, setStock] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [defaultEntryType, setDefaultEntryType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryFilter, setEntryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [leftPct, setLeftPct] = useState(40);

  const handleDetailResize = useCallback((delta) => {
    const container = document.getElementById('stock-detail-columns');
    if (!container) return;
    const pctDelta = (delta / container.offsetWidth) * 100;
    setLeftPct(prev => Math.max(25, Math.min(65, prev + pctDelta)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setStock(null);
    setEntries([]);
    setEntryFilter('all');
    setShowAddEntry(false);

    async function load() {
      try {
        const s = await getStock(id);
        if (!s) { navigate('/'); return; }
        setStock(s);
        const e = await getEntries(id);
        setEntries(e);
        try {
          const prices = await refreshPrices([s]);
          const quote = prices[s.code];
          if (quote && quote.price != null) {
            const newPrice = String(quote.price);
            setStock(prev => prev ? { ...prev, currentPrice: newPrice } : prev);
            updateLocalStock(s.id, { currentPrice: newPrice });
          }
        } catch { /* 行情刷新失败不影响页面 */ }
      } catch (err) {
        console.error('Failed to load stock:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate, updateLocalStock]);

  if (loading) return <StockDetailSkeleton />;
  if (!stock) return null;

  // Price calculations
  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;
  const marketValue = !isNaN(current) && hasShares ? current * shares : null;
  const isGain = pnlPct !== null && pnlPct >= 0;
  const priceHistory = priceHistoryMap?.[id];
  const hasSparkline = priceHistory && priceHistory.length >= 2;

  async function handleSaveResearch(updates) {
    const updated = await updateStock(id, updates);
    setStock(updated);
    updateLocalStock(id, updates);
  }

  async function handleClosePosition({ content, price }) {
    const entry = await addEntry({ stockId: id, type: 'sell', content, price });
    setEntries(prev => [entry, ...prev]);
    addLocalEntry(entry);
  }

  async function handleAddEntry(data) {
    const { quantity, ...entryData } = data;
    const entry = await addEntry({ stockId: id, ...entryData });
    setEntries(prev => [entry, ...prev]);
    addLocalEntry(entry);

    // Auto-update position when buy/sell has price + quantity
    const tradePrice = parseFloat(data.price);
    const tradeQty = parseFloat(quantity);
    if ((data.type === 'buy' || data.type === 'sell') && !isNaN(tradePrice) && !isNaN(tradeQty) && tradeQty > 0) {
      const oldShares = parseFloat(stock.shares) || 0;
      const oldCost = parseFloat(stock.costPrice) || 0;
      let newShares, newCost;
      if (data.type === 'buy') {
        newShares = oldShares + tradeQty;
        newCost = newShares > 0 ? (oldCost * oldShares + tradePrice * tradeQty) / newShares : tradePrice;
      } else {
        newShares = Math.max(0, oldShares - tradeQty);
        newCost = oldCost; // 卖出不改变成本价
      }
      const updates = {
        shares: String(newShares),
        costPrice: String(parseFloat(newCost.toFixed(4))),
      };
      // 全部卖出自动清仓
      if (data.type === 'sell' && newShares === 0) {
        updates.status = 'closed';
      }
      const updated = await updateStock(id, updates);
      setStock(updated);
      updateLocalStock(id, updates);
    }

    setShowAddEntry(false);
    setDefaultEntryType(null);
  }

  async function handleDeleteEntry(entryId) {
    await deleteEntry(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
    removeLocalEntry(entryId);
  }

  async function handleDeleteStock() {
    await deleteStock(id);
    removeLocalStock(id);
    navigate('/');
  }

  // Filtered entries
  const filteredEntries = entryFilter === 'all' ? entries : entries.filter(e => e.type === entryFilter);

  // Detail header (shared)
  const detailHeader = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-3">
            {!isDesktop && (
              <Link to="/" className="text-[var(--ink-faint)] hover:text-[var(--ink)] p-1 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors">
                <ArrowLeft size={18} />
              </Link>
            )}
            <h1 className="font-serif text-2xl font-semibold tracking-tight">{stock.name}</h1>
          </div>
          {stock.code && (
            <div className="font-mono text-xs text-[var(--ink-faint)] mt-1 tracking-wider">
              {stock.code}
            </div>
          )}
        </div>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] hover:text-[var(--loss)] transition-colors cursor-pointer">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Stats row: 3 columns with vertical separators */}
      {hasPrice && (
        <div className="grid grid-cols-3 gap-0 mt-4 py-4 border-b border-[var(--line)]">
          <div className="px-3 first:pl-0 border-r border-[var(--line)]">
            <div className="text-[11px] text-[var(--ink-faint)] tracking-widest uppercase">成本价</div>
            <div className="font-mono text-base mt-1">{cost.toFixed(hasDecimal(stock.costPrice) ? 3 : 2)}</div>
          </div>
          <div className="px-3 border-r border-[var(--line)]">
            <div className="text-[11px] text-[var(--ink-faint)] tracking-widest uppercase">现价</div>
            <div className="font-mono text-base mt-1 flex items-baseline gap-1.5">
              {current.toFixed(2)}
              {pnlPct !== null && (
                <span className={`text-xs ${isGain ? 'text-positive' : 'text-negative'}`}>
                  {isGain ? '+' : ''}{pnlPct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="px-3">
            <div className="text-[11px] text-[var(--ink-faint)] tracking-widest uppercase">持仓数量</div>
            <div className="font-mono text-base mt-1">
              {hasShares ? shares : '—'}
              {hasShares && <span className="text-xs text-[var(--ink-faint)] ml-1">股</span>}
            </div>
          </div>
        </div>
      )}

      {/* P&L callout */}
      {pnlAmount !== null && (
        <div className={`mt-4 px-5 py-4 rounded-[var(--radius)] flex items-center justify-between gap-4 border ${
          isGain
            ? 'bg-[linear-gradient(135deg,var(--gain-soft),transparent)] border-[color-mix(in_oklch,var(--gain)_25%,var(--line))]'
            : 'bg-[linear-gradient(135deg,var(--loss-soft),transparent)] border-[color-mix(in_oklch,var(--loss)_25%,var(--line))]'
        }`}>
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] tracking-widest uppercase text-[var(--ink-faint)]">盈亏金额</div>
            <div className={`font-mono text-[22px] font-medium ${isGain ? 'text-positive' : 'text-negative'}`}>
              {isGain ? '+' : ''}{formatMoney(pnlAmount)}
            </div>
          </div>
          {hasSparkline && (
            <div className="flex-1 h-[38px] max-w-[160px]">
              <Sparkline data={priceHistory} positive={isGain} height={38} />
            </div>
          )}
          {marketValue !== null && (
            <div className="flex flex-col gap-0.5 text-right">
              <div className="text-[11px] tracking-widest uppercase text-[var(--ink-faint)]">持仓市值</div>
              <div className="font-mono text-[22px] font-medium">{formatMoney(marketValue)}</div>
            </div>
          )}
        </div>
      )}

      {/* Quick trade actions */}
      {stock.status === 'holding' && (
        <div className="flex gap-2 mt-4">
          <button onClick={() => { setDefaultEntryType('buy'); setShowAddEntry(true); }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius)] text-xs font-medium cursor-pointer border transition-colors"
            style={{ borderColor: 'color-mix(in oklch, var(--gain) 40%, var(--line))', color: 'var(--gain)', background: 'var(--gain-soft)' }}>
            <ShoppingCart size={13} /> 买入
          </button>
          <button onClick={() => { setDefaultEntryType('sell'); setShowAddEntry(true); }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius)] text-xs font-medium cursor-pointer border transition-colors"
            style={{ borderColor: 'color-mix(in oklch, var(--loss) 40%, var(--line))', color: 'var(--loss)', background: 'var(--loss-soft)' }}>
            <LogOut size={13} /> 卖出
          </button>
        </div>
      )}
    </>
  );

  // Timeline section (shared)
  const timelineSection = (
    <div>
      {/* Timeline header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[11px] tracking-widest uppercase text-[var(--ink-faint)]">Think Journal</div>
          <div className="font-serif text-lg font-semibold">思考时间线</div>
        </div>
        {!showAddEntry && (
          <button onClick={() => setShowAddEntry(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--accent)] text-[var(--accent)] text-xs bg-transparent hover:bg-[var(--accent-soft)] transition-colors cursor-pointer">
            <Plus size={12} /> 记录想法
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-0.5 text-xs mb-4 pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
        <button onClick={() => setEntryFilter('all')}
          className="px-2.5 py-1 rounded-full border-0 cursor-pointer transition-colors"
          style={entryFilter === 'all'
            ? { background: 'var(--bg-sunken)', color: 'var(--ink)' }
            : { background: 'transparent', color: 'var(--ink-soft)' }
          }>
          全部<span className="ml-1 font-mono text-[11px] opacity-60">{entries.length}</span>
        </button>
        {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
          const count = entries.filter(e => e.type === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setEntryFilter(key)}
              className="px-2.5 py-1 rounded-full border-0 cursor-pointer transition-colors"
              style={entryFilter === key
                ? { background: 'var(--bg-sunken)', color: 'var(--ink)' }
                : { background: 'transparent', color: 'var(--ink-soft)' }
              }>
              {cfg.label}<span className="ml-1 font-mono text-[11px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {showAddEntry && <AddEntryForm onAdd={handleAddEntry} onCancel={() => { setShowAddEntry(false); setDefaultEntryType(null); }} stock={stock} defaultType={defaultEntryType} />}

      {/* Timeline entries */}
      <div className="relative pl-[22px]">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--line)]" />
        {filteredEntries.map(entry => (
          <TimelineEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {entries.length > 0 ? (
        isDesktop ? (
          <div id="stock-detail-columns" className="flex gap-0 items-stretch">
            {/* Left: Detail + Research */}
            <div className="overflow-y-auto shrink-0" style={{ width: `${leftPct}%` }}>
              <div className="pr-3">
                {detailHeader}
                <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
                <AnchorsCard stockId={id} />
              </div>
            </div>
            <ResizeHandle onResize={handleDetailResize} />
            {/* Right: Timeline */}
            <div className="flex-1 min-w-0 pl-6">
              {timelineSection}
            </div>
          </div>
        ) : (
          <div>
            {detailHeader}
            <div className="mt-6">
              <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
              <AnchorsCard stockId={id} />
            </div>
            <div className="mt-6">
              {timelineSection}
            </div>
          </div>
        )
      ) : (
        <div>
          {detailHeader}
          <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
          <AnchorsCard stockId={id} />

          <div className="font-serif text-sm font-semibold mt-7 mb-2.5">思考时间线</div>

          {showAddEntry ? (
            <AddEntryForm onAdd={handleAddEntry} onCancel={() => { setShowAddEntry(false); setDefaultEntryType(null); }} stock={stock} defaultType={defaultEntryType} />
          ) : (
            <div className="bg-[var(--bg-raised)] rounded-[var(--radius-lg)] border border-[var(--line)] p-8 text-center">
              <Brain size={36} className="text-[var(--ink-faint)] mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-soft)] mb-1">还没有思考记录</p>
              <p className="text-xs text-[var(--ink-faint)] mb-4">记录每一次判断和操作背后的想法，这是投资复盘最有价值的部分</p>
              <button onClick={() => setShowAddEntry(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border-0"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                <Plus size={14} /> 写下第一条想法
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.2_0.02_60/0.35)] backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[var(--bg-raised)] rounded-[var(--radius-lg)] border border-[var(--line)] shadow-lg w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-[var(--ink-soft)] mb-5">删除「{stock.name}」及其所有思考记录？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-full text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] bg-transparent border-0 cursor-pointer transition-colors">取消</button>
              <button onClick={handleDeleteStock} className="px-4 py-2 rounded-full bg-[var(--loss)] text-white text-sm font-medium hover:opacity-90 transition-opacity border-0 cursor-pointer">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hasDecimal(str) {
  return str && str.includes('.') && str.split('.')[1]?.length > 2;
}
