import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 本地开发时模拟 Vercel serverless function
function apiProxy() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/quotes', async (req, res) => {
        const url = new URL(req.originalUrl || req.url, 'http://localhost');
        const codes = url.searchParams.get('codes');
        if (!codes) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing codes parameter' }));
          return;
        }

        const codeList = codes.split(',').map(c => c.trim()).filter(Boolean);
        const secids = codeList
          .filter(code => /^\d{6}$/.test(code))
          .map(code => (code.startsWith('6') ? `1.${code}` : `0.${code}`))
          .join(',');

        if (!secids) {
          res.end(JSON.stringify({}));
          return;
        }

        try {
          const { get } = await import('https');
          const apiUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f14&secids=${secids}`;
          const data = await new Promise((resolve, reject) => {
            get(apiUrl, { headers: { 'Referer': 'https://quote.eastmoney.com/' } }, (resp) => {
              let body = '';
              resp.on('data', chunk => body += chunk);
              resp.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
            }).on('error', reject);
          });
          const prices = {};
          if (data.data?.diff) {
            for (const item of data.data.diff) {
              if (item.f2 !== '-') {
                prices[item.f12] = { price: item.f2, change: item.f3, name: item.f14 };
              }
            }
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(prices));
        } catch {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: 'Failed to fetch quotes' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxy()],
})
