-- Fix "permission denied for table X" errors: tables created via the SQL
-- Editor don't always inherit the standard role grants. RLS policies only
-- take effect after these table-level privilege checks pass.
-- Run this once in the Supabase SQL Editor.

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select, insert, update, delete on public.measurements to authenticated;
grant select, insert, update, delete on public.food_logs to authenticated;
grant select, insert, update, delete on public.workout_logs to authenticated;
