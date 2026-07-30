-- Full fat breakdown on food logs: trans / poly / mono unsaturated fat, so the
-- Nutrition table can show them (going forward). Run once in the SQL Editor.

alter table public.food_logs
  add column if not exists trans_fat_g numeric,
  add column if not exists poly_fat_g numeric,
  add column if not exists mono_fat_g numeric;
