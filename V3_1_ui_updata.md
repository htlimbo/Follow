# Follow UI/UX 大改造 — 分阶段实施方案

## Context
用户希望从桌面端开发回到页面和逻辑优化，按 ui_update.md 的需求重构 UI。改造范围包括：配色/字体刷新、三栏布局、迷你走势图、现金仓位、组合净值曲线、写作增强、复盘重构等。需要分阶段推进，每阶段可独立上线。

---

## Phase 1: Bug 修复 + 基础体验 + 视觉刷新（快速见效）

### 1.1 港股代码输入修复
- **问题**: `AddStockModal.jsx` 只接受 5/6 位代码，输入 "2400" 无法搜索
- **修复**: 放宽正则，允许 1-4 位数字触发搜索（shared.js 的 `padStart(5,'0')` 已能处理）
- **文件**: `src/components/stock/AddStockModal.jsx`

### 1.2 ErrorBoundary
- 新建 class 组件 `src/components/layout/ErrorBoundary.jsx`
- 在 `App.jsx` 包裹 Routes，显示友好中文错误页 + 刷新按钮
- **文件**: 新建 `ErrorBoundary.jsx`，改 `App.jsx`

### 1.3 Loading 骨架屏
- 新建 `src/components/ui/Skeleton.jsx` 脉冲占位组件
- 替换 Portfolio / StockDetail / Review 的 "加载中..." 文本
- **文件**: 新建 `Skeleton.jsx`，改 `Portfolio.jsx`, `StockDetail.jsx`, `Review.jsx`

### 1.4 饼图 hover 显示百分比
- `PortfolioCharts.jsx` Tooltip 加上占比百分比
- **文件**: `src/components/layout/PortfolioCharts.jsx`

### 1.5 配色 & 字体刷新
- `index.css` 主题变量更新：
  - accent: `#2563eb` → `#4f46e5` (indigo-600)
  - positive(涨): `#dc2626` → `#f43f5e` (rose-500)
  - negative(跌): `#16a34a` → `#10b981` (emerald-500)
  - 对应 light 色也调整
- 全局数字加 `font-variant-numeric: tabular-nums`
- 正文加 `leading-relaxed`
- 更新 `utils.js` 的 `CHART_COLORS`
- **文件**: `src/index.css`, `src/utils.js`

### 1.6 图表视觉优化
- 柱状图圆角统一、Tooltip 美化
- **文件**: `src/components/layout/PortfolioCharts.jsx`

---

## Phase 2: 现金仓位 + 持仓增强

### 2.1 现金仓位追踪（需新数据表）
- 新建 `portfolio_settings` 表（Supabase + SQLite）存 `cash_balance`
- Store 新增 `getCashBalance()` / `setCashBalance()`
- PortfolioCharts 饼图加入现金占比
- Portfolio 页添加现金编辑入口
- **文件**: `store/supabase.js`, `store/sqlite.js`, `store/index.js`, `PortfolioCharts.jsx`, `Portfolio.jsx`

### 2.2 持仓天数显示
- StockCard 显示 "已持仓 XX 天"（基于已有的 `createdAt`，无需新字段）
- **文件**: `src/components/stock/StockCard.jsx`

### 2.3 饼图图例加百分比
- 饼图 legend 每项显示 "XX.X%"
- **文件**: `src/components/layout/PortfolioCharts.jsx`

---

## Phase 3: 三栏布局 + 迷你走势图（核心重构）

### 3.1 三栏布局
- **桌面 (lg+)**: 左侧窄 icon 导航 | 中间股票列表 | 右侧详情/图表
- **移动端**: 保持现有路由切页，不破坏
- 实现方式：
  - 新建 `AppShell.jsx` 检测屏幕尺寸，决定三栏 vs 单栏
  - 新建 `SideNav.jsx` 替代顶部导航
  - 从 Portfolio.jsx 提取 `StockListPanel.jsx`
  - 用 `LayoutContext` 管理 `selectedStockId`，桌面点击卡片不跳路由
