-- Push reminders: store each device's push subscription, the user's timezone
-- offset, their chosen reminder times, and a per-reminder "last sent" stamp so
-- the scheduler never double-sends. Run this once in the Supabase SQL Editor.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  tz_offset_minutes integer not null default 0,
  prefs jsonb not null default '{}'::jsonb,
  last_sent jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_owner" on public.push_subscriptions;
create policy "push_subscriptions_owner" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- The reminder scheduler reads/writes this table server-side with the
-- service_role key, so it needs table privileges too.
grant all on public.push_subscriptions to service_role;
