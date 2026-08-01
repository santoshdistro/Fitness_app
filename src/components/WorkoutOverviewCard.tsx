import { useMemo } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useSettings } from '../hooks/useSettings';
import { addDays, todayDateString } from '../utils/date';

// "Workout Overview" hero card in the smart-AI concept style: a big weekly
// activity score over a row of rounded pill bars (Sun–Sat), with today's bar
// highlighted. Uses real logged steps + training days.
export function WorkoutOverviewCard() {
  const { logs } = useRecentDailyLogs(14);
  const { workouts } = useRecentWorkouts(40);
  const { settings } = useSettings();
  const stepGoal = settings.stepGoal || 10000;

  const { days, scorePct, peakIndex } = useMemo(() => {
    const today = todayDateString();
    // Current week Sun..Sat containing today.
    const todayDow = new Date(`${today}T00:00:00`).getDay(); // 0=Sun
    const weekStart = addDays(today, -todayDow);

    const stepsByDate = new Map<string, number>();
    for (const l of logs) if (l.steps != null) stepsByDate.set(l.log_date, l.steps);
    const trainedDates = new Set(workouts.map(w => w.session_timestamp.slice(0, 10)));

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const steps = stepsByDate.get(date) ?? 0;
      const trained = trainedDates.has(date);
      // Activity ratio: steps vs goal, with a floor bump for a trained day.
      const ratio = Math.min(1.2, Math.max(steps / stepGoal, trained ? 0.9 : 0));
      return {
        date,
        label: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
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
    <div className="glass-card overflow-hidden p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}
          >
            <Activity size={16} />
          </span>
          <p className="text-sm font-bold text-[var(--text)]">Weekly Overview</p>
        </div>
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
      </div>

      <p className="text-4xl font-black tracking-tight text-[var(--text)]">{scorePct}%</p>
      <p className="mb-4 text-[11px] font-medium text-[var(--muted)]">Activity vs your goals this week</p>

      <div className="flex items-end justify-between gap-2" style={{ height: 132 }}>
        {days.map((d, i) => {
          const active = i === peakIndex;
          const h = Math.max(8, Math.round(d.ratio * 108));
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 items-end justify-center">
                {active ? (
                  <span
                    className="absolute -top-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {d.pct}%
                  </span>
                ) : null}
                <div
                  className="w-full rounded-full transition-all"
                  style={{
                    height: h,
                    maxWidth: 22,
                    background: active
                      ? 'linear-gradient(180deg, var(--accent), var(--accent-dark))'
                      : d.future
                        ? 'color-mix(in srgb, var(--muted) 18%, transparent)'
                        : 'color-mix(in srgb, var(--accent) 22%, transparent)',
                    outline: d.isToday && !active ? '1px solid var(--accent)' : 'none',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
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
