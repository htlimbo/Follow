import { useState } from 'react';
import { Plus, Brain, ShoppingCart, LogOut, RefreshCw, Shield } from 'lucide-react';
import { ENTRY_TYPES } from '../../utils';

const ENTRY_ICONS = {
  thought: Brain,
  buy: ShoppingCart,
  sell: LogOut,
  adjust: RefreshCw,
  discipline: Shield,
};

export default function AddEntryForm({ onAdd, onCancel }) {
  const [type, setType] = useState('thought');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd({ type, content: content.trim(), price: price.trim() });
    setContent('');
    setPrice('');
    setType('thought');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-accent/30 p-4 mb-4">
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
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} autoFocus
        placeholder={type === 'thought' ? '记录此刻的想法...' : type === 'buy' ? '为什么在这个位置买入？' : type === 'sell' ? '为什么卖出？回头看这个决定...' : type === 'adjust' ? '判断发生了什么变化？' : '执行了什么纪律？'}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none mb-3" />
      {(type === 'buy' || type === 'sell') && (
        <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="成交价格（选填）"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent mb-3" />
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          <Plus size={14} /> 记录
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">
          取消
        </button>
      </div>
    </form>
  );
}
