-- Progress photos: a private storage bucket + a metadata table so you can build
-- a visual before/after timeline. Run this once in the Supabase SQL Editor.

-- 1. Private bucket (only the owner can read their files via signed URLs).
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- 2. Storage access: a user may only touch objects under a top-level folder
--    named after their own user id (e.g. "<uid>/photo.jpg").
drop policy if exists "progress_photos_read_own" on storage.objects;
drop policy if exists "progress_photos_insert_own" on storage.objects;
drop policy if exists "progress_photos_delete_own" on storage.objects;

create policy "progress_photos_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "progress_photos_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Metadata table.
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  taken_on date not null default current_date,
  weight_kg numeric,
  note text,
  created_at timestamptz not null default now()
);

alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos_owner" on public.progress_photos;
create policy "progress_photos_owner" on public.progress_photos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.progress_photos to authenticated;
