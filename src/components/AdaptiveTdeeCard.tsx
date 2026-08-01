import { Sparkles } from 'lucide-react';
import type { AdaptiveTdee } from '../hooks/useAdaptiveTdee';

// Shows real maintenance from logged data vs the formula estimate, and what to
// eat to keep losing/gaining based on the truth.
export function AdaptiveTdeeCard({ data, formulaTdee }: { data: AdaptiveTdee; formulaTdee: number | null }) {
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

  return (
    <div
      className="overflow-hidden p-5 text-white"
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
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
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">Lose 0.5 kg/wk</p>
          <p className="text-lg font-black">{Math.max(0, data.observedTdee - 550)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">Gain 0.5 kg/wk</p>
          <p className="text-lg font-black">{data.observedTdee + 550}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-white/70">
        Assumes your logging is roughly complete. Recheck every couple of weeks.
      </p>
    </div>
  );
}
