// SQLite 实现（桌面 Pro 版）
// 基于 @tauri-apps/plugin-sql，数据存储在本地 follow.db

import Database from '@tauri-apps/plugin-sql';
import { fetchQuotes, searchStock as _searchStock } from './shared.js';

let db;

async function getDb() {
  if (!db) {
    db = await Database.load('sqlite:follow.db');
    await initTables();
  }
  return db;
}

async function initTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stocks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'holding',
      shares TEXT DEFAULT '',
      cost_price TEXT DEFAULT '',
      current_price TEXT DEFAULT '',
      thesis TEXT DEFAULT '',
      bull_case TEXT DEFAULT '',
      bear_case TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS anchors (
      id TEXT PRIMARY KEY,
      stock_id TEXT NOT NULL,
      name TEXT NOT NULL,
      expected TEXT DEFAULT '',
      frequency TEXT DEFAULT '季度',
      latest_value TEXT DEFAULT '',
      latest_date TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      stock_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'thought',
      content TEXT NOT NULL DEFAULT '',
      price TEXT DEFAULT '',
      review_verdict TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      summary TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  // 开启外键约束（SQLite 默认关闭）
  await db.execute('PRAGMA foreign_keys = ON');
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

// ── Field mapping helpers（与 supabase.js 保持一致的 camelCase 输出）──

function mapStock(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    shares: row.shares || '',
    costPrice: row.cost_price || '',
    currentPrice: row.current_price || '',
    thesis: row.thesis || '',
    bullCase: row.bull_case || '',
    bearCase: row.bear_case || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAnchor(row) {
  return {
    id: row.id,
    stockId: row.stock_id,
    name: row.name,
    expected: row.expected || '',
    frequency: row.frequency || '季度',
    latestValue: row.latest_value || '',
    latestDate: row.latest_date || '',
    note: row.note || '',
    createdAt: row.created_at,
  };
}

function mapEntry(row) {
  return {
    id: row.id,
    stockId: row.stock_id,
    type: row.type,
    content: row.content,
    price: row.price || '',
    reviewVerdict: row.review_verdict || null,
    createdAt: row.created_at,
  };
}

function mapReview(row) {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    summary: row.summary || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Stock operations ──

export async function getStocks() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM stocks ORDER BY created_at DESC');
  return rows.map(mapStock);
}

export async function getStock(id) {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM stocks WHERE id = $1', [id]);
  return rows.length > 0 ? mapStock(rows[0]) : null;
}

export async function addStock({ name, code, status = 'holding', shares = '', costPrice = '', currentPrice = '', thesis = '', bullCase = '', bearCase = '' }) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  await d.execute(
    `INSERT INTO stocks (id, name, code, status, shares, cost_price, current_price, thesis, bull_case, bear_case, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, name, code, status, shares, costPrice, currentPrice, thesis, bullCase, bearCase, ts, ts]
  );
  const rows = await d.select('SELECT * FROM stocks WHERE id = $1', [id]);
  return mapStock(rows[0]);
}

export async function updateStock(id, updates) {
  const d = await getDb();
  const sets = [];
  const vals = [];
  let idx = 1;

  const fieldMap = {
    name: 'name', code: 'code', status: 'status', shares: 'shares',
    costPrice: 'cost_price', currentPrice: 'current_price',
    thesis: 'thesis', bullCase: 'bull_case', bearCase: 'bear_case',
  };
  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      sets.push(`${dbCol} = $${idx}`);
      vals.push(updates[jsKey]);
      idx++;
    }
  }
  if (sets.length === 0) {
    return getStock(id);
  }
  sets.push(`updated_at = $${idx}`);
  vals.push(now());
  idx++;
  vals.push(id);

  await d.execute(
    `UPDATE stocks SET ${sets.join(', ')} WHERE id = $${idx}`,
    vals
  );
  return getStock(id);
}

export async function deleteStock(id) {
  const d = await getDb();
  // 外键 ON DELETE CASCADE 会自动清理 entries 和 anchors
  await d.execute('DELETE FROM stocks WHERE id = $1', [id]);
}

// ── Anchor operations ──

export async function getAnchors(stockId) {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM anchors WHERE stock_id = $1 ORDER BY created_at ASC', [stockId]);
  return rows.map(mapAnchor);
}

export async function addAnchor(stockId, anchor) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  await d.execute(
    `INSERT INTO anchors (id, stock_id, name, expected, frequency, latest_value, latest_date, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, stockId, anchor.name, anchor.expected || '', anchor.frequency || '季度',
     anchor.latestValue || '', anchor.latestDate || '', anchor.note || '', ts]
  );
  const rows = await d.select('SELECT * FROM anchors WHERE id = $1', [id]);
  return mapAnchor(rows[0]);
}

export async function updateAnchor(id, updates) {
  const d = await getDb();
  const sets = [];
  const vals = [];
  let idx = 1;

  const fieldMap = {
    name: 'name', expected: 'expected', frequency: 'frequency',
    latestValue: 'latest_value', latestDate: 'latest_date', note: 'note',
  };
  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      sets.push(`${dbCol} = $${idx}`);
      vals.push(updates[jsKey]);
      idx++;
    }
  }
  if (sets.length === 0) {
    const rows = await d.select('SELECT * FROM anchors WHERE id = $1', [id]);
    return mapAnchor(rows[0]);
  }
  vals.push(id);
  await d.execute(
    `UPDATE anchors SET ${sets.join(', ')} WHERE id = $${idx}`,
    vals
  );
  const rows = await d.select('SELECT * FROM anchors WHERE id = $1', [id]);
  return mapAnchor(rows[0]);
}

