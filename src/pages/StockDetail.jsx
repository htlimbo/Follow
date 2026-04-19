import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Brain } from 'lucide-react';
import ResizeHandle from '../components/ui/ResizeHandle';
import {
  getStock, updateStock, deleteStock,
  getEntries, addEntry, deleteEntry,
  refreshPrices,
} from '../store';
import { ENTRY_TYPES } from '../utils';
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
  const { updateLocalStock, removeLocalStock, addLocalEntry, removeLocalEntry } = useStockData();

  const [stock, setStock] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryFilter, setEntryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [leftPct, setLeftPct] = useState(40); // 左栏默认 40%

  const handleDetailResize = useCallback((delta) => {
    // 根据父容器宽度把 px delta 转换为百分比
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
    const entry = await addEntry({ stockId: id, ...data });
    setEntries(prev => [entry, ...prev]);
    addLocalEntry(entry);
    setShowAddEntry(false);
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* 移动端显示返回箭头，桌面端不需要 */}
          {!isDesktop && (
            <Link to="/" className="text-text-tertiary hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors">
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-semibold">{stock.name}</h1>
            {stock.code && <p className="text-sm text-text-tertiary font-mono">{stock.code}</p>}
          </div>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="text-text-tertiary hover:text-negative p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content */}
      {entries.length > 0 ? (
        isDesktop ? (
          /* 桌面端：可拖拽调整左右宽度 */
          <div id="stock-detail-columns" className="flex gap-0 items-stretch">
            <div className="overflow-y-auto shrink-0" style={{ width: `${leftPct}%` }}>
              <div className="pr-3">
                <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
                <AnchorsCard stockId={id} />
              </div>
            </div>

            <ResizeHandle onResize={handleDetailResize} />

            <div className="flex-1 min-w-0 pl-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">思考时间线</h2>
                {!showAddEntry && (
                  <button onClick={() => setShowAddEntry(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-light transition-colors">
                    <Plus size={14} /> 记录想法
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 mb-4 flex-wrap">
                <button onClick={() => setEntryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    entryFilter === 'all' ? 'bg-accent-light text-accent font-medium' : 'text-text-tertiary hover:bg-surface-hover'
                  }`}>
                  全部
                </button>
                {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
                  const count = entries.filter(e => e.type === key).length;
                  if (count === 0) return null;
                  return (
                    <button key={key} onClick={() => setEntryFilter(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        entryFilter === key ? `${cfg.bg} ${cfg.color} font-medium` : 'text-text-tertiary hover:bg-surface-hover'
                      }`}>
                      {cfg.label} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>

              {showAddEntry && <AddEntryForm onAdd={handleAddEntry} onCancel={() => setShowAddEntry(false)} stock={stock} />}

              <div className="mt-2">
                {(entryFilter === 'all' ? entries : entries.filter(e => e.type === entryFilter)).map(entry => (
                  <TimelineEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 移动端：上下堆叠 */
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <div>
              <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
              <AnchorsCard stockId={id} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">思考时间线</h2>
                {!showAddEntry && (
                  <button onClick={() => setShowAddEntry(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-light transition-colors">
                    <Plus size={14} /> 记录想法
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 mb-4 flex-wrap">
                <button onClick={() => setEntryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    entryFilter === 'all' ? 'bg-accent-light text-accent font-medium' : 'text-text-tertiary hover:bg-surface-hover'
                  }`}>
                  全部
                </button>
                {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
                  const count = entries.filter(e => e.type === key).length;
                  if (count === 0) return null;
                  return (
                    <button key={key} onClick={() => setEntryFilter(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        entryFilter === key ? `${cfg.bg} ${cfg.color} font-medium` : 'text-text-tertiary hover:bg-surface-hover'
                      }`}>
                      {cfg.label} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>

              {showAddEntry && <AddEntryForm onAdd={handleAddEntry} onCancel={() => setShowAddEntry(false)} stock={stock} />}

              <div className="mt-2">
                {(entryFilter === 'all' ? entries : entries.filter(e => e.type === entryFilter)).map(entry => (
                  <TimelineEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <div>
          <ResearchCard stock={stock} onSave={handleSaveResearch} onClose={handleClosePosition} />
          <AnchorsCard stockId={id} />

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">思考时间线</h2>
          </div>

          {showAddEntry ? (
            <AddEntryForm onAdd={handleAddEntry} onCancel={() => setShowAddEntry(false)} stock={stock} />
          ) : (
            <div className="bg-surface rounded-xl border border-border-light p-8 text-center">
              <Brain size={36} className="text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-1">还没有思考记录</p>
              <p className="text-xs text-text-tertiary mb-4">记录每一次判断和操作背后的想法，这是投资复盘最有价值的部分</p>
              <button onClick={() => setShowAddEntry(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
                <Plus size={14} /> 写下第一条想法
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-surface rounded-xl border border-border shadow-lg w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-text-secondary mb-5">删除「{stock.name}」及其所有思考记录？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">取消</button>
              <button onClick={handleDeleteStock} className="px-4 py-2 rounded-lg bg-negative text-white text-sm font-medium hover:opacity-90 transition-opacity">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
