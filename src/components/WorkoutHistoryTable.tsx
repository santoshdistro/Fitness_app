import { Dumbbell } from 'lucide-react';
import { useExerciseProgress, type ExerciseSeries } from '../hooks/useExerciseProgress';
import { exerciseRegion, type BodyRegion } from '../data/muscles';
import type { WorkoutGroup } from './WorkoutProgressChart';

const GREEN = '#22c55e';
const RED = '#ef4444';

const SECTIONS: { key: BodyRegion; label: string }[] = [
  { key: 'upper', label: 'Upper body' },
  { key: 'lower', label: 'Lower body' },
  { key: 'core', label: 'Core' },
];

// Condensed strength table — one row per exercise (heaviest set: latest, the
// session before, and the change), grouped by body region and kept in sync with
// the chart's group.
export function WorkoutHistoryTable({ group = 'all' }: { group?: WorkoutGroup }) {
  const { series, loading } = useExerciseProgress();

  if (loading) return null;
  if (series.length === 0) return null;

  const colClass = 'w-14 text-right tabular-nums';
  const visibleSections = SECTIONS.filter(s => group === 'all' || s.key === group);

  function rowsFor(region: BodyRegion): ExerciseSeries[] {
    return series.filter(s => exerciseRegion(s.name) === region);
  }

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Dumbbell size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Lifts by exercise</p>
          <p className="text-[10px] text-[var(--muted)]">{series.length} exercises tracked</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        <span>Exercise</span>
        <span className="flex gap-3">
          <span className={colClass}>Latest</span>
          <span className={colClass}>Prev</span>
          <span className={colClass}>Change</span>
        </span>
      </div>

      <div className="hide-scrollbar max-h-80 overflow-y-auto">
        {visibleSections.map(section => {
          const rows = rowsFor(section.key);
          if (rows.length === 0) return null;
          return (
            <div key={section.key}>
              <p className="pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                {section.label}
              </p>
              {rows.map(s => {
                const delta = s.prev != null ? Math.round((s.latest - s.prev) * 10) / 10 : null;
                const color = delta == null || delta === 0 ? 'var(--muted)' : delta > 0 ? GREEN : RED;
                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between gap-2 border-b border-[var(--card-border)] py-2 text-xs last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate pl-3 capitalize text-[var(--text)]">{s.name}</span>
                    <span className="flex gap-3">
                      <span className={`${colClass} font-semibold text-[var(--text)]`}>{s.latest}kg</span>
                      <span className={`${colClass} text-[var(--muted)]`}>{s.prev != null ? `${s.prev}kg` : '—'}</span>
                      <span className={colClass} style={{ color, fontWeight: 600 }}>
                        {delta == null ? '—' : delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 text-[10px] text-[var(--muted)]">
        Heaviest set per exercise · green = heavier than last session. See the chart above for the
        full trend.
      </p>
    </div>
  );
}
