-- Multi-account & ETF type & portfolio snapshots
-- 在 Supabase SQL Editor 执行一次即可。所有操作幂等，可重复运行。

-- ─── ETF: stocks 表加 type 字段 ───
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'stock';

-- ─── 多账户: accounts 表 ───
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own accounts" ON accounts;
CREATE POLICY "own accounts" ON accounts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- ─── stocks / portfolio_settings 加 account_id ───
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stocks_account ON stocks(account_id);

ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
-- 老 PK 是 user_id（每用户一行），改为 (user_id, account_id) 唯一约束
ALTER TABLE portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_pkey;
-- 给已有行加 id（如果没有）
ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE portfolio_settings SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE portfolio_settings ADD CONSTRAINT portfolio_settings_pkey PRIMARY KEY (id);
DROP INDEX IF EXISTS idx_portfolio_settings_user_account;
CREATE UNIQUE INDEX idx_portfolio_settings_user_account
  ON portfolio_settings(user_id, account_id);

-- ─── 净值快照表 ───
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  recorded_at DATE NOT NULL,
  market_value TEXT DEFAULT '0',
  cash TEXT DEFAULT '0',
  total_value TEXT DEFAULT '0',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, recorded_at)
);
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own snapshots" ON portfolio_snapshots;
CREATE POLICY "own snapshots" ON portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_account_date
  ON portfolio_snapshots(account_id, recorded_at DESC);
