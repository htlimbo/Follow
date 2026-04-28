import { Link } from 'react-router-dom';
import { formatPnl, formatMoney, formatTime } from '../../utils';
import Sparkline from '../ui/Sparkline';

const TAG_STYLES = {
  holding: 'bg-[color-mix(in_oklch,var(--gain)_15%,transparent)] text-[var(--gain)]',
  watching: 'bg-[color-mix(in_oklch,var(--sky)_15%,transparent)] text-[var(--sky)]',
  closed: 'bg-[var(--bg-sunken)] text-[var(--ink-faint)]',
};
const TAG_LABELS = { holding: '持仓', watching: '观察', closed: '已清仓' };

export default function StockCard({ stock, latestEntry, entryCount, compact, selected, onSelect, priceHistory }) {
  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;
  const isGain = pnlPct !== null && pnlPct >= 0;
  const hasSparkline = priceHistory && priceHistory.length >= 2;
  const holdDays = stock.status === 'holding' && stock.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(stock.createdAt).getTime()) / 86400000))
    : null;

  const tagStyle = TAG_STYLES[stock.status] || TAG_STYLES.holding;
  const tagLabel = TAG_LABELS[stock.status] || '持仓';

  // pct display
  const pctText = pnlPct !== null ? formatPnl(pnlPct) : '—';
  const pctColor = pnlPct === null ? 'text-[var(--ink-faint)]' : isGain ? 'text-positive' : 'text-negative';

  // delta (price change)
  const delta = hasPrice ? current - cost : null;
  const deltaColor = delta !== null ? (delta >= 0 ? 'text-positive' : 'text-negative') : '';

  // Compact mode: desktop three-column list
  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`w-full text-left rounded-[var(--radius)] p-3.5 transition-all relative cursor-pointer border ${
          selected
            ? 'bg-[var(--bg-raised)] border-[var(--line)] shadow-[var(--shadow-card)]'
            : 'hover:bg-[var(--bg-sunken)] border-transparent'
        }`}
      >
        {/* Active accent bar */}
        {selected && (
          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-[var(--accent)]" />
        )}

        {/* Row 1: Name + Tag | Pct */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif text-base font-medium tracking-tight truncate">{stock.name}</span>
            {stock.type === 'etf' && (
              <span
                className="text-[9px] font-mono px-1 py-px rounded-sm shrink-0 tracking-wider"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                ETF
              </span>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm shrink-0 tracking-wide ${tagStyle}`}>
              {tagLabel}
            </span>
          </div>
          <span className={`font-mono text-[13px] font-medium shrink-0 ${pctColor}`}>
            {pctText}
          </span>
        </div>

        {/* Row 2: Code + Price + Delta | Days */}
        <div className="flex items-baseline gap-2.5 mt-1 text-[11px] font-mono text-[var(--ink-faint)]">
          {stock.code && <span className="tracking-wider">{stock.code}</span>}
          {hasPrice && <span className="text-[var(--ink-soft)]">{current.toFixed(2)}</span>}
          {delta !== null && (
            <span className={deltaColor}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
            </span>
          )}
          {holdDays && <span className="ml-auto">持仓 {holdDays} 天</span>}
        </div>

        {/* Sparkline */}
        {hasSparkline && (
          <div className="mt-2 h-[26px] overflow-hidden rounded">
            <Sparkline data={priceHistory} positive={pnlPct === null || pnlPct >= 0} height={26} />
          </div>
        )}

        {/* Latest thought quote */}
        {latestEntry && (
          <div className="mt-2 py-1.5 px-2 text-[11.5px] leading-relaxed text-[var(--ink-soft)] bg-[color-mix(in_oklch,var(--accent-soft)_50%,transparent)] rounded-md font-serif italic border-l-2 border-[var(--accent)] line-clamp-2">
            "{latestEntry.content}"
          </div>
        )}
      </button>
    );
  }

  // Full mode: mobile layout
  return (
    <Link to={`/stock/${stock.id}`}
      className="block rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-raised)] hover:shadow-[var(--shadow-card)] transition-all no-underline text-[var(--ink)] relative overflow-hidden">
      <div className="p-4 relative">
        {/* Row 1: Name + Tag | Pct */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-serif text-base font-medium tracking-tight">{stock.name}</span>
            {stock.type === 'etf' && (
              <span
                className="text-[9px] font-mono px-1 py-px rounded-sm tracking-wider"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                ETF
              </span>
            )}
            {stock.code && <span className="text-[11px] font-mono text-[var(--ink-faint)] tracking-wider">{stock.code}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm tracking-wide ${tagStyle}`}>
              {tagLabel}
            </span>
          </div>
        </div>

        {/* Row 2: Price info */}
        {hasPrice && (
          <div className="flex items-baseline gap-3 mt-2 flex-wrap">
            <span className="font-mono text-sm text-[var(--ink-soft)]">{current.toFixed(2)}</span>
            <span className={`font-mono text-sm font-medium ${pctColor}`}>{pctText}</span>
            {pnlAmount !== null && (
              <span className={`text-sm ${pnlAmount >= 0 ? 'text-positive' : 'text-negative'}`}>
                {pnlAmount >= 0 ? '+' : ''}{formatMoney(pnlAmount)}
              </span>
            )}
            {hasShares && <span className="text-xs text-[var(--ink-faint)]">{shares}股</span>}
            {holdDays && <span className="text-xs text-[var(--ink-faint)]">持仓 {holdDays} 天</span>}
          </div>
        )}

        {/* Sparkline */}
        {hasSparkline && (
          <div className="mt-3 h-[32px] overflow-hidden rounded">
            <Sparkline data={priceHistory} positive={pnlPct === null || pnlPct >= 0} height={32} />
          </div>
        )}

        {/* Latest entry */}
        {latestEntry ? (
          <div className="mt-3 pt-3 border-t border-[var(--line)]">
            <p className="font-serif text-[13.5px] text-[var(--ink-soft)] leading-relaxed line-clamp-2 italic">
              "{latestEntry.content}"
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-[var(--ink-faint)]">{formatTime(latestEntry.createdAt)}</span>
              {entryCount > 1 && <span className="text-xs text-[var(--ink-faint)]">共{entryCount}条记录</span>}
            </div>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-[var(--line)]">
            <p className="text-sm text-[var(--ink-faint)] italic font-serif">还没有思考记录，点击添加</p>
          </div>
        )}
      </div>
    </Link>
  );
}
