-- Personal Fitness & Nutrition App: initial schema
-- Run this once in the Supabase SQL Editor for a new project.

create extension if not exists "pgcrypto";

-- One row per authenticated user, keyed directly to auth.users.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  height numeric,
  birth_date date,
  gender text check (gender in ('male', 'female')),
  equipment_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily weight / steps / activity snapshot, one row per user per day.
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  weight numeric,
  steps integer,
  active_calories_burned numeric,
  sleep_hours numeric,
  water_ml integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- Point-in-time body measurements, used to derive body fat %.
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_timestamp timestamptz not null default now(),
  neck numeric,
  waist numeric,
  hips numeric,
  chest numeric,
  biceps numeric,
  thighs numeric,
  calculated_body_fat numeric,
  created_at timestamptz not null default now()
);

-- Individual logged meals/food items.
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_timestamp timestamptz not null default now(),
  meal_name text not null,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  created_at timestamptz not null default now()
);

-- Workout sessions; exercise_data holds sets/reps/weight per exercise.
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_timestamp timestamptz not null default now(),
  routine_name text,
  exercise_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);
create index if not exists measurements_user_ts_idx on public.measurements (user_id, entry_timestamp desc);
create index if not exists food_logs_user_ts_idx on public.food_logs (user_id, meal_timestamp desc);
create index if not exists workout_logs_user_ts_idx on public.workout_logs (user_id, session_timestamp desc);

-- Row Level Security: every table only ever exposes the signed-in user's own rows.
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.measurements enable row level security;
alter table public.food_logs enable row level security;
alter table public.workout_logs enable row level security;

create policy "profiles: owner full access" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_logs: owner full access" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "measurements: owner full access" on public.measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "food_logs: owner full access" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workout_logs: owner full access" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep updated_at current on edit.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger daily_logs_set_updated_at
  before update on public.daily_logs
  for each row execute function public.set_updated_at();
