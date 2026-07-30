type Entry = { weekday: string; day: string; hours: number | null };

type Props = {
  entries: Entry[];
  goalHours?: number;
  maxScaleHours?: number;
  /** Index of the bar to emphasise (usually the selected/most-recent day). */
  highlightIndex?: number;
};

const BAR_TRACK_HEIGHT = 88;

function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins === 0 ? `${whole}h` : `${whole}.${Math.round(mins / 6)}h`;
}

export function SleepBarChart({
  entries,
  goalHours = 8,
  maxScaleHours = 10,
  highlightIndex,
}: Props) {
  const goalOffsetPercent = Math.min(100, Math.max(0, (1 - goalHours / maxScaleHours) * 100));
  const focus = highlightIndex ?? entries.length - 1;

  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-end">
        <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[8px] font-bold text-[var(--accent)]">
          {`Goal ${goalHours}h`}
        </span>
      </div>
      <div className="relative">
        {/* Goal line */}
        <div
          className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-[var(--accent)]/30"
          style={{ top: `${goalOffsetPercent + 16}px` }}
        />

        <div className="relative z-10 flex items-end justify-between px-1 pt-5">
          {entries.map((entry, idx) => {
            const hasData = entry.hours != null;
            const heightPercent = Math.min(100, ((entry.hours ?? 0) / maxScaleHours) * 100);
            const isFocus = idx === focus;
            const metGoal = (entry.hours ?? 0) >= goalHours;
            return (
              <div key={idx} className="flex w-8 flex-col items-center gap-1.5">
                {/* value */}
                <span
                  className={`text-[8px] font-bold leading-none ${
                    hasData ? 'text-[var(--text)]' : 'text-transparent'
                  }`}
                >
                  {hasData ? formatHours(entry.hours!) : '·'}
                </span>
                {/* track + bar */}
                <div
                  className="flex w-3 items-end overflow-hidden rounded-full"
                  style={{
                    height: BAR_TRACK_HEIGHT,
                    background: hasData
                      ? 'var(--bg)'
                      : 'repeating-linear-gradient(180deg, var(--card-border) 0 2px, transparent 2px 6px)',
                  }}
                >
                  {hasData ? (
                    <div
                      className="w-full rounded-full transition-all"
                      style={{
                        height: `${Math.max(heightPercent, 6)}%`,
                        background: isFocus
                          ? 'linear-gradient(180deg, #8b7dff, #6c63ff)'
                          : metGoal
                            ? 'linear-gradient(180deg, #34d399, #22c55e)'
                            : 'linear-gradient(180deg, #c9cdec, #b4b9e0)',
                        boxShadow: isFocus ? '0 4px 10px rgba(108,99,255,0.4)' : 'none',
                      }}
                    />
                  ) : null}
                </div>
                {/* labels */}
                <span
                  className={`text-[9px] font-bold leading-none ${
                    isFocus ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                  }`}
                >
                  {entry.weekday}
                </span>
                <span
                  className={`text-[8px] leading-none ${
                    isFocus ? 'font-bold text-[var(--text)]' : 'text-[var(--muted)]/70'
                  }`}
                >
                  {entry.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
