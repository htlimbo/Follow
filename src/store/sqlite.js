// SQLite 实现（桌面 Pro 版）
// 基于 @tauri-apps/plugin-sql，数据存储在本地 follow.db

import Database from '@tauri-apps/plugin-sql';
import { fetchQuotes, searchStock as _searchStock } from './shared.js';

let db;

// 当前激活的账户 id（与 supabase.js 同义，AccountContext 切换账户时调用 setActiveAccount）
let currentAccountId = null;

export function setActiveAccount(id) { currentAccountId = id || null; }
export function getActiveAccount() { return currentAccountId; }

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
      snapshot_data TEXT DEFAULT NULL,
      logic_tags TEXT DEFAULT NULL,
      review_verdict TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    )
  `);
  // 为已有数据库添加新列（IF NOT EXISTS 不支持 ALTER，用 try/catch 兼容）
  try { await db.execute('ALTER TABLE entries ADD COLUMN snapshot_data TEXT DEFAULT NULL'); } catch {}
  try { await db.execute('ALTER TABLE entries ADD COLUMN logic_tags TEXT DEFAULT NULL'); } catch {}
  try { await db.execute("ALTER TABLE stocks ADD COLUMN type TEXT DEFAULT 'stock'"); } catch {}
  try { await db.execute('ALTER TABLE stocks ADD COLUMN account_id TEXT DEFAULT NULL'); } catch {}
  try { await db.execute('ALTER TABLE portfolio_settings ADD COLUMN account_id TEXT DEFAULT NULL'); } catch {}
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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_settings (
      id TEXT PRIMARY KEY,
      cash_balance TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      stock_id TEXT NOT NULL,
      price TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_stock_date
    ON price_history (stock_id, recorded_at)
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      tags TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      market_value TEXT DEFAULT '0',
      cash TEXT DEFAULT '0',
      total_value TEXT DEFAULT '0',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_account_date
    ON portfolio_snapshots (account_id, recorded_at)
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
    type: row.type || 'stock',
    accountId: row.account_id || null,
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
  let snapshotData = null;
  let logicTags = null;
  try { if (row.snapshot_data) snapshotData = JSON.parse(row.snapshot_data); } catch {}
  try { if (row.logic_tags) logicTags = JSON.parse(row.logic_tags); } catch {}
  return {
    id: row.id,
    stockId: row.stock_id,
    type: row.type,
    content: row.content,
    price: row.price || '',
    snapshotData,
    logicTags,
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

// ── Account CRUD ──

function mapAccount(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color || '',
    sortOrder: row.sort_order || 0,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
  };
}

export async function getAccounts() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM accounts ORDER BY sort_order ASC, created_at ASC');
  return rows.map(mapAccount);
}

export async function addAccount({ name, color = '' } = {}) {
  const d = await getDb();
  const id = uuid();
  await d.execute(
    'INSERT INTO accounts (id, name, color, sort_order, is_default) VALUES ($1, $2, $3, 0, 0)',
    [id, name, color]
  );
  const rows = await d.select('SELECT * FROM accounts WHERE id = $1', [id]);
  return mapAccount(rows[0]);
}

export async function updateAccount(id, updates) {
  const d = await getDb();
  const sets = [];
  const vals = [];
  let idx = 1;
  if (updates.name !== undefined) { sets.push(`name = $${idx}`); vals.push(updates.name); idx++; }
  if (updates.color !== undefined) { sets.push(`color = $${idx}`); vals.push(updates.color); idx++; }
  if (updates.sortOrder !== undefined) { sets.push(`sort_order = $${idx}`); vals.push(updates.sortOrder); idx++; }
  if (sets.length === 0) {
    const rows = await d.select('SELECT * FROM accounts WHERE id = $1', [id]);
    return rows.length > 0 ? mapAccount(rows[0]) : null;
  }
  vals.push(id);
  await d.execute(`UPDATE accounts SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
  const rows = await d.select('SELECT * FROM accounts WHERE id = $1', [id]);
  return mapAccount(rows[0]);
}

