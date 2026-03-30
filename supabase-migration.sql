-- Follow 数据库建表 SQL
-- 在 Supabase SQL Editor 中执行

-- 1. stocks 表
create table stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  code text not null default '',
  status text not null default 'holding',
  shares text default '',
  cost_price text default '',
  current_price text default '',
  thesis text default '',
  bull_case text default '',
  bear_case text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. anchors 表
create table anchors (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references stocks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  expected text default '',
  frequency text default '季度',
  latest_value text default '',
  latest_date text default '',
  note text default '',
  created_at timestamptz default now()
);

-- 3. entries 表
create table entries (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references stocks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  type text not null default 'thought',
  content text not null,
  price text default '',
  created_at timestamptz default now()
);

-- 4. 启用 Row Level Security
alter table stocks enable row level security;
alter table anchors enable row level security;
alter table entries enable row level security;

-- 5. RLS 策略：用户只能操作自己的数据
create policy "Users can view own stocks" on stocks for select using (auth.uid() = user_id);
create policy "Users can insert own stocks" on stocks for insert with check (auth.uid() = user_id);
create policy "Users can update own stocks" on stocks for update using (auth.uid() = user_id);
create policy "Users can delete own stocks" on stocks for delete using (auth.uid() = user_id);

create policy "Users can view own anchors" on anchors for select using (auth.uid() = user_id);
create policy "Users can insert own anchors" on anchors for insert with check (auth.uid() = user_id);
create policy "Users can update own anchors" on anchors for update using (auth.uid() = user_id);
create policy "Users can delete own anchors" on anchors for delete using (auth.uid() = user_id);

create policy "Users can view own entries" on entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on entries for delete using (auth.uid() = user_id);

-- 6. updated_at 自动更新触发器
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stocks_updated_at
  before update on stocks
  for each row execute function update_updated_at();
