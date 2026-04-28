import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getStocks, addStock, getAllEntries, exportData, importData, refreshPrices, getCashBalance, setCashBalance, getPriceHistory } from '../store';
import { isTradingHour } from '../utils';
import { useAccount } from './AccountContext';

const StockDataContext = createContext(null);

export function StockDataProvider({ children }) {
  const { activeAccountId, loading: accountLoading } = useAccount();
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cashBalance, setCashBal] = useState('');
  const [priceHistoryMap, setPriceHistoryMap] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (accountLoading) return;
    let cancelled = false;
    setLoading(true);
    async function load() {
      try {
        const [s, e, cash] = await Promise.all([getStocks(), getAllEntries(), getCashBalance()]);
        if (cancelled) return;
        setStocks(s);
        setEntries(e);
        setCashBal(cash);

        if (isTradingHour() && s.length > 0) {
          try {
            const prices = await refreshPrices(s);
            if (cancelled) return;
            if (Object.keys(prices).length > 0) {
              setStocks(prev => prev.map(stock => {
                const quote = prices[stock.code];
                if (quote && quote.price != null) {
                  return { ...stock, currentPrice: String(quote.price) };
                }
                return stock;
              }));
            }
          } catch { /* 行情刷新失败不影响页面加载 */ }
        }

        // 加载价格历史（用于 Sparkline）
        if (s.length > 0) {
          try {
            const historyEntries = await Promise.all(
              s.map(stock => getPriceHistory(stock.id, 30).then(h => [stock.id, h]))
            );
            if (cancelled) return;
            const map = {};
            historyEntries.forEach(([id, history]) => { map[id] = history; });
            setPriceHistoryMap(map);
          } catch { /* 价格历史加载失败不影响页面 */ }
        } else {
          setPriceHistoryMap({});
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeAccountId, accountLoading]);

  const handleAdd = useCallback(async (data) => {
    try {
      const stock = await addStock(data);
      setStocks(prev => [stock, ...prev]);
      return stock;
    } catch (err) {
      console.error('Failed to add stock:', err);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const prices = await refreshPrices(stocks);
      if (Object.keys(prices).length > 0) {
        setStocks(prev => prev.map(stock => {
          const quote = prices[stock.code];
          if (quote && quote.price != null) {
            return { ...stock, currentPrice: String(quote.price) };
          }
          return stock;
        }));
      }
      // 刷新后更新价格历史
      const historyEntries = await Promise.all(
        stocks.map(stock => getPriceHistory(stock.id, 30).then(h => [stock.id, h]))
      );
      const map = {};
      historyEntries.forEach(([id, history]) => { map[id] = history; });
      setPriceHistoryMap(map);
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      setRefreshing(false);
    }
  }, [stocks]);

  const handleExport = useCallback(async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `follow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  }, []);

  const handleImport = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const ok = await importData(ev.target.result);
      if (ok) {
        const [s, en] = await Promise.all([getStocks(), getAllEntries()]);
        setStocks(s);
        setEntries(en);
      } else {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleSaveCash = useCallback(async (amount) => {
    try {
      await setCashBalance(amount);
      setCashBal(amount);
    } catch (err) {
      console.error('Failed to save cash balance:', err);
    }
  }, []);

  // Update stock in local state (after editing research card, refreshing price, etc.)
  const updateLocalStock = useCallback((id, updates) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeLocalStock = useCallback((id) => {
    setStocks(prev => prev.filter(s => s.id !== id));
  }, []);

  const addLocalEntry = useCallback((entry) => {
    setEntries(prev => [entry, ...prev]);
  }, []);

  const removeLocalEntry = useCallback((entryId) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  // Derived data
  const latestEntryMap = {};
  const entryCountMap = {};
  entries.forEach(e => {
    if (!latestEntryMap[e.stockId]) latestEntryMap[e.stockId] = e;
    entryCountMap[e.stockId] = (entryCountMap[e.stockId] || 0) + 1;
  });

  const holdingStocks = stocks.filter(s => s.status === 'holding');

  const value = {
    stocks, entries, loading, refreshing, cashBalance, priceHistoryMap,
    holdingStocks, latestEntryMap, entryCountMap,
    fileInputRef,
    handleAdd, handleRefresh, handleExport, handleImport, handleSaveCash,
    updateLocalStock, removeLocalStock, addLocalEntry, removeLocalEntry,
    setStocks, setEntries, setLoading,
  };

  return (
    <StockDataContext.Provider value={value}>
      {children}
    </StockDataContext.Provider>
  );
}

export function useStockData() {
  const ctx = useContext(StockDataContext);
  if (!ctx) throw new Error('useStockData must be used within StockDataProvider');
  return ctx;
}
