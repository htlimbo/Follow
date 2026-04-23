import { useState } from 'react';
import { Edit3, Save, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { formatMoney } from '../../utils';

const STATUS_OPTIONS = [
  { key: 'holding', label: '持仓' },
  { key: 'watching', label: '观察' },
  { key: 'closed', label: '已清仓' },
];

export default function ResearchCard({ stock, onSave, onClose }) {
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
    if (form.status === 'closed' && stock.status === 'holding' && onClose) {
      const cost = parseFloat(stock.costPrice);
      const current = parseFloat(stock.currentPrice);
      const shares = parseFloat(stock.shares);
      if (!isNaN(cost) && !isNaN(current) && !isNaN(shares) && cost !== 0 && shares > 0) {
        const pnl = (current - cost) * shares;
        const pnlPct = ((current - cost) / Math.abs(cost) * 100).toFixed(2);
        onClose({
          content: `清仓总结：成本价 ${cost}，清仓价 ${current}，持仓 ${shares} 股，盈亏 ${pnl >= 0 ? '+' : ''}${formatMoney(pnl)}（${pnlPct}%）`,
          price: String(current),
        });
      }
    }
    await onSave(form);
    setEditing(false);
  }

  function resetForm() {
    setEditing(false);
    setForm({
      thesis: stock.thesis || '', bullCase: stock.bullCase || '', bearCase: stock.bearCase || '',
      costPrice: stock.costPrice || '', currentPrice: stock.currentPrice || '',
      shares: stock.shares || '', status: stock.status || 'holding',
    });
  }

  return (
    <div className="mt-7">
      {/* Section label */}
      <div className="font-serif text-sm font-semibold flex items-center justify-between mb-2.5">
        <span
          className={!editing ? 'cursor-pointer' : ''}
          onClick={() => !editing && setExpanded(!expanded)}
        >
          研究摘要
          {!editing && (
            <span className="ml-2 inline-block text-[var(--ink-faint)]">
              {expanded ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />}
            </span>
          )}
        </span>
        {!editing && (
          <button onClick={() => { setEditing(true); setExpanded(true); }}
            className="text-[var(--ink-faint)] hover:text-[var(--accent)] bg-transparent border-0 cursor-pointer p-1">
            <Edit3 size={14} />
          </button>
        )}
      </div>

      {expanded && !editing && (
        <div>
          {/* Thesis */}
          {form.thesis ? (
            <div className="font-serif text-sm leading-[1.8] text-[var(--ink)] p-3.5 bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius)] tracking-wide mb-4">
              <span className="float-left text-[32px] leading-[0.9] pr-1.5 pt-1 text-[var(--accent)] font-semibold">
                {form.thesis.charAt(0)}
              </span>
              {form.thesis.slice(1)}
            </div>
          ) : (
            <p className="text-sm text-[var(--ink-faint)] italic mb-4">还没有写投资逻辑</p>
          )}

          {/* Bull / Bear */}
          {(form.bullCase || form.bearCase) && (
            <>
              <div className="font-serif text-sm font-semibold mb-2.5">看多 & 风险</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {form.bullCase && (
                  <div className="p-3.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--bg-raised)]">
                    <div className="text-xs font-semibold tracking-wider uppercase mb-2.5 flex items-center gap-1.5 text-positive">
                      <Check size={12} /> 看好理由
                    </div>
                    <div className="font-serif text-[13px] leading-[1.7] text-[var(--ink)] whitespace-pre-wrap">{form.bullCase}</div>
                  </div>
                )}
                {form.bearCase && (
                  <div className="p-3.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--bg-raised)]">
                    <div className="text-xs font-semibold tracking-wider uppercase mb-2.5 flex items-center gap-1.5 text-negative">
                      <X size={12} /> 风险点
                    </div>
                    <div className="font-serif text-[13px] leading-[1.7] text-[var(--ink)] whitespace-pre-wrap">{form.bearCase}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Editing form */}
      {expanded && editing && (
        <div>
          {/* Price grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">成本价</label>
              <input type="text" value={form.costPrice} onChange={e => setForm(f => ({...f, costPrice: e.target.value}))}
                className="w-full px-2.5 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">现价</label>
              <input type="text" value={form.currentPrice} onChange={e => setForm(f => ({...f, currentPrice: e.target.value}))}
                className="w-full px-2.5 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">持仓数量</label>
              <input type="text" value={form.shares} onChange={e => setForm(f => ({...f, shares: e.target.value}))} placeholder="股数"
                className="w-full px-2.5 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-mono focus:outline-none focus:border-[var(--accent)]" />
            </div>
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">状态</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.key} type="button" onClick={() => setForm(f => ({...f, status: opt.key}))}
                  className={`flex-1 py-1.5 rounded-[var(--radius)] text-sm font-medium border transition-colors cursor-pointer ${
                    form.status === opt.key
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--bg-sunken)] bg-transparent'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thesis */}
          <div className="mb-4">
            <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">投资逻辑</label>
            <textarea value={form.thesis} onChange={e => setForm(f => ({...f, thesis: e.target.value}))}
              rows={3} placeholder="这家公司为什么值得关注？核心逻辑是什么？"
              className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-serif leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-none" />
          </div>

          {/* Bull / Bear */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">看好理由</label>
              <textarea value={form.bullCase} onChange={e => setForm(f => ({...f, bullCase: e.target.value}))}
                rows={3} placeholder="为什么看好？"
                className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-serif leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">风险点</label>
              <textarea value={form.bearCase} onChange={e => setForm(f => ({...f, bearCase: e.target.value}))}
                rows={3} placeholder="主要风险是什么？"
                className="w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm font-serif leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border-0"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
              <Save size={14} /> 保存
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 rounded-full text-sm text-[var(--ink-soft)] bg-transparent border-0 cursor-pointer hover:text-[var(--ink)] transition-colors">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
