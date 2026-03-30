import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Trash2, Plus, Save,
  Brain, ShoppingCart, LogOut, RefreshCw, Shield,
  ChevronDown, ChevronUp, Crosshair
} from 'lucide-react';
import {
  getStock, updateStock, deleteStock,
  getEntries, addEntry, deleteEntry,
  getAnchors, addAnchor, updateAnchor, deleteAnchor,
} from '../store';

const ENTRY_TYPES = {
  thought: { label: '思考', icon: Brain, color: 'text-accent', bg: 'bg-accent-light' },
  buy: { label: '买入', icon: ShoppingCart, color: 'text-positive', bg: 'bg-positive-light' },
  sell: { label: '卖出', icon: LogOut, color: 'text-negative', bg: 'bg-negative-light' },
  adjust: { label: '修正判断', icon: RefreshCw, color: 'text-warning', bg: 'bg-warning-light' },
  discipline: { label: '纪律执行', icon: Shield, color: 'text-accent', bg: 'bg-accent-light' },
};

const STATUS_OPTIONS = [
  { key: 'holding', label: '持仓' },
  { key: 'watching', label: '观察' },
  { key: 'closed', label: '已清仓' },
];

const FREQ_OPTIONS = ['月度', '季度', '半年度', '年度', '不定期'];

