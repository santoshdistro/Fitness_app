import { createClient } from '@supabase/supabase-js';
import type { PushReq, PushRes } from './_push.js';

// Apple Health bridge. An iOS Shortcut reads Health metrics and POSTs them here
// with the user's sync token; we resolve the user and upsert into daily_logs.
// One day:  { token, date?, steps?, active_calories?, weight_kg?, sleep_hours?,
//             water_ml?, resting_hr?, hrv_ms?, vo2_max?, respiratory_rate?,
//             wrist_temp_delta? }
// Backfill:  { token, days: [ { date, ...same fields }, ... ] }
//
// The batch lives in this endpoint rather than its own file because api/ is at
// Vercel's 12-function limit — and it is the same work anyway, so both paths
// share one validator instead of drifting apart.
// date defaults to today in the values' own local day — the Shortcut passes it.

// A month or a year of history is the point; beyond that it is a mistake, and
// a single upsert of thousands of rows is not what this endpoint is for.
const MAX_BATCH_DAYS = 400;

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

  // One day's values → the row to upsert. Extracted so a single-day POST and a
  // batch row go through exactly the same validation; a backfill that accepted
  // values the daily path rejects would be worse than no backfill.
  function rowFor(
    source: Record<string, unknown>,
    fallbackDate: string,
  ): { logDate: string; payload: Record<string, unknown>; fields: string[] } {
    const logDate =
      typeof source.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(source.date)
        ? source.date
        : fallbackDate;

    const payload: Record<string, unknown> = {
      user_id: (profile as { user_id: string }).user_id,
      log_date: logDate,
    };
    const steps = inRange(num(source.steps), 0, 300000);
    const active = inRange(num(source.active_calories), 0, 30000);
    const weight = inRange(num(source.weight_kg), 20, 500);
    const sleep = inRange(num(source.sleep_hours), 0, 24);
    const water = inRange(num(source.water_ml), 0, 30000);
    // Body signals from the watch. Ranges are physiological, not generous: the
    // point of the guard is that a mis-built Shortcut sending a weekly average
    // or a value in the wrong unit gets dropped rather than saved as a reading.
    const restingHr = inRange(num(source.resting_hr), 25, 150);
    const hrv = inRange(num(source.hrv_ms), 1, 400);
    const vo2 = inRange(num(source.vo2_max), 10, 90);
    const respRate = inRange(num(source.respiratory_rate), 4, 40);
    // Signed on purpose — this is a deviation from your own baseline, and a
    // NEGATIVE reading is as meaningful as a positive one.
    const wristTemp = inRange(num(source.wrist_temp_delta), -5, 5);
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
    return { logDate, payload, fields };
  }

  const today = new Date().toISOString().slice(0, 10);

  // ---- Batch: { token, days: [ { date, ...values }, ... ] } ----------------
  // Backfilling a history one request per day is a hundred round trips that
  // each get a chance to fail halfway. One POST carries the lot.
  if (Array.isArray(body.days)) {
    const days = body.days as Record<string, unknown>[];
    if (days.length === 0) {
      res.status(400).json({ error: 'days was empty.' });
      return;
    }
    if (days.length > MAX_BATCH_DAYS) {
      res.status(400).json({ error: `Too many days in one request — ${MAX_BATCH_DAYS} max.` });
      return;
    }

    const rows: Record<string, unknown>[] = [];
    const skipped: { date: string; reason: string }[] = [];
    const seen = new Set<string>();
    for (const day of days) {
      const { logDate, payload, fields } = rowFor(day, today);
      if (fields.length === 0) {
        skipped.push({ date: logDate, reason: 'no usable values' });
        continue;
      }
      // The upsert would fail outright on two rows for the same day in one
      // statement ("cannot affect row a second time"), so the later one wins
      // here rather than taking the whole batch down.
      if (seen.has(logDate)) {
        const at = rows.findIndex(r => r.log_date === logDate);
        rows[at] = payload;
        continue;
      }
      seen.add(logDate);
      rows.push(payload);
    }

    if (rows.length === 0) {
      res.status(400).json({ error: 'No usable values in any day.', skipped });
      return;
    }

    const { error: batchError } = await admin
      .from('daily_logs')
      .upsert(rows, { onConflict: 'user_id,log_date' });
    if (batchError) {
      res.status(500).json({ error: batchError.message });
      return;
    }

    res.status(200).json({
      ok: true,
      saved: rows.length,
      from: rows[0].log_date,
      to: rows[rows.length - 1].log_date,
      ...(skipped.length ? { skipped } : {}),
    });
    return;
  }

  // ---- Single day, unchanged ----------------------------------------------
  const { logDate, payload, fields } = rowFor(body, today);
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
