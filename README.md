# Fitness App

A subscription-free personal fitness & nutrition tracker. Vite + React + TypeScript + Tailwind, backed by Supabase.

## Getting started

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

Open the printed local URL in a browser. On an iPhone, open it in Safari and use
**Share → Add to Home Screen** for an installable, full-screen app icon.

## Database

The schema lives in `supabase/migrations/0001_init.sql` — run it once in your
Supabase project's SQL Editor to create the `profiles`, `daily_logs`,
`measurements`, `food_logs`, and `workout_logs` tables with Row Level Security.

## Deploying

Push to GitHub and import the repo into [Vercel](https://vercel.com) — it
auto-detects Vite and redeploys on every push. Set the same two environment
variables from `.env` in the Vercel project settings.

## Push reminders (optional)

Daily reminder notifications (log meals, hydrate, workout, weigh-in) use the Web
Push standard. On iPhone they only work once the app is added to the Home Screen.

1. **Generate VAPID keys** (once): `npx web-push generate-vapid-keys`.
2. **Add env vars in Vercel** (see `.env.example`): `VITE_VAPID_PUBLIC_KEY`,
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, plus `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` and a random `CRON_SECRET`. Redeploy.
3. **Run migration** `supabase/migrations/0010_push_reminders.sql`.
4. **Turn them on**: open the app from your Home Screen → Settings → Reminders →
   *Turn on*, allow notifications, then *Send me a test notification* to confirm.
5. **Schedule delivery.** `api/send-reminders` sends any reminders due in the last
   30 minutes, so call it every ~15–30 min. The simplest cross-plan option is
   Supabase `pg_cron` + `pg_net` (run in the SQL Editor, replace the URL/secret):

   ```sql
   -- one-time: enable the extensions
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   -- run every 15 minutes
   select cron.schedule('fitness-reminders', '*/15 * * * *', $$
     select net.http_post(
       url := 'https://YOUR-APP.vercel.app/api/send-reminders',
       headers := '{"Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb
     );
   $$);
   ```

   (On Vercel Pro you could use a Vercel Cron instead; Hobby crons only run once
   a day, which is why `pg_cron` is the recommended scheduler.)
