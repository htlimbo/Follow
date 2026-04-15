import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { searchStock } from '../../store';
import { STATUS_CONFIG } from '../../utils';

export default function AddStockModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('holding');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // { code, name, market } | 'not_found'
  const searchTimer = useRef(null);

  function handleCodeChange(val) {
    setCode(val);
    setSearchResult(null);
    setName('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = val.trim();
    if (!trimmed) return;
    // 1-6位纯数字触发搜索（港股可输入 2400 等短代码）
    if (!/^\d{1,6}$/.test(trimmed)) return;
    // 短于5位时延迟更长，给用户继续输入的机会
    const delay = trimmed.length < 5 ? 1200 : trimmed.length === 5 ? 800 : 300;
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchStock(trimmed);
        setSearchResult(result || 'not_found');
        if (result) {
          setName(result.name);
        }
      } catch { setSearchResult('not_found'); }
      finally { setSearching(false); }
    }, delay);
  }

  const isValid = searchResult && searchResult !== 'not_found';

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    onAdd({ name: searchResult.name, code: searchResult.code, status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border shadow-lg w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">添加股票</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">股票代码</label>
            <input type="text" value={code} onChange={e => handleCodeChange(e.target.value)} placeholder="如：300750 或 00700" autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors" />
            {searching && <p className="text-xs text-text-tertiary mt-1">查询中...</p>}
            {searchResult === 'not_found' && <p className="text-xs text-negative mt-1">未找到该股票代码</p>}
            {searchResult && searchResult !== 'not_found' && (
              <p className="text-xs text-positive mt-1">
                {searchResult.name}（{searchResult.market === 'HK' ? '港股' : 'A股'}）
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">股票名称</label>
            <input type="text" value={name} readOnly placeholder="输入代码后自动填充"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-hover text-sm text-text-secondary cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">状态</label>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setStatus(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    status === key ? 'border-accent bg-accent-light text-accent' : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={!isValid}
            className="mt-1 w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            添加
          </button>
        </form>
      </div>
    </div>
  );
}
