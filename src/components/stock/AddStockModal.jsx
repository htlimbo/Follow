import { useState, useRef } from 'react';
import { searchStock } from '../../store';
import { detectInstrumentType } from '../../utils';

export default function AddStockModal({ onClose, onAdd, existingCodes = [] }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('watching');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const searchTimer = useRef(null);

  function handleCodeChange(val) {
    setCode(val);
    setSearchResult(null);
    setName('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!/^\d{1,6}$/.test(trimmed)) return;
    const delay = trimmed.length < 5 ? 1200 : trimmed.length === 5 ? 800 : 300;
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchStock(trimmed);
        setSearchResult(result || 'not_found');
        if (result) setName(result.name);
      } catch { setSearchResult('not_found'); }
      finally { setSearching(false); }
    }, delay);
  }

  const isValid = searchResult && searchResult !== 'not_found';
  const isDuplicate = isValid && existingCodes.includes(searchResult.code);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || isDuplicate) return;
    const type = detectInstrumentType(searchResult.code);
    onAdd({ name: searchResult.name, code: searchResult.code, status, type });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.2_0.02_60/0.35)] backdrop-blur-md animate-[fadeIn_0.2s]" onClick={onClose}>
      <div
        className="w-[460px] max-w-[92%] bg-[var(--bg-raised)] border border-[var(--line)] rounded-[var(--radius-lg)] overflow-hidden animate-[modalIn_0.25s_cubic-bezier(.2,.8,.2,1)]"
        style={{ boxShadow: '0 20px 60px oklch(0.2 0.02 60 / 0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Head */}
        <div className="px-6 pt-5 pb-1.5">
          <div className="font-serif text-xl font-semibold">添加到组合</div>
          <div className="text-[12.5px] text-[var(--ink-soft)] mt-1">
            先记录观察，买入后再转为持仓 —— 记录每一次决策。
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-4 pb-0">
            {/* Code input */}
            <div className="mb-3.5">
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">
                股票代码 / 名称
              </label>
              <input
                type="text"
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="搜索 002460 或 赣锋锂业…"
                autoFocus
                className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {searching && <p className="text-xs text-[var(--ink-faint)] mt-1.5">查询中...</p>}
              {searchResult === 'not_found' && <p className="text-xs text-[var(--loss)] mt-1.5">未找到该股票代码</p>}
              {isDuplicate && <p className="text-xs text-[var(--loss)] mt-1.5">该股票已在组合中，不能重复添加</p>}
              {isValid && (() => {
                const isEtf = detectInstrumentType(searchResult.code) === 'etf';
                let marketLabel;
                if (searchResult.market === 'HK') {
                  marketLabel = 'HK · 港股';
                } else if (/^(6|5|9|113|110|11[8-9])/.test(searchResult.code)) {
                  marketLabel = 'SH · 沪市';
                } else {
                  marketLabel = 'SZ · 深市';
                }
                return (
                  <div className="mt-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--bg)] overflow-hidden">
                    <div className="flex items-baseline justify-between px-3.5 py-2.5 bg-[var(--accent-soft)]">
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-sm">{searchResult.name}</span>
                        {isEtf && (
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                          >
                            ETF
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-[var(--ink-faint)]">{searchResult.code}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--ink-soft)]">{marketLabel}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Status choice */}
            <div className="mb-3.5">
              <label className="block text-[11px] text-[var(--ink-faint)] tracking-widest uppercase mb-1.5">
                加入方式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('watching')}
                  className={`text-left p-3 rounded-[var(--radius)] border transition-colors cursor-pointer ${
                    status === 'watching'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--ink-faint)]'
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">仅观察</div>
                  <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">追踪价格变化，尚未买入</div>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('holding')}
                  className={`text-left p-3 rounded-[var(--radius)] border transition-colors cursor-pointer ${
                    status === 'holding'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--ink-faint)]'
                  }`}
                >
                  <div className="font-serif text-sm font-semibold">已持仓</div>
                  <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">填写成本价与数量</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--line)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[13px] font-medium text-[var(--ink-soft)] bg-transparent border-0 cursor-pointer hover:text-[var(--ink)] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!isValid || isDuplicate}
              className="px-4 py-2 rounded-full text-[13px] font-medium border-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
