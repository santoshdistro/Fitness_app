-- Cardio sessions (runs/walks/rides) with distance + time. Run once in the SQL Editor.

create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_type text not null default 'run',
  distance_km numeric,
  duration_min numeric,
  calories integer,
  session_timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.cardio_logs enable row level security;

drop policy if exists "cardio_logs_owner" on public.cardio_logs;
create policy "cardio_logs_owner" on public.cardio_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.cardio_logs to authenticated;
