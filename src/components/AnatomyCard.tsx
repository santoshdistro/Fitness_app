import { Check, Sparkles } from 'lucide-react';
import { useMuscleActivity } from '../hooks/useMuscleActivity';
import { FRONT_PARTS, FRONT_VIEWBOX } from '../data/bodyPaths';
import type { MuscleKey } from '../data/muscles';

// Anatomy card in the smart-AI concept style: a single X-ray front figure with
// floating pill labels that check off the muscle groups trained this week.
type FloatLabel = {
  label: string;
  keys: MuscleKey[];
  pos: React.CSSProperties;
};

const LABELS: FloatLabel[] = [
  { label: 'Shoulder', keys: ['shoulders'], pos: { top: '13%', left: '0%' } },
  { label: 'Chest', keys: ['chest'], pos: { top: '25%', right: '0%' } },
  { label: 'Triceps', keys: ['triceps'], pos: { top: '37%', left: '-2%' } },
  { label: 'Abs', keys: ['abs'], pos: { top: '45%', left: '20%' } },
  { label: 'Biceps', keys: ['biceps'], pos: { top: '52%', right: '-2%' } },
  { label: 'Legs', keys: ['quads', 'hamstrings', 'calves'], pos: { bottom: '9%', left: '4%' } },
];

export function AnatomyCard() {
  const { data } = useMuscleActivity('week');
  const isTrained = (keys: MuscleKey[]) => keys.some(k => (data.intensity[k] ?? 0) > 0);

  const fillFor = (muscle: MuscleKey | null | undefined): string => {
    if (!muscle) return 'color-mix(in srgb, var(--accent) 6%, transparent)';
    const t = data.intensity[muscle] ?? 0;
    if (t <= 0) return 'color-mix(in srgb, var(--accent) 12%, transparent)';
    const pct = 40 + Math.round(t * 45); // 40–85%
    return `color-mix(in srgb, var(--accent) ${pct}%, transparent)`;
  };

  return (
    <div
      className="glass-card relative overflow-hidden p-5"
      style={{
        backgroundImage:
          'radial-gradient(60% 45% at 82% 12%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)',
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--text)]">Target areas</p>
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
      </div>
      <p className="mb-2 text-[11px] text-[var(--muted)]">Muscles you’ve trained in the last 7 days</p>

      <div className="relative mx-auto" style={{ maxWidth: 280 }}>
        <svg viewBox={FRONT_VIEWBOX} style={{ width: '100%', display: 'block' }}>
          {FRONT_PARTS.map((part, i) =>
            part.paths.map((d, j) => (
              <path
                key={`${i}-${j}`}
                d={d}
                fill={fillFor(part.muscle)}
                stroke="color-mix(in srgb, var(--accent) 45%, transparent)"
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}
        </svg>

        {LABELS.map(l => {
          const on = isTrained(l.keys);
          return (
            <span
              key={l.label}
              className="absolute flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md"
              style={{
                ...l.pos,
                color: 'var(--text)',
                background: 'color-mix(in srgb, var(--card) 60%, rgba(0,0,0,0.25))',
                border: '1px solid var(--card-border)',
                boxShadow: on ? '0 0 14px color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
              }}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{
                  background: on ? 'var(--accent)' : 'transparent',
                  border: on ? 'none' : '1.5px solid var(--muted)',
                }}
              >
                {on ? <Check size={11} className="text-white" strokeWidth={3} /> : null}
              </span>
              {l.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
