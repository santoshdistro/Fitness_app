import { useId, useState } from 'react';

type Point = { label: string; value: number };

type Props = {
  points: Point[];
  type?: 'line' | 'bar';
  color?: string;
  /** Optional smoothed overlay line (e.g. moving average), same length as points. */
  overlay?: number[];
  /** Optional constant target/required line drawn across the chart. */
  goal?: number | null;
  unit?: string;
  height?: number;
  /** Decimal places for the value labels (0 for calories/steps, 1 for weight). */
  decimals?: number;
};

// Responsive SVG chart (line or bars) with a gradient fill, point markers,
// an optional target line, and tap-to-inspect tooltips.
export function TrendChart({ points, type = 'line', color = '#6c63ff', overlay, goal, unit = '', height = 120, decimals = 0 }: Props) {
  const gid = useId().replace(/:/g, '');
  const [active, setActive] = useState<number | null>(null);
  const fmt = (v: number) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v)));

  if (points.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--muted)]">Not enough data yet.</p>;
  }
  const values = points.map(p => p.value);
  const all = [...values, ...(overlay ?? []), ...(goal != null ? [goal] : [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  // BARS BASELINE AT ZERO, lines at the series minimum, and the difference is
  // not cosmetic: a bar's length IS its value, so starting the axis at the
  // smallest reading makes the smallest value vanish and every gap look total.
  // Two cardio sessions of 2.0km and 2.2km drew as an empty slot next to a
  // full-height bar. A line only claims to show shape, so zooming to the data
  // is right there — a weight chart baselined at zero would be a flat line.
  const base = type === 'bar' ? Math.min(0, min) : min;
  const range = max - base || 1;
  const n = points.length;

  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 38 - ((v - base) / range) * 34 + 2; // 2..38

  // Bars sit in evenly-spaced bands (each centred in its own slot) so the first
  // and last aren't half-clipped at the chart edges — a point-based x would put
  // their centres on x=0 and x=100.
  const bandW = 100 / n;
  const xBar = (i: number) => (i + 0.5) * bandW;

  // Markers shrink as the line gets busier, so a growing history degrades
  // smoothly instead of snapping from "every point dotted" to "none" the day one
  // more weigh-in lands. Below ~6px of breathing room they'd collide into a
  // smear, so intermediate dots drop out and only the latest (and any tapped
  // point) stay marked. 340 approximates the on-screen chart width in px.
  const gapPx = (n > 1 ? 100 / (n - 1) : 100) * 3.4;
  const dotSize = gapPx >= 26 ? 6 : gapPx >= 16 ? 5 : gapPx >= 10 ? 4 : gapPx >= 6 ? 3 : 0;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(n - 1)} 40 L ${x(0)} 40 Z`;
  const overlayPath = overlay
    ? overlay.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
    : null;

  const latest = values[values.length - 1];
  const activePoint = active != null ? points[active] : null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>
          {fmt(max)}
          {unit}
        </span>
        <span className="font-semibold text-[var(--text)]">
          now {fmt(latest)}
          {unit}
        </span>
      </div>

      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {type === 'bar' ? (
            points.map((p, i) => {
              const bw = Math.max(0.8, bandW - 1.5);
              const top = y(p.value);
              const bh = y(base) - top;
              return (
                <rect
                  key={i}
                  x={xBar(i) - bw / 2}
                  y={top}
                  width={bw}
                  height={Math.max(0.6, bh)}
                  rx={0.6}
                  fill={color}
                  opacity={active === i ? 1 : 0.85}
                />
              );
            })
          ) : (
            <>
              <path d={areaPath} fill={`url(#fill-${gid})`} stroke="none" />
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          {overlayPath ? (
            <path
              d={overlayPath}
              fill="none"
              stroke="var(--text)"
              strokeWidth={1}
              strokeDasharray="2 1.5"
              opacity={0.45}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {goal != null ? (
            <line
              x1={0}
              y1={y(goal)}
              x2={100}
              y2={y(goal)}
              stroke="#ef4444"
              strokeWidth={1.2}
              strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {/* Point markers (line only) */}
        {type === 'line'
          ? points.map((p, i) => {
              const emphasised = active === i || i === n - 1;
              if (dotSize === 0 && !emphasised) return null;
              const size = emphasised ? 9 : dotSize;
              return (
              <span
                key={i}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: `${x(i)}%`,
                  top: `${(y(p.value) / 40) * 100}%`,
                  width: size,
                  height: size,
                  transform: 'translate(-50%, -50%)',
                  // Small dots fill solid — a hollow ring that size reads as a
                  // smudge — while roomier ones keep the ringed look.
                  background: emphasised || size <= 4 ? color : 'var(--card)',
                  border: `${size <= 4 ? 1 : 2}px solid ${color}`,
                }}
              />
              );
            })
          : null}

        {/* Transparent hit columns for tap-to-inspect */}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${p.label}: ${Math.round(p.value)}${unit}`}
              onClick={() => setActive(active === i ? null : i)}
              className="h-full flex-1"
            />
          ))}
        </div>

        {/* Tooltip */}
        {activePoint ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold text-white shadow-lg"
            style={{
              left: `${Math.min(85, Math.max(15, x(active!)))}%`,
              top: `${(y(activePoint.value) / 40) * 100}%`,
              background: color,
            }}
          >
            {activePoint.label} · {fmt(activePoint.value)}
            {unit}
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>

      {goal != null ? (
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
            {type === 'bar' ? 'Intake' : 'Actual'}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0 w-3 border-t-2 border-dashed" style={{ borderColor: '#ef4444' }} />
            Target {Math.round(goal)}
            {unit}
          </span>
        </div>
      ) : null}
    </div>
  );
}
