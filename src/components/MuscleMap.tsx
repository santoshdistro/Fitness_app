import { muscleHeat, type MuscleKey } from '../data/muscles';

type Shape =
  | { m?: MuscleKey; kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { m?: MuscleKey; kind: 'rect'; x: number; y: number; w: number; h: number; r: number };

// Neutral silhouette pieces shared by both views (head, limbs, hands, feet).
const BASE: Shape[] = [
  { kind: 'ellipse', cx: 30, cy: 14, rx: 7, ry: 8 },
  { kind: 'rect', x: 27, y: 20, w: 6, h: 6, r: 2 },
  { kind: 'ellipse', cx: 7, cy: 92, rx: 4, ry: 5 },
  { kind: 'ellipse', cx: 53, cy: 92, rx: 4, ry: 5 },
  { kind: 'rect', x: 21, y: 122, w: 7, h: 44, r: 3 },
  { kind: 'rect', x: 32, y: 122, w: 7, h: 44, r: 3 },
  { kind: 'ellipse', cx: 24, cy: 172, rx: 5, ry: 4 },
  { kind: 'ellipse', cx: 36, cy: 172, rx: 5, ry: 4 },
];

const FRONT: Shape[] = [
  { m: 'shoulders', kind: 'ellipse', cx: 15, cy: 33, rx: 7, ry: 6 },
  { m: 'shoulders', kind: 'ellipse', cx: 45, cy: 33, rx: 7, ry: 6 },
  { m: 'chest', kind: 'rect', x: 18, y: 37, w: 11, h: 13, r: 4 },
  { m: 'chest', kind: 'rect', x: 31, y: 37, w: 11, h: 13, r: 4 },
  { m: 'biceps', kind: 'ellipse', cx: 11, cy: 53, rx: 4.5, ry: 11 },
  { m: 'biceps', kind: 'ellipse', cx: 49, cy: 53, rx: 4.5, ry: 11 },
  { m: 'abs', kind: 'rect', x: 23, y: 51, w: 14, h: 26, r: 4 },
  { m: 'forearms', kind: 'ellipse', cx: 8, cy: 75, rx: 4, ry: 12 },
  { m: 'forearms', kind: 'ellipse', cx: 52, cy: 75, rx: 4, ry: 12 },
  { m: 'quads', kind: 'rect', x: 20, y: 80, w: 9, h: 44, r: 4 },
  { m: 'quads', kind: 'rect', x: 31, y: 80, w: 9, h: 44, r: 4 },
];

const BACK: Shape[] = [
  { m: 'traps', kind: 'rect', x: 24, y: 26, w: 12, h: 9, r: 3 },
  { m: 'shoulders', kind: 'ellipse', cx: 15, cy: 33, rx: 7, ry: 6 },
  { m: 'shoulders', kind: 'ellipse', cx: 45, cy: 33, rx: 7, ry: 6 },
  { m: 'back', kind: 'rect', x: 20, y: 36, w: 20, h: 24, r: 6 },
  { m: 'triceps', kind: 'ellipse', cx: 11, cy: 53, rx: 4.5, ry: 11 },
  { m: 'triceps', kind: 'ellipse', cx: 49, cy: 53, rx: 4.5, ry: 11 },
  { m: 'forearms', kind: 'ellipse', cx: 8, cy: 75, rx: 4, ry: 12 },
  { m: 'forearms', kind: 'ellipse', cx: 52, cy: 75, rx: 4, ry: 12 },
  { m: 'lowerBack', kind: 'rect', x: 24, y: 60, w: 12, h: 12, r: 3 },
  { m: 'glutes', kind: 'ellipse', cx: 24, cy: 82, rx: 7, ry: 7 },
  { m: 'glutes', kind: 'ellipse', cx: 36, cy: 82, rx: 7, ry: 7 },
  { m: 'hamstrings', kind: 'rect', x: 20, y: 90, w: 9, h: 34, r: 4 },
  { m: 'hamstrings', kind: 'rect', x: 31, y: 90, w: 9, h: 34, r: 4 },
  { m: 'calves', kind: 'ellipse', cx: 24, cy: 140, rx: 5, ry: 13 },
  { m: 'calves', kind: 'ellipse', cx: 36, cy: 140, rx: 5, ry: 13 },
];

function ShapeEl({
  s,
  fill,
  onClick,
}: {
  s: Shape;
  fill: string;
  onClick?: () => void;
}) {
  const common = {
    fill,
    stroke: '#9aa4b2',
    strokeWidth: 0.4,
    onClick,
    style: { cursor: onClick ? 'pointer' : 'default' } as const,
  };
  return s.kind === 'ellipse' ? (
    <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />
  ) : (
    <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} {...common} />
  );
}

function Figure({
  shapes,
  label,
  intensity,
  onSelect,
}: {
  shapes: Shape[];
  label: string;
  intensity: Partial<Record<MuscleKey, number>>;
  onSelect: (m: MuscleKey) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <svg viewBox="0 0 60 182" style={{ width: '100%', maxWidth: 150 }}>
        {BASE.map((s, i) => (
          <ShapeEl key={`b${i}`} s={s} fill="#eef1f6" />
        ))}
        {shapes.map((s, i) => (
          <ShapeEl
            key={`m${i}`}
            s={s}
            fill={muscleHeat(s.m ? intensity[s.m] ?? 0 : 0)}
            onClick={s.m ? () => onSelect(s.m!) : undefined}
          />
        ))}
      </svg>
      <span className="mt-1 text-[10px] font-semibold text-[var(--muted)]">{label}</span>
    </div>
  );
}

export function MuscleMap({
  intensity,
  onSelect,
}: {
  intensity: Partial<Record<MuscleKey, number>>;
  onSelect: (m: MuscleKey) => void;
}) {
  return (
    <div className="flex gap-2">
      <Figure shapes={FRONT} label="Front" intensity={intensity} onSelect={onSelect} />
      <Figure shapes={BACK} label="Back" intensity={intensity} onSelect={onSelect} />
    </div>
  );
}
