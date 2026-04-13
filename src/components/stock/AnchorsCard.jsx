import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import { getAnchors, addAnchor, updateAnchor, deleteAnchor } from '../../store';

const FREQ_OPTIONS = ['月度', '季度', '半年度', '年度', '不定期'];

export default function AnchorsCard({ stockId }) {
  const [anchors, setAnchors] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newAnchor, setNewAnchor] = useState({ name: '', expected: '', frequency: '季度', latestValue: '', latestDate: '', note: '' });
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    getAnchors(stockId).then(setAnchors);
  }, [stockId]);

  async function handleAdd() {
    if (!newAnchor.name.trim()) return;
    const anchor = await addAnchor(stockId, { ...newAnchor, name: newAnchor.name.trim() });
    setAnchors(prev => [...prev, anchor]);
    setAdding(false);
    setNewAnchor({ name: '', expected: '', frequency: '季度', latestValue: '', latestDate: '', note: '' });
  }

  async function handleDelete(id) {
    await deleteAnchor(id);
    setAnchors(prev => prev.filter(a => a.id !== id));
  }

  function startEdit(anchor) {
    setEditingId(anchor.id);
    setEditForm({ ...anchor });
  }

  async function saveEdit() {
    const updated = await updateAnchor(editingId, editForm);
    setAnchors(prev => prev.map(a => a.id === editingId ? updated : a));
    setEditingId(null);
  }

  return (
    <div className="bg-surface rounded-xl border border-border mb-6">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <Crosshair size={14} /> 关键追踪锚
        </h2>
        <div className="flex items-center gap-2">
          {!adding && (
            <button onClick={e => { e.stopPropagation(); setAdding(true); setExpanded(true); }}
              className="text-text-tertiary hover:text-accent p-1 rounded-lg hover:bg-surface-hover transition-colors">
              <Plus size={15} />
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {anchors.length === 0 && !adding && (
            <p className="text-sm text-text-tertiary italic mb-2">
              还没有追踪锚。添加你关注的业务指标，如出货量、毛利率、海外收入占比等。
            </p>
          )}

          {anchors.map(anchor => (
            <div key={anchor.id} className="border border-border-light rounded-lg p-3 mb-2 group">
              {editingId === anchor.id ? (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                      placeholder="指标名称" className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                    <select value={editForm.frequency} onChange={e => setEditForm(f => ({...f, frequency: e.target.value}))}
                      className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent bg-surface">
                      {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <input value={editForm.expected} onChange={e => setEditForm(f => ({...f, expected: e.target.value}))}
                    placeholder="预期值/预期范围" className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.latestValue} onChange={e => setEditForm(f => ({...f, latestValue: e.target.value}))}
                      placeholder="最新实际值" className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                    <input type="date" value={editForm.latestDate} onChange={e => setEditForm(f => ({...f, latestDate: e.target.value}))}
                      className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <textarea value={editForm.note} onChange={e => setEditForm(f => ({...f, note: e.target.value}))}
                    rows={2} placeholder="备注" className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium">保存</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-hover">取消</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{anchor.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-text-tertiary">{anchor.frequency}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(anchor)} className="text-text-tertiary hover:text-accent p-0.5 rounded"><Edit3 size={12} /></button>
                      <button onClick={() => handleDelete(anchor.id)} className="text-text-tertiary hover:text-negative p-0.5 rounded"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3 text-sm">
                    {anchor.expected && <span className="text-text-tertiary">预期: <span className="text-text-secondary">{anchor.expected}</span></span>}
                    {anchor.latestValue && (
                      <span className="text-text-tertiary">实际: <span className="text-text font-medium">{anchor.latestValue}</span></span>
                    )}
                    {anchor.latestDate && <span className="text-xs text-text-tertiary">{anchor.latestDate}</span>}
                  </div>
                  {anchor.note && <p className="text-xs text-text-tertiary mt-1">{anchor.note}</p>}
                </div>
              )}
            </div>
          ))}

          {adding && (
            <div className="border border-accent/30 rounded-lg p-3 mt-2">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={newAnchor.name} onChange={e => setNewAnchor(f => ({...f, name: e.target.value}))}
                    placeholder="指标名称，如：季度出货量" autoFocus
                    className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                  <select value={newAnchor.frequency} onChange={e => setNewAnchor(f => ({...f, frequency: e.target.value}))}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent bg-surface">
                    {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <input value={newAnchor.expected} onChange={e => setNewAnchor(f => ({...f, expected: e.target.value}))}
                  placeholder="预期值/预期范围，如：毛利率 > 25%"
                  className="px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
                <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={!newAnchor.name.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium disabled:opacity-40">添加</button>
                  <button onClick={() => setAdding(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-hover">取消</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
