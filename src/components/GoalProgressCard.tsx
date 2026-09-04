import { Flag, Pencil, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { GoalProgress } from '../utils/calculations';
import type { WeightUnit } from '../hooks/useSettings';
import { weightValue } from '../utils/units';

function formatEta(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStart(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function GoalProgressCard({
  progress,
  weightUnit,
  startDate,
  onEditJourney,
}: {
  progress: GoalProgress;
  weightUnit: WeightUnit;
  startDate?: string | null;
  onEditJourney?: () => void;
}) {
  const losing = progress.goalType === 'lose';
  const verb = losing ? 'lost' : 'gained';
  const TrendIcon = losing ? TrendingDown : TrendingUp;
  const u = weightUnit;
  const barColor = progress.reached ? '#22c55e' : 'var(--accent)';
  // Moved away from the goal (e.g. wanted to lose but the scale went up).
  const offTrack = !progress.reached && progress.netChangeKg < -0.05;
  const gained = progress.weightDeltaKg > 0;

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          Your journey{startDate ? ` · from ${formatStart(startDate)}` : ''}
        </p>
        <div className="flex items-center gap-1.5">
          {progress.reached ? (
            <Trophy size={15} style={{ color: '#22c55e' }} />
          ) : (
            <TrendIcon size={15} style={{ color: 'var(--accent)' }} />
          )}
          {onEditJourney ? (
            <button
              type="button"
              onClick={onEditJourney}
              aria-label="Start or restart journey"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]"
            >
              <Pencil size={12} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-0.5 flex items-end justify-between">
        {progress.reached ? (
          <p className="text-lg font-black leading-tight text-[var(--text)]">Goal reached! 🎉</p>
        ) : (
          <p className="text-xl font-black leading-none text-[var(--text)]">
            {weightValue(progress.remainingKg, u)}
            <span className="text-xs font-bold text-[var(--muted)]"> {u} to go</span>
          </p>
        )}
        <p className="text-[11px] font-semibold text-[var(--muted)]">
          {Math.round(progress.percent)}%
        </p>
      </div>

      {/* Progress bar: start → target */}
      <div className="mt-2">
        <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg)' }}>
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${progress.percent}%`, background: barColor }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-[var(--muted)]">
          <span>
            {weightValue(progress.startWeight, u)}
            {u}
          </span>
          <span className="flex items-center gap-0.5">
            <Flag size={10} /> {weightValue(progress.targetWeight, u)}
            {u}
          </span>
        </div>
      </div>

      {/* Achieved + projection */}
      <div className="mt-2 flex gap-2 text-[var(--text)]">
        <div className="flex-1 rounded-xl p-2" style={{ background: 'var(--bg)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {offTrack ? 'Since start' : 'Achieved'}
          </p>
          {offTrack ? (
            // Moved the wrong way — show the gap in red with a direction arrow.
            <p className="flex items-center gap-1 text-sm font-black leading-tight" style={{ color: '#ef4444' }}>
              {gained ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {weightValue(Math.abs(progress.weightDeltaKg), u)} {u}
              <span className="text-[10px] font-semibold"> {gained ? 'gained' : 'lost'}</span>
            </p>
          ) : (
            <p className="text-sm font-black leading-tight">
              {weightValue(progress.achievedKg, u)} {u}
              <span className="text-[10px] font-semibold text-[var(--muted)]"> {verb}</span>
            </p>
          )}
        </div>
        <div className="flex-1 rounded-xl p-2" style={{ background: 'var(--bg)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {progress.reached ? 'Status' : 'On track for'}
          </p>
          {progress.reached ? (
            <p className="text-sm font-black leading-tight">Done 💪</p>
          ) : progress.etaDate ? (
            <p className="text-sm font-black leading-tight">
              {formatEta(progress.etaDate)}
              <span className="block text-[10px] font-semibold text-[var(--muted)]">
                ~{Math.max(1, Math.round(progress.weeksToGo ?? 0))} wks at your pace
              </span>
            </p>
          ) : (
            <p className="text-[11px] font-semibold leading-tight text-[var(--muted)]">
              Set a weekly rate in goals
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
