import { Check, ChevronRight } from 'lucide-react';
import { ActivityRings, type Ring } from './charts/ActivityRings';
import type { GamePlanItem } from './TodayGamePlan';

// Merged Home dashboard: the activity rings on the left, and today's game-plan
// goals as a tick-off list on the right — one card doing both jobs.
export function TodayDashboard({
  rings,
  items,
  onNavigateStats,
}: {
  rings: Ring[];
  items: GamePlanItem[];
  onNavigateStats: () => void;
}) {
  const doneCount = items.filter(i => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Today's game plan</p>
          <p className="text-[11px] text-[var(--muted)]">
            {allDone ? 'Every box ticked — champion. 🏆' : 'Tick these off to win the day'}
          </p>
        </div>
        <div
          className="flex h-10 w-10 flex-col items-center justify-center rounded-full text-[var(--on-accent)]"
          style={{
            background: allDone
              ? 'var(--success-gradient)'
              : 'var(--accent-gradient)',
          }}
        >
          <span className="text-sm font-black leading-none">{doneCount}</span>
          <span className="text-[10px] font-bold leading-none opacity-80">/ {items.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ActivityRings rings={rings} size={104} />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {items.map(item => (
            <div key={item.key} className="flex items-center gap-2">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={
                  item.done
                    ? { background: '#22c55e', color: '#fff' }
                    : { border: '2px solid var(--card-border)' }
                }
              >
                {item.done ? <Check size={11} strokeWidth={3} /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`truncate text-[11px] font-semibold ${
                      item.done ? 'text-[var(--muted)] line-through' : 'text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="shrink-0 text-[10px] font-medium text-[var(--muted)]">{item.detail}</span>
                </div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, item.progress * 100)}%`,
                      background: item.done ? '#22c55e' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNavigateStats}
        className="mt-3 flex items-center gap-1 text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        See full stats
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
