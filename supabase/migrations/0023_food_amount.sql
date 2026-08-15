-- Store the amount + unit a food was logged with, so the diary can show
-- "200 g" / "1 serving" and the edit sheet can adjust by grams.
alter table public.food_logs
  add column if not exists amount numeric,
  add column if not exists unit text;
