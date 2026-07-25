import { createClient } from '@supabase/supabase-js';
import { configureWebPush, webpush, type PushReq, type PushRes } from './_push.js';

// Cron-triggered: for every stored subscription, works out the user's local time
// and sends any reminders due in the current window (deduped via last_sent).
// Protect it with CRON_SECRET so only your scheduler can call it.

const MESSAGES: Record<string, { title: string; body: string }> = {
  weighin: { title: 'Morning weigh-in ⚖️', body: 'Hop on the scale and log today’s weight.' },
  breakfast: { title: 'Breakfast 🍳', body: 'Log your breakfast to start the day on track.' },
  lunch: { title: 'Lunch 🥗', body: 'Time for lunch — log it so your macros stay honest.' },
  workout: { title: 'Workout time 🏋️', body: 'Move your body — even 20 minutes counts.' },
  dinner: { title: 'Dinner 🍽️', body: 'Log your dinner and close out the day.' },
  water: { title: 'Drink water 💧', body: 'Hydration check — grab a glass and log it.' },
};

const WINDOW_MINUTES = 30;

type FixedPref = { enabled?: boolean; time?: string };
type WaterPref = { enabled?: boolean; everyHours?: number; startTime?: string; endTime?: string };
type Prefs = { items?: Record<string, FixedPref>; water?: WaterPref };

type Row = {
  id: string;
  subscription: webpush.PushSubscription;
  tz_offset_minutes: number;
  prefs: Prefs | null;
  last_sent: Record<string, string> | null;
};

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function toMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Describes the Supabase key WITHOUT leaking it, to spot anon-vs-service mistakes. */
function describeKey(key: string): string {
  if (key.startsWith('sb_secret_')) return 'new secret key (OK)';
  if (key.startsWith('sb_publishable_')) return 'PUBLISHABLE key — WRONG, use the secret key';
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as { role?: string };
      return `jwt role=${payload.role ?? 'unknown'}${payload.role === 'service_role' ? ' (OK)' : ' — WRONG, use the service_role key'}`;
    } catch {
      return 'unreadable jwt';
    }
  }
  return 'unknown key format';
}

export default async function handler(req: PushReq, res: PushRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = firstHeader(req.headers?.authorization);
    const key = firstHeader(req.query?.key);
    if (auth !== `Bearer ${secret}` && key !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  if (!configureWebPush()) {
    res.status(500).json({ error: 'Push is not configured. Add VAPID keys in Vercel.' });
    return;
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.' });
    return;
  }

  const debug = firstHeader(req.query?.debug) !== '';

  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error: selectError } = await admin.from('push_subscriptions').select('*');
  const rows = (data as Row[]) ?? [];

  let sent = 0;
  const diagnostics: unknown[] = [];
  for (const row of rows) {
    const nowLocal = new Date(Date.now() + (row.tz_offset_minutes || 0) * 60000);
    const minutesOfDay = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();
    const localDate = nowLocal.toISOString().slice(0, 10);
    const prefs = row.prefs ?? {};
    const lastSent = row.last_sent ?? {};
    let changed = false;

    const trySend = async (tag: string, dedupKey: string) => {
      const msg = MESSAGES[tag];
      if (!msg || lastSent[tag] === dedupKey) return;
      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify({ title: msg.title, body: msg.body, tag }),
        );
        lastSent[tag] = dedupKey;
        changed = true;
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', row.id);
        }
      }
    };

    // Fixed one-time reminders.
    for (const [tag, pref] of Object.entries(prefs.items ?? {})) {
      if (!pref?.enabled) continue;
      const target = toMinutes(pref.time);
      if (target == null) continue;
      const delta = minutesOfDay - target;
      if (delta >= 0 && delta < WINDOW_MINUTES) {
        await trySend(tag, localDate);
      }
    }

    // Interval water reminder within its daytime window.
    const water = prefs.water;
    const start = toMinutes(water?.startTime);
    const end = toMinutes(water?.endTime);
    const intervalMin = Math.max(1, Math.round((water?.everyHours ?? 2) * 60));
    const inRange = start != null && end != null && minutesOfDay >= start && minutesOfDay <= end;
    const since = start != null ? minutesOfDay - start : null;
    const slot = since != null ? Math.floor(since / intervalMin) : null;
    const intoSlot = since != null && slot != null ? since - slot * intervalMin : null;
    if (water?.enabled && inRange && intoSlot != null && intoSlot < WINDOW_MINUTES && slot != null) {
      await trySend('water', `${localDate}#${slot}`);
    }

    if (debug) {
      diagnostics.push({
        localTime: `${String(nowLocal.getUTCHours()).padStart(2, '0')}:${String(nowLocal.getUTCMinutes()).padStart(2, '0')}`,
        localDate,
        tzOffsetMinutes: row.tz_offset_minutes,
        hasWaterPref: Boolean(water),
        water: water
          ? {
              enabled: Boolean(water.enabled),
              everyHours: water.everyHours,
              start: water.startTime,
              end: water.endTime,
              inRange,
              intoSlot,
              windowMinutes: WINDOW_MINUTES,
              dedupKey: slot != null ? `${localDate}#${slot}` : null,
              lastSentWater: lastSent.water ?? null,
            }
          : null,
        enabledItems: Object.entries(prefs.items ?? {})
          .filter(([, p]) => p?.enabled)
          .map(([tag, p]) => ({ tag, time: p.time })),
      });
    }

    if (changed) {
      await admin.from('push_subscriptions').update({ last_sent: lastSent }).eq('id', row.id);
    }
  }

  res.status(200).json({
    ok: true,
    sent,
    subscriptions: rows.length,
    ...(debug
      ? {
          serviceKey: describeKey(serviceKey),
          supabaseHost: (() => {
            try {
              return new URL(supabaseUrl).host;
            } catch {
              return 'invalid SUPABASE_URL';
            }
          })(),
          selectError: selectError?.message ?? null,
          diagnostics,
        }
      : {}),
  });
}
