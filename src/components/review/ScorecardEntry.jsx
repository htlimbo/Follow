import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { ENTRY_TYPES } from '../../utils';

const VERDICT_OPTIONS = [
  { key: 'confirmed', label: '兑现了', icon: CheckCircle, color: 'text-positive', bg: 'bg-positive-light', border: 'border-positive/30' },
  { key: 'pending', label: '验证中', icon: Clock, color: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/30' },
  { key: 'wrong', label: '打脸了', icon: XCircle, color: 'text-negative', bg: 'bg-negative-light', border: 'border-negative/30' },
];

export default function ScorecardEntry({ entry, onVerdict }) {
  const typeCfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const currentVerdict = entry.reviewVerdict;
  const currentPrice = parseFloat(entry.stockCurrentPrice);
  const entryPrice = parseFloat(entry.price);
  const hasEntryPrice = !isNaN(entryPrice) && entryPrice > 0;
  const hasPriceChange = hasEntryPrice && !isNaN(currentPrice) && currentPrice > 0;
  const priceChangePct = hasPriceChange ? ((currentPrice - entryPrice) / entryPrice * 100) : null;

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      {/* Header: type + stock + date */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${typeCfg.bg} ${typeCfg.color}`}>
          {typeCfg.label}
        </span>
        <Link to={`/stock/${entry.stockId}`} className="text-sm font-medium text-text hover:text-accent transition-colors no-underline">
          {entry.stockName}
        </Link>
        {entry.stockCode && <span className="text-xs text-text-tertiary font-mono">{entry.stockCode}</span>}
        <span className="text-xs text-text-tertiary ml-auto">
          {new Date(entry.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-3">{entry.content}</p>

      {/* Price context */}
      {(hasEntryPrice || !isNaN(currentPrice)) && (
        <div className="flex items-center gap-3 text-xs text-text-tertiary mb-3">
          {hasEntryPrice && <span>记录时价格: <span className="font-mono text-text-secondary">{entryPrice.toFixed(2)}</span></span>}
          {!isNaN(currentPrice) && currentPrice > 0 && (
            <span>现价: <span className="font-mono text-text-secondary">{currentPrice.toFixed(2)}</span></span>
          )}
          {priceChangePct !== null && (
            <span className={priceChangePct >= 0 ? 'text-positive' : 'text-negative'}>
              {priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Verdict buttons */}
      <div className="flex gap-2">
        {VERDICT_OPTIONS.map(v => {
          const Icon = v.icon;
          const isActive = currentVerdict === v.key;
          return (
            <button key={v.key}
              onClick={() => onVerdict(entry.id, isActive ? null : v.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isActive
                  ? `${v.bg} ${v.color} ${v.border}`
                  : 'border-border text-text-tertiary hover:bg-surface-hover'
              }`}>
              <Icon size={13} /> {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
