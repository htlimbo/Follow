import { Link } from 'react-router-dom';
import { ChevronRight, Briefcase, Eye, Archive } from 'lucide-react';
import { formatPnl, formatMoney, formatTime, STATUS_CONFIG } from '../../utils';

const STATUS_ICONS = { holding: Briefcase, watching: Eye, closed: Archive };

export default function StockCard({ stock, latestEntry, entryCount }) {
  const cfg = STATUS_CONFIG[stock.status] || STATUS_CONFIG.holding;
  const StatusIcon = STATUS_ICONS[stock.status] || Briefcase;

  const cost = parseFloat(stock.costPrice);
  const current = parseFloat(stock.currentPrice);
  const shares = parseFloat(stock.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;

  return (
    <Link to={`/stock/${stock.id}`}
      className="block bg-surface rounded-xl border border-border hover:border-border-light hover:shadow-sm transition-all no-underline text-text group">
      <div className="p-4">
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
            <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
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
