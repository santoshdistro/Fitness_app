-- History of AI physique-scan readouts (text only; the photo is never stored).
-- Run once in the Supabase SQL Editor.

create table if not exists public.body_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  summary text not null,
  focus_areas jsonb not null default '[]'::jsonb,
  training_focus text,
  nutrition_focus text,
  created_at timestamptz not null default now()
);

alter table public.body_scans enable row level security;

drop policy if exists "body_scans_owner" on public.body_scans;
create policy "body_scans_owner" on public.body_scans
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.body_scans to authenticated;
