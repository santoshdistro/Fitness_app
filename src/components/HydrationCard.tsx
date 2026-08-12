import { Check, Droplets } from 'lucide-react';
import type { HydrationTargets } from '../utils/calculations';

// Shows goal-aware hydration + electrolyte targets and lets the user adopt the
// water figure as their daily goal.
export function HydrationCard({
  targets,
  currentWaterGoalMl,
  onApplyWater,
}: {
  targets: HydrationTargets;
  currentWaterGoalMl: number;
  onApplyWater: (ml: number) => void;
}) {
  const applied = currentWaterGoalMl === targets.waterMl;
  const cells = [
    { label: 'Water', value: `${(targets.waterMl / 1000).toFixed(1)} L`, tint: '#0ea5e9' },
    { label: 'Sodium', value: `${targets.sodiumMg} mg`, tint: '#f59e0b' },
    { label: 'Potassium', value: `${targets.potassiumMg} mg`, tint: '#22c55e' },
    { label: 'Magnesium', value: `${targets.magnesiumMg} mg`, tint: '#a855f7' },
  ];

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
          <Droplets size={16} className="text-sky-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Hydration & minerals</p>
          <p className="text-[10px] text-[var(--muted)]">Scaled to your protein, fibre, activity & goal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cells.map(c => (
          <div key={c.label} className="rounded-2xl bg-[var(--bg)] p-3">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="text-base font-black leading-tight" style={{ color: c.tint }}>
              {c.value}
            </p>
            <p className="text-[9px] text-[var(--muted)]">per day</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--muted)]">{targets.note}</p>

      <button
        type="button"
        onClick={() => onApplyWater(targets.waterMl)}
        disabled={applied}
        className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
        style={{ background: applied ? '#16a34a' : 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
      >
        {applied ? (
          <><Check size={14} /> Water goal set to {(targets.waterMl / 1000).toFixed(1)} L</>
        ) : (
          <>Use {(targets.waterMl / 1000).toFixed(1)} L as my water goal</>
        )}
      </button>
      <p className="text-center text-[9px] text-[var(--muted)]">
        General wellness guidance — not medical advice. Adjust to how you feel and any clinical advice.
      </p>
    </div>
  );
}
