-- Goal weight so the app can show distance-to-target, progress, and a projected
-- date you'll reach it. Run this once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists target_weight_kg numeric;
