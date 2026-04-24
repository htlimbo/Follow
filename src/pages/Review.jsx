import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getReviewableEntries, updateEntryVerdict, getReviewByPeriod, getEntriesInRange, getAllAnchors } from '../store';
import ScorecardEntry from '../components/review/ScorecardEntry';
import DisciplineAudit from '../components/review/DisciplineAudit';
import ReviewNote from '../components/review/ReviewNote';
import { ReviewSkeleton } from '../components/ui/Skeleton';

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

export default function Review() {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState(PERIOD_OPTIONS[0].start);
  const [customEnd, setCustomEnd] = useState(PERIOD_OPTIONS[0].end);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState([]);
  const [anchors, setAnchors] = useState([]);
  const [reviewNote, setReviewNote] = useState(null);

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
        setAllEntries(all);
        setAnchors(anch);
      })
      .catch(err => console.error('Failed to load review data:', err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="text-[11px] tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>
          Post-Mortem Review
        </div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[26px] font-semibold tracking-tight">阶段复盘</h1>
        </div>
        <div className="mt-1.5 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          回顾判断，审视纪律，与过去的自己对话。
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-1.5 mt-5 mb-6">
        {PERIOD_OPTIONS.map(p => (
          <button key={p.label} onClick={() => { setPeriod(p); setCustomMode(false); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-0"
            style={!customMode && period.label === p.label
              ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
              : { background: 'transparent', color: 'var(--ink-soft)' }
            }>
            {p.label}
          </button>
        ))}
        <button onClick={() => setCustomMode(true)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-0"
          style={customMode
            ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
            : { background: 'transparent', color: 'var(--ink-soft)' }
          }>
          自定义
        </button>
        {customMode && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-[var(--radius)] border text-sm font-mono focus:outline-none"
              style={{ borderColor: 'var(--line)', background: 'var(--bg)' }} />
            <span className="text-sm" style={{ color: 'var(--ink-faint)' }}>至</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-[var(--radius)] border text-sm font-mono focus:outline-none"
              style={{ borderColor: 'var(--line)', background: 'var(--bg)' }} />
          </div>
        )}
      </div>

      {loading ? (
        <ReviewSkeleton />
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-sm" style={{ color: 'var(--ink-soft)' }}>这个时间段没有关键判断记录</p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>买入、卖出、修正判断类型的记录会出现在这里</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="flex items-center gap-5 mb-5 text-xs">
            <span style={{ color: 'var(--ink-soft)' }}>共 <span className="font-mono font-medium">{entries.length}</span> 条关键判断</span>
            {confirmed > 0 && <span className="text-positive flex items-center gap-1"><CheckCircle size={13} /> {confirmed} 逻辑证实</span>}
            {pending > 0 && <span className="flex items-center gap-1" style={{ color: 'var(--gold)' }}><Clock size={13} /> {pending} 待验证</span>}
            {wrong > 0 && <span className="text-negative flex items-center gap-1"><XCircle size={13} /> {wrong} 逻辑证伪</span>}
          </div>

          {/* Entry list */}
          <div className="flex flex-col gap-3">
            {entries.map(entry => (
              <ScorecardEntry key={entry.id} entry={entry} onVerdict={handleVerdict} />
            ))}
          </div>
        </>
      )}

      {/* Discipline Audit */}
      {!loading && allEntries.length > 0 && <DisciplineAudit allEntries={allEntries} anchors={anchors} startDate={startDate} endDate={endDate} />}

      {/* Review Note */}
      {!loading && <ReviewNote key={`${startDate}-${endDate}`} reviewNote={reviewNote} startDate={startDate} endDate={endDate} onSaved={setReviewNote} />}
    </div>
  );
}
