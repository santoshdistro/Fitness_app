import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useExerciseProgress, type ExercisePoint } from '../hooks/useExerciseProgress';
import { buildBuckets, startOfDay, stepAnchor, type Bucket, type ChartView } from '../lib/timeBuckets';
import { exerciseRegion, type BodyRegion } from '../data/muscles';
import { milestonesForBuckets, useMilestones } from '../hooks/useMilestones';
import { ChartMilestones } from './ChartMilestones';

export type WorkoutGroup = 'all' | BodyRegion;

const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const GROUPS: { key: WorkoutGroup; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upper', label: 'Upper' },
  { key: 'lower', label: 'Lower' },
  { key: 'core', label: 'Core' },
];

// Distinct line colours, cycled per exercise (stable by name within a session).
const PALETTE = [
  '#6c63ff', '#0ea5e9', '#22c55e', '#14b8a6', '#ef4444', '#f59e0b',
  '#a855f7', '#ec4899', '#eab308', '#3b82f6', '#10b981', '#f97316',
];

// Heaviest top-set in a bucket (progression = your best lift that period).
function bucketMax(points: ExercisePoint[], b: Bucket): number | null {
  let best: number | null = null;
  for (const p of points) {
    if (p.t >= b.start && p.t < b.end) best = best == null ? p.topWeight : Math.max(best, p.topWeight);
  }
  return best;
}

type Props = {
  group: WorkoutGroup;
  onGroupChange: (g: WorkoutGroup) => void;
};

export function WorkoutProgressChart({ group, onGroupChange }: Props) {
  const { series, loading } = useExerciseProgress();
  const { milestones } = useMilestones();
  const [view, setView] = useState<ChartView>('month');
  const [anchor, setAnchor] = useState<number>(() => startOfDay(Date.now()));
  const [active, setActive] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const buckets = useMemo(() => buildBuckets(anchor, view), [anchor, view]);

  // Every exercise in this group that has at least one reading in the window.
  const visibleSeries = useMemo(
    () => series.filter(s => group === 'all' || exerciseRegion(s.name) === group),
    [series, group],
  );
  const linesInWindow = useMemo(() => {
    return visibleSeries
      .map(s => ({ name: s.name, vals: buckets.map(b => bucketMax(s.points, b)) }))
      .filter(l => l.vals.some(v => v != null));
  }, [visibleSeries, buckets]);

  if (loading) return null;
  if (series.length === 0) return null; // nothing logged — the empty state lives on the screen

  // Stable colour per exercise, by its index in the full series list.
  const colorFor = (name: string) => PALETTE[Math.max(0, series.findIndex(s => s.name === name)) % PALETTE.length];

  const activeLines = linesInWindow.filter(l => !hidden.has(l.name));

  const allVals: number[] = [];
  for (const l of activeLines) for (const v of l.vals) if (v != null) allVals.push(v);
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 1;
  const range = max - min || 1;
  const n = buckets.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 36 - ((v - min) / range) * 32 + 2;

  // Connect readings into a continuous line, drawing straight through empty
  // buckets so sparse data still joins up instead of showing lone dots.
  function pathFor(vals: (number | null)[]): string {
    let d = '';
    let started = false;
    vals.forEach((v, i) => {
      if (v == null) return;
      d += `${started ? 'L' : 'M'} ${x(i)} ${y(v)} `;
      started = true;
    });
    return d.trim();
  }

  const canForward = anchor < startOfDay(Date.now());
  const rangeLabel = `${buckets[0].label} – ${buckets[n - 1].label}`;

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      {/* Header + group toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text)]">Strength progress</p>
            <p className="text-[10px] text-[var(--muted)]">Heaviest set over time (kg)</p>
          </div>
        </div>
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {GROUPS.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => { onGroupChange(g.key); setActive(null); setHidden(new Set()); }}
              className="rounded-full px-2 py-1 text-[10px] font-bold"
              style={group === g.key ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--muted)' }}
            >
              {g.label}
            </button>
          ))}
        </div>
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

      {activeLines.length === 0 ? (
        <p className="py-8 text-center text-xs text-[var(--muted)]">
          No {group === 'all' ? '' : `${group} `}sessions in this range. Use ‹ › or the date to browse.
        </p>
      ) : (
        <>
          <div className="relative" style={{ height: 150 }}>
            <div className="absolute left-0 top-0 text-[10px] text-[var(--muted)]">{Math.round(max)}kg</div>
            <div className="absolute bottom-4 left-0 text-[10px] text-[var(--muted)]">{Math.round(min)}kg</div>
            <ChartMilestones marks={milestonesForBuckets(milestones, buckets)} />
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              {active != null ? (
                <line x1={x(active)} y1={0} x2={x(active)} y2={38} stroke="var(--card-border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ) : null}
              {activeLines.map(l => (
                <path
                  key={l.name}
                  d={pathFor(l.vals)}
                  fill="none"
                  stroke={colorFor(l.name)}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {activeLines.map(l =>
              l.vals.map((v, i) =>
                v == null ? null : (
                  <span
                    key={`${l.name}-${i}`}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      left: `${x(i)}%`,
                      top: `${(y(v) / 40) * 100}%`,
                      width: active === i ? 8 : 5,
                      height: active === i ? 8 : 5,
                      transform: 'translate(-50%, -50%)',
                      background: active === i ? colorFor(l.name) : 'var(--card)',
                      border: `2px solid ${colorFor(l.name)}`,
                    }}
                  />
                ),
              ),
            )}

            <div className="absolute inset-0 bottom-4 flex">
              {buckets.map((b, i) => (
                <button key={i} type="button" aria-label={b.label} onClick={() => setActive(active === i ? null : i)} className="h-full flex-1" />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-[var(--muted)]">
              <span>{buckets[0].label}</span>
              {n > 2 ? <span>{buckets[Math.floor(n / 2)].label}</span> : null}
              <span>{buckets[n - 1].label}</span>
            </div>

            {active != null ? (
              <div
                className="pointer-events-none absolute z-10 max-w-[62%] -translate-x-1/2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-[10px] shadow-lg"
                style={{ left: `${Math.min(78, Math.max(22, x(active)))}%`, top: 4 }}
              >
                <p className="mb-0.5 font-bold text-[var(--text)]">{buckets[active].label}</p>
                {activeLines.map(l => {
                  const v = l.vals[active];
                  if (v == null) return null;
                  return (
                    <p key={l.name} className="flex items-center gap-1 capitalize text-[var(--muted)]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: colorFor(l.name) }} />
                      {l.name} {v}kg
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Legend — tap to isolate / restore a line */}
          <div className="flex flex-wrap gap-1.5">
            {linesInWindow.map(l => {
              const off = hidden.has(l.name);
              return (
                <button
                  key={l.name}
                  type="button"
                  onClick={() =>
                    setHidden(prev => {
                      const next = new Set(prev);
                      if (next.has(l.name)) next.delete(l.name);
                      else next.add(l.name);
                      return next;
                    })
                  }
                  className="flex items-center gap-1 rounded-full border border-[var(--card-border)] px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{ opacity: off ? 0.35 : 1, color: 'var(--text)' }}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorFor(l.name) }} />
                  {l.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
