-- Additional body-measurement sites for progress tracking.
-- Existing columns already cover neck, waist, hips, chest, biceps, thighs.
alter table public.measurements
  add column if not exists belly numeric,
  add column if not exists calves numeric,
  add column if not exists forearms numeric;
