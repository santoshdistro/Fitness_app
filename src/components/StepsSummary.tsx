import { Footprints, Target } from 'lucide-react';
import { useStepTotals } from '../hooks/useStepTotals';

function fmt(n: number): string {
  return n.toLocaleString();
}

// Step totals for this week / month / year.
export function StepsTotalsCard() {
  const { totals } = useStepTotals();
  const cells: { label: string; value: number }[] = [
    { label: 'This week', value: totals.week },
    { label: 'This month', value: totals.month },
    { label: 'This year', value: totals.year },
  ];
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Footprints size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">Step totals</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(c => (
          <div key={c.label} className="rounded-2xl p-3" style={{ background: 'var(--bg)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="text-base font-black leading-tight text-[var(--text)]">{fmt(c.value)}</p>
            <p className="text-[10px] text-[var(--muted)]">steps</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Benchmark dot-grid: today's steps toward the goal, each dot = goal/100 steps.
export function StepsBenchmarkCard({ steps, goal }: { steps: number; goal: number }) {
  const safeGoal = goal > 0 ? goal : 10000;
  const filled = Math.max(0, Math.min(100, Math.round((steps / safeGoal) * 100)));
  const goalK = safeGoal % 1000 === 0 ? `${safeGoal / 1000}K` : fmt(safeGoal);

  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <div className="grid shrink-0 grid-cols-10 gap-[3px]">
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-[2px]"
            style={{
              background:
                i < filled ? 'var(--accent)' : 'color-mix(in srgb, var(--muted) 20%, transparent)',
            }}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Target size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-semibold text-[var(--text)]">Benchmark</p>
        </div>
        <p className="mt-1 text-lg font-black leading-tight text-[var(--text)]">
          {fmt(steps)}
          <span className="text-[11px] font-semibold text-[var(--muted)]">/{goalK}</span>
        </p>
        <p className="text-[10px] text-[var(--muted)]">
          {filled >= 100 ? 'Goal smashed 🎉' : `${filled}% of today’s goal`}
        </p>
      </div>
    </div>
  );
}
