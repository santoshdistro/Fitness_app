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
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-base font-black leading-tight text-[var(--text)]">{value}</p>
      {hint ? <p className="text-[10px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function WeeklyReviewCard({
  review,
  weightUnit,
  calorieTarget,
}: {
  review: WeeklyReview;
  weightUnit: WeightUnit;
  calorieTarget?: number | null;
}) {
  const avgWeightStr =
    review.avgWeightKg == null ? '—' : `${weightValue(review.avgWeightKg, weightUnit)} ${weightUnit}`;

  // A running weekly budget: one heavy day matters less than the week as a
  // whole, and this is the view that shows whether there is room left.
  const weekBudget = calorieTarget ? calorieTarget * 7 : null;
  const budgetPct = weekBudget ? Math.min(100, (review.weekCalories / weekBudget) * 100) : 0;
  // Where you'd be if you had eaten exactly to target for the days so far.
  const pacePct = weekBudget ? Math.min(100, (review.daysElapsed / 7) * 100) : 0;

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <CalendarCheck size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">This week</p>
          <p className="text-[11px] text-[var(--muted)]">Since Monday</p>
        </div>
      </div>

      {weekBudget ? (
        <div className="rounded-2xl bg-[var(--bg)] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Week so far
            </p>
            <p className="text-[11px] font-semibold text-[var(--text)]">
              {review.weekCalories.toLocaleString()}
              <span className="font-medium text-[var(--muted)]"> of {weekBudget.toLocaleString()} kcal</span>
            </p>
          </div>
          <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${budgetPct}%`, background: 'var(--accent)' }}
            />
            {/* Where an exactly-on-target week would sit today. */}
            <div
              className="absolute top-0 h-full w-0.5 bg-[var(--text)] opacity-40"
              style={{ left: `${pacePct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            {review.weekCalories <= weekBudget
              ? `${(weekBudget - review.weekCalories).toLocaleString()} kcal left · marker = on-target pace`
              : `${(review.weekCalories - weekBudget).toLocaleString()} kcal over budget`}
          </p>
        </div>
      ) : null}

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
