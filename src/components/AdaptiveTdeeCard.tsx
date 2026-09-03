import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { AdaptiveTdee } from '../hooks/useAdaptiveTdee';

// Shows real maintenance from logged data vs the formula estimate, and what to
// eat to keep losing/gaining based on the truth. When it diverges from the
// current daily target, offers to update the target (and the macros +
// hydration that derive from it) to match your real data.
export function AdaptiveTdeeCard({
  data,
  formulaTdee,
  currentTarget,
  deficitKcal,
  onApplyTarget,
}: {
  data: AdaptiveTdee;
  formulaTdee: number | null;
  currentTarget?: number | null;
  deficitKcal?: number | null;
  onApplyTarget?: (kcal: number) => void;
}) {
  const [applied, setApplied] = useState(false);
  if (!data.ready) {
    return (
      <div className="glass-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold text-[var(--text)]">Adaptive maintenance</p>
        </div>
        <p className="text-xs text-[var(--muted)]">{data.reason}</p>
      </div>
    );
  }

  const lost = data.weightChangeKg < 0;
  const diff = formulaTdee != null ? data.observedTdee - formulaTdee : null;

  // Recommended daily target from real maintenance minus your goal deficit
  // (a surplus is a negative deficit). Only offered when it meaningfully
  // differs from what you're currently targeting.
  const recommended = Math.max(1200, Math.round((data.observedTdee - (deficitKcal ?? 0)) / 10) * 10);
  const showApply =
    onApplyTarget != null &&
    currentTarget != null &&
    Math.abs(recommended - currentTarget) >= 100;

  return (
    <div
      className="overflow-hidden p-5 text-[var(--on-accent)]"
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'var(--accent-gradient)',
        boxShadow: '0 12px 28px -12px rgba(75,63,224,0.6)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-white" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
          Adaptive maintenance · your real data
        </p>
      </div>
      <p className="mt-1 text-3xl font-black leading-none">
        {data.observedTdee}
        <span className="text-base font-bold text-white/80"> kcal/day</span>
      </p>
      <p className="mt-2 text-xs text-white/90">
        Over {data.spanDays} days you averaged {data.avgCalories} kcal and{' '}
        {lost ? 'lost' : data.weightChangeKg > 0 ? 'gained' : 'held'}{' '}
        {Math.abs(data.weightChangeKg)} kg — so this is what your body actually burns.
      </p>

      {diff != null ? (
        <p className="mt-2 text-[11px] text-white/75">
          Formula estimate was {formulaTdee} kcal · your body is {Math.abs(diff)} kcal{' '}
          {diff > 0 ? 'higher' : 'lower'}.
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/15 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Lose 0.5 kg/wk</p>
          <p className="text-lg font-black">{Math.max(0, data.observedTdee - 550)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Gain 0.5 kg/wk</p>
          <p className="text-lg font-black">{data.observedTdee + 550}</p>
        </div>
      </div>
      {showApply ? (
        <button
          type="button"
          onClick={() => {
            onApplyTarget!(recommended);
            setApplied(true);
          }}
          disabled={applied}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-xs font-bold disabled:opacity-90"
          style={{ color: '#4b3fe0' }}
        >
          {applied ? (
            <><Check size={14} /> Target set to {recommended} kcal</>
          ) : (
            <>Update my daily target to {recommended} kcal</>
          )}
        </button>
      ) : null}

      <p className="mt-2 text-[10px] text-white/70">
        {showApply
          ? 'Sets your calorie target from real data — macros & hydration follow. '
          : ''}
        Assumes your logging is roughly complete. Recheck every couple of weeks.
      </p>
    </div>
  );
}
