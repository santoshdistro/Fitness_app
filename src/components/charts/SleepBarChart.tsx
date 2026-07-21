type Entry = { label: string; hours: number | null };

type Props = {
  entries: Entry[];
  goalHours?: number;
  maxScaleHours?: number;
};

const BAR_TRACK_HEIGHT = 80;

export function SleepBarChart({
  entries,
  goalHours = 8,
  maxScaleHours = 10,
}: Props) {
  const goalOffsetPercent = Math.min(
    100,
    Math.max(0, (1 - goalHours / maxScaleHours) * 100),
  );
  const todayLabel = entries[entries.length - 1]?.label;

  return (
    <div className="relative mt-2">
      <div
        className="absolute left-0 right-0 z-0 border-t border-dashed border-[var(--card-border)]"
        style={{ top: `${goalOffsetPercent}%` }}
      >
        <span className="absolute -top-2.5 left-0 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[8px] font-bold text-white">
          {`Goal ${goalHours}h`}
        </span>
      </div>

      <div className="flex justify-between items-end relative z-10 pt-4 px-2">
        {entries.map((entry, idx) => {
          const heightPercent = Math.min(
            100,
            ((entry.hours ?? 0) / maxScaleHours) * 100,
          );
          const isToday = entry.label === todayLabel;
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5 w-7">
              <div
                className="flex w-2.5 items-end overflow-hidden rounded-full bg-[var(--bg)]"
                style={{ height: BAR_TRACK_HEIGHT }}
              >
                <div
                  className="w-full rounded-full"
                  style={{
                    height: `${heightPercent}%`,
                    background: isToday ? '#6c63ff' : '#d8dae8',
                  }}
                />
              </div>
              <span className="text-[9px] font-medium text-[var(--muted)]">
                {entry.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
