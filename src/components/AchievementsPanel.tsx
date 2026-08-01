import { useAchievements } from '../hooks/useAchievements';

export function AchievementsPanel() {
  const { achievements, earnedCount, total, loading } = useAchievements();

  return (
    <div className="flex flex-col gap-4">
      <div
        className="overflow-hidden p-5 text-center text-white"
        style={{ borderRadius: 'var(--radius-card)', background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Achievements</p>
        <p className="text-4xl font-black">
          {earnedCount}
          <span className="text-lg font-bold text-white/70"> / {total}</span>
        </p>
        <p className="text-[11px] text-white/80">Keep logging to unlock more.</p>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {achievements.map(ac => (
            <div
              key={ac.id}
              className="glass-card flex flex-col items-center gap-1 p-4 text-center"
              style={{ opacity: ac.earned ? 1 : 0.55 }}
            >
              <span className="text-3xl" style={{ filter: ac.earned ? 'none' : 'grayscale(1)' }}>
                {ac.emoji}
              </span>
              <p className="text-xs font-semibold text-[var(--text)]">{ac.title}</p>
              {ac.earned ? (
                <p className="text-[10px] font-bold text-emerald-500">Unlocked ✓</p>
              ) : (
                <p className="text-[10px] text-[var(--muted)]">
                  {ac.threshold > 1 ? `${Math.min(ac.current, ac.threshold)} / ${ac.threshold}` : ac.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
