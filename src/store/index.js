// 数据层统一入口（阶段三 P0 抽象）
//
// 目的：所有组件只 import from '../store'，底层实现在这里切换。
// 未来 Web 版继续走 Supabase，桌面 Pro 版走本地 SQLite。
//
// ── 切换策略 ──
// 阶段三 P0（当前）：sqlite.js 还是存根，所以强制走 supabase。
//                    Tauri 包也通过 supabase 访问云端数据——与阶段一行为一致。
// 阶段三 P1 完成后：把 USE_SQLITE 改为运行时检测：
//     const USE_SQLITE = typeof window !== 'undefined'
//                        && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
//
// 这样 Web 版构建继续用 Supabase，Tauri 构建自动走本地 SQLite。
// 目前用 const false 是为了让 bundler 静态消除 sqlite 分支，Web 版零影响。

import * as supabaseImpl from './supabase.js';
import * as sqliteImpl from './sqlite.js';

const USE_SQLITE = false;

const impl = USE_SQLITE ? sqliteImpl : supabaseImpl;

// 显式列出所有接口函数，作为数据层的"契约"。
// 两套实现必须提供同名同签名的导出，否则这里会解构出 undefined、运行时报错。
export const {
  // Stock
  getStocks,
  getStock,
  addStock,
  updateStock,
  deleteStock,
  // Anchor
  getAnchors,
  addAnchor,
  updateAnchor,
  deleteAnchor,
  getAllAnchors,
  // Entry
  getEntries,
  getAllEntries,
  addEntry,
  deleteEntry,
  // Price / search
  refreshPrices,
  searchStock,
  // Review
  getReviewableEntries,
  updateEntryVerdict,
  getEntriesInRange,
  getReviews,
  getReviewByPeriod,
  saveReview,
  deleteReview,
  // Export / Import
  exportData,
  importData,
} = impl;
