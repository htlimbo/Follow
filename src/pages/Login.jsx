import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('注册成功！请检查邮箱确认链接。');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp size={28} className="text-accent" />
          <span className="text-2xl font-semibold tracking-tight">Follow</span>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-1 text-center">
            {isSignUp ? '创建账号' : '登录'}
          </h2>
          <p className="text-sm text-text-secondary text-center mb-5">
            {isSignUp ? '注册后开始记录你的投资思考' : '登录以访问你的投资记录'}
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-negative-light text-negative text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-positive-light text-positive text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少6位"
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
              className="text-sm text-accent hover:underline"
            >
              {isSignUp ? '已有账号？去登录' : '没有账号？注册一个'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
