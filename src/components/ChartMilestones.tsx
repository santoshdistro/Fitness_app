import { useState } from 'react';
import type { ChartMark } from '../hooks/useMilestones';

function fmt(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' });
}

// Milestone overlay for a trend chart — a dashed vertical line per milestone in
// the window plus a tappable flag showing the label. Render inside the chart's
// `relative` plot container. `lineBottom` keeps the line above the x-labels.
export function ChartMilestones({ marks, lineBottom = 16 }: { marks: ChartMark[]; lineBottom?: number }) {
  const [open, setOpen] = useState<string | null>(null);
  if (marks.length === 0) return null;

  return (
    <>
      {marks.map(m => {
        const key = `${m.date}-${m.label}`;
        return (
          <div key={key}>
            <div
              className="pointer-events-none absolute top-1 w-0"
              style={{ left: `${m.left}%`, bottom: lineBottom, borderLeft: `1px dashed ${m.color}`, opacity: 0.75 }}
            />
            <button
              type="button"
              onClick={() => setOpen(open === key ? null : key)}
              aria-label={`Milestone: ${m.label}`}
              className="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 p-1"
              style={{ left: `${m.left}%` }}
            >
              <span className="block h-2.5 w-2.5 rotate-45 rounded-[2px]" style={{ background: m.color }} />
            </button>
          </div>
        );
      })}
      {open
        ? (() => {
            const m = marks.find(x => `${x.date}-${x.label}` === open);
            if (!m) return null;
            return (
              <div
                className="absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-[9px] font-semibold text-[var(--text)] shadow-lg"
                style={{ left: `${Math.min(80, Math.max(20, m.left))}%`, top: 12 }}
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: m.color }} />
                {m.label} · {fmt(m.date)}
              </div>
            );
          })()
        : null}
    </>
  );
}
