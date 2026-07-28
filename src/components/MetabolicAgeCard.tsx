type Props = {
  metabolicAge: number;
  actualAge: number;
  basis: 'bodyFat' | 'bmi';
};

export function MetabolicAgeCard({ metabolicAge, actualAge, basis }: Props) {
  const delta = metabolicAge - actualAge;
  const younger = delta < 0;
  const same = delta === 0;
  const accent = younger ? '#22c55e' : same ? '#6c63ff' : '#f97316';

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Metabolic age
          </p>
          <p className="mt-1 text-4xl font-black leading-none" style={{ color: accent }}>
            {metabolicAge}
            <span className="ml-1 text-sm font-semibold text-[var(--muted)]">yrs</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--muted)]">Actual age</p>
          <p className="text-lg font-bold text-[var(--text)]">{actualAge}</p>
        </div>
      </div>

      <div
        className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        {same
          ? 'Right on your age — solid.'
          : younger
            ? `${Math.abs(delta)} year${Math.abs(delta) === 1 ? '' : 's'} younger than your age 💪`
            : `${delta} year${delta === 1 ? '' : 's'} older than your age — room to improve.`}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
        A rough estimate from your {basis === 'bodyFat' ? 'body fat %' : 'BMI'} and activity level —
        leaner and more active reads younger. Motivational, not medical.
      </p>
    </div>
  );
}
