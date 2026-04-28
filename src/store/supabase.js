import { supabase } from '../supabaseClient';
import { fetchQuotes, searchStock as _searchStock } from './shared.js';

// 当前激活的账户 id。AccountContext 在切账户时调用 setActiveAccount(id) 写入。
// 所有 stocks / entries / portfolio_settings / snapshot 相关查询都按它过滤。
let currentAccountId = null;

export function setActiveAccount(id) {
  currentAccountId = id || null;
}

export function getActiveAccount() {
  return currentAccountId;
}

// ── Account CRUD ──

export async function getAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAccount);
}

export async function addAccount({ name, color = '' } = {}) {
  const { data, error } = await supabase
    .from('accounts')
    .insert({ name, color })
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
}

export async function updateAccount(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  const { data, error } = await supabase
    .from('accounts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
}

export async function deleteAccount(id) {
  // 默认账户不允许删除（前端也会阻拦，这里再守一道）
  const { data: row } = await supabase.from('accounts').select('is_default').eq('id', id).maybeSingle();
  if (row?.is_default) throw new Error('默认账户不可删除');
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

// 老用户首次升级：若没有任何账户，自动建一个"默认账户"，并把所有遗留 stocks / portfolio_settings 划归它。
// 幂等。返回默认账户对象。
export async function ensureDefaultAccount() {
  const existing = await getAccounts();
  if (existing.length > 0) {
    return existing.find(a => a.isDefault) || existing[0];
  }
  const { data, error } = await supabase
    .from('accounts')
    .insert({ name: '默认账户', is_default: true })
    .select()
    .single();
  if (error) throw error;
  const def = mapAccount(data);
  // 老数据归并
  await supabase.from('stocks').update({ account_id: def.id }).is('account_id', null);
  await supabase.from('portfolio_settings').update({ account_id: def.id }).is('account_id', null);
  return def;
}

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

// ── Stock operations ──

export async function getStocks() {
  let q = supabase.from('stocks').select('*').order('created_at', { ascending: false });
  if (currentAccountId) q = q.eq('account_id', currentAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapStock);
}

export async function getStock(id) {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapStock(data);
}

export async function addStock({ name, code, status = 'holding', shares = '', costPrice = '', currentPrice = '', thesis = '', bullCase = '', bearCase = '', type = 'stock' }) {
  const insertRow = {
    name,
    code,
    status,
    shares,
    cost_price: costPrice,
    current_price: currentPrice,
    thesis,
    bull_case: bullCase,
    bear_case: bearCase,
    type,
  };
  if (currentAccountId) insertRow.account_id = currentAccountId;
  const { data, error } = await supabase
    .from('stocks')
    .insert(insertRow)
    .select()
    .single();
  if (error) throw error;
  return mapStock(data);
}

export async function updateStock(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
  if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
  if (updates.currentPrice !== undefined) dbUpdates.current_price = updates.currentPrice;
  if (updates.thesis !== undefined) dbUpdates.thesis = updates.thesis;
  if (updates.bullCase !== undefined) dbUpdates.bull_case = updates.bullCase;
  if (updates.bearCase !== undefined) dbUpdates.bear_case = updates.bearCase;
  if (updates.type !== undefined) dbUpdates.type = updates.type;

  const { data, error } = await supabase
    .from('stocks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapStock(data);
}

export async function deleteStock(id) {
  const { error } = await supabase.from('stocks').delete().eq('id', id);
  if (error) throw error;
}

// ── Anchor operations ──

export async function getAnchors(stockId) {
  const { data, error } = await supabase
    .from('anchors')
    .select('*')
    .eq('stock_id', stockId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAnchor);
}

export async function addAnchor(stockId, anchor) {
  const { data, error } = await supabase
    .from('anchors')
    .insert({
      stock_id: stockId,
      name: anchor.name,
      expected: anchor.expected || '',
      frequency: anchor.frequency || '季度',
      latest_value: anchor.latestValue || '',
      latest_date: anchor.latestDate || '',
      note: anchor.note || '',
    })
    .select()
    .single();
  if (error) throw error;
  return mapAnchor(data);
}

export async function updateAnchor(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.expected !== undefined) dbUpdates.expected = updates.expected;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.latestValue !== undefined) dbUpdates.latest_value = updates.latestValue;
  if (updates.latestDate !== undefined) dbUpdates.latest_date = updates.latestDate;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { data, error } = await supabase
    .from('anchors')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAnchor(data);
}

export async function deleteAnchor(id) {
  const { error } = await supabase.from('anchors').delete().eq('id', id);
  if (error) throw error;
}

// ── Entry operations ──

export async function getEntries(stockId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('stock_id', stockId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function getAllEntries() {
  // 通过 stocks!inner 内联，按 account_id 过滤；不会改变 entries 字段
  let q = supabase
    .from('entries')
    .select('*, stocks!inner(account_id)')
    .order('created_at', { ascending: false });
  if (currentAccountId) q = q.eq('stocks.account_id', currentAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function addEntry({ stockId, type = 'thought', content, price = '', snapshotData = null, logicTags = null }) {
  const row = { stock_id: stockId, type, content, price };
  if (snapshotData) row.snapshot_data = snapshotData;
  if (logicTags && logicTags.length > 0) row.logic_tags = logicTags;
  const { data, error } = await supabase
    .from('entries')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

// ── Price refresh（网络请求来自 shared.js，写库仍走 Supabase）──

export async function refreshPrices(stocks) {
  const prices = await fetchQuotes(stocks);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 批量更新数据库中的现价
  const updates = [];
  const historyUpserts = [];
  for (const stock of stocks) {
    const quote = prices[stock.code];
    if (quote && quote.price != null) {
      const newPrice = String(quote.price);
      if (newPrice !== stock.currentPrice) {
        updates.push(
          supabase
            .from('stocks')
            .update({ current_price: newPrice })
            .eq('id', stock.id)
        );
      }
      // 记录当日价格历史（upsert by stock_id + recorded_at）
      historyUpserts.push(
        supabase
          .from('price_history')
          .upsert(
            { stock_id: stock.id, price: newPrice, recorded_at: today },
            { onConflict: 'stock_id,recorded_at' }
          )
      );
    }
  }
  const all = [...updates, ...historyUpserts];
  if (all.length > 0) await Promise.all(all);

  // 顺手写入当日组合净值快照（按 currentAccountId）
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
    } catch { /* 快照写失败不影响行情刷新 */ }
  }

  return prices;
}

// ── Portfolio snapshots ──

export async function getSnapshots(accountId, days = 90) {
  const id = accountId || currentAccountId;
  if (!id) return [];
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('recorded_at, market_value, cash, total_value')
    .eq('account_id', id)
    .order('recorded_at', { ascending: false })
    .limit(days);
  if (error) throw error;
  return (data || []).map(r => ({
    date: r.recorded_at,
    marketValue: parseFloat(r.market_value) || 0,
    cash: parseFloat(r.cash) || 0,
    totalValue: parseFloat(r.total_value) || 0,
  })).reverse();
}

export async function writeSnapshotIfMissing({ marketValue, cash, recordedAt }) {
  if (!currentAccountId) return;
  const total = (Number(marketValue) || 0) + (Number(cash) || 0);
  await supabase
    .from('portfolio_snapshots')
    .upsert(
      {
        account_id: currentAccountId,
        recorded_at: recordedAt,
        market_value: String(marketValue || 0),
        cash: String(cash || 0),
        total_value: String(total),
      },
      { onConflict: 'account_id,recorded_at' }
    );
}

// ── Price history ──

export async function getPriceHistory(stockId, days = 30) {
  const { data, error } = await supabase
    .from('price_history')
    .select('price, recorded_at')
    .eq('stock_id', stockId)
    .order('recorded_at', { ascending: false })
    .limit(days);
  if (error) throw error;
  return (data || []).map(r => ({ price: r.price, date: r.recorded_at })).reverse();
}

// ── Stock search（直接复用 shared.js）──

export { _searchStock as searchStock };

// ── Review operations ──

export async function getReviewableEntries(startDate, endDate) {
  let q = supabase
    .from('entries')
    .select('*, stocks!inner(name, code, current_price, cost_price, account_id)')
    .in('type', ['buy', 'sell', 'adjust'])
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });
  if (currentAccountId) q = q.eq('stocks.account_id', currentAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(row => ({
    ...mapEntry(row),
    stockName: row.stocks?.name || '',
    stockCode: row.stocks?.code || '',
    stockCurrentPrice: row.stocks?.current_price || '',
    stockCostPrice: row.stocks?.cost_price || '',
  }));
}

export async function updateEntryVerdict(entryId, verdict) {
  const { data, error } = await supabase
    .from('entries')
    .update({ review_verdict: verdict })
    .eq('id', entryId)
    .select()
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function getEntriesInRange(startDate, endDate) {
  let q = supabase
    .from('entries')
    .select('*, stocks!inner(account_id)')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });
  if (currentAccountId) q = q.eq('stocks.account_id', currentAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function getAllAnchors() {
  let q = supabase
    .from('anchors')
    .select('*, stocks!inner(name, account_id)')
    .order('created_at', { ascending: true });
  if (currentAccountId) q = q.eq('stocks.account_id', currentAccountId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(row => ({
    ...mapAnchor(row),
    stockName: row.stocks?.name || '',
  }));
}

// ── Review notes CRUD ──

export async function getReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapReview);
}

export async function getReviewByPeriod(periodStart, periodEnd) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReview(data) : null;
}

export async function saveReview({ id, periodStart, periodEnd, summary }) {
  if (id) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ summary, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapReview(data);
  }
  const { data, error } = await supabase
    .from('reviews')
    .insert({ period_start: periodStart, period_end: periodEnd, summary })
    .select()
    .single();
  if (error) throw error;
  return mapReview(data);
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
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

// ── Portfolio settings (cash balance) ──

export async function getCashBalance() {
  let q = supabase.from('portfolio_settings').select('cash_balance');
  if (currentAccountId) q = q.eq('account_id', currentAccountId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data?.cash_balance || '';
}

export async function setCashBalance(amount) {
  // upsert by (user_id, account_id)
  let q = supabase.from('portfolio_settings').select('id');
  if (currentAccountId) q = q.eq('account_id', currentAccountId);
  const { data: existing } = await q.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('portfolio_settings')
      .update({ cash_balance: amount, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const insertRow = { cash_balance: amount };
    if (currentAccountId) insertRow.account_id = currentAccountId;
    const { error } = await supabase
      .from('portfolio_settings')
      .insert(insertRow);
    if (error) throw error;
  }
}

// ── Export / Import ──

export async function exportData() {
  // 仅导出当前账户数据
  let stocksQ = supabase.from('stocks').select('*').order('created_at', { ascending: false });
  let entriesQ = supabase.from('entries').select('*, stocks!inner(account_id)').order('created_at', { ascending: false });
  let anchorsQ = supabase.from('anchors').select('*, stocks!inner(account_id)').order('created_at', { ascending: true });
  if (currentAccountId) {
    stocksQ = stocksQ.eq('account_id', currentAccountId);
    entriesQ = entriesQ.eq('stocks.account_id', currentAccountId);
    anchorsQ = anchorsQ.eq('stocks.account_id', currentAccountId);
  }
  const [stocks, entries, anchorsRes] = await Promise.all([stocksQ, entriesQ, anchorsQ]);

  const stockList = (stocks.data || []).map(mapStock);
  const anchorList = (anchorsRes.data || []);

  // Attach anchors back to stocks for export compatibility
  const anchorsByStock = {};
  anchorList.forEach(a => {
    if (!anchorsByStock[a.stock_id]) anchorsByStock[a.stock_id] = [];
    anchorsByStock[a.stock_id].push(mapAnchor(a));
  });
  stockList.forEach(s => {
    s.anchors = anchorsByStock[s.id] || [];
  });

  return JSON.stringify({
    stocks: stockList,
    entries: (entries.data || []).map(mapEntry),
  }, null, 2);
}

export async function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.stocks || !data.entries) return false;

    // Insert stocks（导入到当前账户）
    for (const s of data.stocks) {
      const insertRow = {
        name: s.name,
        code: s.code || '',
        status: s.status || 'holding',
        shares: s.shares || '',
        cost_price: s.costPrice || '',
        current_price: s.currentPrice || '',
        thesis: s.thesis || '',
        bull_case: s.bullCase || '',
        bear_case: s.bearCase || '',
        type: s.type || 'stock',
      };
      if (currentAccountId) insertRow.account_id = currentAccountId;
      const { data: newStock, error } = await supabase
        .from('stocks')
        .insert(insertRow)
        .select()
        .single();
      if (error) continue;

      // Insert anchors for this stock
      if (s.anchors && s.anchors.length > 0) {
        const anchorRows = s.anchors.map(a => ({
          stock_id: newStock.id,
          name: a.name,
          expected: a.expected || '',
          frequency: a.frequency || '季度',
          latest_value: a.latestValue || '',
          latest_date: a.latestDate || '',
          note: a.note || '',
        }));
        await supabase.from('anchors').insert(anchorRows);
      }

      // Insert entries for this stock
      const stockEntries = data.entries.filter(e => e.stockId === s.id);
      if (stockEntries.length > 0) {
        const entryRows = stockEntries.map(e => ({
          stock_id: newStock.id,
          type: e.type || 'thought',
          content: e.content,
          price: e.price || '',
        }));
        await supabase.from('entries').insert(entryRows);
      }
    }
    return true;
  } catch {
    return false;
  }
}

// ── Journal (独立写作) ──

export async function getJournals() {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapJournal);
}

export async function addJournal({ title, content, tags = [] }) {
  const row = { title, content };
  if (tags.length > 0) row.tags = tags;
  const { data, error } = await supabase
    .from('journals')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapJournal(data);
}

export async function updateJournal(id, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  const { data, error } = await supabase
    .from('journals')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapJournal(data);
}

export async function deleteJournal(id) {
  const { error } = await supabase.from('journals').delete().eq('id', id);
  if (error) throw error;
}

// ── Field mapping helpers (snake_case DB → camelCase JS) ──

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
  return {
    id: row.id,
    stockId: row.stock_id,
    type: row.type,
    content: row.content,
    price: row.price || '',
    snapshotData: row.snapshot_data || null,
    logicTags: row.logic_tags || null,
    reviewVerdict: row.review_verdict || null,
    createdAt: row.created_at,
  };
}

function mapJournal(row) {
  return {
    id: row.id,
    title: row.title || '',
    content: row.content || '',
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
