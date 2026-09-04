import { createClient } from '@supabase/supabase-js';
import type { PushReq, PushRes } from './_push.js';

// Apple Health bridge. An iOS Shortcut reads Health metrics and POSTs them here
// with the user's sync token; we resolve the user and upsert into daily_logs.
// Body: { token, date?, steps?, active_calories?, weight_kg?, sleep_hours?,
//         water_ml?, resting_hr?, hrv_ms?, vo2_max?, respiratory_rate?,
//         wrist_temp_delta? }
// date defaults to today in the values' own local day — the Shortcut passes it.

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Guard against a mis-built Shortcut sending an implausible value (e.g. summing
// all-time sleep instead of one night). Out-of-range values are dropped, not
// saved, so a bad sync can never corrupt the day's log.
function inRange(value: number | null, min: number, max: number): number | null {
  if (value == null) return null;
  return value >= min && value <= max ? value : null;
}

export default async function handler(req: PushReq, res: PushRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }

  const rawUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceKey) {
    res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set.' });
    return;
  }
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}) as Record<
    string,
    unknown
  >;
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    res.status(400).json({ error: 'Missing sync token.' });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile, error: lookupError } = await admin
    .from('profiles')
    .select('user_id')
    .eq('sync_token', token)
    .maybeSingle();

  if (lookupError) {
    res.status(500).json({ error: lookupError.message });
    return;
  }
  if (!profile) {
    res.status(401).json({ error: 'Invalid sync token.' });
    return;
  }

  const logDate =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10);

  const payload: Record<string, unknown> = {
    user_id: (profile as { user_id: string }).user_id,
    log_date: logDate,
  };
  const steps = inRange(num(body.steps), 0, 300000);
  const active = inRange(num(body.active_calories), 0, 30000);
  const weight = inRange(num(body.weight_kg), 20, 500);
  const sleep = inRange(num(body.sleep_hours), 0, 24);
  const water = inRange(num(body.water_ml), 0, 30000);
  // Body signals from the watch. Ranges are physiological, not generous: the
  // point of the guard is that a mis-built Shortcut sending a weekly average or
  // a value in the wrong unit gets dropped rather than saved as a real reading.
  const restingHr = inRange(num(body.resting_hr), 25, 150);
  const hrv = inRange(num(body.hrv_ms), 1, 400);
  const vo2 = inRange(num(body.vo2_max), 10, 90);
  const respRate = inRange(num(body.respiratory_rate), 4, 40);
  // Signed on purpose — this is a deviation from your own baseline, and a
  // NEGATIVE reading is as meaningful as a positive one.
  const wristTemp = inRange(num(body.wrist_temp_delta), -5, 5);
  if (steps != null) payload.steps = Math.round(steps);
  if (active != null) payload.active_calories_burned = Math.round(active);
  if (weight != null) payload.weight = Math.round(weight * 100) / 100;
  if (sleep != null) payload.sleep_hours = Math.round(sleep * 10) / 10;
  if (water != null) payload.water_ml = Math.round(water);
  if (restingHr != null) payload.resting_hr = Math.round(restingHr);
  if (hrv != null) payload.hrv_ms = Math.round(hrv);
  if (vo2 != null) payload.vo2_max = Math.round(vo2 * 10) / 10;
  if (respRate != null) payload.respiratory_rate = Math.round(respRate * 10) / 10;
  if (wristTemp != null) payload.wrist_temp_delta = Math.round(wristTemp * 10) / 10;

  const fields = Object.keys(payload).filter(k => k !== 'user_id' && k !== 'log_date');
  if (fields.length === 0) {
    res.status(400).json({ error: 'No health values provided.' });
    return;
  }

  const { error: saveError } = await admin
    .from('daily_logs')
    .upsert(payload, { onConflict: 'user_id,log_date' });

  if (saveError) {
    res.status(500).json({ error: saveError.message });
    return;
  }

  res.status(200).json({ ok: true, date: logDate, updated: fields });
}
