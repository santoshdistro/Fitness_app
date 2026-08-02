import { Flag, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { GoalProgress } from '../utils/calculations';
import type { WeightUnit } from '../hooks/useSettings';
import { weightValue } from '../utils/units';

function formatEta(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GoalProgressCard({
  progress,
  weightUnit,
}: {
  progress: GoalProgress;
  weightUnit: WeightUnit;
}) {
  const losing = progress.goalType === 'lose';
  const verb = losing ? 'lost' : 'gained';
  const TrendIcon = losing ? TrendingDown : TrendingUp;
  const u = weightUnit;
  const barColor = progress.reached ? '#22c55e' : 'var(--accent)';

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          Your journey
        </p>
        {progress.reached ? (
          <Trophy size={15} style={{ color: '#22c55e' }} />
        ) : (
          <TrendIcon size={15} style={{ color: 'var(--accent)' }} />
        )}
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
            className="h-full rounded-full transition-all"
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
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">Achieved</p>
          <p className="text-sm font-black leading-tight">
            {weightValue(progress.achievedKg, u)} {u}
            <span className="text-[10px] font-semibold text-[var(--muted)]"> {verb}</span>
          </p>
        </div>
        <div className="flex-1 rounded-xl p-2" style={{ background: 'var(--bg)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
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
