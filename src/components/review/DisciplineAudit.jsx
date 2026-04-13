import { ENTRY_TYPES } from '../../utils';

const FREQ_DAYS = { '月度': 35, '季度': 95, '半年度': 185, '年度': 370, '不定期': Infinity };

export default function DisciplineAudit({ allEntries, anchors, startDate, endDate }) {
  // 1. Record frequency
  const totalCount = allEntries.length;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const effectiveEnd = now < end ? now : end;
  const weeks = Math.max(1, Math.ceil((effectiveEnd - start) / (7 * 86400000)));
  const weeklyAvg = (totalCount / weeks).toFixed(1);

  // Weekly heatmap data
  const weekBuckets = {};
  for (let i = 0; i < weeks; i++) weekBuckets[i] = 0;
  allEntries.forEach(e => {
    const d = new Date(e.createdAt);
    const weekIdx = Math.floor((d - start) / (7 * 86400000));
    if (weekIdx >= 0 && weekIdx < weeks) weekBuckets[weekIdx]++;
  });
  const maxWeekCount = Math.max(1, ...Object.values(weekBuckets));

  // 2. Entry type distribution
  const typeCounts = {};
  allEntries.forEach(e => {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  });

  // 3. Anchor update rate
  const today = new Date();
  let anchorsDue = 0;
  let anchorsUpdated = 0;
  const overdueAnchors = [];

  anchors.forEach(a => {
    const freqDays = FREQ_DAYS[a.frequency];
    if (freqDays === Infinity) return;
    anchorsDue++;
    const lastDate = a.latestDate ? new Date(a.latestDate) : null;
    const daysSince = lastDate ? Math.floor((today - lastDate) / 86400000) : Infinity;
    if (daysSince <= freqDays) {
      anchorsUpdated++;
    } else {
      overdueAnchors.push({
        stockName: a.stockName,
        anchorName: a.name,
        frequency: a.frequency,
        daysSince: daysSince === Infinity ? null : daysSince,
      });
    }
  });
  const updateRate = anchorsDue > 0 ? Math.round((anchorsUpdated / anchorsDue) * 100) : null;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">操作纪律审计</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-xs text-text-tertiary mb-1">记录频率</p>
          <p className="text-lg font-semibold">{totalCount} <span className="text-sm font-normal text-text-tertiary">条</span></p>
          <p className="text-xs text-text-tertiary">周均 {weeklyAvg}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-xs text-text-tertiary mb-1">追踪锚更新率</p>
          {updateRate !== null ? (
            <>
              <p className={`text-lg font-semibold ${updateRate >= 75 ? 'text-positive' : updateRate >= 50 ? 'text-warning' : 'text-negative'}`}>
                {updateRate}%
              </p>
              <p className="text-xs text-text-tertiary">{anchorsUpdated}/{anchorsDue} 按期更新</p>
            </>
          ) : (
            <p className="text-lg font-semibold">—</p>
          )}
        </div>
        <div className="bg-surface rounded-xl border border-border p-3">
          <p className="text-xs text-text-tertiary mb-1">操作分布</p>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
              const count = typeCounts[key] || 0;
              if (count === 0) return null;
              return (
                <span key={key} className={`text-xs ${cfg.color}`}>
                  {cfg.label} {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly heatmap */}
      {weeks > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-4">
          <p className="text-xs text-text-tertiary mb-2">每周记录密度</p>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: weeks }, (_, i) => {
              const count = weekBuckets[i] || 0;
              const intensity = count / maxWeekCount;
              const weekStart = new Date(start.getTime() + i * 7 * 86400000);
              const label = `W${i + 1} (${weekStart.getMonth() + 1}/${weekStart.getDate()}): ${count}条`;
              return (
                <div key={i} title={label}
                  className="w-5 h-5 rounded-sm"
                  style={{
                    backgroundColor: count === 0 ? 'var(--color-surface-hover)' : `rgba(37, 99, 235, ${0.2 + intensity * 0.8})`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
            <span>少</span>
            <div className="flex gap-0.5">
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div key={i} className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: v === 0 ? 'var(--color-surface-hover)' : `rgba(37, 99, 235, ${0.2 + v * 0.8})` }}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>
      )}

      {/* Overdue anchors */}
      {overdueAnchors.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-tertiary mb-2">追踪锚到期提醒</p>
          <div className="flex flex-col gap-1.5">
            {overdueAnchors.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-warning">!</span>
                <span className="text-text-secondary">
                  {a.stockName} — "{a.anchorName}" 设定{a.frequency}追踪，
                  {a.daysSince ? `已超过${a.daysSince}天未更新` : '从未更新'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
