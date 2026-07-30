-- Apple Health sync bridge: a per-user secret token that an iOS Shortcut posts
-- alongside health values so the serverless endpoint can resolve the user
-- without exposing their login. Run once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists sync_token text;

-- Fast lookup by token from the service-role endpoint.
create unique index if not exists profiles_sync_token_key
  on public.profiles (sync_token)
  where sync_token is not null;

-- The /api/health-sync endpoint runs as service_role and reads profiles to
-- resolve the token, then upserts daily_logs. Grant it those tables explicitly.
grant select on public.profiles to service_role;
grant select, insert, update on public.daily_logs to service_role;
