import { computeBmi } from '../utils/calculations';
import type { WeightUnit } from '../hooks/useSettings';
import { weightValue } from '../utils/units';

const CATEGORY_LABEL: Record<string, string> = {
  underweight: 'Underweight',
  normal: 'Healthy',
  overweight: 'Overweight',
  obese: 'Obese',
};

const CATEGORY_COLOR: Record<string, string> = {
  underweight: '#0ea5e9',
  normal: '#22c55e',
  overweight: '#f59e0b',
  obese: '#ef4444',
};

// Maps a BMI value onto the 15–40 scale used by the bar.
function bmiToPercent(bmi: number): number {
  return Math.max(0, Math.min(100, ((bmi - 15) / (40 - 15)) * 100));
}

export function BmiCard({
  weightKg,
  heightCm,
  weightUnit,
}: {
  weightKg: number;
  heightCm: number;
  weightUnit: WeightUnit;
}) {
  const info = computeBmi(weightKg, heightCm);
  const color = CATEGORY_COLOR[info.category];
  const markerPercent = bmiToPercent(info.bmi);

  // Zone boundaries on the 15–40 scale.
  const p18 = bmiToPercent(18.5);
  const p25 = bmiToPercent(25);
  const p30 = bmiToPercent(30);

  const u = weightUnit;
  const diff = weightValue(Math.abs(info.toHealthyKg), u, 1);
  const message =
    info.toHealthyKg > 0
      ? `Lose ${diff} ${u} to reach a healthy weight`
      : info.toHealthyKg < 0
        ? `Gain ${diff} ${u} to reach a healthy weight`
        : "You're in the healthy range — nice. 🎉";

  return (
    <div className="glass-card anim-fade-rise flex flex-col gap-3 p-5" style={{ animationDelay: '0.08s' }}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Body Mass Index</p>
          <p className="text-[10px] text-[var(--muted)]">From your height & weight</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black leading-none text-[var(--text)]">{info.bmi}</p>
          <p className="text-xs font-bold" style={{ color }}>
            {CATEGORY_LABEL[info.category]}
          </p>
        </div>
      </div>

      {/* Zone bar */}
      <div className="mt-1">
        <div
          className="relative h-2.5 rounded-full"
          style={{
            background: `linear-gradient(to right,
              ${CATEGORY_COLOR.underweight} 0% ${p18}%,
              ${CATEGORY_COLOR.normal} ${p18}% ${p25}%,
              ${CATEGORY_COLOR.overweight} ${p25}% ${p30}%,
              ${CATEGORY_COLOR.obese} ${p30}% 100%)`,
          }}
        >
          {/* marker */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${markerPercent}%`, background: color }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[8px] font-semibold text-[var(--muted)]">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>

      <p className="text-xs font-medium text-[var(--text)]">{message}</p>
      <p className="text-[10px] text-[var(--muted)]">
        Healthy weight for your height: {info.healthyLowKg}–{info.healthyHighKg} kg. BMI is a rough
        guide and doesn't account for muscle.
      </p>
    </div>
  );
}
