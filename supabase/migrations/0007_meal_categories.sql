-- Track more than just meals: add "supplement" and "other" so protein shakes,
-- vitamins, drinks, etc. all get logged. Run this once in the Supabase SQL Editor.

alter table public.food_logs drop constraint if exists food_logs_meal_category_check;

alter table public.food_logs
  add constraint food_logs_meal_category_check
  check (meal_category in ('breakfast', 'lunch', 'dinner', 'snack', 'supplement', 'other'));
