export type Ring = {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
};

type Props = {
  rings: Ring[];
  size?: number;
};

const STROKE = 9;
const GAP = 4;

/**
 * Apple-Fitness-style concentric progress rings. The first ring is the
 * outermost; each subsequent ring nests inside. Progress clamps at 100%
 * of its own circle but the label can still show an over-100% value.
 */
export function ActivityRings({ rings, size = 132 }: Props) {
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ring, index) => {
          const radius = center - STROKE / 2 - index * (STROKE + GAP);
          if (radius <= 0) return null;
          const circumference = 2 * Math.PI * radius;
          const pct = ring.target > 0 ? Math.min(1, ring.value / ring.target) : 0;
          const offset = circumference * (1 - pct);
          return (
            <g key={ring.label} transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeOpacity={0.14}
                strokeWidth={STROKE}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RingLegend({ rings }: { rings: Ring[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {rings.map(ring => {
        const pct = ring.target > 0 ? Math.round((ring.value / ring.target) * 100) : 0;
        return (
          <div key={ring.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: ring.color }}
            />
            <div className="leading-tight">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {ring.label}
              </p>
              <p className="text-sm font-bold text-[var(--text)]">
                {Math.round(ring.value)}
                <span className="text-[var(--muted)]">
                  {' '}
                  / {Math.round(ring.target)}
                  {ring.unit ?? ''} · {pct}%
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
