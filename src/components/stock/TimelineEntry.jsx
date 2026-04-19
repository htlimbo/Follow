import { Trash2, Brain, ShoppingCart, LogOut, RefreshCw, Shield, Camera } from 'lucide-react';
import { ENTRY_TYPES, LOGIC_TAGS, formatDate, formatPnl } from '../../utils';

const ENTRY_ICONS = {
  thought: Brain,
  buy: ShoppingCart,
  sell: LogOut,
  adjust: RefreshCw,
  discipline: Shield,
};

function getTagConfig(key) {
  return LOGIC_TAGS.find(t => t.key === key) || { label: `#${key}`, color: 'text-gray-500', bg: 'bg-gray-50' };
}

export default function TimelineEntry({ entry, onDelete }) {
  const cfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const Icon = ENTRY_ICONS[entry.type] || Brain;
  const snap = entry.snapshotData;
  const tags = entry.logicTags;

  return (
    <div className="relative pl-8 pb-6 group">
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border-light" />
      <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center`}>
        <Icon size={12} className={cfg.color} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          {entry.price && <span className="text-xs text-text-tertiary font-mono">@ {entry.price}</span>}
          <span className="text-xs text-text-tertiary">{formatDate(entry.createdAt)}</span>
          {snap && <Camera size={11} className="text-text-tertiary" title="含存证数据" />}
          <button onClick={() => onDelete(entry.id)}
            className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative p-0.5 rounded transition-all">
            <Trash2 size={12} />
          </button>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{entry.content}</p>

        {/* 逻辑标签 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.map(t => {
              const tc = getTagConfig(t);
              return (
                <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] ${tc.bg} ${tc.color}`}>
                  {tc.label}
                </span>
              );
            })}
          </div>
        )}

        {/* 存证快照 */}
        {snap && (
          <div className="flex items-center gap-3 mt-1.5 px-2 py-1 rounded bg-bg text-[11px] text-text-tertiary">
            <span>存证价 <span className="font-mono font-medium text-text-secondary">{parseFloat(snap.currentPrice).toFixed(2)}</span></span>
            {snap.pnlPct && (
              <span className={parseFloat(snap.pnlPct) >= 0 ? 'text-positive' : 'text-negative'}>
                {formatPnl(parseFloat(snap.pnlPct))}
              </span>
            )}
            {snap.shares && <span>{snap.shares}股</span>}
          </div>
        )}
      </div>
    </div>
  );
}
