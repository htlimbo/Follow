import { useState } from 'react';
import { TrendingUp, BookOpen, Anchor, ClipboardCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FEATURES = [
  {
    icon: BookOpen,
    title: '思考时间线',
    desc: '记录每一次买入、卖出、修正判断背后的想法，而不只是交易数字',
  },
  {
    icon: Anchor,
    title: '关键追踪锚',
    desc: '用基本面指标替代止盈止损线，跟踪出货量、毛利率等真正重要的数据',
  },
  {
    icon: ClipboardCheck,
    title: '阶段复盘',
    desc: '定期回顾判断兑现率和操作纪律，让每一次复盘都有据可依',
  },
];

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
    <div className="min-h-screen flex flex-col">
      {/* Hero + Login */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left: Hero */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <TrendingUp size={32} className="text-accent" />
              <span className="text-3xl font-semibold tracking-tight">Follow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4">
              记录你的投资思考，<br />而不只是交易记录
            </h1>
            <p className="text-text-secondary leading-relaxed mb-8">
              面向 A 股 + 港股个人投资者的研究与持仓管理工具。把每一次判断和修正沉淀下来，复盘时还原你的决策链路。
            </p>

            <div className="flex flex-col gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                    <f.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5">{f.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login form */}
          <div className="md:pt-12">
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

            <p className="text-xs text-text-tertiary text-center mt-4">
              免费使用 · 数据存储在云端 · 支持添加到手机主屏幕
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-text-tertiary">
        <a href="https://github.com/htlimbo/Follow" target="_blank" rel="noopener noreferrer" className="hover:text-text-secondary transition-colors">
          GitHub
        </a>
        <span className="mx-2">·</span>
        <span>A 股 + 港股实时行情</span>
        <span className="mx-2">·</span>
        <span>MIT License</span>
      </footer>
    </div>
  );
}
