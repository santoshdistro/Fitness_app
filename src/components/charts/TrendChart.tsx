type Point = { label: string; value: number };

type Props = {
  points: Point[];
  type?: 'line' | 'bar';
  color?: string;
  /** Optional smoothed overlay line (e.g. moving average), same length as points. */
  overlay?: number[];
  unit?: string;
  height?: number;
};

// Lightweight responsive SVG chart (line or bars) with min/max/latest labels.
export function TrendChart({ points, type = 'line', color = '#6c63ff', overlay, unit = '', height = 90 }: Props) {
  if (points.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--muted)]">Not enough data yet.</p>;
  }
  const values = points.map(p => p.value);
  const all = overlay ? [...values, ...overlay] : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const n = points.length;

  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 38 - ((v - min) / range) * 36 + 1;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const overlayPath = overlay
    ? overlay.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
    : null;

  const latest = values[values.length - 1];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>
          {Math.round(max)}
          {unit}
        </span>
        <span className="font-semibold text-[var(--text)]">
          now {Math.round(latest)}
          {unit}
        </span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height }}>
        {type === 'bar' ? (
          points.map((p, i) => {
            const bw = Math.max(0.8, 100 / n - 1.5);
            const bh = ((p.value - min) / range) * 36;
            return (
              <rect
                key={i}
                x={x(i) - bw / 2}
                y={39 - bh}
                width={bw}
                height={Math.max(0.5, bh)}
                rx={0.6}
                fill={color}
                opacity={0.85}
              />
            );
          })
        ) : (
          <path d={linePath} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
        )}
        {overlayPath ? (
          <path d={overlayPath} fill="none" stroke="var(--text)" strokeWidth={1} strokeDasharray="2 1.5" opacity={0.5} />
        ) : null}
      </svg>
      <div className="mt-0.5 flex items-center justify-between text-[9px] text-[var(--muted)]">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
