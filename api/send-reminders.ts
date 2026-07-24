import { createClient } from '@supabase/supabase-js';
import { configureWebPush, webpush, type PushReq, type PushRes } from './_push';

// Cron-triggered: for every stored subscription, works out the user's local time
// and sends any reminders due in the current window (deduped per day via
// last_sent). Protect it with CRON_SECRET so only your scheduler can call it.

const MESSAGES: Record<string, { title: string; body: string }> = {
  weighin: { title: 'Morning weigh-in ⚖️', body: 'Hop on the scale and log today’s weight.' },
  breakfast: { title: 'Breakfast 🍳', body: 'Log your breakfast to start the day on track.' },
  lunch: { title: 'Lunch 🥗', body: 'Time for lunch — log it so your macros stay honest.' },
  water: { title: 'Hydration 💧', body: 'Water check — top up and log it.' },
  workout: { title: 'Workout time 🏋️', body: 'Move your body — even 20 minutes counts.' },
  dinner: { title: 'Dinner 🍽️', body: 'Log your dinner and close out the day.' },
};

const WINDOW_MINUTES = 30;

type Row = {
  id: string;
  subscription: webpush.PushSubscription;
  tz_offset_minutes: number;
  prefs: Record<string, { enabled?: boolean; time?: string }> | null;
  last_sent: Record<string, string> | null;
};

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
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

  const admin = createClient(supabaseUrl, serviceKey);
  const { data } = await admin.from('push_subscriptions').select('*');
  const rows = (data as Row[]) ?? [];

  let sent = 0;
  for (const row of rows) {
    const nowLocal = new Date(Date.now() + (row.tz_offset_minutes || 0) * 60000);
    const minutesOfDay = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes();
    const localDate = nowLocal.toISOString().slice(0, 10);
    const prefs = row.prefs ?? {};
    const lastSent = row.last_sent ?? {};
    let changed = false;

    for (const key of Object.keys(prefs)) {
      const pref = prefs[key];
      const msg = MESSAGES[key];
      if (!pref?.enabled || !pref.time || !msg) continue;
      const [h, m] = String(pref.time).split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;
      const target = h * 60 + m;
      const delta = minutesOfDay - target;
      if (delta >= 0 && delta < WINDOW_MINUTES && lastSent[key] !== localDate) {
        try {
          await webpush.sendNotification(
            row.subscription,
            JSON.stringify({ title: msg.title, body: msg.body, tag: key }),
          );
          lastSent[key] = localDate;
          changed = true;
          sent += 1;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', row.id);
          }
        }
      }
    }

    if (changed) {
      await admin.from('push_subscriptions').update({ last_sent: lastSent }).eq('id', row.id);
    }
  }

  res.status(200).json({ ok: true, sent });
}
