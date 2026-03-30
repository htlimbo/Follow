/**
 * Vercel Serverless Function — 获取A股实时行情
 * 使用东方财富 push API，返回 JSON 格式的股票现价
 *
 * GET /api/quotes?codes=300750,600519,002594
 * Response: { "300750": { price: 218.30, change: 2.15, name: "宁德时代" }, ... }
 */
export default async function handler(req, res) {
  const { codes } = req.query;

  if (!codes) {
    return res.status(400).json({ error: 'Missing codes parameter' });
  }

  // 将股票代码转换为东方财富 secid 格式
  // 上海(6开头) → 1.XXXXXX，深圳(0/3开头) → 0.XXXXXX
  const codeList = codes.split(',').map(c => c.trim()).filter(Boolean);
  const secids = codeList
    .filter(code => /^\d{6}$/.test(code)) // 只处理6位纯数字的A股代码
    .map(code => (code.startsWith('6') ? `1.${code}` : `0.${code}`))
    .join(',');

  if (!secids) {
    return res.status(200).json({});
  }

  try {
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14&secids=${secids}`;
    const response = await fetch(url, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
    });
    const data = await response.json();

    const prices = {};
    if (data.data?.diff) {
      for (const item of data.data.diff) {
        if (item.f2 !== '-') {
          prices[item.f12] = {
            price: item.f2,
            change: item.f3,
            name: item.f14,
          };
        }
      }
    }

    // 缓存 30 秒，交易时段内足够频繁
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(prices);
  } catch (err) {
    console.error('Failed to fetch quotes:', err);
    return res.status(502).json({ error: 'Failed to fetch quotes' });
  }
}