function formatMoney(value) {
  if (Math.abs(value) >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toFixed(2);
}

// ── Research Card ──
function ResearchCard({ stock, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    thesis: stock.thesis || '',
    bullCase: stock.bullCase || '',
    bearCase: stock.bearCase || '',
    costPrice: stock.costPrice || '',
    currentPrice: stock.currentPrice || '',
    shares: stock.shares || '',
    status: stock.status || 'holding',
  });
  const [expanded, setExpanded] = useState(true);

  async function handleSave() {
    await onSave(form);
    setEditing(false);
  }

  const cost = parseFloat(form.costPrice);
  const current = parseFloat(form.currentPrice);
  const shares = parseFloat(form.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost > 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / cost * 100) : null;
  const pnlAmount = hasPrice && hasShares ? (current - cost) * shares : null;
  const marketValue = !isNaN(current) && hasShares ? current * shares : null;

  return (
    <div className="bg-surface rounded-xl border border-border mb-6">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => !editing && setExpanded(!expanded)}>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">研究摘要</h2>
        <div className="flex items-center gap-2">
          {!editing && (
            <button onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(true); }}
              className="text-text-tertiary hover:text-accent p-1 rounded-lg hover:bg-surface-hover transition-colors">
              <Edit3 size={15} />
            </button>
          )}
          {!editing && (expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />)}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Price grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-text-tertiary mb-1">成本价</label>
              {editing ? (
                <input type="text" value={form.costPrice} onChange={e => setForm(f => ({...f, costPrice: e.target.value}))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
              ) : (
                <p className="text-sm font-mono">{form.costPrice || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">现价</label>
              {editing ? (
                <input type="text" value={form.currentPrice} onChange={e => setForm(f => ({...f, currentPrice: e.target.value}))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono">{form.currentPrice || '—'}</span>
                  {pnlPct !== null && (
                    <span className={`text-xs font-medium ${pnlPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">持仓数量</label>
              {editing ? (
                <input type="text" value={form.shares} onChange={e => setForm(f => ({...f, shares: e.target.value}))}
                  placeholder="股数"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent" />
              ) : (
                <p className="text-sm font-mono">{form.shares ? `${form.shares}股` : '—'}</p>
              )}
            </div>
          </div>

          {/* P&L summary (non-editing) */}
          {!editing && pnlAmount !== null && (
            <div className={`flex items-center gap-4 px-3 py-2.5 rounded-lg mb-4 ${pnlAmount >= 0 ? 'bg-positive-light' : 'bg-negative-light'}`}>
              <div>
                <span className="text-xs text-text-tertiary">盈亏金额</span>
                <p className={`text-base font-semibold ${pnlAmount >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {pnlAmount >= 0 ? '+' : ''}{formatMoney(pnlAmount)}
                </p>
              </div>
              {marketValue !== null && (
                <div>
                  <span className="text-xs text-text-tertiary">持仓市值</span>
                  <p className="text-base font-semibold">{formatMoney(marketValue)}</p>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          {editing && (
            <div className="mb-4">
              <label className="block text-xs text-text-tertiary mb-1.5">状态</label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.key} type="button" onClick={() => setForm(f => ({...f, status: opt.key}))}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.status === opt.key ? 'border-accent bg-accent-light text-accent' : 'border-border text-text-secondary hover:bg-surface-hover'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thesis */}
          <div className="mb-4">
            <label className="block text-xs text-text-tertiary mb-1">投资逻辑</label>
            {editing ? (
              <textarea value={form.thesis} onChange={e => setForm(f => ({...f, thesis: e.target.value}))}
                rows={3} placeholder="这家公司为什么值得关注？核心逻辑是什么？"
                className="w-full px-2.5 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none" />
            ) : (
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{form.thesis || '还没有写投资逻辑'}</p>
            )}
          </div>

          {/* Bull / Bear */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-text-tertiary mb-1">看好理由</label>
              {editing ? (
                <textarea value={form.bullCase} onChange={e => setForm(f => ({...f, bullCase: e.target.value}))}
                  rows={3} placeholder="为什么看好？"
                  className="w-full px-2.5 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none" />
              ) : (
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{form.bullCase || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">风险点</label>
              {editing ? (
                <textarea value={form.bearCase} onChange={e => setForm(f => ({...f, bearCase: e.target.value}))}
                  rows={3} placeholder="主要风险是什么？"
                  className="w-full px-2.5 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none" />
              ) : (
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{form.bearCase || '—'}</p>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex gap-2">
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
                <Save size={14} /> 保存
              </button>
              <button onClick={() => { setEditing(false); setForm({ thesis: stock.thesis || '', bullCase: stock.bullCase || '', bearCase: stock.bearCase || '', costPrice: stock.costPrice || '', currentPrice: stock.currentPrice || '', shares: stock.shares || '', status: stock.status || 'holding' }); }}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                取消
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tracking Anchors Card ──
function AnchorsCard({ stockId }) {
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

// ── Add Entry Form ──
function AddEntryForm({ onAdd, onCancel }) {
  const [type, setType] = useState('thought');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd({ type, content: content.trim(), price: price.trim() });
    setContent('');
    setPrice('');
    setType('thought');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-accent/30 p-4 mb-4">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(ENTRY_TYPES).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                type === key ? `${cfg.bg} ${cfg.color}` : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} autoFocus
        placeholder={type === 'thought' ? '记录此刻的想法...' : type === 'buy' ? '为什么在这个位置买入？' : type === 'sell' ? '为什么卖出？回头看这个决定...' : type === 'adjust' ? '判断发生了什么变化？' : '执行了什么纪律？'}
        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent resize-none mb-3" />
      {(type === 'buy' || type === 'sell') && (
        <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="成交价格（选填）"
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-accent mb-3" />
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          <Plus size={14} /> 记录
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">
          取消
        </button>
      </div>
    </form>
  );
}

// ── Timeline Entry ──
function TimelineEntry({ entry, onDelete }) {
  const cfg = ENTRY_TYPES[entry.type] || ENTRY_TYPES.thought;
  const Icon = cfg.icon;

  return (
    <div className="relative pl-8 pb-6 group">
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border-light" />
      <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center`}>
        <Icon size={12} className={cfg.color} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          {entry.price && <span className="text-xs text-text-tertiary font-mono">@ {entry.price}</span>}
          <span className="text-xs text-text-tertiary">{formatDate(entry.createdAt)}</span>
          <button onClick={() => onDelete(entry.id)}
            className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-negative p-0.5 rounded transition-all">
            <Trash2 size={12} />
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  if (hr < 24) return `${hr}小时前`;
  if (day < 7) return `${day}天前`;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// ── Main Page ──
export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await getStock(id);
        if (!s) { navigate('/'); return; }
        setStock(s);
        const e = await getEntries(id);
        setEntries(e);
      } catch (err) {
        console.error('Failed to load stock:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-tertiary">加载中...</p>
      </div>
    );
  }

  if (!stock) return null;

  async function handleSaveResearch(updates) {
    const updated = await updateStock(id, updates);
    setStock(updated);
  }

  async function handleAddEntry(data) {
    const entry = await addEntry({ stockId: id, ...data });
    setEntries(prev => [entry, ...prev]);
    setShowAddEntry(false);
  }

  async function handleDeleteEntry(entryId) {
    await deleteEntry(entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }

  async function handleDeleteStock() {
    await deleteStock(id);
    navigate('/');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-text-tertiary hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{stock.name}</h1>
            {stock.code && <p className="text-sm text-text-tertiary font-mono">{stock.code}</p>}
          </div>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)}
          className="text-text-tertiary hover:text-negative p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Research Card */}
      <ResearchCard stock={stock} onSave={handleSaveResearch} />

      {/* Tracking Anchors */}
      <AnchorsCard stockId={id} />

      {/* Timeline */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">思考时间线</h2>
        {!showAddEntry && (
          <button onClick={() => setShowAddEntry(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-light transition-colors">
            <Plus size={14} /> 记录想法
          </button>
        )}
      </div>

      {showAddEntry && <AddEntryForm onAdd={handleAddEntry} onCancel={() => setShowAddEntry(false)} />}

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Brain size={32} className="text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-1">还没有思考记录</p>
          <p className="text-xs text-text-tertiary">记录每一次判断和操作背后的想法</p>
        </div>
      ) : (
        <div className="mt-2">
          {entries.map(entry => (
            <TimelineEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-surface rounded-xl border border-border shadow-lg w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-text-secondary mb-5">删除「{stock.name}」及其所有思考记录？此操作不可撤销。</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">取消</button>
              <button onClick={handleDeleteStock} className="px-4 py-2 rounded-lg bg-negative text-white text-sm font-medium hover:opacity-90 transition-opacity">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
