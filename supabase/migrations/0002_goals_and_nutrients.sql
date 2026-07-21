-- Configurable goals (calorie deficit/surplus, macro/nutrient targets)
-- and fiber/sodium tracking on logged meals.
-- Run this once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists calorie_deficit_kcal numeric not null default 500,
  add column if not exists protein_target_g numeric,
  add column if not exists fiber_target_g numeric,
  add column if not exists sodium_target_mg numeric;

alter table public.food_logs
  add column if not exists fiber_g numeric,
  add column if not exists sodium_mg numeric;