export async function deleteAccount(id) {
  const d = await getDb();
  const rows = await d.select('SELECT is_default FROM accounts WHERE id = $1', [id]);
  if (rows.length > 0 && rows[0].is_default) throw new Error('默认账户不可删除');
  await d.execute('DELETE FROM accounts WHERE id = $1', [id]);
}

export async function ensureDefaultAccount() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM accounts ORDER BY sort_order ASC, created_at ASC');
  if (rows.length > 0) {
    const def = rows.find(r => r.is_default) || rows[0];
    return mapAccount(def);
  }
  const id = uuid();
  await d.execute(
    "INSERT INTO accounts (id, name, color, sort_order, is_default) VALUES ($1, '默认账户', '', 0, 1)",
    [id]
  );
  await d.execute('UPDATE stocks SET account_id = $1 WHERE account_id IS NULL', [id]);
  await d.execute('UPDATE portfolio_settings SET account_id = $1 WHERE account_id IS NULL', [id]);
  const newRows = await d.select('SELECT * FROM accounts WHERE id = $1', [id]);
  return mapAccount(newRows[0]);
}

// ── Stock operations ──

export async function getStocks() {
  const d = await getDb();
  const rows = currentAccountId
    ? await d.select('SELECT * FROM stocks WHERE account_id = $1 ORDER BY created_at DESC', [currentAccountId])
    : await d.select('SELECT * FROM stocks ORDER BY created_at DESC');
  return rows.map(mapStock);
}

export async function getStock(id) {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM stocks WHERE id = $1', [id]);
  return rows.length > 0 ? mapStock(rows[0]) : null;
}

export async function addStock({ name, code, status = 'holding', shares = '', costPrice = '', currentPrice = '', thesis = '', bullCase = '', bearCase = '', type = 'stock' }) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  const accountId = currentAccountId;
  await d.execute(
    `INSERT INTO stocks (id, name, code, status, shares, cost_price, current_price, thesis, bull_case, bear_case, type, account_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, name, code, status, shares, costPrice, currentPrice, thesis, bullCase, bearCase, type, accountId, ts, ts]
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
    type: 'type',
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
  const rows = currentAccountId
    ? await d.select(`
        SELECT a.*, s.name AS stock_name
        FROM anchors a
        JOIN stocks s ON a.stock_id = s.id
        WHERE s.account_id = $1
        ORDER BY a.created_at ASC
      `, [currentAccountId])
    : await d.select(`
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
  const rows = currentAccountId
    ? await d.select(`
        SELECT e.* FROM entries e
        JOIN stocks s ON e.stock_id = s.id
        WHERE s.account_id = $1
        ORDER BY e.created_at DESC
      `, [currentAccountId])
    : await d.select('SELECT * FROM entries ORDER BY created_at DESC');
  return rows.map(mapEntry);
}

