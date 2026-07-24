import { Flag, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { GoalProgress } from '../utils/calculations';

function formatEta(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function GoalProgressCard({ progress }: { progress: GoalProgress }) {
  const losing = progress.goalType === 'lose';
  const verb = losing ? 'lost' : 'gained';
  const TrendIcon = losing ? TrendingDown : TrendingUp;

  return (
    <div
      className="overflow-hidden p-5 text-white"
      style={{
        borderRadius: 'var(--radius-card)',
        background: progress.reached
          ? 'linear-gradient(135deg, #22c55e, #15803d)'
          : 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
        boxShadow: '0 12px 28px -12px rgba(75,63,224,0.6)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
          Your journey
        </p>
        {progress.reached ? (
          <Trophy size={16} className="text-white" />
        ) : (
          <TrendIcon size={16} className="text-white/90" />
        )}
      </div>

      {progress.reached ? (
        <p className="mt-1 text-2xl font-black leading-tight">Goal reached! 🎉</p>
      ) : (
        <p className="mt-1 text-3xl font-black leading-none">
          {progress.remainingKg}
          <span className="text-base font-bold text-white/80"> kg to go</span>
        </p>
      )}

      {/* Progress bar: start → target */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-white/80">
          <span>{progress.startWeight}kg</span>
          <span className="flex items-center gap-0.5">
            <Flag size={10} /> {progress.targetWeight}kg
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Achieved + projection */}
      <div className="mt-4 flex gap-2">
        <div className="flex-1 rounded-2xl bg-white/15 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">Achieved</p>
          <p className="text-lg font-black leading-tight">
            {progress.achievedKg} kg
            <span className="text-[11px] font-semibold text-white/75"> {verb}</span>
          </p>
          <p className="text-[10px] text-white/75">{Math.round(progress.percent)}% of the way there</p>
        </div>
        <div className="flex-1 rounded-2xl bg-white/15 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wide text-white/70">
            {progress.reached ? 'Status' : 'On track for'}
          </p>
          {progress.reached ? (
            <p className="text-lg font-black leading-tight">Done 💪</p>
          ) : progress.etaDate ? (
            <>
              <p className="text-sm font-black leading-tight">{formatEta(progress.etaDate)}</p>
              <p className="text-[10px] text-white/75">
                ~{Math.max(1, Math.round(progress.weeksToGo ?? 0))} weeks at your pace
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold leading-tight text-white/85">
              Set a weekly rate in goals for a date
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
