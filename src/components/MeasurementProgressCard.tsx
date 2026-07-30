import { Ruler } from 'lucide-react';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { WeightSparkline } from './charts/WeightSparkline';
import type { Measurement } from '../types/database';

type PartKey = 'neck' | 'chest' | 'belly' | 'waist' | 'hips' | 'thighs' | 'calves' | 'biceps' | 'forearms';

// goodDown = a smaller number is the improvement (fat sites); otherwise bigger
// (muscle sites) is the win. Drives the delta colour.
const PARTS: { key: PartKey; label: string; goodDown: boolean }[] = [
  { key: 'neck', label: 'Neck', goodDown: false },
  { key: 'chest', label: 'Chest', goodDown: false },
  { key: 'belly', label: 'Belly', goodDown: true },
  { key: 'waist', label: 'Waist', goodDown: true },
  { key: 'hips', label: 'Glutes / hips', goodDown: true },
  { key: 'thighs', label: 'Thighs', goodDown: false },
  { key: 'calves', label: 'Calves', goodDown: false },
  { key: 'biceps', label: 'Biceps', goodDown: false },
  { key: 'forearms', label: 'Forearms', goodDown: false },
];

const GREEN = '#22c55e';
const RED = '#ef4444';

function seriesFor(entries: Measurement[], key: PartKey): number[] {
  // entries are oldest→newest; keep only rows where this site was recorded.
  return entries.map(m => m[key]).filter((v): v is number => v != null);
}

export function MeasurementProgressCard() {
  const { measurements, loading } = useRecentMeasurements(30);

  if (loading) return null;
  // Hook returns newest-first; flip to chronological for trends.
  const chrono = [...measurements].reverse();

  const rows = PARTS.map(p => ({ ...p, values: seriesFor(chrono, p.key) })).filter(
    r => r.values.length > 0,
  );

  if (rows.length === 0) return null;

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Ruler size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Body measurements</p>
          <p className="text-[11px] text-[var(--muted)]">Progress each time you log</p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[var(--card-border)]">
        {rows.map(r => {
          const current = r.values[r.values.length - 1];
          const first = r.values[0];
          const delta = Math.round((current - first) * 10) / 10;
          const improved = r.goodDown ? delta < 0 : delta > 0;
          const deltaColor = delta === 0 ? 'var(--muted)' : improved ? GREEN : RED;
          return (
            <div key={r.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="w-20 shrink-0">
                <p className="text-xs font-semibold text-[var(--text)]">{r.label}</p>
                <p className="text-[10px] text-[var(--muted)]">{r.values.length} logged</p>
              </div>
              <div className="min-w-0 flex-1">
                {r.values.length >= 2 ? (
                  <WeightSparkline
                    values={r.values}
                    width={110}
                    height={30}
                    color={r.goodDown ? '#0ea5e9' : '#6c63ff'}
                  />
                ) : (
                  <p className="text-[10px] text-[var(--muted)]">Log again to see a trend</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[var(--text)]">{current}&quot;</p>
                {r.values.length >= 2 ? (
                  <p className="text-[10px] font-bold" style={{ color: deltaColor }}>
                    {delta > 0 ? '+' : ''}
                    {delta}&quot; total
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--muted)]">
        Green = moving the right way (muscles up, waist/belly/hips down). Add measurements from the “+”
        menu whenever you check in.
      </p>
    </div>
  );
}