export async function deleteAnchor(id) {
  const d = await getDb();
  await d.execute('DELETE FROM anchors WHERE id = $1', [id]);
}

export async function getAllAnchors() {
  const d = await getDb();
  const rows = await d.select(`
    SELECT a.*, s.name AS stock_name
    FROM anchors a
    JOIN stocks s ON a.stock_id = s.id
    ORDER BY a.created_at ASC
  `);
  return rows.map(row => ({
    ...mapAnchor(row),
    stockName: row.stock_name || '',
  }));
}

// ── Entry operations ──

export async function getEntries(stockId) {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM entries WHERE stock_id = $1 ORDER BY created_at DESC', [stockId]);
  return rows.map(mapEntry);
}

export async function getAllEntries() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM entries ORDER BY created_at DESC');
  return rows.map(mapEntry);
}

export async function addEntry({ stockId, type = 'thought', content, price = '' }) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  await d.execute(
    `INSERT INTO entries (id, stock_id, type, content, price, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, stockId, type, content, price, ts]
  );
  const rows = await d.select('SELECT * FROM entries WHERE id = $1', [id]);
  return mapEntry(rows[0]);
}

export async function deleteEntry(id) {
  const d = await getDb();
  await d.execute('DELETE FROM entries WHERE id = $1', [id]);
}

// ── Price refresh（网络请求来自 shared.js，写库走本地 SQLite）──

export async function refreshPrices(stocks) {
  const prices = await fetchQuotes(stocks);
  const d = await getDb();

  for (const stock of stocks) {
    const quote = prices[stock.code];
    if (quote && quote.price != null) {
      const newPrice = String(quote.price);
      if (newPrice !== stock.currentPrice) {
        await d.execute(
          'UPDATE stocks SET current_price = $1, updated_at = $2 WHERE id = $3',
          [newPrice, now(), stock.id]
        );
      }
    }
  }

  return prices;
}

// ── Stock search（直接复用 shared.js）──

export { _searchStock as searchStock };

// ── Review operations ──

export async function getReviewableEntries(startDate, endDate) {
  const d = await getDb();
  const rows = await d.select(`
    SELECT e.*, s.name AS stock_name, s.code AS stock_code,
           s.current_price AS stock_current_price, s.cost_price AS stock_cost_price
    FROM entries e
    JOIN stocks s ON e.stock_id = s.id
    WHERE e.type IN ('buy', 'sell', 'adjust')
      AND e.created_at >= $1
      AND e.created_at <= $2
    ORDER BY e.created_at DESC
  `, [startDate, endDate + 'T23:59:59']);
  return rows.map(row => ({
    ...mapEntry(row),
    stockName: row.stock_name || '',
    stockCode: row.stock_code || '',
    stockCurrentPrice: row.stock_current_price || '',
    stockCostPrice: row.stock_cost_price || '',
  }));
}

export async function updateEntryVerdict(entryId, verdict) {
  const d = await getDb();
  await d.execute(
    'UPDATE entries SET review_verdict = $1 WHERE id = $2',
    [verdict, entryId]
  );
  const rows = await d.select('SELECT * FROM entries WHERE id = $1', [entryId]);
  return mapEntry(rows[0]);
}

export async function getEntriesInRange(startDate, endDate) {
  const d = await getDb();
  const rows = await d.select(`
    SELECT * FROM entries
    WHERE created_at >= $1 AND created_at <= $2
    ORDER BY created_at DESC
  `, [startDate, endDate + 'T23:59:59']);
  return rows.map(mapEntry);
}

// ── Review notes CRUD ──

export async function getReviews() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM reviews ORDER BY period_start DESC');
  return rows.map(mapReview);
}

export async function getReviewByPeriod(periodStart, periodEnd) {
  const d = await getDb();
  const rows = await d.select(
    'SELECT * FROM reviews WHERE period_start = $1 AND period_end = $2',
    [periodStart, periodEnd]
  );
  return rows.length > 0 ? mapReview(rows[0]) : null;
}

export async function saveReview({ id, periodStart, periodEnd, summary }) {
  const d = await getDb();
  const ts = now();
  if (id) {
    await d.execute(
      'UPDATE reviews SET summary = $1, updated_at = $2 WHERE id = $3',
      [summary, ts, id]
    );
    const rows = await d.select('SELECT * FROM reviews WHERE id = $1', [id]);
    return mapReview(rows[0]);
  }
  const newId = uuid();
  await d.execute(
    `INSERT INTO reviews (id, period_start, period_end, summary, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [newId, periodStart, periodEnd, summary, ts, ts]
  );
  const rows = await d.select('SELECT * FROM reviews WHERE id = $1', [newId]);
  return mapReview(rows[0]);
}

