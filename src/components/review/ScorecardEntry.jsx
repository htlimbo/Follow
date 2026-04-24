import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import { ENTRY_TYPES } from '../../utils';

const VERDICT_OPTIONS = [
  { key: 'confirmed', label: '逻辑证实', icon: CheckCircle, color: 'var(--gain)', bg: 'var(--gain-soft)' },
  { key: 'pending', label: '待验证', icon: Clock, color: 'var(--gold)', bg: 'oklch(0.92 0.04 80)' },
  { key: 'wrong', label: '逻辑证伪', icon: XCircle, color: 'var(--loss)', bg: 'var(--loss-soft)' },
  { key: 'surprise', label: '意外因素', icon: Zap, color: 'var(--violet)', bg: 'oklch(0.92 0.04 300)' },
];

const TYPE_STYLES = {
  buy: { color: 'var(--gain)', bg: 'var(--gain-soft)' },
  sell: { color: 'var(--loss)', bg: 'var(--loss-soft)' },
  adjust: { color: 'var(--gold)', bg: 'oklch(0.92 0.04 80)' },
  thought: { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  discipline: { color: 'var(--accent)', bg: 'var(--accent-soft)' },
};

export default function ScorecardEntry({ entry, onVerdict }) {
  const typeCfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const currentVerdict = entry.reviewVerdict;
  const currentPrice = parseFloat(entry.stockCurrentPrice);
  const entryPrice = parseFloat(entry.price);
  const hasEntryPrice = !isNaN(entryPrice) && entryPrice > 0;
  const hasPriceChange = hasEntryPrice && !isNaN(currentPrice) && currentPrice > 0;
  const priceChangePct = hasPriceChange ? ((currentPrice - entryPrice) / entryPrice * 100) : null;
  const typeStyle = TYPE_STYLES[entry.type] || TYPE_STYLES.thought;

  return (
    <div className="rounded-[var(--radius-lg)] border p-5" style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}>
      {/* Header: type + stock + date */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: typeStyle.bg, color: typeStyle.color }}>
          {typeCfg.label}
        </span>
        <Link to={`/stock/${entry.stockId}`}
          className="font-serif text-sm font-medium no-underline transition-colors"
          style={{ color: 'var(--ink)' }}
          onMouseEnter={e => e.target.style.color = 'var(--accent)'}
          onMouseLeave={e => e.target.style.color = 'var(--ink)'}>
          {entry.stockName}
        </Link>
        {entry.stockCode && <span className="text-[11px] font-mono" style={{ color: 'var(--ink-faint)' }}>{entry.stockCode}</span>}
        <span className="text-[11px] font-mono ml-auto" style={{ color: 'var(--ink-faint)' }}>
          {new Date(entry.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Content */}
      <p className="font-serif text-[13.5px] leading-[1.7] whitespace-pre-wrap mb-3" style={{ color: 'var(--ink)' }}>
        {entry.content}
      </p>

      {/* Price context — dual-column "当初 vs 现在" */}
      {(hasEntryPrice || !isNaN(currentPrice)) && (
        <div className="flex items-center gap-4 px-3 py-2 rounded-[var(--radius)] mb-4 text-[11px]"
          style={{ background: 'var(--bg-sunken)' }}>
          {hasEntryPrice && (
            <span style={{ color: 'var(--ink-faint)' }}>
              当时价格 <span className="font-mono font-medium" style={{ color: 'var(--ink-soft)' }}>{entryPrice.toFixed(2)}</span>
            </span>
          )}
          {!isNaN(currentPrice) && currentPrice > 0 && (
            <span style={{ color: 'var(--ink-faint)' }}>
              现价 <span className="font-mono font-medium" style={{ color: 'var(--ink-soft)' }}>{currentPrice.toFixed(2)}</span>
            </span>
          )}
          {priceChangePct !== null && (
            <span className={`font-mono font-medium ${priceChangePct >= 0 ? 'text-positive' : 'text-negative'}`}>
              {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Three-dimension verdict buttons */}
      <div className="flex gap-2 flex-wrap">
        {VERDICT_OPTIONS.map(v => {
          const Icon = v.icon;
          const isActive = currentVerdict === v.key;
          return (
            <button key={v.key}
              onClick={() => onVerdict(entry.id, isActive ? null : v.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border cursor-pointer"
              style={isActive
                ? { background: v.bg, color: v.color, borderColor: v.color }
                : { background: 'transparent', color: 'var(--ink-faint)', borderColor: 'var(--line)' }
              }>
              <Icon size={12} /> {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
