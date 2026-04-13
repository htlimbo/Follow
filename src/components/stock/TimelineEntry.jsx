import { Trash2, Brain, ShoppingCart, LogOut, RefreshCw, Shield } from 'lucide-react';
import { ENTRY_TYPES, formatDate } from '../../utils';

const ENTRY_ICONS = {
  thought: Brain,
  buy: ShoppingCart,
  sell: LogOut,
  adjust: RefreshCw,
  discipline: Shield,
};

export default function TimelineEntry({ entry, onDelete }) {
  const cfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const Icon = ENTRY_ICONS[entry.type] || Brain;

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
          <button onClick={() => onDelete(entry.id)}
            className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative p-0.5 rounded transition-all">
            <Trash2 size={12} />
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      </div>
    </div>
  );
}
