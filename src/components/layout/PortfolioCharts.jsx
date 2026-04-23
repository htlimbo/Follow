import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney, formatPnl } from '../../utils';

// Design-system–aligned palette
const CHART_COLORS = [
  'oklch(0.58 0.14 38)',   // terracotta (accent)
  'oklch(0.70 0.08 230)',  // sky
  'oklch(0.60 0.10 300)',  // violet
  'oklch(0.55 0.10 155)',  // sage
  'oklch(0.72 0.12 80)',   // gold
  'oklch(0.58 0.13 25)',   // dusty rose
  'oklch(0.50 0.12 280)',  // deep violet
  'oklch(0.65 0.08 200)',  // teal
];
const CASH_COLOR = 'oklch(0.62 0.015 65)'; // ink-faint tone

export default function PortfolioCharts({ holdingStocks, cashBalance = '' }) {
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

  // Pie data
  const pieData = [];
  const pnlBarData = [];
  holdingStocks.forEach(s => {
    const current = parseFloat(s.currentPrice);
    const shares = parseFloat(s.shares);
    const cost = parseFloat(s.costPrice);
    if (!isNaN(current) && !isNaN(shares) && shares > 0) {
      pieData.push({ name: s.name, value: Math.round(current * shares) });
    }
    if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
      const pnl = (current - cost) * shares;
      pnlBarData.push({ name: s.name, val: pnl / 10000 }); // 万
    }
  });
  pnlBarData.sort((a, b) => b.val - a.val);

  const cashNum = parseFloat(cashBalance);
  const hasCash = !isNaN(cashNum) && cashNum > 0;
  if (hasCash) {
    pieData.push({ name: '现金', value: Math.round(cashNum), isCash: true });
  }
  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);
  const totalAssets = totalMarketValue + (hasCash ? cashNum : 0);

  // Max absolute bar value for scaling
  const maxBar = Math.max(...pnlBarData.map(b => Math.abs(b.val)), 0.01);

  const watchCount = holdingStocks.length; // already filtered to holding

  return (
    <div className="flex flex-col gap-5">
      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="持仓数" value={holdingStocks.length} />
        <StatCard
          label="总资产"
          value={hasPnlData || hasCash ? formatAssetVal(totalAssets) : '—'}
          sub={hasPnlData && hasCash ? `持仓 ${formatMoney(totalMarketValue)} · 现金 ${formatMoney(cashNum)}` : null}
        />
        <StatCard
          label="总盈亏"
          value={hasPnlData ? formatAssetVal(totalPnl, true) : '—'}
          valueClass={hasPnlData ? (totalPnl >= 0 ? 'text-positive' : 'text-negative') : ''}
          sub={hasPnlData ? `${formatPnl(totalPnlPct)} 全周期` : null}
          subClass={hasPnlData ? (totalPnlPct >= 0 ? 'text-positive' : 'text-negative') : ''}
        />
      </div>

      {/* Donut chart card */}
      {pieData.length > 0 && (
        <section className="bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius-lg)] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-serif text-base font-semibold tracking-tight">持仓分布</div>
            <div className="text-[11.5px] text-[var(--ink-faint)]">按市值占比</div>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-9 items-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={75} innerRadius={45} paddingAngle={2} stroke="none">
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.isCash ? CASH_COLOR : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const { name, value } = payload[0].payload;
                  const pct = pieTotal > 0 ? (value / pieTotal * 100).toFixed(1) : 0;
                  return (
                    <div className="text-xs rounded-lg px-3 py-2 shadow-lg" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                      <p className="font-medium mb-0.5">{name}</p>
                      <p>{formatMoney(value)}（{pct}%）</p>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
              {pieData.map((d, i) => {
                const pct = pieTotal > 0 ? (d.value / pieTotal * 100).toFixed(1) : '0';
                return (
                  <div key={d.name} className="flex items-center gap-2 text-[var(--ink-soft)]">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.isCash ? CASH_COLOR : CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 text-[var(--ink)]">{d.name}</span>
                    <span className="font-mono text-[var(--ink-faint)]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* P&L bar chart (CSS bars, center-axis) */}
      {pnlBarData.length > 0 && (
        <section className="bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius-lg)] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-serif text-base font-semibold tracking-tight">个股盈亏金额</div>
            <div className="text-[11.5px] text-[var(--ink-faint)]">单位：万元</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {pnlBarData.map(b => {
              const isGain = b.val >= 0;
              const widthPct = (Math.abs(b.val) / maxBar) * 50;
              return (
                <div key={b.name} className="grid items-center gap-3 text-[12.5px]" style={{ gridTemplateColumns: '70px 1fr 60px' }}>
                  <div className="font-serif text-right text-[13px] text-[var(--ink)]">{b.name}</div>
                  <div className="relative h-6 bg-[var(--bg-sunken)] rounded-sm flex">
                    {/* Center axis */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--line-strong)] opacity-50" />
                    {isGain ? (
                      <div
                        className="h-full rounded-sm transition-[width] duration-400"
                        style={{
                          marginLeft: '50%',
                          width: `${widthPct}%`,
                          background: `linear-gradient(90deg, color-mix(in oklch, var(--gain) 60%, transparent), var(--gain))`,
                        }}
                      />
                    ) : (
                      <div
                        className="h-full rounded-sm transition-[width] duration-400"
                        style={{
                          marginLeft: `${50 - widthPct}%`,
                          width: `${widthPct}%`,
                          background: `linear-gradient(90deg, var(--loss), color-mix(in oklch, var(--loss) 60%, transparent))`,
                        }}
                      />
                    )}
                  </div>
                  <div className={`font-mono text-xs ${isGain ? 'text-positive' : 'text-negative'}`}>
                    {isGain ? '+' : ''}{b.val.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Helpers ───

function StatCard({ label, value, sub, valueClass = '', subClass = '' }) {
  return (
    <div className="p-4 bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius)] flex flex-col gap-1">
      <div className="text-[11px] tracking-widest uppercase text-[var(--ink-faint)]">{label}</div>
      <div className={`font-mono text-[28px] font-medium tracking-tight leading-tight mt-1 ${valueClass}`}>
        {value}
      </div>
      {sub && <div className={`text-xs font-mono text-[var(--ink-faint)] ${subClass}`}>{sub}</div>}
    </div>
  );
}

function formatAssetVal(num, showSign = false) {
  const abs = Math.abs(num);
  if (abs >= 10000) {
    const wan = num / 10000;
    const prefix = showSign && num > 0 ? '+' : '';
    return `${prefix}${wan.toFixed(2)}万`;
  }
  const prefix = showSign && num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(0)}`;
}
