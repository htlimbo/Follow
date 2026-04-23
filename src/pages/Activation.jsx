import { useState } from 'react';
import { Key, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Wordmark } from '../components/ui/Logo';

export default function Activation({ onActivated, onActivate, onBack }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleActivate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await onActivate(key);
      if (result.success) {
        onActivated();
      } else {
        setError(result.error);
      }
    } catch {
      setError('激活失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Back button (only during trial, not when expired) */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text mb-4 transition-colors"
          >
            <ArrowLeft size={14} />
            返回
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Wordmark size={28} textClass="text-xl" />
        </div>

        {/* Expired notice */}
        <div className="rounded-xl border bg-negative-light border-negative/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-negative" />
            <span className="text-sm font-medium text-negative">试用已到期</span>
          </div>
          <p className="text-xs text-text-secondary">
            7 天免费试用已结束，请输入 License Key 继续使用
          </p>
        </div>

        {/* Activation form */}
        <form onSubmit={handleActivate} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              <Key size={13} className="inline mr-1" />
              License Key
            </label>
            <input
              type="text"
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder="输入激活码"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors font-mono"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={!key.trim() || loading}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '验证中...' : '激活'}
          </button>
        </form>

        <p className="text-center text-xs text-text-tertiary mt-8">
          还没有 License？
          <a href="https://github.com/htlimbo/Follow" target="_blank" rel="noreferrer"
            className="text-accent hover:underline ml-1">了解更多</a>
        </p>
      </div>
    </div>
  );
}
