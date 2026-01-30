# Supabase 設定指引

## 1. 建立資料表
在 Supabase SQL Editor 執行：

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  stamina integer default 20,
  gold integer default 0,
  checked_in boolean default false,
  last_check_in date,
  updated_at timestamptz default now()
);

alter table profiles
  add column if not exists last_check_in date;
```

## 2. 開啟 RLS 並設定政策

```sql
alter table profiles enable row level security;

create policy "Profiles are readable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on profiles for update
  using (auth.uid() = id);
```

## 3. 新增每日重置與打卡函式（後端判斷）

```sql
create or replace function public.fetch_profile()
returns table (stamina integer, gold integer, checked_in boolean, last_check_in date)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid()) then
    insert into profiles (id, stamina, gold, checked_in, last_check_in)
    values (auth.uid(), 20, 0, false, null);
  end if;

  update profiles
  set checked_in = case when profiles.last_check_in = current_date then true else false end
  where id = auth.uid();

  return query
  select profiles.stamina, profiles.gold, profiles.checked_in, profiles.last_check_in
  from profiles
  where profiles.id = auth.uid();
end;
$$;

create or replace function public.check_in()
returns table (stamina integer, gold integer, checked_in boolean, last_check_in date)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record profiles%rowtype;
begin
  select * into current_record from profiles where id = auth.uid();

  if not found then
    insert into profiles (id, stamina, gold, checked_in, last_check_in)
    values (auth.uid(), 20, 0, true, current_date)
    returning * into current_record;
  elsif current_record.last_check_in is distinct from current_date then
    update profiles
    set stamina = profiles.stamina + 20,
        checked_in = true,
        last_check_in = current_date,
        updated_at = now()
    where profiles.id = auth.uid()
    returning * into current_record;
  end if;

  return query
  select current_record.stamina,
         current_record.gold,
         current_record.checked_in,
         current_record.last_check_in;
end;
$$;

grant execute on function public.fetch_profile() to authenticated;
grant execute on function public.check_in() to authenticated;
```

## 4. 啟用登入
在 Supabase Auth 設定中啟用 Email/Password。
若要使用 Google/GitHub OAuth：

- 在 Auth Providers 啟用 Google 與 GitHub
- 設定 OAuth 的 Client ID/Secret
- 將 http://localhost:5173 加入 Redirect URLs

## 5. 環境變數
已放在 apps/web/.env：

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

若要改成自己的專案，請更新 apps/web/.env。

## 6. 本地測試
執行：

- npm run dev:a
- 開啟 http://localhost:5173

登入後即可自動載入與保存雲端存檔。
