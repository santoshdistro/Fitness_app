import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useProfile } from '../hooks/useProfile';
import { useSettings } from '../hooks/useSettings';
import { cmToFtIn, kgToUnit } from '../utils/units';
import { WeightSparkline } from './charts/WeightSparkline';
import { Sheet } from './Sheet';

type SiteKey = 'neck' | 'chest' | 'belly' | 'waist' | 'hips' | 'thighs' | 'calves' | 'biceps' | 'forearms';

// goodDown = a smaller number is the improvement (fat sites); otherwise bigger
// (muscle sites) is the win. Drives the delta colour.
const SITES: { key: SiteKey; label: string; goodDown: boolean }[] = [
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

type Point = { date: string; value: number };
type Metric = {
  key: string;
  label: string;
  unit: string;
  goodDown: boolean | null; // null → neutral (no colour)
  color: string;
  history: Point[]; // chronological
};

function shortDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' });
}

// Value of a metric as of the snapshot date (latest point on or before it),
// plus the point immediately before that, for the change figure.
function asOf(history: Point[], iso: string): { current?: Point; prev?: Point; upto: Point[] } {
  const cutoff = new Date(iso).getTime();
  const upto = history.filter(p => new Date(p.date).getTime() <= cutoff);
  return { current: upto[upto.length - 1], prev: upto[upto.length - 2], upto };
}

export function MeasurementProgressCard() {
  const { measurements, loading } = useRecentMeasurements(30);
  const { logs } = useRecentDailyLogs(60);
  const { profile } = useProfile();
  const { settings } = useSettings();
  const [open, setOpen] = useState<Metric | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  if (loading) return null;

  const chrono = [...measurements].reverse(); // oldest → newest
  const metrics: Metric[] = [];

  // Weight (from daily logs, in the user's unit) — direction depends on goal.
  const weightPoints: Point[] = logs
    .filter((l): l is typeof l & { weight: number } => l.weight != null)
    .map(l => ({ date: l.log_date, value: Math.round(kgToUnit(l.weight, settings.weightUnit) * 10) / 10 }));
  if (weightPoints.length > 0) {
    const deficit = profile?.calorie_deficit_kcal ?? 0;
    metrics.push({
      key: 'weight',
      label: 'Weight',
      unit: settings.weightUnit,
      goodDown: deficit > 0 ? true : deficit < 0 ? false : null,
      color: '#6c63ff',
      history: weightPoints,
    });
  }

  // Body sites (inches).
  for (const s of SITES) {
    const history = chrono
      .filter(m => m[s.key] != null)
      .map(m => ({ date: m.entry_timestamp, value: m[s.key] as number }));
    if (history.length > 0) {
      metrics.push({
        key: s.key,
        label: s.label,
        unit: '"',
        goodDown: s.goodDown,
        color: s.goodDown ? '#0ea5e9' : '#8b5cf6',
        history,
      });
    }
  }

  const heightText =
    profile?.height != null
      ? settings.heightUnit === 'ft'
        ? (() => {
            const { ft, inches } = cmToFtIn(profile.height);
            return `${ft}'${inches}"`;
          })()
        : `${Math.round(profile.height)} cm`
      : null;

  if (metrics.length === 0 && !heightText) return null;

  // Snapshot dates come from the body-measurement recordings, newest first.
  const snapshotDates = chrono.map(m => m.entry_timestamp).reverse();
  const activeDate = selected ?? snapshotDates[0] ?? new Date().toISOString();

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Ruler size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Body measurements</p>
            <p className="text-[11px] text-[var(--muted)]">
              {snapshotDates.length > 0 ? `As of ${shortDate(activeDate)}` : 'No recordings yet'}
            </p>
          </div>
        </div>
        {snapshotDates.length > 1 ? (
          <select
            value={activeDate}
            onChange={e => setSelected(e.target.value)}
            className="max-w-[7.5rem] shrink-0 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text)] outline-none"
            aria-label="Select recording date"
          >
            {snapshotDates.map((d, i) => (
              <option key={d} value={d}>
                {shortDate(d)}
                {i === 0 ? ' (latest)' : ''}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex flex-col divide-y divide-[var(--card-border)]">
        {heightText ? (
          <div className="flex items-center justify-between py-2.5 first:pt-0">
            <p className="text-xs font-semibold text-[var(--text)]">Height</p>
            <p className="text-sm font-black text-[var(--text)]">{heightText}</p>
          </div>
        ) : null}

        {metrics.map(m => {
          const { current, prev, upto } = asOf(m.history, activeDate);
          if (!current) {
            return (
              <div key={m.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <p className="text-xs font-semibold text-[var(--text)]">{m.label}</p>
                <p className="text-[10px] text-[var(--muted)]">—</p>
              </div>
            );
          }
          const delta = prev ? Math.round((current.value - prev.value) * 10) / 10 : null;
          const improved = delta == null || m.goodDown == null ? null : m.goodDown ? delta < 0 : delta > 0;
          const deltaColor =
            delta == null || delta === 0 || improved == null ? 'var(--muted)' : improved ? GREEN : RED;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setOpen(m)}
              className="flex items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0"
            >
              <div className="w-20 shrink-0">
                <p className="text-xs font-semibold text-[var(--text)]">{m.label}</p>
                <p className="text-[10px] text-[var(--muted)]">{upto.length} logged</p>
              </div>
              <div className="min-w-0 flex-1">
                {upto.length >= 2 ? (
                  <WeightSparkline values={upto.map(p => p.value)} width={110} height={30} color={m.color} />
                ) : (
                  <p className="text-[10px] text-[var(--muted)]">Log again to see a trend</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-[var(--text)]">
                  {current.value}
                  {m.unit}
                </p>
                {delta != null ? (
                  <p className="text-[10px] font-bold" style={{ color: deltaColor }}>
                    {delta > 0 ? '+' : ''}
                    {delta === 0 ? '±0' : delta}
                    {m.unit} vs last
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--muted)]">
        Green = moving the right way (muscles up; waist/belly/hips down). Tap a row for full history.
      </p>

      <Sheet open={open != null} onClose={() => setOpen(null)} title={open ? `${open.label} history` : 'History'}>
        {open ? (
          <div className="flex flex-col">
            {[...open.history].reverse().map((p, i, arr) => {
              const prev = arr[i + 1];
              const step = prev ? Math.round((p.value - prev.value) * 10) / 10 : null;
              const improved =
                step == null || open.goodDown == null ? null : open.goodDown ? step < 0 : step > 0;
              const stepColor =
                step == null || step === 0 || improved == null ? 'var(--muted)' : improved ? GREEN : RED;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
                >
                  <span className="text-xs text-[var(--muted)]">{shortDate(p.date)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text)]">
                      {p.value}
                      {open.unit}
                    </span>
                    {step != null ? (
                      <span className="w-16 text-right text-[11px] font-semibold" style={{ color: stepColor }}>
                        {step > 0 ? '+' : ''}
                        {step === 0 ? '±0' : step}
                        {open.unit}
                      </span>
                    ) : (
                      <span className="w-16 text-right text-[11px] text-[var(--muted)]">start</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
