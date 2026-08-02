import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useSettings } from '../hooks/useSettings';
import { addDays, startOfWeek, todayDateString } from '../utils/date';

// Compact "Weekly Overview": a weekly activity score over a row of rounded
// pill bars (Sun–Sat), today's/peak bar highlighted. Uses real logged steps +
// training days.
export function WorkoutOverviewCard() {
  const { logs } = useRecentDailyLogs(14);
  const { workouts } = useRecentWorkouts(40);
  const { settings } = useSettings();
  const stepGoal = settings.stepGoal || 10000;

  const { days, scorePct, peakIndex } = useMemo(() => {
    const today = todayDateString();
    const weekStart = startOfWeek(today); // Monday

    const stepsByDate = new Map<string, number>();
    for (const l of logs) if (l.steps != null) stepsByDate.set(l.log_date, l.steps);
    const trainedDates = new Set(workouts.map(w => w.session_timestamp.slice(0, 10)));

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const steps = stepsByDate.get(date) ?? 0;
      const trained = trainedDates.has(date);
      const ratio = Math.min(1.2, Math.max(steps / stepGoal, trained ? 0.9 : 0));
      return {
        date,
        label: new Date(`${date}T00:00:00`)
          .toLocaleDateString(undefined, { weekday: 'short' })
          .slice(0, 1),
        ratio,
        pct: Math.round(ratio * 100),
        isToday: date === today,
        future: date > today,
      };
    });

    const past = days.filter(d => !d.future);
    const scorePct = past.length
      ? Math.round((past.reduce((s, d) => s + Math.min(1, d.ratio), 0) / past.length) * 100)
      : 0;
    let peakIndex = 0;
    days.forEach((d, i) => {
      if (!d.future && d.ratio >= days[peakIndex].ratio) peakIndex = i;
    });
    return { days, scorePct, peakIndex };
  }, [logs, workouts, stepGoal]);

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
          >
            <Activity size={14} />
          </span>
          <div>
            <p className="text-xs font-bold text-[var(--text)]">Weekly Overview</p>
            <p className="text-[10px] text-[var(--muted)]">Activity vs your goals</p>
          </div>
        </div>
        <p className="text-2xl font-black leading-none tracking-tight text-[var(--text)]">{scorePct}%</p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-1.5" style={{ height: 96 }}>
        {days.map((d, i) => {
          const active = i === peakIndex;
          const h = Math.max(6, Math.round(d.ratio * 52));
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className="text-[8px] font-bold leading-none"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {d.future ? '' : `${d.pct}%`}
              </span>
              <div
                className="w-full rounded-full"
                style={{
                  height: h,
                  maxWidth: 16,
                  background: active
                    ? 'linear-gradient(180deg, #6c63ff, #4b3fe0)'
                    : d.future
                      ? 'color-mix(in srgb, var(--muted) 18%, transparent)'
                      : 'color-mix(in srgb, var(--accent) 24%, transparent)',
                  outline: d.isToday && !active ? '1px solid var(--accent)' : 'none',
                }}
              />
              <span
                className="text-[9px] font-semibold"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
