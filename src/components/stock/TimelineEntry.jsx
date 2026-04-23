import { Trash2, Camera } from 'lucide-react';
import { ENTRY_TYPES, LOGIC_TAGS, formatDate, formatPnl } from '../../utils';

const ENTRY_DOT_COLORS = {
  thought: 'border-[var(--accent)]',
  buy: 'border-[var(--gain)]',
  sell: 'border-[var(--loss)]',
  adjust: 'border-[var(--gold)]',
  discipline: 'border-[var(--accent)]',
};

function getTagConfig(key) {
  return LOGIC_TAGS.find(t => t.key === key) || { label: `#${key}`, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-soft)]' };
}

export default function TimelineEntry({ entry, onDelete }) {
  const cfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const dotColor = ENTRY_DOT_COLORS[entry.type] || ENTRY_DOT_COLORS.thought;
  const snap = entry.snapshotData;
  const tags = entry.logicTags;

  return (
    <div className="relative mb-5 group">
      {/* Dot on the timeline */}
      <div className={`absolute -left-[21px] top-[8px] w-[10px] h-[10px] rounded-full bg-[var(--bg)] border-2 ${dotColor}`} />

      {/* Meta row */}
      <div className="flex items-baseline gap-2.5 mb-1.5">
        <span className="font-serif text-[13px] font-semibold text-[var(--ink)]">{cfg.label}</span>
        {entry.price && <span className="text-[11px] text-[var(--ink-faint)] font-mono">@ {entry.price}</span>}
        <span className="text-[11px] text-[var(--ink-faint)] font-mono">{formatDate(entry.createdAt)}</span>
        {snap && <Camera size={11} className="text-[var(--ink-faint)]" title="含存证数据" />}
        <button onClick={() => onDelete(entry.id)}
          className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--ink-faint)] hover:text-[var(--loss)] bg-transparent border-0 p-0.5 rounded cursor-pointer transition-all">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Content */}
      <p className="font-serif text-[13.5px] leading-[1.7] text-[var(--ink)] whitespace-pre-wrap">{entry.content}</p>

      {/* Logic tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map(t => {
            const tc = getTagConfig(t);
            return (
              <span key={t} className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-[var(--accent-soft)] text-[var(--accent)]">
                {tc.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Snapshot */}
      {snap && (
        <div className="flex items-center gap-3 mt-2 px-2.5 py-1.5 rounded-[var(--radius)] bg-[var(--bg-sunken)] text-[11px] text-[var(--ink-faint)]">
          <span>存证价 <span className="font-mono font-medium text-[var(--ink)]">{parseFloat(snap.currentPrice).toFixed(2)}</span></span>
          {snap.pnlPct && (
            <span className={parseFloat(snap.pnlPct) >= 0 ? 'text-positive' : 'text-negative'}>
              {formatPnl(parseFloat(snap.pnlPct))}
            </span>
          )}
          {snap.shares && <span>{snap.shares}股</span>}
        </div>
      )}
    </div>
  );
}
