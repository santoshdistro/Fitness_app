-- Richer nutrition: track sugar and saturated fat so the Nutrition table can
-- show them (going forward — existing rows stay null). Run once in the SQL Editor.

alter table public.food_logs
  add column if not exists sugar_g numeric,
  add column if not exists saturated_fat_g numeric;
