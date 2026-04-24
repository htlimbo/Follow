import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { saveReview } from '../../store';

// Store reflection as part of summary with a separator
const REFLECTION_SEP = '\n---REFLECTION---\n';

function parseSummaryAndReflection(raw) {
  if (!raw) return { summary: '', reflection: '' };
  const idx = raw.indexOf(REFLECTION_SEP);
  if (idx === -1) return { summary: raw, reflection: '' };
  return { summary: raw.slice(0, idx), reflection: raw.slice(idx + REFLECTION_SEP.length) };
}

function combineSummaryAndReflection(summary, reflection) {
  if (!reflection.trim()) return summary;
  return summary + REFLECTION_SEP + reflection;
}

export default function ReviewNote({ reviewNote, startDate, endDate, onSaved }) {
  const parsed = parseSummaryAndReflection(reviewNote?.summary);
  const [draft, setDraft] = useState(parsed.summary);
  const [reflection, setReflection] = useState(parsed.reflection);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const combined = combineSummaryAndReflection(draft, reflection);
      const result = await saveReview({
        id: reviewNote?.id || null,
        periodStart: startDate,
        periodEnd: endDate,
        summary: combined,
      });
      onSaved(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save review note:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Review summary */}
      <div>
        <div className="text-[11px] tracking-widest uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>Review Summary</div>
        <div className="font-serif text-lg font-semibold mb-4">复盘总结</div>
        <div className="rounded-[var(--radius-lg)] border p-5" style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}>
          <textarea
            value={draft}
            onChange={e => { setDraft(e.target.value); setSaved(false); }}
            rows={5}
            placeholder={"这个阶段最大的收获是...\n犯的最大的错误是...\n下个阶段要注意的是..."}
            className="w-full px-3 py-2.5 rounded-[var(--radius)] border text-sm font-serif leading-relaxed focus:outline-none resize-none"
            style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
          />
        </div>
      </div>

      {/* "回到过去" reflection */}
      <div>
        <div className="text-[11px] tracking-widest uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>Time Travel</div>
        <div className="font-serif text-lg font-semibold mb-1">回到过去</div>
        <p className="text-[13px] mb-4" style={{ color: 'var(--ink-soft)' }}>如果回到这段时间的开始，带着现在的认知，你会做出什么不同的决定？</p>
        <div className="rounded-[var(--radius-lg)] border p-5"
          style={{ background: 'var(--bg-raised)', borderColor: 'color-mix(in oklch, var(--accent) 25%, var(--line))' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-serif text-sm font-medium" style={{ color: 'var(--accent)' }}>如果回到过去，我会改进什么？</span>
          </div>
          <textarea
            value={reflection}
            onChange={e => { setReflection(e.target.value); setSaved(false); }}
            rows={4}
            placeholder={"我会在更早的时候注意到...\n我不应该在那个时候...\n下一次遇到类似情况，我会..."}
            className="w-full px-3 py-2.5 rounded-[var(--radius)] border text-sm font-serif leading-relaxed focus:outline-none resize-none"
            style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
          />
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer border-0"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          <Save size={14} /> {saving ? '保存中...' : '保存复盘'}
        </button>
        {saved && (
          <span className="text-xs text-positive flex items-center gap-1">
            <CheckCircle size={13} /> 已保存
          </span>
        )}
        {reviewNote && (
          <span className="text-xs ml-auto font-mono" style={{ color: 'var(--ink-faint)' }}>
            上次保存: {new Date(reviewNote.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
