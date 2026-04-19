import { Link } from 'react-router-dom';
import { Briefcase, Eye, Archive } from 'lucide-react';
import { formatPnl, formatMoney, formatTime, STATUS_CONFIG } from '../../utils';
import Sparkline from '../ui/Sparkline';

const STATUS_ICONS = { holding: Briefcase, watching: Eye, closed: Archive };

export default function StockCard({ stock, latestEntry, entryCount, compact, selected, onSelect, priceHistory }) {
  const cfg = STATUS_CONFIG[stock.status] || STATUS_CONFIG.holding;
  const StatusIcon = STATUS_ICONS[stock.status] || Briefcase;

  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;

  const hasSparkline = priceHistory && priceHistory.length >= 2;

  // Compact mode: used in desktop three-column layout
  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`w-full text-left rounded-lg p-3 transition-all relative overflow-hidden ${
          selected
            ? 'bg-accent/8 border border-accent/20 shadow-sm'
            : 'hover:bg-surface-hover border border-transparent'
        }`}
      >
        {hasSparkline && (
          <div className="absolute inset-x-0 bottom-0 opacity-30 pointer-events-none">
            <Sparkline data={priceHistory} positive={pnlPct === null || pnlPct >= 0} height={32} />
          </div>
        )}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold truncate">{stock.name}</span>
              <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                <StatusIcon size={10} />
                {cfg.label}
              </span>
            </div>
            {hasPrice && (
              <span className={`text-xs font-medium shrink-0 ml-2 ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatPnl(pnlPct)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            {stock.code && <span className="font-mono">{stock.code}</span>}
            {hasPrice && <span className="font-mono">{current.toFixed(2)}</span>}
            {pnlAmount !== null && (
              <span className={pnlAmount >= 0 ? 'text-positive' : 'text-negative'}>
                {pnlAmount >= 0 ? '+' : ''}{formatMoney(pnlAmount)}
              </span>
            )}
            {stock.status === 'holding' && stock.createdAt && (
              <span>持仓{Math.max(1, Math.floor((Date.now() - new Date(stock.createdAt).getTime()) / 86400000))}天</span>
            )}
          </div>
          {latestEntry && (
            <p className="text-xs text-text-secondary mt-1.5 line-clamp-1">{latestEntry.content}</p>
          )}
        </div>
      </button>
    );
  }

  // Full mode: used in mobile layout
  return (
    <Link to={`/stock/${stock.id}`}
      className="block bg-surface rounded-xl border border-border hover:border-border-light hover:shadow-sm transition-all no-underline text-text group relative overflow-hidden">
      {hasSparkline && (
        <div className="absolute inset-x-0 bottom-0 opacity-20 pointer-events-none">
          <Sparkline data={priceHistory} positive={pnlPct === null || pnlPct >= 0} height={48} />
        </div>
      )}
      <div className="p-4 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold">{stock.name}</span>
            {stock.code && <span className="text-xs text-text-tertiary font-mono">{stock.code}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
              <StatusIcon size={12} />
              {cfg.label}
            </span>
          </div>
        </div>

        {(hasPrice || hasShares) && (
          <div className="flex items-baseline gap-4 mb-3 flex-wrap">
            {hasPrice && (
              <>
                <span className="text-sm text-text-secondary font-mono">{current.toFixed(2)}</span>
                <span className={`text-sm font-medium ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {formatPnl(pnlPct)}
                </span>
              </>
            )}
            {pnlAmount !== null && (
              <span className={`text-sm ${pnlAmount >= 0 ? 'text-positive' : 'text-negative'}`}>
                {pnlAmount >= 0 ? '+' : ''}{formatMoney(pnlAmount)}
              </span>
            )}
            {hasShares && (
              <span className="text-xs text-text-tertiary">{shares}股</span>
            )}
            {stock.status === 'holding' && stock.createdAt && (
              <span className="text-xs text-text-tertiary">
                持仓{Math.max(1, Math.floor((Date.now() - new Date(stock.createdAt).getTime()) / 86400000))}天
              </span>
            )}
          </div>
        )}

        {latestEntry ? (
          <div className="pt-3 border-t border-border-light">
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{latestEntry.content}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-text-tertiary">{formatTime(latestEntry.createdAt)}</span>
              {entryCount > 1 && <span className="text-xs text-text-tertiary">共{entryCount}条记录</span>}
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-border-light">
            <p className="text-sm text-text-tertiary italic">还没有思考记录，点击添加</p>
          </div>
        )}
      </div>
    </Link>
  );
}
