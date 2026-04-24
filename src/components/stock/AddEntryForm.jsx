import { useState, useContext } from 'react';
import { Plus, Brain, ShoppingCart, LogOut, RefreshCw, Shield, Camera, Tag, Maximize2, Minimize2 } from 'lucide-react';
import { ENTRY_TYPES, LOGIC_TAGS, formatPnl } from '../../utils';
import { ImmersiveContext } from '../layout/AppShell';

const ENTRY_ICONS = {
  thought: Brain,
  buy: ShoppingCart,
  sell: LogOut,
  adjust: RefreshCw,
  discipline: Shield,
};

export default function AddEntryForm({ onAdd, onCancel, stock, defaultType }) {
  const [type, setType] = useState(defaultType || 'thought');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [snapshotEnabled, setSnapshotEnabled] = useState(false);
  const immersiveCtx = useContext(ImmersiveContext);
  const immersive = immersiveCtx?.immersive || false;
  const setImmersive = immersiveCtx?.setImmersive;

  function toggleTag(key) {
    setSelectedTags(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  }

  function addCustomTag() {
    const tag = customTag.trim().replace(/^#/, '');
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setCustomTag('');
    setShowTagInput(false);
  }

  function buildSnapshot() {
    if (!stock) return null;
    const cost = parseFloat(stock.costPrice);
    const current = parseFloat(stock.currentPrice);
    const shares = parseFloat(stock.shares);
    const snapshot = { currentPrice: stock.currentPrice, date: new Date().toISOString() };
    if (!isNaN(cost) && cost !== 0 && !isNaN(current)) {
      snapshot.costPrice = stock.costPrice;
      snapshot.pnlPct = ((current - cost) / Math.abs(cost) * 100).toFixed(2);
    }
    if (!isNaN(shares) && shares > 0) {
      snapshot.shares = stock.shares;
      if (!isNaN(cost) && !isNaN(current)) {
        snapshot.pnlAmount = ((current - cost) * shares).toFixed(2);
      }
    }
    return snapshot;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const data = { type, content: content.trim(), price: price.trim() };
    if ((type === 'buy' || type === 'sell') && quantity.trim()) {
      data.quantity = quantity.trim();
    }
    if (selectedTags.length > 0) data.logicTags = selectedTags;
    if (snapshotEnabled) data.snapshotData = buildSnapshot();
    if (setImmersive) setImmersive(false);
    onAdd(data);
    setContent('');
    setPrice('');
    setQuantity('');
    setType('thought');
    setSelectedTags([]);
    setSnapshotEnabled(false);
  }

  function handleCancel() {
    if (setImmersive) setImmersive(false);
    onCancel();
  }

  const currentPrice = stock ? parseFloat(stock.currentPrice) : NaN;
  const costPrice = stock ? parseFloat(stock.costPrice) : NaN;
  const hasPriceInfo = !isNaN(currentPrice) && currentPrice > 0;
  const hasPnl = hasPriceInfo && !isNaN(costPrice) && costPrice !== 0;
  const pnlPct = hasPnl ? ((currentPrice - costPrice) / Math.abs(costPrice) * 100) : null;

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-raised)] rounded-[var(--radius-lg)] border border-[color-mix(in_oklch,var(--accent)_30%,var(--line))] p-4 mb-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
          const Icon = ENTRY_ICONS[key];
          return (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border-0 ${
                type === key ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-transparent text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]'
              }`}>
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Live data panel */}
      {hasPriceInfo && (
        <div className="flex items-center gap-4 px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-sunken)] mb-3 text-xs">
          <span className="text-[var(--ink-faint)]">现价</span>
          <span className="font-mono font-medium">{currentPrice.toFixed(2)}</span>
          {hasPnl && (
            <>
              <span className="text-[var(--ink-faint)]">盈亏</span>
              <span className={`font-medium ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatPnl(pnlPct)}
              </span>
            </>
          )}
          {stock.shares && parseFloat(stock.shares) > 0 && (
            <>
              <span className="text-[var(--ink-faint)]">持仓</span>
              <span className="font-mono">{stock.shares}股</span>
            </>
          )}
        </div>
      )}

      {/* Text input */}
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={immersive ? 12 : 3} autoFocus
        placeholder={type === 'thought' ? '记录此刻的想法...' : type === 'buy' ? '为什么在这个位置买入？' : type === 'sell' ? '为什么卖出？回头看这个决定...' : type === 'adjust' ? '判断发生了什么变化？' : '执行了什么纪律？'}
        className={`w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-serif leading-relaxed focus:outline-none focus:border-[var(--accent)] mb-3 ${immersive ? 'resize-y' : 'resize-none'}`} />

      {(type === 'buy' || type === 'sell') && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input type="text" value={price} onChange={e => setPrice(e.target.value)}
            placeholder={`${type === 'buy' ? '买入' : '卖出'}价格`}
            className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
          <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)}
            placeholder={`${type === 'buy' ? '买入' : '卖出'}股数`}
            className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
        </div>
      )}

      {/* Logic tags */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <Tag size={12} className="text-[var(--ink-faint)]" />
        {LOGIC_TAGS.map(tag => (
          <button key={tag.key} type="button" onClick={() => toggleTag(tag.key)}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors cursor-pointer border-0 ${
              selectedTags.includes(tag.key)
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                : 'bg-transparent text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]'
            }`}>
            {tag.label}
          </button>
        ))}
        {selectedTags.filter(t => !LOGIC_TAGS.some(lt => lt.key === t)).map(t => (
          <button key={t} type="button" onClick={() => toggleTag(t)}
            className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-sunken)] text-[var(--ink-soft)] font-medium cursor-pointer border-0">
            #{t}
          </button>
        ))}
        {showTagInput ? (
          <input type="text" value={customTag} onChange={e => setCustomTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } if (e.key === 'Escape') setShowTagInput(false); }}
            onBlur={addCustomTag}
            placeholder="自定义标签"
            autoFocus
            className="w-20 px-1.5 py-0.5 rounded-[var(--radius)] border border-[var(--line)] text-xs focus:outline-none focus:border-[var(--accent)]" />
        ) : (
          <button type="button" onClick={() => setShowTagInput(true)}
            className="px-1.5 py-0.5 rounded-full text-xs text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)] cursor-pointer border-0 bg-transparent">
            +自定义
          </button>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!content.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer border-0"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
          <Plus size={14} /> 记录
        </button>
        {hasPriceInfo && (
          <button type="button" onClick={() => setSnapshotEnabled(!snapshotEnabled)}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer border-0 ${
              snapshotEnabled ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-transparent text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]'
            }`}>
            <Camera size={13} /> 存证
          </button>
        )}
        {setImmersive && (
          <button type="button" onClick={() => setImmersive(!immersive)}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer border-0 ${
              immersive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-transparent text-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]'
            }`}>
            {immersive ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {immersive ? '退出沉浸' : '沉浸写作'}
          </button>
        )}
        <button type="button" onClick={handleCancel}
          className="px-4 py-2 rounded-full text-sm text-[var(--ink-soft)] bg-transparent border-0 cursor-pointer hover:text-[var(--ink)] transition-colors">
          取消
        </button>
      </div>
    </form>
  );
}
