import { Footprints } from 'lucide-react';
import { useStepTotals } from '../hooks/useStepTotals';

function fmt(n: number): string {
  return n.toLocaleString();
}

// "Steps" card: a benchmark dot-grid (today's steps toward the goal — each dot
// = goal/100 steps) beside a 2×2 grid of totals (today / week / month / year).
export function StepsCard({ steps, goal }: { steps: number; goal: number }) {
  const { totals } = useStepTotals();
  const safeGoal = goal > 0 ? goal : 10000;
  const filled = Math.max(0, Math.min(100, Math.round((steps / safeGoal) * 100)));
  const goalK = safeGoal % 1000 === 0 ? `${safeGoal / 1000}K` : fmt(safeGoal);

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Footprints size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">Steps</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Benchmark dot-grid */}
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

        {/* 4 boxes: today (with goal) + week / month / year */}
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <div className="rounded-xl p-2" style={{ background: 'var(--bg)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Today</p>
            <p className="text-sm font-black leading-tight text-[var(--text)]">
              {fmt(steps)}
              <span className="text-[10px] font-semibold text-[var(--muted)]">/{goalK}</span>
            </p>
            <p className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
              {filled >= 100 ? 'Goal 🎉' : `${filled}% of goal`}
            </p>
          </div>
          <Box label="This week" value={totals.week} />
          <Box label="This month" value={totals.month} />
          <Box label="This year" value={totals.year} />
        </div>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-2" style={{ background: 'var(--bg)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-sm font-black leading-tight text-[var(--text)]">{fmt(value)}</p>
      <p className="text-[10px] text-[var(--muted)]">steps</p>
    </div>
  );
}
