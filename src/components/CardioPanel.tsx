import { ArrowDownRight, ArrowUpRight, Minus, Timer } from 'lucide-react';
import type { CardioSession, CardioSummary, Series } from '../hooks/useTrends';
import { TrendChart } from './charts/TrendChart';

type Props = {
  sessions: CardioSession[];
  summary: CardioSummary;
  distance: Series;
};

/** 7.5 → "7:30 /km". Pace is minutes-per-km, so the fraction is seconds. */
function fmtPace(pace: number): string {
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  // 7.999 rounds to 60s, which must carry rather than print "7:60".
  const carry = secs === 60;
  return `${mins + (carry ? 1 : 0)}:${String(carry ? 0 : secs).padStart(2, '0')}`;
}

function fmtDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-2xl p-3" style={{ background: 'var(--input-bg)' }}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-lg font-black leading-none tabular-nums text-[var(--text)]">{value}</p>
      {sub ? <p className="mt-1 text-[10px] text-[var(--muted)]">{sub}</p> : null}
    </div>
  );
}

export function CardioPanel({ sessions, summary, distance }: Props) {
  const paced = sessions.filter(s => s.pace != null);
  // Pace is plotted as-is and read upside down — see the axis note below. It is
  // the number that tells you whether the running is working, so it leads.
  const paceSeries: Series = paced.map(s => ({
    label: s.label,
    value: Math.round((s.pace as number) * 100) / 100,
    date: s.date,
  }));

  const delta = summary.paceDelta;
  const improving = delta != null && delta < -0.02;
  const slower = delta != null && delta > 0.02;
  const DeltaIcon = improving ? ArrowDownRight : slower ? ArrowUpRight : Minus;
  const deltaColor = improving ? '#22c55e' : slower ? '#f59e0b' : 'var(--muted)';

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">Running &amp; cardio</p>
        <p className="text-[11px] text-[var(--muted)]">
          {summary.sessions} session{summary.sessions === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex gap-2">
        <Stat
          label="Distance"
          value={`${summary.totalKm} km`}
          sub={summary.longestKm != null ? `longest ${summary.longestKm} km` : undefined}
        />
        <Stat
          label="Time"
          value={fmtDuration(summary.totalMinutes)}
          sub={summary.sessions > 0 ? `${fmtDuration(summary.totalMinutes / summary.sessions)} avg` : undefined}
        />
        <Stat
          label="Best pace"
          value={summary.bestPace != null ? `${fmtPace(summary.bestPace)}` : '—'}
          sub={summary.bestPace != null ? 'min / km' : 'log time + distance'}
        />
      </div>

      {paceSeries.length >= 2 ? (
        <>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text)]">Pace per session</p>
            {delta != null ? (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                style={{ color: deltaColor, background: 'var(--input-bg)' }}
              >
                <DeltaIcon size={11} />
                {improving || slower ? `${fmtPace(Math.abs(delta))} /km` : 'steady'}
              </span>
            ) : null}
          </div>
          <TrendChart points={paceSeries} type="line" unit="" color="#0ea5e9" decimals={2} height={110} />
          {/* Said plainly because a pace chart is the one chart where down is
              good, and a line falling off a cliff otherwise reads as bad news. */}
          <p className="text-[10px] text-[var(--muted)]">
            Minutes per kilometre — <span className="font-semibold text-[var(--text)]">lower is faster</span>. Latest{' '}
            {summary.latestPace != null ? `${fmtPace(summary.latestPace)} /km` : '—'}
            {summary.avgPace != null ? `, average ${fmtPace(summary.avgPace)} /km` : ''}.
          </p>
        </>
      ) : (
        <div
          className="flex items-start gap-2 rounded-2xl p-3 text-[11px] text-[var(--muted)]"
          style={{ background: 'var(--input-bg)' }}
        >
          <Timer size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          <p>
            Log <span className="font-semibold text-[var(--text)]">both distance and time</span> on a couple of runs and
            your pace trend appears here — it is the number that shows the training working, well before the distance
            does.
          </p>
        </div>
      )}

      {distance.length > 1 ? (
        <>
          <p className="mt-1 text-xs font-semibold text-[var(--text)]">Distance per session</p>
          <TrendChart points={distance} type="bar" unit="km" color="#22c55e" decimals={1} height={92} />
        </>
      ) : null}
    </div>
  );
}
