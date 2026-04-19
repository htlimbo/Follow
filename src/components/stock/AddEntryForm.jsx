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

export default function AddEntryForm({ onAdd, onCancel, stock }) {
  const [type, setType] = useState('thought');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
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
    if (selectedTags.length > 0) data.logicTags = selectedTags;
    if (snapshotEnabled) data.snapshotData = buildSnapshot();
    if (setImmersive) setImmersive(false);
    onAdd(data);
    setContent('');
    setPrice('');
    setType('thought');
    setSelectedTags([]);
    setSnapshotEnabled(false);
  }

  function handleCancel() {
    if (setImmersive) setImmersive(false);
    onCancel();
  }

  // 当前股价信息
  const currentPrice = stock ? parseFloat(stock.currentPrice) : NaN;
  const costPrice = stock ? parseFloat(stock.costPrice) : NaN;
  const hasPriceInfo = !isNaN(currentPrice) && currentPrice > 0;
  const hasPnl = hasPriceInfo && !isNaN(costPrice) && costPrice !== 0;
  const pnlPct = hasPnl ? ((currentPrice - costPrice) / Math.abs(costPrice) * 100) : null;

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-accent/30 p-4 mb-4">
      {/* 类型选择 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
          const Icon = ENTRY_ICONS[key];
          return (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                type === key ? `${cfg.bg} ${cfg.color}` : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* 实时数据面板 */}
      {hasPriceInfo && (
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-bg mb-3 text-xs">
          <span className="text-text-tertiary">现价</span>
          <span className="font-mono font-medium">{currentPrice.toFixed(2)}</span>
          {hasPnl && (
            <>
              <span className="text-text-tertiary">盈亏</span>
              <span className={`font-medium ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatPnl(pnlPct)}
              </span>
            </>
          )}
          {stock.shares && parseFloat(stock.shares) > 0 && (
            <>
              <span className="text-text-tertiary">持仓</span>
              <span className="font-mono">{stock.shares}股</span>
            </>
          )}
        </div>
      )}

      {/* 文本输入 */}
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={immersive ? 12 : 3} autoFocus
        placeholder={type === 'thought' ? '记录此刻的想法...' : type === 'buy' ? '为什么在这个位置买入？' : type === 'sell' ? '为什么卖出？回头看这个决定...' : type === 'adjust' ? '判断发生了什么变化？' : '执行了什么纪律？'}
        className={`w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent mb-3 ${immersive ? 'resize-y leading-relaxed' : 'resize-none'}`} />

      {(type === 'buy' || type === 'sell') && (
        <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="成交价格（选填）"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent mb-3" />
      )}

      {/* 逻辑标签 */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <Tag size={12} className="text-text-tertiary" />
        {LOGIC_TAGS.map(tag => (
          <button key={tag.key} type="button" onClick={() => toggleTag(tag.key)}
            className={`px-2 py-0.5 rounded-md text-xs transition-colors ${
              selectedTags.includes(tag.key) ? `${tag.bg} ${tag.color} font-medium` : 'text-text-tertiary hover:bg-surface-hover'
            }`}>
            {tag.label}
          </button>
        ))}
        {/* 已选的自定义标签 */}
        {selectedTags.filter(t => !LOGIC_TAGS.some(lt => lt.key === t)).map(t => (
          <button key={t} type="button" onClick={() => toggleTag(t)}
            className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 font-medium">
            #{t}
          </button>
        ))}
        {showTagInput ? (
          <input type="text" value={customTag} onChange={e => setCustomTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } if (e.key === 'Escape') setShowTagInput(false); }}
            onBlur={addCustomTag}
            placeholder="自定义标签"
            autoFocus
            className="w-20 px-1.5 py-0.5 rounded-md border border-border text-xs focus:outline-none focus:border-accent" />
        ) : (
          <button type="button" onClick={() => setShowTagInput(true)}
            className="px-1.5 py-0.5 rounded-md text-xs text-text-tertiary hover:bg-surface-hover">
            +自定义
          </button>
        )}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          <Plus size={14} /> 记录
        </button>
        {hasPriceInfo && (
          <button type="button" onClick={() => setSnapshotEnabled(!snapshotEnabled)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              snapshotEnabled ? 'bg-accent-light text-accent' : 'text-text-tertiary hover:bg-surface-hover'
            }`}>
            <Camera size={13} /> 存证
          </button>
        )}
        {setImmersive && (
          <button type="button" onClick={() => setImmersive(!immersive)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              immersive ? 'bg-accent-light text-accent' : 'text-text-tertiary hover:bg-surface-hover'
            }`}>
            {immersive ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {immersive ? '退出沉浸' : '沉浸写作'}
          </button>
        )}
        <button type="button" onClick={handleCancel}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">
          取消
        </button>
      </div>
    </form>
  );
}
