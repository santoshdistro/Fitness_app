import { muscleHeat, type MuscleKey } from '../data/muscles';
import { BACK_PARTS, BACK_VIEWBOX, FRONT_PARTS, FRONT_VIEWBOX, type BodyPart } from '../data/bodyPaths';

const STROKE = '#9aa4b2';

function Figure({
  parts,
  viewBox,
  label,
  intensity,
  onSelect,
  large,
}: {
  parts: BodyPart[];
  viewBox: string;
  label: string;
  intensity: Partial<Record<MuscleKey, number>>;
  onSelect: (m: MuscleKey) => void;
  large?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <svg viewBox={viewBox} style={{ width: '100%', maxWidth: large ? 240 : 170 }}>
        {parts.map((part, i) =>
          part.paths.map((d, j) => (
            <path
              key={`${i}-${j}`}
              d={d}
              fill={part.muscle ? muscleHeat(intensity[part.muscle] ?? 0) : '#eef1f6'}
              stroke={STROKE}
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              onClick={part.muscle ? () => onSelect(part.muscle!) : undefined}
              style={{ cursor: part.muscle ? 'pointer' : 'default' }}
            />
          )),
        )}
      </svg>
      <span className="mt-1 text-[10px] font-semibold text-[var(--muted)]">{label}</span>
    </div>
  );
}

export function MuscleMap({
  intensity,
  onSelect,
  large,
}: {
  intensity: Partial<Record<MuscleKey, number>>;
  onSelect: (m: MuscleKey) => void;
  large?: boolean;
}) {
  return (
    <div className="flex justify-center gap-2">
      <Figure parts={FRONT_PARTS} viewBox={FRONT_VIEWBOX} label="Front" intensity={intensity} onSelect={onSelect} large={large} />
      <Figure parts={BACK_PARTS} viewBox={BACK_VIEWBOX} label="Back" intensity={intensity} onSelect={onSelect} large={large} />
    </div>
  );
}