- **文件**: 新建 `AppShell.jsx`, `SideNav.jsx`, `StockListPanel.jsx`；改 `Layout.jsx`, `App.jsx`, `Portfolio.jsx`, `StockCard.jsx`

### 3.2 价格历史数据（需新数据表）
- 新建 `price_history` 表 (stock_id, price, recorded_at, unique per day)
- `refreshPrices()` 每次刷新时自动 upsert 当日价格
- Store 新增 `getPriceHistory(stockId, days)`
- **注意**: 数据从用户开始使用后逐步积累，无需回填
- **文件**: `store/supabase.js`, `store/sqlite.js`, `store/index.js`

### 3.3 Sparkline 迷你走势图组件
- 新建 `src/components/ui/Sparkline.jsx`，基于 Recharts AreaChart
- monotone 平滑曲线 + 隐藏坐标轴 + 渐变填充
- 在 StockCard 背景渲染（低透明度）
- 数据不足 2 天时不显示
- **文件**: 新建 `Sparkline.jsx`，改 `StockCard.jsx`

---

## Phase 4: 写作增强 + 快照系统

### 4.1 快照数据（需改 entries 表）
- entries 加 `snapshot_data` (JSON) + `logic_tags` (text/array)
- snapshot 存当时的价格、涨跌幅等（PE/PB 暂无 API，后续扩展）
- **文件**: Store 双端 + 迁移

### 4.2 写作时实时数据面板
- AddEntryForm 扩展：右侧/下方显示当前股价信息
- "存证" 按钮冻结当前数据到 entry
- **文件**: `AddEntryForm.jsx`，新建 `SnapshotPanel.jsx`

### 4.3 逻辑标签
- 预设: #宏观驱动 #基本面反转 #情绪博弈 #套利，支持自定义
- AddEntryForm 添加标签选择器
- TimelineEntry 显示标签
- **文件**: `AddEntryForm.jsx`, `TimelineEntry.jsx`, `utils.js`

### 4.4 沉浸写作模式
- 输入长文时隐藏侧栏和列表，只留写作区
- **文件**: `AddEntryForm.jsx`, `AppShell.jsx`

---

## Phase 5: 复盘重构 + 组合净值曲线

### 5.1 组合净值曲线（需新数据表）
- 新建 `portfolio_snapshots` 表，每次刷新价格时自动记录
- 新建 PortfolioPnlChart 组件（AreaChart + 渐变，类雪球风格）
- **文件**: Store 双端，新建 `PortfolioPnlChart.jsx`，改 `PortfolioCharts.jsx`

### 5.2 复盘双栏对比
- 左栏"当初的我": 记录内容 + 存证价格 + 当时逻辑
- 右栏"现在的市场": 当前价格 + 涨跌对比
- **文件**: `Review.jsx`, `ScorecardEntry.jsx`

### 5.3 逻辑验证标记
- 三维度: 逻辑证实 / 逻辑证伪 / 意外因素干扰
- 迁移旧 verdict 值
- **文件**: `ScorecardEntry.jsx`, Store 迁移

### 5.4 "回到过去" 反思区
- ReviewNote 底部加高亮 textarea: "如果回到过去，我会改进什么？"
- **文件**: `ReviewNote.jsx`

---

## 依赖关系

```
Phase 1（无依赖，立即开始）
  ↓
Phase 2（依赖 Phase 1 配色）
  ↓
Phase 3（核心重构，依赖 Phase 1）
  ↓
Phase 4（依赖 Phase 3 三栏布局）
  ↓
Phase 5（依赖 Phase 3 价格历史 + Phase 4 快照）
```

## 不在本轮范围（ui_update.md "下一步"）
- Tauri 毛玻璃/置顶小窗/系统托盘
- 逻辑漏斗统计
- PDF 研报导出
- 数据脱敏分享卡片

## 验证方式
- 每个 Phase 完成后 `npm run dev` 验证 Web 版
- `npx tauri dev` 验证桌面版
- 新数据表需在 Supabase Dashboard 执行迁移 SQL + SQLite 端 initTables 自动创建

