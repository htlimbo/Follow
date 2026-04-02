/**
 * Vercel Serverless Function — 获取A股实时行情
 * 使用东方财富 push API，返回 JSON 格式的股票现价
 *
 * GET /api/quotes?codes=300750,600519,002594
 */
export async function GET(request) {
  const url = new URL(request.url);
  const codes = url.searchParams.get('codes');

  if (!codes) {
    return new Response(JSON.stringify({ error: 'Missing codes parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const codeList = codes.split(',').map(c => c.trim()).filter(Boolean);
  const secids = codeList
    .filter(code => /^\d{6}$/.test(code))
    .map(code => (code.startsWith('6') ? `1.${code}` : `0.${code}`))
    .join(',');

  if (!secids) {
    return Response.json({});
  }

  try {
    const apiUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14&secids=${secids}`;
    const response = await fetch(apiUrl, {
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

    return Response.json(prices, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch quotes' }, { status: 502 });
  }
}