export async function addEntry({ stockId, type = 'thought', content, price = '', snapshotData = null, logicTags = null }) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  await d.execute(
    `INSERT INTO entries (id, stock_id, type, content, price, snapshot_data, logic_tags, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, stockId, type, content, price,
     snapshotData ? JSON.stringify(snapshotData) : null,
     logicTags && logicTags.length > 0 ? JSON.stringify(logicTags) : null,
     ts]
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
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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
      // 记录当日价格历史（upsert）
      const existing = await d.select(
        'SELECT id FROM price_history WHERE stock_id = $1 AND recorded_at = $2',
        [stock.id, today]
      );
      if (existing.length > 0) {
        await d.execute(
          'UPDATE price_history SET price = $1 WHERE id = $2',
          [newPrice, existing[0].id]
        );
      } else {
        await d.execute(
          'INSERT INTO price_history (id, stock_id, price, recorded_at) VALUES ($1, $2, $3, $4)',
          [uuid(), stock.id, newPrice, today]
        );
      }
    }
  }

  // 当日组合净值快照（按当前账户）
  if (currentAccountId) {
    try {
      let marketValue = 0;
      for (const stock of stocks) {
        if (stock.status !== 'holding') continue;
        const quote = prices[stock.code];
        const px = quote?.price != null ? quote.price : parseFloat(stock.currentPrice);
        const sh = parseFloat(stock.shares);
        if (!isNaN(px) && !isNaN(sh)) marketValue += px * sh;
      }
      const cash = await getCashBalance();
      const cashNum = parseFloat(cash) || 0;
      await writeSnapshotIfMissing({ marketValue, cash: cashNum, recordedAt: today });
    } catch { /* 快照失败不影响行情刷新 */ }
  }

  return prices;
}

// ── Portfolio snapshots ──

export async function getSnapshots(accountId, days = 90) {
  const id = accountId || currentAccountId;
  if (!id) return [];
  const d = await getDb();
  const rows = await d.select(
    `SELECT recorded_at, market_value, cash, total_value FROM portfolio_snapshots
     WHERE account_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2`,
    [id, days]
  );
  return rows.map(r => ({
    date: r.recorded_at,
    marketValue: parseFloat(r.market_value) || 0,
    cash: parseFloat(r.cash) || 0,
    totalValue: parseFloat(r.total_value) || 0,
  })).reverse();
}

export async function writeSnapshotIfMissing({ marketValue, cash, recordedAt }) {
  if (!currentAccountId) return;
  const d = await getDb();
  const total = (Number(marketValue) || 0) + (Number(cash) || 0);
  const existing = await d.select(
    'SELECT id FROM portfolio_snapshots WHERE account_id = $1 AND recorded_at = $2',
    [currentAccountId, recordedAt]
  );
  if (existing.length > 0) {
    await d.execute(
      'UPDATE portfolio_snapshots SET market_value = $1, cash = $2, total_value = $3 WHERE id = $4',
      [String(marketValue || 0), String(cash || 0), String(total), existing[0].id]
    );
  } else {
    await d.execute(
      `INSERT INTO portfolio_snapshots (id, account_id, recorded_at, market_value, cash, total_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuid(), currentAccountId, recordedAt, String(marketValue || 0), String(cash || 0), String(total)]
    );
  }
}

// ── Price history ──

export async function getPriceHistory(stockId, days = 30) {
  const d = await getDb();
  const rows = await d.select(
    `SELECT price, recorded_at FROM price_history
     WHERE stock_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2`,
    [stockId, days]
  );
  return rows.map(r => ({ price: r.price, date: r.recorded_at })).reverse();
}

// ── Stock search（直接复用 shared.js）──

export { _searchStock as searchStock };

// ── Review operations ──

