// 共享网络逻辑：行情刷新 + 股票搜索（腾讯财经 API）
// 这些函数与存储层无关，supabase.js 和 sqlite.js 都复用。

// A 股市场前缀路由：覆盖股票 + ETF + 转债 + B股
// 沪市（s_sh）：6xx 股票 / 5xx ETF / 11x 转债 / 9xx B股
// 深市（s_sz）：0xx/3xx 股票 / 1[5-8]x ETF / 12x 转债
export function getQtPrefix(code) {
  if (/^\d{5}$/.test(code)) return 'r_hk';
  if (!/^\d{6}$/.test(code)) return null;
  if (/^(6|5|9|113|110|11[8-9])/.test(code)) return 's_sh';
  if (/^(0|3|1[5-8]|12)/.test(code)) return 's_sz';
  return null;
}

function buildQtSymbols(stocks) {
  return stocks.map(s => {
    const prefix = getQtPrefix(s.code);
    return prefix ? `${prefix}${s.code}` : null;
  }).filter(Boolean);
}

function parseQtResponse(text) {
  const prices = {};
  const lines = text.split('\n').filter(l => l.includes('='));
  for (const line of lines) {
    const match = line.match(/v_\w+="(.+)"/);
    if (!match) continue;
    const fields = match[1].split('~');
    const name = fields[1];
    const code = fields[2];
    const price = parseFloat(fields[3]);
    if (name && code && !isNaN(price) && price > 0) {
      const change = parseFloat(fields[5]) || parseFloat(fields[32]) || 0;
      prices[code] = { price, change, name };
    }
  }
  return prices;
}

/**
 * 从腾讯财经 API 获取实时行情（仅网络请求，不写库）
 * @returns {{ [code: string]: { price: number, change: number, name: string } }}
 */
export async function fetchQuotes(stocks) {
  const quotable = stocks.filter(s => getQtPrefix(s.code));
  if (quotable.length === 0) return {};

  const symbols = buildQtSymbols(quotable);
  if (symbols.length === 0) return {};
  const url = `https://qt.gtimg.cn/q=${symbols.join(',')}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buf);
    return parseQtResponse(text);
  } catch { return {}; }
}

/**
 * 搜索/验证股票代码（纯网络请求）
 */
export async function searchStock(code) {
  code = code.trim();
  if (!code) return null;

  let symbol = null;
  let market = null;
  let normalizedCode = code;

  if (/^\d{6}$/.test(code)) {
    const prefix = getQtPrefix(code);
    if (prefix === 's_sh' || prefix === 's_sz') {
      symbol = `${prefix}${code}`;
      market = 'A';
    }
  }

  if (!symbol) {
    const hkMatch = code.match(/^(\d{1,5})(\.HK)?$/i);
    if (hkMatch) {
      normalizedCode = hkMatch[1].padStart(5, '0');
      symbol = `r_hk${normalizedCode}`;
      market = 'HK';
    }
  }

  if (!symbol) return null;

  try {
    const res = await fetch(`https://qt.gtimg.cn/q=${symbol}`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buf);
    const prices = parseQtResponse(text);
    const keys = Object.keys(prices);
    if (keys.length > 0) {
      const item = prices[keys[0]];
      return { code: keys[0], name: item.name, market };
    }
  } catch { /* ignore */ }

  return null;
}
