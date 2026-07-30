import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

// Destructive account actions. Each confirms first, then reloads so every screen
// reflects the fresh state.
export function DataResetSection() {
  const { session } = useAuth();
  const { saveProfile } = useProfile();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;

  async function resetGoal() {
    if (!userId) return;
    if (!window.confirm('Reset your goal and re-run the setup wizard? Your logged data is kept.')) return;
    setBusy('goal');
    setError(null);
    const { error: e } = await saveProfile({
      goal_type: null,
      target_weight_kg: null,
      weekly_rate_kg: null,
      calorie_target_override: null,
    });
    if (e) {
      setError(e.message);
      setBusy(null);
      return;
    }
    window.location.reload();
  }

  async function clearAllData() {
    if (!userId) return;
    if (
      !window.confirm(
        'Delete ALL your logged data — meals, activity, workouts, measurements, physique scans and progress photos? This cannot be undone.',
      )
    )
      return;
    setBusy('data');
    setError(null);
    try {
      // Remove progress photo files from storage first.
      const { data: photos } = await supabase
        .from('progress_photos')
        .select('storage_path')
        .eq('user_id', userId);
      const paths = (photos as { storage_path: string }[] | null)?.map(p => p.storage_path) ?? [];
      if (paths.length > 0) await supabase.storage.from('progress-photos').remove(paths);

      const tables = [
        'food_logs',
        'daily_logs',
        'workout_logs',
        'measurements',
        'body_scans',
        'progress_photos',
      ];
      for (const table of tables) {
        const { error: e } = await supabase.from(table).delete().eq('user_id', userId);
        if (e) throw new Error(`${table}: ${e.message}`);
      }

      // Local AI artifacts.
      localStorage.removeItem(`ai_workout_plan:${userId}`);
      localStorage.removeItem(`nutrition_plan:${userId}`);
      localStorage.removeItem(`nutrition_prefs:${userId}`);

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear data.');
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--card-border)] pt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-500/80">Danger zone</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={resetGoal}
          disabled={busy != null}
          className="flex items-center gap-2 rounded-2xl border border-[var(--card-border)] px-4 py-3 text-left text-sm font-semibold text-[var(--text)] disabled:opacity-50"
        >
          <RotateCcw size={16} className="text-[var(--muted)]" />
          {busy === 'goal' ? 'Resetting…' : 'Reset goal & re-run setup'}
        </button>
        <button
          type="button"
          onClick={clearAllData}
          disabled={busy != null}
          className="flex items-center gap-2 rounded-2xl border border-red-500/40 px-4 py-3 text-left text-sm font-semibold text-red-500 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {busy === 'data' ? 'Clearing…' : 'Clear all my logged data'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
      <p className="mt-2 text-[11px] text-[var(--muted)]">
        Resetting the goal keeps your logs. Clearing data can't be undone.
      </p>
    </div>
  );
}
