import { CalendarCheck } from 'lucide-react';
import type { WeeklyReview } from '../hooks/useWeeklyReview';
import type { WeightUnit } from '../hooks/useSettings';
import { weightValue } from '../utils/units';

function takeaway(r: WeeklyReview): string {
  if (r.daysLogged === 0) return 'Log a few days this week and your review appears here.';
  if (r.daysLogged >= 6) return "Incredible consistency — that's exactly how results happen. 🔥";
  if (r.daysLogged >= 4) return 'Solid week. Nudge it toward daily logging for even faster progress.';
  return 'Good start. The more days you log, the sharper your plan gets.';
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg)] p-3">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-base font-black leading-tight text-[var(--text)]">{value}</p>
      {hint ? <p className="text-[10px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function WeeklyReviewCard({
  review,
  weightUnit,
}: {
  review: WeeklyReview;
  weightUnit: WeightUnit;
}) {
  const avgWeightStr =
    review.avgWeightKg == null ? '—' : `${weightValue(review.avgWeightKg, weightUnit)} ${weightUnit}`;

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <CalendarCheck size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">This week</p>
          <p className="text-[11px] text-[var(--muted)]">Last 7 days</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Days logged" value={`${review.daysLogged}/7`} />
        <Stat
          label="Avg kcal"
          value={review.avgCalories != null ? String(review.avgCalories) : '—'}
          hint={review.calorieOnTargetDays != null ? `${review.calorieOnTargetDays} on target` : undefined}
        />
        <Stat
          label="Avg protein"
          value={review.avgProtein != null ? `${review.avgProtein}g` : '—'}
          hint={review.proteinHitDays != null ? `${review.proteinHitDays} days hit` : undefined}
        />
        <Stat label="Avg weight" value={avgWeightStr} hint="this week" />
        <Stat
          label="Avg steps"
          value={review.avgSteps != null ? review.avgSteps.toLocaleString() : '—'}
        />
        <Stat
          label="Avg active kcal"
          value={review.avgActiveKcal != null ? review.avgActiveKcal.toLocaleString() : '—'}
          hint="burned / day"
        />
      </div>

      <p className="text-[11px] font-medium text-[var(--muted)]">{takeaway(review)}</p>
    </div>
  );
}
