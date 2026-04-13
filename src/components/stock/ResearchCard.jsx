import { useState } from 'react';
import { Edit3, Save, ChevronDown, ChevronUp } from 'lucide-react';
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
    // 检测从持仓变为已清仓，自动生成盈亏快照
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

  const cost = parseFloat(form.costPrice);
  const current = parseFloat(form.currentPrice);
  const shares = parseFloat(form.shares);
  const hasPrice = !isNaN(cost) && !isNaN(current) && cost !== 0;
  const hasShares = !isNaN(shares) && shares > 0;
  const pnlPct = hasPrice ? ((current - cost) / Math.abs(cost) * 100) : null;
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
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
