import { useState } from 'react';
import { Sparkles, Check, TriangleAlert, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useStrengthRecords } from '../hooks/useStrengthRecords';
import { generateWorkoutReview, type WorkoutReviewResult } from '../lib/aiClient';

// AI coach review: reads the recent training log + PRs and returns what's going
// well, what's lacking, and what to focus on next.
export function WorkoutReviewCard() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { workouts } = useRecentWorkouts(20);
  const { records } = useStrengthRecords();
  const [review, setReview] = useState<WorkoutReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData = workouts.length > 0;

  async function run() {
    if (!session?.user || !hasData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateWorkoutReview(session.user.id, {
        goal: profile?.goal_type ?? null,
        workouts: workouts.slice(0, 12).map(w => ({
          date: w.session_timestamp.slice(0, 10),
          name: w.routine_name,
          sets: (w.exercise_data ?? []).map(s => ({ ex: s.exercise, reps: s.reps, kg: s.weight })),
        })),
        records: records.slice(0, 8).map(r => ({
          ex: r.exercise,
          bestKg: r.bestWeight,
          e1rm: r.best1RM,
          sessions: r.sessions,
        })),
      });
      setReview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">AI coach review</p>
          <p className="text-[11px] text-[var(--muted)]">
            {hasData
              ? `Feedback on your last ${Math.min(workouts.length, 12)} sessions`
              : 'Log a workout to unlock feedback'}
          </p>
        </div>
      </div>

      {review ? (
        <>
          <p className="rounded-2xl bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--text)]">
            {review.summary}
          </p>
          <Section title="Doing well" color="#22c55e" icon={Check} items={review.strengths} />
          <Section title="To improve" color="#f59e0b" icon={TriangleAlert} items={review.improvements} />
          <Section title="Focus next" color="var(--accent)" icon={Target} items={review.focus} />
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="mt-1 rounded-2xl border border-[var(--card-border)] py-2 text-[11px] font-semibold text-[var(--muted)] disabled:opacity-50"
          >
            {loading ? 'Reviewing…' : 'Refresh review'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={run}
          disabled={loading || !hasData}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Reviewing your training…
            </>
          ) : (
            <>
              <Sparkles size={15} /> Review my progress
            </>
          )}
        </button>
      )}

      {error ? <p className="text-[11px] font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}

function Section({
  title,
  color,
  icon: Icon,
  items,
}: {
  title: string;
  color: string;
  icon: typeof Check;
  items: string[];
}) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
        <Icon size={13} /> {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-xs text-[var(--text)]">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
            <span className="leading-snug">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
