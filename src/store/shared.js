// 共享网络逻辑：行情刷新 + 股票搜索（腾讯财经 API）
// 这些函数与存储层无关，supabase.js 和 sqlite.js 都复用。

function buildQtSymbols(stocks) {
  // A股：s_sh600519（沪）/ s_sz300750（深）；港股：r_hk00700
  return stocks.map(s => {
    if (/^\d{5}$/.test(s.code)) return `r_hk${s.code}`;
    if (/^\d{6}$/.test(s.code)) return s.code.startsWith('6') ? `s_sh${s.code}` : `s_sz${s.code}`;
    return null;
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
  const aStocks = stocks.filter(s => /^\d{6}$/.test(s.code));
  const hkStocks = stocks.filter(s => /^\d{5}$/.test(s.code));
  const allQuotable = [...aStocks, ...hkStocks];
  if (allQuotable.length === 0) return {};

  const symbols = buildQtSymbols(allQuotable);
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

  if (/^\d{6}$/.test(code)) {
    symbol = code.startsWith('6') ? `s_sh${code}` : `s_sz${code}`;
    market = 'A';
  }

  if (!symbol) {
    const hkMatch = code.match(/^(\d{1,5})(\.HK)?$/i);
    if (hkMatch) {
      const hkCode = hkMatch[1].padStart(5, '0');
      symbol = `r_hk${hkCode}`;
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
