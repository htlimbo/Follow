import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { saveReview } from '../../store';

export default function ReviewNote({ reviewNote, startDate, endDate, onSaved }) {
  const [draft, setDraft] = useState(reviewNote?.summary || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveReview({
        id: reviewNote?.id || null,
        periodStart: startDate,
        periodEnd: endDate,
        summary: draft,
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
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">复盘总结</h2>
      <div className="bg-surface rounded-xl border border-border p-4">
        <textarea
          value={draft}
          onChange={e => { setDraft(e.target.value); setSaved(false); }}
          rows={6}
          placeholder={"这个阶段最大的收获是...\n犯的最大的错误是...\n下个阶段要注意的是..."}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none mb-3 leading-relaxed"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            <Save size={14} /> {saving ? '保存中...' : '保存复盘'}
          </button>
          {saved && (
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
  );
}
