-- Track more than just meals: allow "supplement" and "other" so protein shakes,
-- vitamins, drinks, etc. all get logged. Self-contained — also adds the
-- meal_category column if an earlier migration (0004) was never run.
-- Run this once in the Supabase SQL Editor.

alter table public.food_logs
  add column if not exists meal_category text not null default 'snack';

alter table public.food_logs drop constraint if exists food_logs_meal_category_check;

alter table public.food_logs
  add constraint food_logs_meal_category_check
  check (meal_category in ('breakfast', 'lunch', 'dinner', 'snack', 'supplement', 'other'));
