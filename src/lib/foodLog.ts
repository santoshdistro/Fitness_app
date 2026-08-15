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

export async function insertFoodLog(row: Record<string, unknown>) {
  const first = await supabase.from('food_logs').insert(row);
  if (first.error && isUnknownColumn(first.error) && ('amount' in row || 'unit' in row)) {
    const { amount: _a, unit: _u, ...rest } = row;
    return supabase.from('food_logs').insert(rest);
  }
  return first;
}
