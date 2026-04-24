import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Save, X } from 'lucide-react';
import { getJournals, addJournal, updateJournal, deleteJournal } from '../store';
import { formatDate } from '../utils';

const DEFAULT_TAGS = ['宏观思考', '策略复盘', '市场情绪', '读书笔记', '交易纪律', '生活感悟'];

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | journal.id
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [filterTag, setFilterTag] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    getJournals()
      .then(setJournals)
      .catch(err => console.error('Failed to load journals:', err))
      .finally(() => setLoading(false));
  }, []);

  // All unique tags across journals
  const allTags = [...new Set(journals.flatMap(j => j.tags || []))];

  const filtered = filterTag
    ? journals.filter(j => j.tags?.includes(filterTag))
    : journals;

  function startNew() {
    setEditing('new');
    setTitle('');
    setContent('');
    setSelectedTags([]);
  }

  function startEdit(journal) {
    setEditing(journal.id);
    setTitle(journal.title);
    setContent(journal.content);
    setSelectedTags(journal.tags || []);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle('');
    setContent('');
    setSelectedTags([]);
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTagHandler() {
    const tag = customTag.trim().replace(/^#/, '');
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setCustomTag('');
    setShowTagInput(false);
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return;
    try {
      if (editing === 'new') {
        const journal = await addJournal({
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags,
        });
        setJournals(prev => [journal, ...prev]);
      } else {
        const updated = await updateJournal(editing, {
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags,
        });
        setJournals(prev => prev.map(j => j.id === editing ? updated : j));
      }
      cancelEdit();
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteJournal(id);
      setJournals(prev => prev.filter(j => j.id !== id));
      setDeleteConfirm(null);
      if (editing === id) cancelEdit();
    } catch (err) {
      console.error('Failed to delete journal:', err);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-5 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="text-[11px] tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--ink-faint)' }}>
          Writing Journal
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[26px] font-semibold tracking-tight">写作日志</h1>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              记录与个股无关的思考、复盘总结、阅读笔记。
            </p>
          </div>
          {editing === null && (
            <button onClick={startNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium cursor-pointer border-0 transition-colors"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
              <Plus size={14} /> 写一篇
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && editing === null && (
        <div className="flex flex-wrap gap-1.5 mt-4 mb-2">
          <button onClick={() => setFilterTag(null)}
            className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border-0 transition-colors"
            style={filterTag === null
              ? { background: 'var(--bg-sunken)', color: 'var(--ink)' }
              : { background: 'transparent', color: 'var(--ink-soft)' }
            }>
            全部
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border-0 transition-colors"
              style={filterTag === tag
                ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                : { background: 'transparent', color: 'var(--ink-soft)' }
              }>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing !== null && (
        <div className="mt-5 rounded-[var(--radius-lg)] border p-5"
          style={{ background: 'var(--bg-raised)', borderColor: 'color-mix(in oklch, var(--accent) 30%, var(--line))' }}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="标题"
            autoFocus
            className="w-full text-xl font-serif font-semibold border-0 bg-transparent focus:outline-none mb-3 tracking-tight"
            style={{ color: 'var(--ink)' }}
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder="写下你的思考..."
            className="w-full px-0 py-0 border-0 bg-transparent text-sm font-serif leading-[1.8] focus:outline-none resize-y mb-4"
            style={{ color: 'var(--ink)' }}
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
            <Tag size={12} style={{ color: 'var(--ink-faint)' }} />
            {DEFAULT_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                className="px-2 py-0.5 rounded-full text-xs transition-colors cursor-pointer border-0"
                style={selectedTags.includes(tag)
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 500 }
                  : { background: 'transparent', color: 'var(--ink-faint)' }
                }>
                {tag}
              </button>
            ))}
            {selectedTags.filter(t => !DEFAULT_TAGS.includes(t)).map(t => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                className="px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0"
                style={{ background: 'var(--bg-sunken)', color: 'var(--ink-soft)' }}>
                #{t}
              </button>
            ))}
            {showTagInput ? (
              <input type="text" value={customTag} onChange={e => setCustomTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTagHandler(); } if (e.key === 'Escape') setShowTagInput(false); }}
                onBlur={addCustomTagHandler}
                placeholder="自定义标签"
                autoFocus
                className="w-20 px-1.5 py-0.5 rounded-[var(--radius)] border text-xs focus:outline-none"
                style={{ borderColor: 'var(--line)' }} />
            ) : (
              <button type="button" onClick={() => setShowTagInput(true)}
                className="px-1.5 py-0.5 rounded-full text-xs cursor-pointer border-0 bg-transparent"
                style={{ color: 'var(--ink-faint)' }}>
                +自定义
              </button>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2">
            <button onClick={handleSave}
              disabled={!title.trim() && !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer border-0"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
              <Save size={14} /> 保存
            </button>
            <button onClick={cancelEdit}
              className="px-4 py-2 rounded-full text-sm bg-transparent border-0 cursor-pointer transition-colors"
              style={{ color: 'var(--ink-soft)' }}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* Journal list */}
      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>加载中...</div>
      ) : filtered.length === 0 && editing === null ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-sunken)', color: 'var(--ink-faint)' }}>
            <JournalIcon size={24} />
          </div>
          <p className="font-serif text-sm" style={{ color: 'var(--ink-soft)' }}>
            {filterTag ? `没有标记为 #${filterTag} 的文章` : '还没有写过日志'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--ink-faint)' }}>
            记录你的投资心得、阅读笔记、策略思考
          </p>
          {!filterTag && (
            <button onClick={startNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-full text-sm font-medium cursor-pointer border-0 transition-colors"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
              <Plus size={14} /> 写下第一篇
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-5">
          {filtered.map(journal => (
            <article key={journal.id}
              className="rounded-[var(--radius-lg)] border p-5 cursor-pointer transition-all"
              style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
              onClick={() => { if (editing === null) startEdit(journal); }}
              onMouseEnter={e => { if (editing === null) e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-lg font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
                    {journal.title || '无标题'}
                  </h2>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--ink-faint)' }}>
                    {formatDate(journal.createdAt)}
                    {journal.updatedAt !== journal.createdAt && ' · 已编辑'}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteConfirm(journal.id); }}
                  className="w-[26px] h-[26px] grid place-items-center rounded-md bg-transparent border-0 cursor-pointer transition-colors shrink-0"
                  style={{ color: 'var(--ink-faint)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--loss)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Content preview */}
              <p className="font-serif text-[13.5px] leading-[1.7] line-clamp-3 mb-3" style={{ color: 'var(--ink-soft)' }}>
                {journal.content}
              </p>

              {/* Tags */}
              {journal.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {journal.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[11px]"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.2_0.02_60/0.35)] backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}>
          <div className="rounded-[var(--radius-lg)] border shadow-lg w-full max-w-sm mx-4 p-6"
            style={{ background: 'var(--bg-raised)', borderColor: 'var(--line)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--ink-soft)' }}>删除这篇日志？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-full text-sm bg-transparent border-0 cursor-pointer transition-colors"
                style={{ color: 'var(--ink-soft)' }}>取消</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-full text-sm font-medium border-0 cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: 'var(--loss)', color: 'white' }}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline icon for empty state
function JournalIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
