import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, Save } from 'lucide-react';
import { getReviewableEntries, updateEntryVerdict, getReviewByPeriod, saveReview, getEntriesInRange, getAllAnchors } from '../store';
import { ENTRY_TYPES } from '../utils';

const FREQ_DAYS = { '月度': 35, '季度': 95, '半年度': 185, '年度': 370, '不定期': Infinity };

const VERDICT_OPTIONS = [
  { key: 'confirmed', label: '兑现了', icon: CheckCircle, color: 'text-positive', bg: 'bg-positive-light', border: 'border-positive/30' },
  { key: 'pending', label: '验证中', icon: Clock, color: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/30' },
  { key: 'wrong', label: '打脸了', icon: XCircle, color: 'text-negative', bg: 'bg-negative-light', border: 'border-negative/30' },
];

function getQuarterRange(offset = 0) {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + offset;
  const year = now.getFullYear() + Math.floor(q / 4);
  const quarter = ((q % 4) + 4) % 4;
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 0);
  return {
    label: `${start.getFullYear()}年Q${Math.floor(start.getMonth() / 3) + 1}`,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

const PERIOD_OPTIONS = [
  getQuarterRange(0),
  getQuarterRange(-1),
  getQuarterRange(-2),
  getQuarterRange(-3),
];

function DisciplineAudit({ allEntries, anchors, startDate, endDate }) {
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
    if (freqDays === Infinity) return; // skip 不定期
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

export default function Review() {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState(PERIOD_OPTIONS[0].start);
  const [customEnd, setCustomEnd] = useState(PERIOD_OPTIONS[0].end);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState([]); // all types in range
  const [anchors, setAnchors] = useState([]);
  const [reviewNote, setReviewNote] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const startDate = customMode ? customStart : period.start;
  const endDate = customMode ? customEnd : period.end;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getReviewableEntries(startDate, endDate),
      getReviewByPeriod(startDate, endDate),
      getEntriesInRange(startDate, endDate),
      getAllAnchors(),
    ])
      .then(([e, note, all, anch]) => {
        setEntries(e);
        setReviewNote(note);
        setNoteDraft(note?.summary || '');
        setNoteSaved(false);
        setAllEntries(all);
        setAnchors(anch);
      })
      .catch(err => console.error('Failed to load review data:', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  async function handleSaveNote() {
    setNoteSaving(true);
    try {
      const saved = await saveReview({
        id: reviewNote?.id || null,
        periodStart: startDate,
        periodEnd: endDate,
        summary: noteDraft,
      });
      setReviewNote(saved);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save review note:', err);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleVerdict(entryId, verdict) {
    try {
      await updateEntryVerdict(entryId, verdict);
      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, reviewVerdict: verdict } : e
      ));
    } catch (err) {
      console.error('Failed to update verdict:', err);
    }
  }

  const confirmed = entries.filter(e => e.reviewVerdict === 'confirmed').length;
  const pending = entries.filter(e => e.reviewVerdict === 'pending').length;
  const wrong = entries.filter(e => e.reviewVerdict === 'wrong').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-text-tertiary hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold">判断记分卡</h1>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {PERIOD_OPTIONS.map(p => (
          <button key={p.label} onClick={() => { setPeriod(p); setCustomMode(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !customMode && period.label === p.label ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
            }`}>
            {p.label}
          </button>
        ))}
        <button onClick={() => setCustomMode(true)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            customMode ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
          }`}>
          自定义
        </button>
        {customMode && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
            <span className="text-text-tertiary text-sm">至</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm text-text-tertiary">加载中...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-1">这个时间段没有关键判断记录</p>
          <p className="text-sm text-text-tertiary">买入、卖出、修正判断类型的记录会出现在这里</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-5 text-sm">
            <span className="text-text-secondary">共 {entries.length} 条关键判断</span>
            {confirmed > 0 && <span className="text-positive flex items-center gap-1"><CheckCircle size={14} /> {confirmed} 兑现</span>}
            {pending > 0 && <span className="text-warning flex items-center gap-1"><Clock size={14} /> {pending} 验证中</span>}
            {wrong > 0 && <span className="text-negative flex items-center gap-1"><XCircle size={14} /> {wrong} 打脸</span>}
          </div>

          {/* Entry list */}
          <div className="flex flex-col gap-3">
            {entries.map(entry => {
              const typeCfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
              const currentVerdict = entry.reviewVerdict;
              const currentPrice = parseFloat(entry.stockCurrentPrice);
              const entryPrice = parseFloat(entry.price);
              const hasEntryPrice = !isNaN(entryPrice) && entryPrice > 0;
              const hasPriceChange = hasEntryPrice && !isNaN(currentPrice) && currentPrice > 0;
              const priceChangePct = hasPriceChange ? ((currentPrice - entryPrice) / entryPrice * 100) : null;

              return (
                <div key={entry.id} className="bg-surface rounded-xl border border-border p-4">
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
                          onClick={() => handleVerdict(entry.id, isActive ? null : v.key)}
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
            })}
          </div>
        </>
      )}

      {/* Block 2: Discipline Audit */}
      {!loading && allEntries.length > 0 && <DisciplineAudit allEntries={allEntries} anchors={anchors} startDate={startDate} endDate={endDate} />}

      {/* Review note section — always visible when not loading */}
      {!loading && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">复盘总结</h2>
          <div className="bg-surface rounded-xl border border-border p-4">
            <textarea
              value={noteDraft}
              onChange={e => { setNoteDraft(e.target.value); setNoteSaved(false); }}
              rows={6}
              placeholder={"这个阶段最大的收获是...\n犯的最大的错误是...\n下个阶段要注意的是..."}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none mb-3 leading-relaxed"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveNote}
                disabled={noteSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
              >
                <Save size={14} /> {noteSaving ? '保存中...' : '保存复盘'}
              </button>
              {noteSaved && (
                <span className="text-xs text-positive flex items-center gap-1">
                  <CheckCircle size={13} /> 已保存
                </span>
              )}
              {reviewNote && (
                <span className="text-xs text-text-tertiary ml-auto">
                  上次保存: {new Date(reviewNote.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
