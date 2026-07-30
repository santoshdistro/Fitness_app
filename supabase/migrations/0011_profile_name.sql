-- Display name so the app can greet you and show your initials. Run once in the
-- Supabase SQL Editor.

alter table public.profiles
  add column if not exists name text;
