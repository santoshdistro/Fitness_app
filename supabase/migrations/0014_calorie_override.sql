-- Let the user set a manual daily calorie goal that overrides the calculated
-- one. Run once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists calorie_target_override integer;
