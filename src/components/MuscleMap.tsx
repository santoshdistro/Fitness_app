import { muscleHeat, type MuscleKey } from '../data/muscles';

type Pt = [number, number];
type Region = { m: MuscleKey; pts: Pt[]; mirror?: boolean };

const IDLE = '#eef1f6';
const STROKE = '#9aa4b2';

const FRONT: Region[] = [
  { m: 'shoulders', mirror: true, pts: [[40, 36], [34, 34], [28, 38], [26, 46], [31, 50], [39, 47], [42, 40]] },
  { m: 'chest', mirror: true, pts: [[42, 40], [49.5, 41], [49.5, 55], [43, 57], [38, 52], [38, 44]] },
  { m: 'biceps', mirror: true, pts: [[33, 51], [39, 53], [38, 65], [34, 69], [29, 64], [30, 54]] },
  { m: 'forearms', mirror: true, pts: [[29, 67], [35, 67], [34, 83], [30, 87], [25, 80], [26, 70]] },
  { m: 'abs', mirror: true, pts: [[40, 60], [42, 60], [42, 84], [39, 80], [38, 66]] }, // obliques
  { m: 'abs', pts: [[43, 58], [57, 58], [56, 82], [50, 90], [44, 82]] },
  { m: 'quads', mirror: true, pts: [[41, 90], [49, 90], [48, 122], [44, 130], [39, 120], [38, 99]] },
];

const BACK: Region[] = [
  { m: 'traps', pts: [[43, 31], [57, 31], [56, 41], [50, 45], [44, 41]] },
  { m: 'shoulders', mirror: true, pts: [[40, 36], [34, 34], [28, 38], [26, 46], [31, 50], [39, 47], [42, 40]] },
  { m: 'back', mirror: true, pts: [[42, 42], [49.5, 44], [48, 67], [43, 69], [38, 60], [38, 47]] },
  { m: 'triceps', mirror: true, pts: [[33, 51], [39, 53], [38, 65], [34, 69], [29, 64], [30, 54]] },
  { m: 'forearms', mirror: true, pts: [[29, 67], [35, 67], [34, 83], [30, 87], [25, 80], [26, 70]] },
  { m: 'lowerBack', pts: [[44, 68], [56, 68], [55, 79], [50, 81], [45, 79]] },
  { m: 'glutes', mirror: true, pts: [[42, 80], [49.5, 81], [49.5, 95], [44, 98], [39, 92], [39, 84]] },
  { m: 'hamstrings', mirror: true, pts: [[41, 98], [49, 98], [48, 127], [44, 133], [39, 124], [38, 105]] },
  { m: 'calves', mirror: true, pts: [[40, 150], [47, 150], [46, 176], [43, 182], [38, 176], [37, 156]] },
];

const SHIN: Pt[] = [[40, 124], [47, 124], [46, 162], [41, 165], [39, 140]];

function ptsStr(pts: Pt[]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}
function mirror(pts: Pt[]): Pt[] {
  return pts.map(([x, y]) => [100 - x, y] as Pt);
}

function Figure({
  regions,
  label,
  intensity,
  onSelect,
}: {
  regions: Region[];
  label: string;
  intensity: Partial<Record<MuscleKey, number>>;
  onSelect: (m: MuscleKey) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <svg viewBox="0 0 100 192" style={{ width: '100%', maxWidth: 160 }}>
        {/* neutral silhouette */}
        <circle cx={50} cy={18} r={10} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <polygon points={ptsStr([[45, 27], [55, 27], [54, 34], [46, 34]])} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <polygon points={ptsStr(SHIN)} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <polygon points={ptsStr(mirror(SHIN))} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <circle cx={42} cy={170} r={5} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <circle cx={58} cy={170} r={5} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <circle cx={26} cy={90} r={5} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />
        <circle cx={74} cy={90} r={5} fill={IDLE} stroke={STROKE} strokeWidth={0.5} />

        {/* muscles */}
        {regions.flatMap((r, i) => {
          const fill = muscleHeat(intensity[r.m] ?? 0);
          const shapes = [r.pts, ...(r.mirror ? [mirror(r.pts)] : [])];
          return shapes.map((pts, j) => (
            <polygon
              key={`${i}-${j}`}
              points={ptsStr(pts)}
              fill={fill}
              stroke={STROKE}
              strokeWidth={0.5}
              strokeLinejoin="round"
              onClick={() => onSelect(r.m)}
              style={{ cursor: 'pointer' }}
            />
          ));
        })}
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
      <Figure regions={FRONT} label="Front" intensity={intensity} onSelect={onSelect} />
      <Figure regions={BACK} label="Back" intensity={intensity} onSelect={onSelect} />
    </div>
  );
}
