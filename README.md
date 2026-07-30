# Fitness App — personal fitness, nutrition & workout tracker

A subscription-free, phone-first PWA I built for myself. Log food/water/sleep,
plan meals and workouts, scan food/physique with AI, and track everything with
charts and a muscle heat-map. No app store, no paywall — add it to the iPhone
Home Screen and it behaves like a native app.

> **Reading this cold (future me, a fresh Claude, or anyone)?** Start with
> [§1 What & how to run](#1-what-it-is--how-to-run), then
> [§4 Where everything lives](#4-where-everything-lives), then
> [§9 Gotchas](#9-gotchas--lessons-learned-read-before-debugging). Those three
> get you productive fastest.

---

## 1. What it is & how to run

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Supabase (Postgres +
Auth + Storage), with serverless functions on Vercel that call the Anthropic API
for the AI features. State that's personal/single-device (AI plans, diet/workout
plans, training split, fasting timer, unit prefs) lives in `localStorage`;
everything shared/durable lives in Supabase.

```sh
npm install
cp .env.example .env    # fill in Supabase URL + anon key (see §5)
npm run dev             # local dev server
npm run build           # tsc -b && vite build (what Vercel runs)
npm run lint            # eslint
npx tsc -p tsconfig.api.json --noEmit   # typecheck the /api serverless fns
```

On iPhone: open the deployed URL in **Safari → Share → Add to Home Screen**.
PWAs cache aggressively — after a deploy you sometimes need to fully close and
reopen the app (or delete + re-add) to get the latest build / new app icon.

## 2. Deployment

- Hosted on **Vercel**, auto-detects Vite. **Every push auto-deploys.**
- The **production branch is `claude/fitness-tracker-planning-18jjik`** (the
  default branch Vercel builds — pushing here ships to production).
- Serverless functions are the files in **`/api`** (Vercel Functions). Files
  prefixed with `_` (e.g. `_anthropic.ts`, `_push.ts`) are **shared helpers, not
  routes**.
- Live app (mine): `https://fitness-app-phi-kohl.vercel.app`
- Supabase project host (mine): `rlmkszvlzyhoyplhveim.supabase.co`

## 3. Tech stack & key concepts

- **Units are stored canonically** (kg, ml, g, cm) and converted at the UI edges
  via `src/utils/units.ts`. Unit prefs (kg/lb, cm/ft, ml/L, g/oz) live in
  `useSettings`.
- **Calorie/macro engine** in `src/utils/calculations.ts`: Mifflin-St Jeor BMR →
  TDEE (×activity) → daily target from goal; Epley 1RM; adaptive TDEE from real
  intake-vs-weight; suggested macros; BMI; metabolic age.
- **AI** goes through `/api/*` (never call Anthropic from the browser — the key
  is server-only). Client wrapper: `src/lib/aiClient.ts`. Usage/cost is logged
  to the `ai_usage` table and shown on the spend screen.
- **`nodenext` module resolution** in `/api`: relative imports **must** use
  `.js` extensions (e.g. `import { getClient } from './_anthropic.js'`) even
  though the files are `.ts`. Forgetting this breaks the Vercel build.

## 4. Where everything lives

```
api/                     Vercel serverless functions (AI + push + health sync)
  _anthropic.ts          shared Anthropic client + JSON helpers + preflight
  _push.ts               shared web-push/VAPID config
  vision-food.ts         AI: food photo -> macros
  vision-body.ts         AI: physique scan -> coaching
  workout-plan.ts        AI: generate a workout plan
  nutrition-coach.ts     AI: diet coach plan
  diet-plan.ts           AI: 7-day diet plan (laid across 2 weeks)
  estimate-food.ts       AI: estimate macros for any typed dish (e.g. aloo methi)
  health-sync.ts         Apple Health bridge (iOS Shortcut POSTs here)
  send-reminders.ts      cron target: sends due push reminders
  push-test.ts, usage.ts

src/
  screens/               top-level tabs: Home, Stats, Discover, Handbook, Workouts
  navigation/AppShell.tsx  tab bar, quick-add menu, all bottom-sheets wired here
  components/            cards, charts, forms/, MuscleMap, BodyMapCard, Sheet, etc.
  hooks/                 data + logic hooks (useProfile, useTrends, useDietPlan,
                         useWorkoutPlan, useMuscleActivity, useTabSwipe, ...)
  data/                  static data: workoutPrograms, exerciseDetails (~180),
                         recipes, indianFoods (~70), muscles, bodyPaths (anatomy)
  lib/                   supabaseClient, aiClient, aiUsage, usdaFoodApi,
                         openFoodFacts, image utils
  utils/                 calculations, units, date, mealCategory, name, healthShortcut
  types/database.ts      Supabase row types

supabase/migrations/     numbered SQL — RUN MANUALLY in the SQL Editor (see §6)
public/                  sw.js (service worker), manifest, app icons, favicon
```

## 5. Environment variables

Client vars are `VITE_`-prefixed (shipped to the browser). Everything else is
**server-only** (Vercel → Settings → Environment Variables). Full template in
`.env.example`.

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | client | Supabase client |
| `VITE_USDA_API_KEY` | client | USDA food search (optional; `DEMO_KEY` works, rate-limited) |
| `ANTHROPIC_API_KEY` | server | all AI features |
| `ANTHROPIC_ADMIN_KEY` | server | optional — real Anthropic billing on spend screen |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server | `send-reminders` + `health-sync` (must be the **service_role** key, not anon) |
| `CRON_SECRET` | server | shared secret so only your scheduler can trigger sends |
| `VITE_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | both/server | Web Push reminders |

> Env vars only apply to deploys made **after** they're added — re-deploy after
> changing them.

## 6. Database & migrations

Schema is a set of numbered SQL files in `supabase/migrations/`. **There is no
automatic runner** — open each new file in the Supabase **SQL Editor** and run
it once, in order. Current set: `0001` … `0018`. Highlights:

- `0001_init` core tables (profiles, daily_logs, measurements, food_logs, workout_logs) + RLS
- `0003_grants` grants to `authenticated`
- `0005_ai_usage` AI spend tracking
- `0009_progress_photos` storage bucket + table
- `0010_push_reminders` push_subscriptions (+ `service_role` grant)
- `0015_body_scans`, `0016_cardio_logs`, `0017_daily_wellness` (caffeine/mood/energy)
- `0018_health_sync` `profiles.sync_token` + service_role grants for the Health bridge

RLS pattern: every table is owner-scoped (`user_id = auth.uid()`) with explicit
`grant`s to the `authenticated` role. Anything the **service_role** touches
(reminders, health-sync) needs its **own** grant — see `0010`/`0018`.

## 7. Feature tour (where things are in the UI)

- **Home** — today's rings, streak, coach card, sleep chart, game plan; the
  refresh icon runs the Health-sync Shortcut if configured; profile (initials)
  opens the profile sheet.
- **Stats** (tabs: **Stats / Trends**) — BMI, metabolic age, adaptive
  maintenance (TDEE from real data), calorie guide, wellness (mood/energy/
  caffeine), meals, physique scans, measurements. Trends = weight/calories/
  protein/steps/caffeine charts with target lines + tap-to-inspect.
- **Discover** (tabs: **Add meal / Nutrition / Macros**) — meal composer with
  3-source food search (Indian + Open Food Facts + USDA) and ✨ AI estimate;
  nutrient table; macro split.
- **Handbook** (tabs: **Diet Handbook / Diet Plan**) — recipes, food list, AI
  diet coach; date-based 2-week meal planner with AI builder + macro totals.
- **Workouts** (tabs: **Workouts / Plan / Heat map**) — programs, AI plan, PRs,
  history; date-based workout planner (split-aware, AI/prefill/copy-last-week,
  guided sessions with rest timer); **Heat map** = anatomical muscle map colored
  by training volume, tap a muscle → exercises → how-to → add to any day, plus a
  volume-ranked "workouts done" list.
- **Quick-add (＋)** — weight, measurements, barcode/photo food, meal, calories,
  activity (steps/water/sleep h+m/active kcal/caffeine/mood/energy), fasting,
  workout, cardio.
- **Reminders / Apple Health sync** — see §8 and §10.

## 8. Push reminders (optional)

Web Push; on iPhone only works after Add-to-Home-Screen.

1. `npx web-push generate-vapid-keys` → add the VAPID vars in Vercel (§5), redeploy.
2. Run `0010_push_reminders.sql`.
3. App → Settings → Reminders → *Turn on*, allow notifications, send a test.
4. **Schedule delivery**: `api/send-reminders` sends anything due in the last 30
   min, so call it every ~15 min. I use **cron-job.org** hitting
   `https://YOUR-APP.vercel.app/api/send-reminders?key=<CRON_SECRET>`. Alternatively
   Supabase `pg_cron`+`pg_net`:

   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;
   select cron.schedule('fitness-reminders', '*/15 * * * *', $$
     select net.http_post(
       url := 'https://YOUR-APP.vercel.app/api/send-reminders',
       headers := '{"Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb
     );
   $$);
   ```

## 9. Gotchas & lessons learned (read before debugging)

Hard-won during the build — future-you will thank present-you:

- **`/api` imports need `.js` extensions** (nodenext). Missing them = Vercel
  build error `TS2835`.
- **Service role, not anon.** `send-reminders`/`health-sync` must use the
  **service_role** key. Using the anon key silently returns 0 rows (RLS hides
  them). And `service_role` still needs explicit table **grants** (see `0010`,
  `0018`) or you get `permission denied for table`.
- **`SUPABASE_URL` must be the bare origin** — no trailing `/rest/v1/`. The code
  normalizes it, but set it clean.
- **Number inputs + `step`**: a value like `4.93` fails `step="0.1"` with "enter a
  valid value". Use `step="any"`, or split into separate fields (sleep uses h+m).
- **Sheets must portal to `document.body`.** A `transform`/animation on an
  ancestor traps `position: fixed` children — sheets opened from animated areas
  wouldn't cover the screen until portaled (`src/components/Sheet.tsx`).
- **PWA caching** hides new deploys — fully close/reopen (or delete + re-add) the
  Home-Screen app. Same for a changed app icon.
- **Apple Health via iOS Shortcuts is fiddly**: `Find Health Samples` returns raw
  multi-source, un-deduplicated data (iPhone + Watch), so steps can double and
  sleep explodes; relative date filters ("in the last 1 day") are unreliable —
  an explicit "is between [computed date] and now" works. The `health-sync`
  endpoint clamps implausible values so a bad Shortcut can't corrupt data. I
  ended up auto-syncing steps + active calories and logging sleep by hand.
- **Anatomy/exercise data is inlined** (no runtime dependency). Only the exercise
  **demo photos** load from GitHub raw at view time — the one remaining external
  dependency (see §10). Text/instructions/paths are all local.

## 10. Data sources & licenses

- **Muscle anatomy** (`src/data/bodyPaths.ts`) — SVG paths adapted from
  **react-body-highlighter** (MIT), inlined so there's no runtime dependency.
- **Exercise how-tos** (`src/data/exerciseDetails.ts`, ~180) — from
  **free-exercise-db** (yuhonas/free-exercise-db, MIT). Text is inlined; demo
  images load on demand from `raw.githubusercontent.com/yuhonas/free-exercise-db`.
- **Food search** — **Open Food Facts** (global, no key), **USDA FoodData
  Central** (US), and a **curated Indian foods list** (`src/data/indianFoods.ts`,
  ~70 dishes). Plus ✨ AI estimate for anything else.
- **Apple Health sync** — a user-built iOS Shortcut POSTs metrics to
  `/api/health-sync` with a per-user `sync_token` (Profile → Apple Health sync
  shows the token + setup steps).

## 11. If you're an AI agent picking this up

- Default/prod branch is `claude/fitness-tracker-planning-18jjik`; pushes
  auto-deploy. Branch, commit, push there (or per the session's instructions).
- Always run `npm run build` **and** `npx tsc -p tsconfig.api.json --noEmit`
  before pushing; `npm run lint` for touched files.
- New DB columns/tables → add a numbered migration in `supabase/migrations/` and
  **tell the user to run it** (there's no auto-runner). Grant `authenticated`
  (and `service_role` if a server function reads it).
- Keep units canonical (kg/ml/g/cm); convert at the edges.
- Don't call Anthropic from the client; add a `/api` route + a wrapper in
  `aiClient.ts`, and log usage via `logAiUsage`.
