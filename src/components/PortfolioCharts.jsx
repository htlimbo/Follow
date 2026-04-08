import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatPnl, CHART_COLORS } from '../utils';

export default function PortfolioCharts({ holdingStocks }) {
  // Calculate summary stats
  let totalMarketValue = 0;
  let totalCost = 0;
  let totalPnl = 0;
  let hasPnlData = false;

  holdingStocks.forEach(s => {
    const cost = parseFloat(s.costPrice);
    const current = parseFloat(s.currentPrice);
    const shares = parseFloat(s.shares);
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
      totalMarketValue += current * shares;
      totalCost += cost * shares;
      totalPnl += (current - cost) * shares;
      hasPnlData = true;
    }
  });

  const totalAbsCost = Math.abs(totalCost);
  const totalPnlPct = totalAbsCost > 0 ? (totalPnl / totalAbsCost * 100) : 0;

  // Chart data
  const pieData = [];
  const pnlAmountData = [];
  const pnlPctData = [];
  holdingStocks.forEach(s => {
    const current = parseFloat(s.currentPrice);
    const shares = parseFloat(s.shares);
    const cost = parseFloat(s.costPrice);
    if (!isNaN(current) && !isNaN(shares) && shares > 0) {
      pieData.push({ name: s.name, value: Math.round(current * shares) });
    }
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
      pnlAmountData.push({ name: s.name, pnl: Math.round((current - cost) * shares) });
      pnlPctData.push({ name: s.name, pct: +((current - cost) / Math.abs(cost) * 100).toFixed(2) });
    }
  });
  pnlAmountData.sort((a, b) => b.pnl - a.pnl);
  pnlPctData.sort((a, b) => b.pct - a.pct);

  return (
    <div className="lg:sticky lg:top-20 lg:self-start flex flex-col gap-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-xl border border-border p-2.5">
          <p className="text-xs text-text-tertiary mb-1">持仓</p>
          <p className="text-lg font-semibold">{holdingStocks.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-2.5">
          <p className="text-xs text-text-tertiary mb-1">总市值</p>
          <p className="text-lg font-semibold truncate">
            {hasPnlData ? formatMoney(totalMarketValue) : '—'}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-2.5">
          <p className="text-xs text-text-tertiary mb-1">总盈亏</p>
          {hasPnlData ? (
            <div>
              <p className={`text-lg font-semibold truncate ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatMoney(totalPnl)}
              </p>
              <p className={`text-xs ${totalPnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatPnl(totalPnlPct)}
              </p>
            </div>
          ) : (
            <p className="text-lg font-semibold">—</p>
          )}
        </div>
      </div>

      {/* Pie chart: position distribution */}
      {pieData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">持仓分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={75} innerRadius={40} paddingAngle={2} stroke="none">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart: per-stock P&L amount */}
      {pnlAmountData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">个股盈亏金额</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, pnlAmountData.length * 32)}>
            <BarChart data={pnlAmountData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
              <Tooltip formatter={(v) => formatMoney(v)} labelStyle={{ fontSize: 12 }} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {pnlAmountData.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar chart: per-stock P&L percentage */}
      {pnlPctData.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">个股收益率</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, pnlPctData.length * 32)}>
            <BarChart data={pnlPctData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={64} />
              <Tooltip formatter={(v) => `${v}%`} labelStyle={{ fontSize: 12 }} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {pnlPctData.map((d, i) => (
                  <Cell key={i} fill={d.pct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
