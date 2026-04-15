import { supabase } from '../supabaseClient';
import { fetchQuotes, searchStock as _searchStock } from './shared.js';

// ── Stock operations ──

export async function getStocks() {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .order('created_at', { ascending: false });
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

export async function addStock({ name, code, status = 'holding', shares = '', costPrice = '', currentPrice = '', thesis = '', bullCase = '', bearCase = '' }) {
  const { data, error } = await supabase
    .from('stocks')
    .insert({
      name,
      code,
      status,
      shares,
      cost_price: costPrice,
      current_price: currentPrice,
      thesis,
      bull_case: bullCase,
      bear_case: bearCase,
    })
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
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function addEntry({ stockId, type = 'thought', content, price = '' }) {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      stock_id: stockId,
      type,
      content,
      price,
    })
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

  // 批量更新数据库中的现价
  const updates = [];
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
    }
  }
  if (updates.length > 0) await Promise.all(updates);

  return prices;
}

// ── Stock search（直接复用 shared.js）──

export { _searchStock as searchStock };

// ── Review operations ──

export async function getReviewableEntries(startDate, endDate) {
  const { data, error } = await supabase
    .from('entries')
    .select('*, stocks!inner(name, code, current_price, cost_price)')
    .in('type', ['buy', 'sell', 'adjust'])
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });
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
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEntry);
}

export async function getAllAnchors() {
  const { data, error } = await supabase
    .from('anchors')
    .select('*, stocks!inner(name)')
    .order('created_at', { ascending: true });
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
  const { data, error } = await supabase
    .from('portfolio_settings')
    .select('cash_balance')
    .maybeSingle();
  if (error) throw error;
  return data?.cash_balance || '';
}

export async function setCashBalance(amount) {
  // upsert: 每个用户只有一行（RLS 保证 user_id 隔离）
  const { data: existing } = await supabase
    .from('portfolio_settings')
    .select('id')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('portfolio_settings')
      .update({ cash_balance: amount, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('portfolio_settings')
      .insert({ cash_balance: amount });
    if (error) throw error;
  }
}

// ── Export / Import ──

export async function exportData() {
  const [stocks, entries] = await Promise.all([
    supabase.from('stocks').select('*').order('created_at', { ascending: false }),
    supabase.from('entries').select('*').order('created_at', { ascending: false }),
  ]);
  const anchorsRes = await supabase.from('anchors').select('*').order('created_at', { ascending: true });

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

    // Insert stocks
    for (const s of data.stocks) {
      const { data: newStock, error } = await supabase
        .from('stocks')
        .insert({
          name: s.name,
          code: s.code || '',
          status: s.status || 'holding',
          shares: s.shares || '',
          cost_price: s.costPrice || '',
          current_price: s.currentPrice || '',
          thesis: s.thesis || '',
          bull_case: s.bullCase || '',
          bear_case: s.bearCase || '',
        })
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
