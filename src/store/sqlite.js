// SQLite 实现（桌面 Pro 版，阶段三 P1 开发）
//
// 当前是存根：所有函数保持与 supabase.js 完全一致的导出名，但实际调用时抛出异常。
// 这样做的目的是：
// 1. 锁定数据层接口契约，确保两套实现导出名一致
// 2. P1 开发时只需填充函数体，不用再改 index.js 的开关逻辑
// 3. 误启用时（比如 index.js 切到 sqlite）能快速失败，不会静默出错
//
// P1 实现将基于 @tauri-apps/plugin-sql + 本地 follow.db 文件。

const NOT_IMPLEMENTED = 'SQLite 实现待阶段三 P1 开发';

const stub = async () => { throw new Error(NOT_IMPLEMENTED); };

// ── Stock operations ──
export const getStocks = stub;
export const getStock = stub;
export const addStock = stub;
export const updateStock = stub;
export const deleteStock = stub;

// ── Anchor operations ──
export const getAnchors = stub;
export const addAnchor = stub;
export const updateAnchor = stub;
export const deleteAnchor = stub;
export const getAllAnchors = stub;

// ── Entry operations ──
export const getEntries = stub;
export const getAllEntries = stub;
export const addEntry = stub;
export const deleteEntry = stub;

// ── Price / search (外部 API，P1 可直接复用 supabase.js 的网络逻辑) ──
export const refreshPrices = stub;
export const searchStock = stub;

// ── Review operations ──
export const getReviewableEntries = stub;
export const updateEntryVerdict = stub;
export const getEntriesInRange = stub;

// ── Review notes CRUD ──
export const getReviews = stub;
export const getReviewByPeriod = stub;
export const saveReview = stub;
export const deleteReview = stub;

// ── Export / Import ──
export const exportData = stub;
export const importData = stub;
