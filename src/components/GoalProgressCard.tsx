import { Flag, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { GoalProgress } from '../utils/calculations';
import type { WeightUnit } from '../hooks/useSettings';
import { weightValue } from '../utils/units';

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
        <div className="flex items-center gap-1.5">
          {progress.reached ? (
            <Trophy size={13} style={{ color: '#22c55e' }} />
          ) : (
            <TrendIcon size={13} style={{ color: 'var(--accent)' }} />
          )}
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Your journey
          </p>
        </div>
        {progress.reached ? (
          <p className="text-sm font-black text-[var(--text)]">Goal reached 🎉</p>
        ) : (
          <p className="text-sm font-black text-[var(--text)]">
            {weightValue(progress.remainingKg, u)}
            <span className="font-bold text-[var(--muted)]"> {u} to go</span>
          </p>
        )}
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
            {u} · {weightValue(progress.achievedKg, u)}
            {u} {verb} ({Math.round(progress.percent)}%)
          </span>
          <span className="flex items-center gap-0.5">
            {progress.reached
              ? 'Done 💪'
              : progress.etaDate
                ? `~${Math.max(1, Math.round(progress.weeksToGo ?? 0))} wks`
                : ''}
            <Flag size={10} /> {weightValue(progress.targetWeight, u)}
            {u}
          </span>
        </div>
      </div>
    </div>
  );
}