export async function getReviewableEntries(startDate, endDate) {
  const d = await getDb();
  const params = [startDate, endDate + 'T23:59:59'];
  let where = `e.type IN ('buy', 'sell', 'adjust') AND e.created_at >= $1 AND e.created_at <= $2`;
  if (currentAccountId) {
    where += ` AND s.account_id = $3`;
    params.push(currentAccountId);
  }
  const rows = await d.select(`
    SELECT e.*, s.name AS stock_name, s.code AS stock_code,
           s.current_price AS stock_current_price, s.cost_price AS stock_cost_price
    FROM entries e
    JOIN stocks s ON e.stock_id = s.id
    WHERE ${where}
    ORDER BY e.created_at DESC
  `, params);
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
  const params = [startDate, endDate + 'T23:59:59'];
  let sql;
  if (currentAccountId) {
    params.push(currentAccountId);
    sql = `
      SELECT e.* FROM entries e
      JOIN stocks s ON e.stock_id = s.id
      WHERE e.created_at >= $1 AND e.created_at <= $2 AND s.account_id = $3
      ORDER BY e.created_at DESC
    `;
  } else {
    sql = `
      SELECT * FROM entries
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC
    `;
  }
  const rows = await d.select(sql, params);
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

// ── Portfolio settings (cash balance) ──

export async function getCashBalance() {
  const d = await getDb();
  const rows = currentAccountId
    ? await d.select('SELECT cash_balance FROM portfolio_settings WHERE account_id = $1 LIMIT 1', [currentAccountId])
    : await d.select('SELECT cash_balance FROM portfolio_settings WHERE account_id IS NULL LIMIT 1');
  return rows.length > 0 ? (rows[0].cash_balance || '') : '';
}

export async function setCashBalance(amount) {
  const d = await getDb();
  const rows = currentAccountId
    ? await d.select('SELECT id FROM portfolio_settings WHERE account_id = $1 LIMIT 1', [currentAccountId])
    : await d.select('SELECT id FROM portfolio_settings WHERE account_id IS NULL LIMIT 1');
  const ts = now();
  if (rows.length > 0) {
    await d.execute(
      'UPDATE portfolio_settings SET cash_balance = $1, updated_at = $2 WHERE id = $3',
      [amount, ts, rows[0].id]
    );
  } else {
    await d.execute(
      'INSERT INTO portfolio_settings (id, account_id, cash_balance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [uuid(), currentAccountId, amount, ts, ts]
    );
  }
}

// ── Journal (独立写作) ──

export async function getJournals() {
  const d = await getDb();
  const rows = await d.select('SELECT * FROM journals ORDER BY created_at DESC');
  return rows.map(mapJournal);
}

export async function addJournal({ title, content, tags = [] }) {
  const d = await getDb();
  const id = uuid();
  const ts = now();
  const tagsJson = tags.length > 0 ? JSON.stringify(tags) : null;
  await d.execute(
    `INSERT INTO journals (id, title, content, tags, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, title, content, tagsJson, ts, ts]
  );
  const rows = await d.select('SELECT * FROM journals WHERE id = $1', [id]);
  return mapJournal(rows[0]);
}

export async function updateJournal(id, updates) {
  const d = await getDb();
  const sets = [];
  const vals = [];
  let idx = 1;
  if (updates.title !== undefined) { sets.push(`title = $${idx}`); vals.push(updates.title); idx++; }
  if (updates.content !== undefined) { sets.push(`content = $${idx}`); vals.push(updates.content); idx++; }
  if (updates.tags !== undefined) { sets.push(`tags = $${idx}`); vals.push(JSON.stringify(updates.tags)); idx++; }
  sets.push(`updated_at = $${idx}`); vals.push(now()); idx++;
  vals.push(id);
  await d.execute(`UPDATE journals SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
  const rows = await d.select('SELECT * FROM journals WHERE id = $1', [id]);
  return mapJournal(rows[0]);
}

export async function deleteJournal(id) {
  const d = await getDb();
  await d.execute('DELETE FROM journals WHERE id = $1', [id]);
}

function mapJournal(row) {
  let tags = [];
  if (row.tags) {
    try { tags = JSON.parse(row.tags); } catch { tags = []; }
  }
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Export / Import ──

export async function exportData() {
  const d = await getDb();
  let stockRows, entryRows, anchorRows;
  if (currentAccountId) {
    stockRows = await d.select('SELECT * FROM stocks WHERE account_id = $1 ORDER BY created_at DESC', [currentAccountId]);
    entryRows = await d.select(`
      SELECT e.* FROM entries e
      JOIN stocks s ON e.stock_id = s.id
      WHERE s.account_id = $1
      ORDER BY e.created_at DESC
    `, [currentAccountId]);
    anchorRows = await d.select(`
      SELECT a.* FROM anchors a
      JOIN stocks s ON a.stock_id = s.id
      WHERE s.account_id = $1
      ORDER BY a.created_at ASC
    `, [currentAccountId]);
  } else {
    stockRows = await d.select('SELECT * FROM stocks ORDER BY created_at DESC');
    entryRows = await d.select('SELECT * FROM entries ORDER BY created_at DESC');
    anchorRows = await d.select('SELECT * FROM anchors ORDER BY created_at ASC');
  }

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
        `INSERT INTO stocks (id, name, code, status, shares, cost_price, current_price, thesis, bull_case, bear_case, type, account_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [stockId, s.name, s.code || '', s.status || 'holding', s.shares || '',
         s.costPrice || '', s.currentPrice || '', s.thesis || '',
         s.bullCase || '', s.bearCase || '', s.type || 'stock', currentAccountId, ts, ts]
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
