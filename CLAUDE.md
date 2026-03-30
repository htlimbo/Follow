# Follow — 个人投资思考记录与复盘工具

## 产品定位

Follow 是一个给自己用的投资研究与持仓管理工具。核心差异化不是行情数据或交易记录，而是**记录"当时我在想什么"**——把投资过程中的思考、判断、修正沉淀下来，支持组合级别的复盘。

一句话：记录你的投资思考，而不只是交易记录。

## 用户画像

就是我自己。A股为主，同时持有6-10只股票。投资风格偏理性分析，关注公司加速上升或周期反转阶段。不看简单的价格止盈止损，而是跟踪与业绩相关的动态锚（如出货量、毛利率、海外收入占比等）。

## 三层核心结构

### 1. 组合总览（首页）
- 所有股票一览，每只显示最近一条思考记录
- 持仓/观察/已清仓三种状态筛选
- 组合级别统计：持仓数量、总市值、总盈亏（需要成本价×股数 vs 现价×股数）
- 数据导入导出（JSON备份）

### 2. 个股研究卡片（核心页面）
- **研究摘要**：投资逻辑、看好理由、风险点、成本价、现价、持仓数量
- **关键追踪锚**：替代传统止盈止损。每个锚 = 指标名称 + 预期值 + 追踪频率（月度/季度/半年度/年度）+ 最新实际值 + 日期 + 备注。一只股票可以有多个追踪锚
- **思考时间线**：每条记录 = 时间戳 + 类型标签（思考/买入/卖出/修正判断/纪律执行）+ 内容。这是整个产品的灵魂

### 3. 阶段复盘（待开发）
- 选时间段回顾所有操作和思考
- 判断兑现率分析
- 思考质量评估，不只是盈亏统计

## 技术栈

- React + Vite + Tailwind CSS v4
- 后端 + 数据库：Supabase（PostgreSQL + Auth + Row Level Security）
- 路由：react-router-dom
- 图标：lucide-react
- ID生成：uuid（本地生成，Supabase 表也使用 uuid 主键）
- 部署：Vercel（前端静态部署）

## 项目结构

```
src/
  main.jsx          # 入口
  index.css          # Tailwind 导入 + 自定义主题变量
  App.jsx            # 路由配置（含 Auth 路由守卫）
  store.js           # 数据层（Supabase CRUD，对外接口不变）
  supabaseClient.js  # Supabase 客户端初始化
  components/
    Layout.jsx       # 顶部导航栏 + 页面容器（含登出按钮）
    AuthGuard.jsx    # 登录状态守卫，未登录重定向到登录页
  pages/
    Login.jsx        # 登录/注册页
    Portfolio.jsx    # 组合总览页
    StockDetail.jsx  # 个股详情页（研究卡片 + 追踪锚 + 时间线）
```

## 设计原则

- **简洁干净**：白底、细边框、充足留白，不要花哨的装饰
- **信息密度适中**：不是塞满数字的仪表盘，留出思考和记录的空间
- **中文优先**：所有界面文案用中文，代码注释可以用英文
- **渐进复杂度**：先做核心功能做到好用，不要过早加花里胡哨的东西

## 自定义主题变量

在 `index.css` 的 `@theme` 中定义，Tailwind 类名直接引用：
- 颜色：`bg-surface`, `text-text-secondary`, `border-border`, `text-accent`, `text-positive`, `text-negative` 等
- 不要引入额外的颜色系统，用现有变量保持一致性

## 开发路线图

**V0.1（MVP）：** 组合总览 + 个股卡片 + 思考时间线 + 追踪锚 + 数据导入导出（localStorage） ✅

**V1.0（SaaS 化）← 当前阶段：**
- Supabase 集成：PostgreSQL 数据库 + Row Level Security
- 用户认证：邮箱密码登录/注册（Supabase Auth）
- 数据层迁移：store.js 从 localStorage 改为 Supabase SDK
- localStorage 数据一键迁移到云端
- 部署到 Vercel，通过互联网访问

**V1.1（体验优化）：**
- 组合总览页支持按盈亏/最近更新排序
- 思考时间线支持按类型筛选
- 更好的移动端响应式适配

**V1.5+（数据增强）：**
- 接入A股行情数据API（自动更新现价）
- 阶段复盘功能

**V2.0（智能化）：**
- AI辅助复盘（分析思考记录中的模式）
- 手机端轻量版

## Supabase 数据库设计

### 表结构

**stocks 表：**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID REFERENCES auth.users(id) NOT NULL
- `name` TEXT NOT NULL
- `code` TEXT NOT NULL
- `status` TEXT DEFAULT 'holding' (holding/watching/closed)
- `shares` TEXT DEFAULT ''
- `cost_price` TEXT DEFAULT ''
- `current_price` TEXT DEFAULT ''
- `thesis` TEXT DEFAULT ''
- `bull_case` TEXT DEFAULT ''
- `bear_case` TEXT DEFAULT ''
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

**anchors 表：**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `stock_id` UUID REFERENCES stocks(id) ON DELETE CASCADE NOT NULL
- `user_id` UUID REFERENCES auth.users(id) NOT NULL
- `name` TEXT NOT NULL
- `expected` TEXT DEFAULT ''
- `frequency` TEXT DEFAULT '季度'
- `latest_value` TEXT DEFAULT ''
- `latest_date` TEXT DEFAULT ''
- `note` TEXT DEFAULT ''
- `created_at` TIMESTAMPTZ DEFAULT now()

**entries 表：**
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `stock_id` UUID REFERENCES stocks(id) ON DELETE CASCADE NOT NULL
- `user_id` UUID REFERENCES auth.users(id) NOT NULL
- `type` TEXT DEFAULT 'thought' (thought/buy/sell/adjust/discipline)
- `content` TEXT NOT NULL
- `price` TEXT DEFAULT ''
- `created_at` TIMESTAMPTZ DEFAULT now()

### Row Level Security (RLS)
每张表都启用 RLS，策略：用户只能读写自己的数据（`auth.uid() = user_id`）。

## 注意事项

- 所有数据操作都通过 `store.js` 进行，不要在组件里直接操作 Supabase
- store.js 对外暴露的函数签名保持不变（异步化除外），降低迁移成本
- Supabase 环境变量放在 `.env` 文件中（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）
- `.env` 已加入 `.gitignore`，不要提交到仓库
- 盈亏计算依赖成本价、现价、持仓数量三个字段都有值，缺任一个就显示"—"
- anchors 从嵌套在 stock 对象中改为独立表，通过 stock_id 关联
