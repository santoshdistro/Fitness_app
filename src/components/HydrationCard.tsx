import { AlertTriangle, Check, Droplets, Zap } from 'lucide-react';
import type { HydrationTargets } from '../utils/calculations';

export type HydrationIntake = {
  waterMl: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
};

// Goal-aware hydration + electrolyte targets, with today's intake tracked
// against them and a caution when water is high but sodium is low (the
// dilution / over-hydration risk).
export function HydrationCard({
  targets,
  intake,
  currentWaterGoalMl,
  onApplyWater,
  onLogElectrolytes,
}: {
  targets: HydrationTargets;
  intake?: HydrationIntake;
  currentWaterGoalMl: number;
  onApplyWater: (ml: number) => void;
  onLogElectrolytes?: () => void;
}) {
  const applied = currentWaterGoalMl === targets.waterMl;

  const cells = [
    { label: 'Water', tint: '#0ea5e9', target: targets.waterMl, have: intake?.waterMl ?? null, fmt: (v: number) => `${(v / 1000).toFixed(1)} L` },
    { label: 'Sodium', tint: '#f59e0b', target: targets.sodiumMg, have: intake?.sodiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg` },
    { label: 'Potassium', tint: '#22c55e', target: targets.potassiumMg, have: intake?.potassiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg` },
    { label: 'Magnesium', tint: '#a855f7', target: targets.magnesiumMg, have: intake?.magnesiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg` },
  ];

  // Drinking plenty but under-salted → the water won't hold / hyponatremia risk.
  const dilutionRisk =
    intake != null &&
    intake.waterMl >= targets.waterMl * 0.8 &&
    intake.sodiumMg < targets.sodiumMg * 0.5;

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
            <Droplets size={16} className="text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Hydration & minerals</p>
            <p className="text-[10px] text-[var(--muted)]">
              {intake ? 'Today vs your goal · protein, fibre, sweat & goal' : 'Scaled to your protein, fibre, activity & goal'}
            </p>
          </div>
        </div>
        {onLogElectrolytes ? (
          <button
            type="button"
            onClick={onLogElectrolytes}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
          >
            <Zap size={12} /> Log
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cells.map(c => {
          const pct = c.have != null ? Math.min(100, Math.round((c.have / c.target) * 100)) : null;
          return (
            <div key={c.label} className="rounded-2xl bg-[var(--bg)] p-3">
              <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
              {c.have != null ? (
                <>
                  <p className="text-sm font-black leading-tight text-[var(--text)]">
                    {c.fmt(c.have)}
                    <span className="text-[10px] font-semibold text-[var(--muted)]"> / {c.fmt(c.target)}</span>
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--card-border)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.tint }} />
                  </div>
                </>
              ) : (
                <p className="text-base font-black leading-tight" style={{ color: c.tint }}>
                  {c.fmt(c.target)}
                  <span className="text-[9px] font-semibold text-[var(--muted)]"> / day</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {dilutionRisk ? (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-[var(--text)]">
            You're drinking plenty but sodium is low — add a little salt or an electrolyte drink so
            the water is actually retained (avoids that watered-down, foggy feeling).
          </p>
        </div>
      ) : null}

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
