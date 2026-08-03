import { supabase } from './supabaseClient';

// Tables that hold the user's own fitness data — everything worth backing up.
// (push_subscriptions / ai_usage are device/plumbing data and are left out.)
export const EXPORT_TABLES = [
  'profiles',
  'daily_logs',
  'food_logs',
  'workout_logs',
  'measurements',
  'cardio_logs',
  'body_scans',
  'progress_photos',
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

async function fetchTable(userId: string, table: string): Promise<Record<string, unknown>[]> {
  const { data } = await supabase.from(table).select('*').eq('user_id', userId);
  return (data as Record<string, unknown>[]) ?? [];
}

/** All of the user's data, keyed by table. */
export async function fetchAllData(userId: string): Promise<Record<string, Record<string, unknown>[]>> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const t of EXPORT_TABLES) out[t] = await fetchTable(userId, t);
  return out;
}

/** Triggers a browser download of `content`. */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Flattens rows to CSV, JSON-stringifying nested values (e.g. exercise_data). */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Array.from(
    rows.reduce<Set<string>>((set, r) => {
      Object.keys(r).forEach(k => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const esc = (v: unknown): string => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Full JSON backup of every table. */
export async function exportJson(userId: string): Promise<void> {
  const data = await fetchAllData(userId);
  const payload = { exportedAt: new Date().toISOString(), app: 'fitness-tracker', data };
  downloadFile(`fitness-backup-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

/** One table as a CSV file. */
export async function exportTableCsv(userId: string, table: ExportTable): Promise<number> {
  const rows = await fetchTable(userId, table);
  downloadFile(`${table}-${stamp()}.csv`, toCsv(rows), 'text/csv');
  return rows.length;
}
