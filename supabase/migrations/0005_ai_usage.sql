-- In-app AI spend tracking: one row per AI call (coach, food scan, body
-- scan, workout plan). cost_usd is computed client-side from the returned
-- token counts and the model's price, so the spend screen never needs the
-- Anthropic admin key. Run this once in the Supabase SQL Editor.

create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_ts_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "ai_usage: owner full access" on public.ai_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.ai_usage to authenticated;
