// 数据层统一入口
//
// 所有组件只 import from '../store'，底层实现在这里切换。
// - Web 版：永远走 Supabase（无需选择）
// - Tauri 桌面版：默认走 Supabase（云端同步），Pro 用户可切换到本地 SQLite
//
// 存储模式保存在 localStorage('follow_storage_mode')：
//   'local' = 本地 SQLite（仅 Tauri 桌面版 Pro 用户）
//   其他或不存在 = Supabase 云端

import * as supabaseImpl from './supabase.js';
import * as sqliteImpl from './sqlite.js';

const STORAGE_KEY = 'follow_storage_mode';

export const isTauri = typeof window !== 'undefined'
  && '__TAURI_INTERNALS__' in window;

export function getStorageMode() {
  if (!isTauri) return 'cloud';
  // 桌面版默认本地存储，用户可切换到云端
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'cloud') return 'cloud';
  return 'local';
}

export function setStorageMode(mode) {
  localStorage.setItem(STORAGE_KEY, mode);
  // 切换后需要刷新页面，让所有组件重新绑定到新的 store 实现
  window.location.reload();
}

const useLocal = isTauri && getStorageMode() === 'local';
const impl = useLocal ? sqliteImpl : supabaseImpl;

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
  getPriceHistory,
  // Review
  getReviewableEntries,
  updateEntryVerdict,
  getEntriesInRange,
  getReviews,
  getReviewByPeriod,
  saveReview,
  deleteReview,
  // Portfolio settings
  getCashBalance,
  setCashBalance,
  // Journal
  getJournals,
  addJournal,
  updateJournal,
  deleteJournal,
  // Export / Import
  exportData,
  importData,
} = impl;
