-- Meal-based diary: group food log entries into breakfast/lunch/dinner/snack,
-- matching the classic diary layout. Existing rows default to 'snack'.
-- Run this once in the Supabase SQL Editor.

alter table public.food_logs
  add column if not exists meal_category text not null default 'snack';

alter table public.food_logs
  add constraint food_logs_meal_category_check
  check (meal_category in ('breakfast', 'lunch', 'dinner', 'snack'));
