-- Daily electrolyte tracking (sodium, potassium, magnesium, calcium in mg),
-- stored as running daily totals on daily_logs like water. Run once in the
-- Supabase SQL Editor.

alter table public.daily_logs
  add column if not exists sodium_mg integer,
  add column if not exists potassium_mg integer,
  add column if not exists magnesium_mg integer,
  add column if not exists calcium_mg integer;
