import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useExerciseProgress, type ExercisePoint } from '../hooks/useExerciseProgress';
import { buildBuckets, startOfDay, stepAnchor, type Bucket, type ChartView } from '../lib/timeBuckets';

const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const COLOR = '#6c63ff';

// Heaviest top-set in a bucket (progression = your best lift that period).
function bucketMax(points: ExercisePoint[], b: Bucket): number | null {
  let best: number | null = null;
  for (const p of points) {
    if (p.t >= b.start && p.t < b.end) best = best == null ? p.topWeight : Math.max(best, p.topWeight);
  }
  return best;
}

export function WorkoutProgressChart() {
  const { series, loading } = useExerciseProgress();
  const [exercise, setExercise] = useState<string | null>(null);
  const [view, setView] = useState<ChartView>('month');
  const [anchor, setAnchor] = useState<number>(() => startOfDay(Date.now()));
  const [active, setActive] = useState<number | null>(null);

  const buckets = useMemo(() => buildBuckets(anchor, view), [anchor, view]);

  if (loading) return null;
  if (series.length === 0) return null; // nothing logged yet — the empty state lives on the screen

  // Default to the most recently trained exercise.
  const selectedName = exercise && series.some(s => s.name === exercise) ? exercise : series[0].name;
  const selected = series.find(s => s.name === selectedName)!;

  const vals = buckets.map(b => bucketMax(selected.points, b));
  const present = vals.filter((v): v is number => v != null);
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 1;
  const range = max - min || 1;
  const n = buckets.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 36 - ((v - min) / range) * 32 + 2;

  function pathFor(): string {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'} ${x(i)} ${y(v)} `;
      pen = true;
    });
    return d.trim();
  }

  const canForward = anchor < startOfDay(Date.now());
  const rangeLabel = `${buckets[0].label} – ${buckets[n - 1].label}`;

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text)]">Strength progress</p>
          <p className="text-[10px] text-[var(--muted)]">Heaviest set over time (kg)</p>
        </div>
      </div>

      {/* Exercise picker */}
      <div className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {series.map(s => (
          <button
            key={s.name}
            type="button"
            onClick={() => { setExercise(s.name); setActive(null); }}
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize whitespace-nowrap"
            style={s.name === selectedName ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--muted)' }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* View toggle + period nav + date jump */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {VIEWS.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => { setView(v.key); setActive(null); }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={view === v.key ? { background: 'var(--card)', color: 'var(--text)', boxShadow: '0 1px 4px -1px rgba(0,0,0,0.3)' } : { color: 'var(--muted)' }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { setAnchor(a => stepAnchor(a, view, -1)); setActive(null); }} aria-label="Earlier" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]">
            <ChevronLeft size={15} />
          </button>
          <label className="relative cursor-pointer text-[10px] font-semibold text-[var(--text)]">
            {rangeLabel}
            <input
              type="date"
              value={new Date(anchor).toISOString().slice(0, 10)}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => { if (e.target.value) { setAnchor(startOfDay(new Date(`${e.target.value}T00:00:00`).getTime())); setActive(null); } }}
              className="absolute inset-0 h-full w-full opacity-0"
            />
          </label>
          <button type="button" onClick={() => { setAnchor(a => stepAnchor(a, view, 1)); setActive(null); }} disabled={!canForward} aria-label="Later" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] disabled:opacity-30 active:bg-[var(--bg)]">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {present.length === 0 ? (
        <p className="py-8 text-center text-xs text-[var(--muted)]">
          No sessions for {selectedName} in this range. Use ‹ › or the date to browse.
        </p>
      ) : (
        <div className="relative" style={{ height: 140 }}>
          <div className="absolute left-0 top-0 text-[9px] text-[var(--muted)]">{Math.round(max)}kg</div>
          <div className="absolute bottom-4 left-0 text-[9px] text-[var(--muted)]">{Math.round(min)}kg</div>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            {active != null ? (
              <line x1={x(active)} y1={0} x2={x(active)} y2={38} stroke="var(--card-border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ) : null}
            <path d={pathFor()} fill="none" stroke={COLOR} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {vals.map((v, i) =>
            v == null ? null : (
              <span
                key={i}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: `${x(i)}%`,
                  top: `${(y(v) / 40) * 100}%`,
                  width: active === i ? 8 : 5,
                  height: active === i ? 8 : 5,
                  transform: 'translate(-50%, -50%)',
                  background: active === i ? COLOR : 'var(--card)',
                  border: `2px solid ${COLOR}`,
                }}
              />
            ),
          )}

          <div className="absolute inset-0 bottom-4 flex">
            {buckets.map((b, i) => (
              <button key={i} type="button" aria-label={b.label} onClick={() => setActive(active === i ? null : i)} className="h-full flex-1" />
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-[var(--muted)]">
            <span>{buckets[0].label}</span>
            {n > 2 ? <span>{buckets[Math.floor(n / 2)].label}</span> : null}
            <span>{buckets[n - 1].label}</span>
          </div>

          {active != null && vals[active] != null ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-[9px] font-semibold text-[var(--text)] shadow-lg"
              style={{ left: `${Math.min(80, Math.max(20, x(active)))}%`, top: 4 }}
            >
              {buckets[active].label} · {vals[active]}kg
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
