import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LineChart } from 'lucide-react';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import type { Measurement } from '../types/database';
import { buildBuckets, startOfDay, stepAnchor, type Bucket, type ChartView } from '../lib/timeBuckets';
import { milestonesForBuckets, useMilestones } from '../hooks/useMilestones';
import { ChartMilestones } from './ChartMilestones';

type SiteKey = 'neck' | 'chest' | 'biceps' | 'forearms' | 'waist' | 'hips' | 'belly' | 'thighs' | 'calves';
type View = ChartView;
type Group = 'all' | 'upper' | 'lower';

const SITES: Record<SiteKey, { label: string; color: string }> = {
  neck: { label: 'Neck', color: '#6c63ff' },
  chest: { label: 'Chest', color: '#0ea5e9' },
  biceps: { label: 'Biceps', color: '#22c55e' },
  forearms: { label: 'Forearms', color: '#14b8a6' },
  waist: { label: 'Waist', color: '#ef4444' },
  hips: { label: 'Hips', color: '#f59e0b' },
  belly: { label: 'Belly', color: '#a855f7' },
  thighs: { label: 'Thighs', color: '#ec4899' },
  calves: { label: 'Calves', color: '#eab308' },
};

const GROUPS: { key: Group; label: string; sites: SiteKey[] }[] = [
  { key: 'all', label: 'All', sites: ['neck', 'chest', 'biceps', 'forearms', 'waist', 'hips', 'belly', 'thighs', 'calves'] },
  { key: 'upper', label: 'Upper', sites: ['neck', 'chest', 'biceps', 'forearms'] },
  { key: 'lower', label: 'Lower', sites: ['waist', 'hips', 'belly', 'thighs', 'calves'] },
];

