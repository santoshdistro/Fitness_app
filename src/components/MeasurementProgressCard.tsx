import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { useProfile } from '../hooks/useProfile';
import { useSettings } from '../hooks/useSettings';
import { cmToFtIn } from '../utils/units';

type SiteKey = 'neck' | 'chest' | 'belly' | 'waist' | 'hips' | 'thighs' | 'calves' | 'biceps' | 'forearms';

// goodDown = a smaller number is the improvement (fat sites); otherwise bigger
// (muscle sites) is the win — drives the delta colour.
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

const GROUPS: { key: 'all' | 'upper' | 'lower'; label: string; sites: SiteKey[] }[] = [
  { key: 'all', label: 'All', sites: ['neck', 'chest', 'biceps', 'forearms', 'waist', 'hips', 'belly', 'thighs', 'calves'] },
  { key: 'upper', label: 'Upper', sites: ['neck', 'chest', 'biceps', 'forearms'] },
  { key: 'lower', label: 'Lower', sites: ['waist', 'hips', 'belly', 'thighs', 'calves'] },
];

const GREEN = '#22c55e';
const RED = '#ef4444';

function shortDate(d: string): string {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function MeasurementProgressCard() {
  const { measurements, loading } = useRecentMeasurements(30);
  const { profile } = useProfile();
  const { settings } = useSettings();
  const [group, setGroup] = useState<'all' | 'upper' | 'lower'>('all');

  if (loading) return null;

  // Newest first (the hook returns newest → oldest).
  const cols = measurements;

  const heightText =
    profile?.height != null
      ? settings.heightUnit === 'ft'
        ? (() => {
            const { ft, inches } = cmToFtIn(profile.height);
            return `${ft}'${inches}"`;
          })()
        : `${Math.round(profile.height)} cm`
      : null;

  if (cols.length === 0 && !heightText) return null;

  const activeSites = GROUPS.find(g => g.key === group)!.sites.filter(s =>
    cols.some(m => m[s] != null),
  );

  const stickyCol: React.CSSProperties = {
    position: 'sticky',
    left: 0,
    background: 'var(--card)',
    zIndex: 1,
    borderRight: '1px solid var(--card-border)',
  };

  return (
    <div className="glass-card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Ruler size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text)]">Body measurements</p>
            <p className="text-[10px] text-[var(--muted)]">
              {heightText ? `Height ${heightText} · ` : ''}
              {cols.length > 0 ? `${cols.length} recordings` : 'No recordings yet'}
            </p>
          </div>
        </div>
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {GROUPS.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={group === g.key ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--muted)' }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {cols.length === 0 || activeSites.length === 0 ? (
        <p className="py-2 text-xs text-[var(--muted)]">Log body measurements to see them here.</p>
      ) : (
        <div className="hide-scrollbar -mx-1 overflow-x-auto px-1" style={{ scrollSnapType: 'x proximity' }}>
          <table className="border-collapse" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th
                  style={stickyCol}
                  className="py-1 pr-2 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]"
                >
                  Site
                </th>
                {cols.map((m, i) => (
                  <th
                    key={m.id}
                    className="px-1.5 py-1 text-right text-[10px] font-bold text-[var(--muted)]"
                    style={{ minWidth: 50, scrollSnapAlign: 'end' }}
                  >
                    {shortDate(m.entry_timestamp)}
                    {i === 0 ? <span className="block text-[8px] font-semibold text-[var(--accent)]">latest</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSites.map(site => {
                const meta = SITES[site];
                return (
                  <tr key={site} className="border-t border-[var(--card-border)]">
                    <td style={stickyCol} className="py-1.5 pr-2 text-xs font-semibold text-[var(--text)]">
                      {meta.label}
                    </td>
                    {cols.map((m, i) => {
                      const v = m[site];
                      // Compare against the next-older recording that has a value.
                      let older: number | null = null;
                      for (let j = i + 1; j < cols.length; j++) {
                        if (cols[j][site] != null) {
                          older = cols[j][site] as number;
                          break;
                        }
                      }
                      const delta = v != null && older != null ? Math.round((v - older) * 10) / 10 : null;
                      const improved =
                        delta == null || delta === 0 ? null : meta.goodDown ? delta < 0 : delta > 0;
                      const color = improved == null ? 'var(--text)' : improved ? GREEN : RED;
                      return (
                        <td key={m.id} className="px-1.5 py-1.5 text-right" style={{ minWidth: 50 }}>
                          {v != null ? (
                            <span className="text-xs font-bold" style={{ color }}>
                              {v}
                              {delta != null && delta !== 0 ? (
                                <span className="ml-0.5 text-[9px]">{delta > 0 ? '▲' : '▼'}</span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--muted)]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-[var(--muted)]">
        Values in inches · green = moving the right way (muscles up; waist/belly/hips down). Swipe ←
        for older dates.
      </p>
    </div>
  );
}
