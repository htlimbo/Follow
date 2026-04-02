export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
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
    return new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    });
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

    return new Response(JSON.stringify(prices), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch quotes' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
