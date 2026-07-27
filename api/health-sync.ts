import { createClient } from '@supabase/supabase-js';
import type { PushReq, PushRes } from './_push.js';

// Apple Health bridge. An iOS Shortcut reads Health metrics and POSTs them here
// with the user's sync token; we resolve the user and upsert into daily_logs.
// Body: { token, date?, steps?, active_calories?, weight_kg?, sleep_hours?, water_ml? }
// date defaults to today in the values' own local day — the Shortcut passes it.

function num(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
    .select('id')
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
    user_id: (profile as { id: string }).id,
    log_date: logDate,
  };
  const steps = num(body.steps);
  const active = num(body.active_calories);
  const weight = num(body.weight_kg);
  const sleep = num(body.sleep_hours);
  const water = num(body.water_ml);
  if (steps != null) payload.steps = Math.round(steps);
  if (active != null) payload.active_calories_burned = Math.round(active);
  if (weight != null) payload.weight = Math.round(weight * 100) / 100;
  if (sleep != null) payload.sleep_hours = Math.round(sleep * 10) / 10;
  if (water != null) payload.water_ml = Math.round(water);

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
