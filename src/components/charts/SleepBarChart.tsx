type Entry = { weekday: string; day: string; hours: number | null };

type Props = {
  entries: Entry[];
  goalHours?: number;
  maxScaleHours?: number;
  /** Index of the bar to emphasise (usually the selected/most-recent day). */
  highlightIndex?: number;
};

const BAR_TRACK_HEIGHT = 88;
// Distance from the wrapper's top to the top of a bar track: pt-5 (20px) +
// value label (~8px) + gap-1.5 (6px). Used to align the goal line to the bars.
const TRACK_TOP = 34;

function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins === 0 ? `${whole}h` : `${whole}.${Math.round(mins / 6)}h`;
}

// Colour a bar by how close the night's sleep got to the goal.
function barGradient(hours: number, goal: number): string {
  if (hours >= goal) return 'linear-gradient(180deg, #34d399, #22c55e)'; // green — hit it
  if (hours >= goal * 0.75) return 'linear-gradient(180deg, #fbbf24, #f59e0b)'; // amber — close
  return 'linear-gradient(180deg, #f87171, #ef4444)'; // red — low
}

export function SleepBarChart({
  entries,
  goalHours = 8,
  maxScaleHours = 10,
  highlightIndex,
}: Props) {
  // Align the goal line to the top of a bar that exactly meets the goal.
  const goalLineTop = TRACK_TOP + (1 - Math.min(goalHours, maxScaleHours) / maxScaleHours) * BAR_TRACK_HEIGHT;
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
          className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed border-[var(--accent)]/40"
          style={{ top: `${goalLineTop}px` }}
        />

        <div className="relative z-10 flex items-end justify-between px-1 pt-5">
          {entries.map((entry, idx) => {
            const hasData = entry.hours != null;
            const heightPercent = Math.min(100, ((entry.hours ?? 0) / maxScaleHours) * 100);
            const isFocus = idx === focus;
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
                        background: barGradient(entry.hours ?? 0, goalHours),
                        boxShadow: isFocus ? '0 3px 9px rgba(0,0,0,0.25)' : 'none',
                        opacity: isFocus || focus < 0 ? 1 : 0.82,
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