const VIEWS: { key: View; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

// Average of a site's readings that fall in [start, end); null if none.
function bucketAvg(rows: Measurement[], site: SiteKey, b: Bucket): number | null {
  let sum = 0;
  let count = 0;
  for (const m of rows) {
    const t = new Date(m.entry_timestamp).getTime();
    const v = m[site];
    if (v != null && t >= b.start && t < b.end) {
      sum += v;
      count += 1;
    }
  }
  return count > 0 ? sum / count : null;
}

type Props = {
  group: Group;
  onGroupChange: (g: Group) => void;
};

export function MeasurementTrendChart({ group, onGroupChange }: Props) {
  const { measurements, loading } = useRecentMeasurements(500);
  const { milestones } = useMilestones();
  const [view, setView] = useState<View>('month');
  const [anchor, setAnchor] = useState<number>(() => startOfDay(Date.now()));
  const [active, setActive] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<SiteKey>>(new Set());

  const buckets = useMemo(() => buildBuckets(anchor, view), [anchor, view]);

  // Sites in this group that actually have at least one reading in the window.
  const rows = measurements;
  const groupSites = GROUPS.find(g => g.key === group)!.sites;
  const seriesBySite = useMemo(() => {
    const map = new Map<SiteKey, (number | null)[]>();
    for (const site of groupSites) {
      const vals = buckets.map(b => bucketAvg(rows, site, b));
      if (vals.some(v => v != null)) map.set(site, vals);
    }
    return map;
  }, [rows, groupSites, buckets]);

  if (loading) return null;

  const activeSites = [...seriesBySite.keys()].filter(s => !hidden.has(s));

  // Shared scale across every visible line so they're comparable.
  const allVals: number[] = [];
  for (const s of activeSites) for (const v of seriesBySite.get(s)!) if (v != null) allVals.push(v);
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 1;
  const range = max - min || 1;
  const n = buckets.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 36 - ((v - min) / range) * 32 + 2; // 2..36

  // Connect the readings into a continuous trend line, drawing straight through
  // empty buckets (so sparse data still joins up instead of showing lone dots).
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
  function step(dir: -1 | 1) {
    setActive(null);
    setAnchor(a => stepAnchor(a, view, dir));
  }

  const rangeLabel = `${buckets[0].label} – ${buckets[n - 1].label}`;

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      {/* Header + group toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <LineChart size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text)]">Measurement progress</p>
            <p className="text-[10px] text-[var(--muted)]">Inches over time</p>
          </div>
        </div>
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {GROUPS.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => { onGroupChange(g.key); setActive(null); setHidden(new Set()); }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
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
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Earlier period"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]"
          >
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
          <button
            type="button"
            onClick={() => step(1)}
            disabled={!canForward}
            aria-label="Later period"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] disabled:opacity-30 active:bg-[var(--bg)]"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {activeSites.length === 0 ? (
        <p className="py-8 text-center text-xs text-[var(--muted)]">
          No measurements in this range. Use ‹ › or the date to browse, or log some to start a trend.
        </p>
      ) : (
        <>
          <div className="relative" style={{ height: 150 }}>
            <div className="absolute left-0 top-0 text-[9px] text-[var(--muted)]">{Math.round(max)}"</div>
            <div className="absolute bottom-4 left-0 text-[9px] text-[var(--muted)]">{Math.round(min)}"</div>
            <ChartMilestones marks={milestonesForBuckets(milestones, buckets)} />
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              {active != null ? (
                <line x1={x(active)} y1={0} x2={x(active)} y2={38} stroke="var(--card-border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ) : null}
              {activeSites.map(site => (
                <path
                  key={site}
                  d={pathFor(seriesBySite.get(site)!)}
                  fill="none"
                  stroke={SITES[site].color}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* Point markers (HTML avoids ellipse distortion from the stretched viewBox) */}
            {activeSites.map(site =>
              seriesBySite.get(site)!.map((v, i) =>
                v == null ? null : (
                  <span
                    key={`${site}-${i}`}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      left: `${x(i)}%`,
                      top: `${(y(v) / 40) * 100}%`,
                      width: active === i ? 8 : 5,
                      height: active === i ? 8 : 5,
                      transform: 'translate(-50%, -50%)',
                      background: active === i ? SITES[site].color : 'var(--card)',
                      border: `2px solid ${SITES[site].color}`,
                    }}
                  />
                ),
              ),
            )}

            {/* Tap columns to inspect a bucket */}
            <div className="absolute inset-0 bottom-4 flex">
              {buckets.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={b.label}
                  onClick={() => setActive(active === i ? null : i)}
                  className="h-full flex-1"
                />
              ))}
            </div>

            {/* x labels */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-[var(--muted)]">
              <span>{buckets[0].label}</span>
              {n > 2 ? <span>{buckets[Math.floor(n / 2)].label}</span> : null}
              <span>{buckets[n - 1].label}</span>
            </div>

            {/* Tooltip for the active bucket */}
            {active != null ? (
              <div
                className="pointer-events-none absolute z-10 max-w-[60%] -translate-x-1/2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-[9px] shadow-lg"
                style={{ left: `${Math.min(78, Math.max(22, x(active)))}%`, top: 4 }}
              >
                <p className="mb-0.5 font-bold text-[var(--text)]">{buckets[active].label}</p>
                {activeSites.map(site => {
                  const v = seriesBySite.get(site)![active];
                  if (v == null) return null;
                  return (
                    <p key={site} className="flex items-center gap-1 text-[var(--muted)]">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: SITES[site].color }} />
                      {SITES[site].label} {Math.round(v * 10) / 10}"
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Legend — tap to isolate / restore a line */}
          <div className="flex flex-wrap gap-1.5">
            {[...seriesBySite.keys()].map(site => {
              const off = hidden.has(site);
              return (
                <button
                  key={site}
                  type="button"
                  onClick={() =>
                    setHidden(prev => {
                      const next = new Set(prev);
                      if (next.has(site)) next.delete(site);
                      else next.add(site);
                      return next;
                    })
                  }
                  className="flex items-center gap-1 rounded-full border border-[var(--card-border)] px-2 py-0.5 text-[10px] font-semibold"
                  style={{ opacity: off ? 0.35 : 1, color: 'var(--text)' }}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: SITES[site].color }} />
                  {SITES[site].label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
