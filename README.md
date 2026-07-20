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
