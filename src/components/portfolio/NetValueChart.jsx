import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getSnapshots } from '../../store';
import { useAccount } from '../../contexts/AccountContext';
import { formatMoney } from '../../utils';

const RANGES = [
  { key: 30, label: '30天' },
  { key: 90, label: '90天' },
  { key: 365, label: '一年' },
  { key: 9999, label: '全部' },
];

export default function NetValueChart() {
  const { activeAccountId } = useAccount();
  const [range, setRange] = useState(90);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeAccountId) return;
    let cancelled = false;
    setLoading(true);
    getSnapshots(activeAccountId, range).then(snaps => {
      if (cancelled) return;
      setData(snaps);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeAccountId, range]);

  const baseValue = data.length > 0 ? data[0].totalValue : 0;
  const lastValue = data.length > 0 ? data[data.length - 1].totalValue : 0;
  const change = lastValue - baseValue;
  const changePct = baseValue > 0 ? (change / baseValue) * 100 : 0;
  const isUp = change >= 0;

  const chartData = useMemo(() => data.map(d => ({
    date: d.date,
    value: d.totalValue,
    market: d.marketValue,
    cash: d.cash,
  })), [data]);

  return (
    <section className="bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius-lg)] p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="font-serif text-base font-semibold tracking-tight">组合净值</div>
          {data.length > 0 && (
            <div className="font-mono text-[11.5px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              {formatMoney(lastValue)}
              <span className={`ml-2 ${isUp ? 'text-positive' : 'text-negative'}`}>
                {isUp ? '+' : ''}{change.toFixed(0)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-2 py-1 rounded text-[11px] font-mono cursor-pointer border-0 transition-colors"
              style={{
                background: range === r.key ? 'var(--accent-soft)' : 'transparent',
                color: range === r.key ? 'var(--accent)' : 'var(--ink-faint)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[140px] flex items-center justify-center text-[12.5px]" style={{ color: 'var(--ink-faint)' }}>
          {loading ? '加载中…' : '暂无快照。在交易时段刷新行情后会自动记录每日净值。'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <ReferenceLine y={baseValue} stroke="var(--line)" strokeDasharray="3 3" />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="text-xs rounded-lg px-3 py-2 shadow-lg" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                  <p className="font-medium mb-0.5">{label}</p>
                  <p>总资产 {formatMoney(d.value)}</p>
                  <p style={{ opacity: 0.7 }}>持仓 {formatMoney(d.market)} · 现金 {formatMoney(d.cash)}</p>
                </div>
              );
            }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isUp ? 'var(--gain)' : 'var(--loss)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
