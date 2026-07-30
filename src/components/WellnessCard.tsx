import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';

const MOOD = ['😣', '😕', '😐', '🙂', '😄'];
const ENERGY = ['😴', '🥱', '😐', '💪', '⚡'];

function weekdayLetter(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
}

export function WellnessCard() {
  const { logs } = useRecentDailyLogs(14);
  // Last 7 days, oldest → newest (logs already arrive in that order).
  const recent = logs.slice(-7);
  const hasAny = recent.some(l => l.caffeine_mg != null || l.mood != null || l.energy != null);
  if (!hasAny) return null;

  const caffeineDays = recent.filter(l => l.caffeine_mg != null);
  const avgCaffeine = caffeineDays.length
    ? Math.round(caffeineDays.reduce((s, l) => s + (l.caffeine_mg ?? 0), 0) / caffeineDays.length)
    : null;

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">Mood, energy & caffeine</p>
        {avgCaffeine != null ? (
          <p className="text-[11px] text-[var(--muted)]">avg {avgCaffeine} mg/day</p>
        ) : null}
      </div>

      <div className="flex justify-between gap-1">
        {recent.map(l => (
          <div key={l.log_date} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-lg leading-none">{l.mood != null ? MOOD[l.mood - 1] : '·'}</span>
            <span className="text-lg leading-none">{l.energy != null ? ENERGY[l.energy - 1] : '·'}</span>
            <span className="text-[9px] font-semibold text-[var(--text)]">
              {l.caffeine_mg != null ? `${l.caffeine_mg}` : '–'}
            </span>
            <span className="text-[9px] text-[var(--muted)]">{weekdayLetter(l.log_date)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between text-[9px] text-[var(--muted)]">
        <span>Top: mood 😄 · energy ⚡</span>
        <span>caffeine in mg</span>
      </div>
    </div>
  );
}
