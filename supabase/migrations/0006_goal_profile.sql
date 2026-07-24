-- Goal-driven profile: the user picks a goal + activity level, and the app
-- derives their calorie target and macros. calorie_deficit_kcal is computed
-- from goal_type + weekly_rate_kg (positive = deficit to lose, negative =
-- surplus to gain, 0 = maintain), so existing screens keep working unchanged.
-- Run this once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists goal_type text,
  add column if not exists activity_level text,
  add column if not exists weekly_rate_kg numeric;

alter table public.profiles
  add constraint profiles_goal_type_check
  check (goal_type is null or goal_type in ('lose', 'maintain', 'gain'));

alter table public.profiles
  add constraint profiles_activity_level_check
  check (activity_level is null or activity_level in ('sedentary', 'light', 'moderate', 'very_active'));
