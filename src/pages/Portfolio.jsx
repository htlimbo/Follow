import { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, ArrowUpDown, RefreshCw, Download, Upload } from 'lucide-react';
import { getStocks, addStock, getAllEntries, exportData, importData, refreshPrices } from '../store';
import { seedDemo } from '../seedDemo';
import AddStockModal from '../components/AddStockModal';
import StockCard from '../components/StockCard';
import PortfolioCharts from '../components/PortfolioCharts';

export default function Portfolio() {
  const [stocks, setStocks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // updated | pnl | name
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, e] = await Promise.all([getStocks(), getAllEntries()]);
        setStocks(s);
        setEntries(e);

        // 自动刷新A股现价
        try {
          const prices = await refreshPrices(s);
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
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleAdd(data) {
    try {
      const stock = await addStock(data);
      setStocks(prev => [stock, ...prev]);
    } catch (err) {
      console.error('Failed to add stock:', err);
    }
  }

  async function handleRefresh() {
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
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleExport() {
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
  }

  async function handleImport(e) {
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
  }

  const latestEntryMap = {};
  const entryCountMap = {};
  entries.forEach(e => {
    if (!latestEntryMap[e.stockId]) latestEntryMap[e.stockId] = e;
    entryCountMap[e.stockId] = (entryCountMap[e.stockId] || 0) + 1;
  });

  function getPnlPct(s) {
    const cost = parseFloat(s.costPrice);
    const current = parseFloat(s.currentPrice);
    if (isNaN(cost) || isNaN(current) || cost === 0) return -Infinity;
    return (current - cost) / Math.abs(cost) * 100;
  }

  function getLastActivity(s) {
    const entry = latestEntryMap[s.id];
    return entry ? new Date(entry.createdAt).getTime() : new Date(s.updatedAt).getTime();
  }

  const baseList = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);
  const filtered = [...baseList].sort((a, b) => {
    if (sortBy === 'pnl') return getPnlPct(b) - getPnlPct(a);
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    return getLastActivity(b) - getLastActivity(a);
  });

  const holdingStocks = stocks.filter(s => s.status === 'holding');

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-text-tertiary">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'holding', label: '持仓' },
            { key: 'watching', label: '观察' },
            { key: 'closed', label: '已清仓' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key ? 'bg-accent-light text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-text-tertiary">
            <ArrowUpDown size={13} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-text-secondary py-1 pr-1"
            >
              <option value="updated">最近活跃</option>
              <option value="pnl">按盈亏</option>
              <option value="name">按名称</option>
            </select>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} title="刷新行情"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-40">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} title="导出数据"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Download size={16} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="导入数据"
            className="text-text-tertiary hover:text-text-secondary p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Upload size={16} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
            <Plus size={16} /> 添加
          </button>
        </div>
      </div>

      {/* Desktop: left-right layout; Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left: Stock list */}
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-text-tertiary" />
              </div>
              <p className="text-text-secondary mb-1">
                {stocks.length === 0 ? '还没有添加股票' : '这个分类下没有股票'}
              </p>
              <p className="text-sm text-text-tertiary mb-4">
                {stocks.length === 0 ? '点击上方「添加」开始跟踪你的投资思考' : '切换筛选条件试试'}
              </p>
              {stocks.length === 0 && (
                <button
                  onClick={async () => {
                    setLoading(true);
                    await seedDemo();
                    const [s, e] = await Promise.all([getStocks(), getAllEntries()]);
                    setStocks(s);
                    setEntries(e);
                    setLoading(false);
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  或者加载演示数据看看效果
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(stock => (
                <StockCard key={stock.id} stock={stock} latestEntry={latestEntryMap[stock.id]} entryCount={entryCountMap[stock.id] || 0} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Stats + Charts */}
        {holdingStocks.length > 0 && (
          <PortfolioCharts holdingStocks={holdingStocks} />
        )}
      </div>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}
