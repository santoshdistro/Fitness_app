import { supabase } from './supabaseClient';

// The `amount` / `unit` columns arrive with migration 0023. Until it's run, the
// DB rejects them as unknown columns — so if that specific error comes back, we
// retry the insert without them. Meal logging therefore keeps working whether
// or not the migration has been applied yet.
function isUnknownColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /'?(amount|unit)'? column|column .*(amount|unit)/i.test(error.message ?? '')
  );
}

type Row = Record<string, unknown>;
const stripAmount = (r: Row): Row => {
  const { amount: _a, unit: _u, ...rest } = r;
  return rest;
};

// Accepts a single row or an array (batch). Retries without amount/unit if the
// DB rejects those columns (migration 0023 not yet applied).
export async function insertFoodLog(rows: Row | Row[]) {
  const first = await supabase.from('food_logs').insert(rows as Row);
  if (first.error && isUnknownColumn(first.error)) {
    const stripped = Array.isArray(rows) ? rows.map(stripAmount) : stripAmount(rows);
    return supabase.from('food_logs').insert(stripped as Row);
  }
  return first;
}