export async function deleteReview(id) {
  const d = await getDb();
  await d.execute('DELETE FROM reviews WHERE id = $1', [id]);
}

// ── Export / Import ──

export async function exportData() {
  const d = await getDb();
  const stockRows = await d.select('SELECT * FROM stocks ORDER BY created_at DESC');
  const entryRows = await d.select('SELECT * FROM entries ORDER BY created_at DESC');
  const anchorRows = await d.select('SELECT * FROM anchors ORDER BY created_at ASC');

  const stockList = stockRows.map(mapStock);

  const anchorsByStock = {};
  anchorRows.forEach(a => {
    if (!anchorsByStock[a.stock_id]) anchorsByStock[a.stock_id] = [];
    anchorsByStock[a.stock_id].push(mapAnchor(a));
  });
  stockList.forEach(s => {
    s.anchors = anchorsByStock[s.id] || [];
  });

  return JSON.stringify({
    stocks: stockList,
    entries: entryRows.map(mapEntry),
  }, null, 2);
}

export async function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.stocks || !data.entries) return false;

    const d = await getDb();

    for (const s of data.stocks) {
      const stockId = uuid();
      const ts = now();
      await d.execute(
        `INSERT INTO stocks (id, name, code, status, shares, cost_price, current_price, thesis, bull_case, bear_case, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [stockId, s.name, s.code || '', s.status || 'holding', s.shares || '',
         s.costPrice || '', s.currentPrice || '', s.thesis || '',
         s.bullCase || '', s.bearCase || '', ts, ts]
      );

      // Insert anchors
      if (s.anchors && s.anchors.length > 0) {
        for (const a of s.anchors) {
          await d.execute(
            `INSERT INTO anchors (id, stock_id, name, expected, frequency, latest_value, latest_date, note, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [uuid(), stockId, a.name, a.expected || '', a.frequency || '季度',
             a.latestValue || '', a.latestDate || '', a.note || '', ts]
          );
        }
      }

      // Insert entries
      const stockEntries = data.entries.filter(e => e.stockId === s.id);
      for (const e of stockEntries) {
        await d.execute(
          `INSERT INTO entries (id, stock_id, type, content, price, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuid(), stockId, e.type || 'thought', e.content, e.price || '', ts]
        );
      }
    }
    return true;
  } catch {
    return false;
  }
}
