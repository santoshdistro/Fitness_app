import { Ruler } from 'lucide-react';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { useProfile } from '../hooks/useProfile';
import { useSettings } from '../hooks/useSettings';
import { cmToFtIn } from '../utils/units';

type SiteKey = 'neck' | 'chest' | 'belly' | 'waist' | 'hips' | 'thighs' | 'calves' | 'biceps' | 'forearms';

// goodDown = a smaller number is the improvement (fat sites); otherwise bigger
// (muscle sites) is the win — drives the change colour.
const SITES: Record<SiteKey, { label: string; goodDown: boolean }> = {
  neck: { label: 'Neck', goodDown: false },
  chest: { label: 'Chest', goodDown: false },
  biceps: { label: 'Biceps', goodDown: false },
  forearms: { label: 'Forearms', goodDown: false },
  waist: { label: 'Waist', goodDown: true },
  hips: { label: 'Glutes / hips', goodDown: true },
  belly: { label: 'Belly', goodDown: true },
  thighs: { label: 'Thighs', goodDown: false },
  calves: { label: 'Calves', goodDown: false },
};

type Group = 'all' | 'upper' | 'lower';

const SECTIONS: { key: Group; label: string; sites: SiteKey[] }[] = [
  { key: 'upper', label: 'Upper body', sites: ['neck', 'chest', 'biceps', 'forearms'] },
  { key: 'lower', label: 'Lower body', sites: ['waist', 'hips', 'belly', 'thighs', 'calves'] },
];

const GREEN = '#22c55e';
const RED = '#ef4444';

export function MeasurementProgressCard({ group = 'all' }: { group?: Group }) {
  const { measurements, loading } = useRecentMeasurements(60);
  const { profile } = useProfile();
  const { settings } = useSettings();

  if (loading) return null;

  const visibleSections = SECTIONS.filter(s => group === 'all' || s.key === group);

  // Newest → oldest, so the first non-null value per site is the latest and the
  // next one is the previous reading it should be compared against.
  function latestPrev(site: SiteKey): { latest: number | null; prev: number | null } {
    let latest: number | null = null;
    let prev: number | null = null;
    for (const m of measurements) {
      const v = m[site];
      if (v == null) continue;
      if (latest == null) latest = v;
      else {
        prev = v;
        break;
      }
    }
    return { latest, prev };
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

  const hasAny = measurements.some(m => SECTIONS.some(s => s.sites.some(site => m[site] != null)));

  if (!hasAny && !heightText) return null;

  const colClass = 'w-14 text-right tabular-nums';

  return (
    <div className="glass-card flex flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Ruler size={14} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Body measurements</p>
          <p className="text-[10px] text-[var(--muted)]">
            {heightText ? `Height ${heightText} · ` : ''}
            {measurements.length > 0 ? `${measurements.length} recordings` : 'No recordings yet'}
          </p>
        </div>
      </div>

      {!hasAny ? (
        <p className="py-2 text-xs text-[var(--muted)]">Log body measurements to see them here.</p>
      ) : (
        <>
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <span>Measurement</span>
            <span className="flex gap-3">
              <span className={colClass}>Latest</span>
              <span className={colClass}>Prev</span>
              <span className={colClass}>Change</span>
            </span>
          </div>

          {visibleSections.map(section => {
            const rows = section.sites
              .map(site => ({ site, ...latestPrev(site) }))
              .filter(r => r.latest != null);
            if (rows.length === 0) return null;
            return (
              <div key={section.label}>
                <p className="pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                  {section.label}
                </p>
                {rows.map(({ site, latest, prev }) => {
                  const meta = SITES[site];
                  const delta = prev != null ? Math.round((latest! - prev) * 10) / 10 : null;
                  const improved = delta == null || delta === 0 ? null : meta.goodDown ? delta < 0 : delta > 0;
                  const changeColor = improved == null ? 'var(--muted)' : improved ? GREEN : RED;
                  return (
                    <div
                      key={site}
                      className="flex items-center justify-between border-b border-[var(--card-border)] py-2 text-xs last:border-b-0"
                    >
                      <span className="pl-3 text-[var(--text)]">{meta.label}</span>
                      <span className="flex gap-3">
                        <span className={`${colClass} font-semibold text-[var(--text)]`}>{latest}"</span>
                        <span className={`${colClass} text-[var(--muted)]`}>{prev != null ? `${prev}"` : '—'}</span>
                        <span className={colClass} style={{ color: changeColor, fontWeight: 600 }}>
                          {delta == null ? '—' : delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}"`}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <p className="mt-2.5 text-[10px] text-[var(--muted)]">
            Values in inches · green = moving the right way (muscles up; waist/belly/hips down). See
            the chart above for the full trend.
          </p>
        </>
      )}
    </div>
  );
}
