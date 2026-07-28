import { useState } from 'react';
import { useMuscleActivity, type MusclePeriod } from '../hooks/useMuscleActivity';
import { MUSCLE_EXERCISES, MUSCLE_LABEL, muscleHeat, type MuscleKey } from '../data/muscles';
import { MuscleMap } from './MuscleMap';
import { Sheet } from './Sheet';

export function BodyMapCard() {
  const [period, setPeriod] = useState<MusclePeriod>('week');
  const { data, loading } = useMuscleActivity(period);
  const [selected, setSelected] = useState<MuscleKey | null>(null);

  const ranked = (Object.keys(data.volumes) as MuscleKey[]).sort(
    (a, b) => (data.volumes[b] ?? 0) - (data.volumes[a] ?? 0),
  );

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">Muscles worked</p>
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {([
            { key: 'today', label: 'Today' },
            { key: 'week', label: '7 days' },
          ] as const).map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => setPeriod(o.key)}
              className="rounded-full px-3 py-1 text-[10px] font-bold"
              style={
                period === o.key
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--muted)' }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <MuscleMap intensity={data.intensity} onSelect={setSelected} />

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-[9px] text-[var(--muted)]">
        <span>Less</span>
        <span className="flex h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #eef1f6, #fdba74, #b91c1c)' }} />
        <span>More</span>
      </div>

      {/* Ranked list */}
      {loading ? (
        <p className="text-center text-xs text-[var(--muted)]">Loading…</p>
      ) : ranked.length === 0 ? (
        <p className="text-center text-xs text-[var(--muted)]">
          Log a workout and the muscles you trained light up here.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {ranked.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              className="flex items-center gap-2.5 rounded-xl bg-[var(--bg)] px-3 py-2 text-left"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: muscleHeat(data.intensity[m] ?? 0) }} />
              <span className="flex-1 text-xs font-semibold text-[var(--text)]">{MUSCLE_LABEL[m]}</span>
              <span className="text-[11px] tabular-nums text-[var(--muted)]">
                {Math.round(data.volumes[m] ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
          <p className="mt-1 text-[9px] text-[var(--muted)]">
            Numbers are training volume (weight × reps). Tap a muscle for exercises.
          </p>
        </div>
      )}

      <Sheet
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected ? MUSCLE_LABEL[selected] : 'Muscle'}
      >
        {selected ? (
          <div className="flex flex-col gap-3">
            <div className="glass-card flex items-center justify-between p-4">
              <span className="text-xs text-[var(--muted)]">
                {period === 'today' ? 'Today' : 'Last 7 days'} volume
              </span>
              <span className="text-sm font-bold text-[var(--text)]">
                {Math.round(data.volumes[selected] ?? 0).toLocaleString()}
              </span>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--text)]">
                Exercises for {MUSCLE_LABEL[selected].toLowerCase()}
              </p>
              <div className="flex flex-col gap-1.5">
                {MUSCLE_EXERCISES[selected].map(name => (
                  <div key={name} className="rounded-xl bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)]">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
