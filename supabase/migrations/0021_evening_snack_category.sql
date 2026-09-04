-- Add an "evening_snack" meal category. Run once in the SQL editor.
alter table public.food_logs drop constraint if exists food_logs_meal_category_check;

alter table public.food_logs
  add constraint food_logs_meal_category_check
  check (meal_category in ('breakfast', 'lunch', 'dinner', 'snack', 'evening_snack', 'supplement', 'other'));
