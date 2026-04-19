import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

/**
 * 迷你走势图 — 用于 StockCard 背景
 * data: [{ price: "12.34", date: "2024-01-01" }, ...]
 * positive: 涨跌方向决定颜色
 */
export default function Sparkline({ data, positive = true, height = 40 }) {
  if (!data || data.length < 2) return null;

  const chartData = data.map(d => ({ value: parseFloat(d.price) }));
  const color = positive ? 'var(--color-positive)' : 'var(--color-negative)';
  const gradientId = `spark-${positive ? 'up' : 'down'}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
