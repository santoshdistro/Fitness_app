-- Daily wellness check-in: caffeine, mood and energy. Run once in the SQL Editor.

alter table public.daily_logs
  add column if not exists caffeine_mg integer,
  add column if not exists mood smallint,
  add column if not exists energy smallint;
