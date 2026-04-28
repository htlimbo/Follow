// Shared utility functions

export function formatMoney(value) {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
}

export function formatPnl(value) {
  if (value >= 0) return `+${value.toFixed(2)}%`;
  return `${value.toFixed(2)}%`;
}

export function formatTime(iso) {
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
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function formatDate(iso) {
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

// 根据代码段位推断品种类型：A 股 ETF 使用 1[5-8] / 5[1,6,8] 段位
// HK 五位代码与股票同段位，无法区分，统一返回 stock，让用户后续手动改 type
export function detectInstrumentType(code) {
  if (/^(15|16|18|51|56|58)/.test(code)) return 'etf';
  return 'stock';
}

export function isTradingHour() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const time = now.getHours() * 60 + now.getMinutes();
  return time >= 555 && time <= 905; // 9:15 - 15:05
}

// Shared constants

export const STATUS_CONFIG = {
  holding: { label: '持仓', color: 'text-accent', bg: 'bg-accent-light' },
  watching: { label: '观察', color: 'text-warning', bg: 'bg-warning-light' },
  closed: { label: '已清仓', color: 'text-text-tertiary', bg: 'bg-surface-hover' },
};

export const ENTRY_TYPES = {
  thought: { label: '思考', color: 'text-accent', bg: 'bg-accent-light' },
  buy: { label: '买入', color: 'text-positive', bg: 'bg-positive-light' },
  sell: { label: '卖出', color: 'text-negative', bg: 'bg-negative-light' },
  adjust: { label: '修正判断', color: 'text-warning', bg: 'bg-warning-light' },
  discipline: { label: '纪律执行', color: 'text-accent', bg: 'bg-accent-light' },
};

export const LOGIC_TAGS = [
  { key: 'macro', label: '#宏观驱动', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'fundamental', label: '#基本面反转', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'sentiment', label: '#情绪博弈', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'arbitrage', label: '#套利', color: 'text-purple-600', bg: 'bg-purple-50' },
];

export const CHART_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#f43f5e', '#6366f1', '#0d9488'];
