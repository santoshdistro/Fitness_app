// Shared time-bucketing for the progress charts (measurements, workouts, …).
// Coarser buckets as the window widens keeps multi-year data legible: daily for
// a week, weekly for a month, monthly for a year.

export type ChartView = 'week' | 'month' | 'year';
export type Bucket = { start: number; end: number; label: string };

export const DAY = 86_400_000;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function fmtDay(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function fmtMonth(t: number): string {
  return new Date(t).toLocaleDateString(undefined, { month: 'short' });
}

// Buckets ending at (and including) the anchor day.
export function buildBuckets(anchorDay: number, view: ChartView): Bucket[] {
  const out: Bucket[] = [];
  if (view === 'week') {
    for (let i = 6; i >= 0; i--) {
      const start = anchorDay - i * DAY;
      out.push({ start, end: start + DAY, label: fmtDay(start) });
    }
    return out;
  }
  if (view === 'month') {
    // Four trailing weeks, oldest → newest.
    for (let i = 3; i >= 0; i--) {
      const end = anchorDay - i * 7 * DAY + DAY;
      const start = end - 7 * DAY;
      out.push({ start, end, label: fmtDay(start) });
    }
    return out;
  }
  // Year: twelve calendar months, oldest → newest.
  const anchor = new Date(anchorDay);
  for (let i = 11; i >= 0; i--) {
    const s = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const e = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 1);
    out.push({ start: s.getTime(), end: e.getTime(), label: fmtMonth(s.getTime()) });
  }
  return out;
}

// Move the anchor one whole window earlier (-1) or later (+1).
export function stepAnchor(anchorDay: number, view: ChartView, dir: -1 | 1): number {
  if (view === 'week') return anchorDay + dir * 7 * DAY;
  if (view === 'month') return anchorDay + dir * 28 * DAY;
  const d = new Date(anchorDay);
  return startOfDay(new Date(d.getFullYear(), d.getMonth() + dir * 12, d.getDate()).getTime());
}
