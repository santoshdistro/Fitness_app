import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useFasting } from '../hooks/useFasting';
import { FASTING_STAGES, stageIndexAt } from '../data/fastingStages';

const PRESETS = [
  { hours: 16, label: '16:8' },
  { hours: 18, label: '18:6' },
  { hours: 20, label: '20:4' },
  { hours: 24, label: 'OMAD / 24h' },
];

function fmt(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function FastingPanel() {
  const { active, history, start, end, cancel } = useFasting();
  const [target, setTarget] = useState(16);
  const [now, setNow] = useState(Date.now());

  // Tick every second while a fast is running.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (active) {
    const elapsedMs = now - new Date(active.startedAt).getTime();
    const targetMs = active.targetHours * 3600000;
    const percent = Math.min(100, (elapsedMs / targetMs) * 100);
    const reached = elapsedMs >= targetMs;
    return (
      <div className="flex flex-col gap-4">
        <div
          className="overflow-hidden p-6 text-center text-white"
          style={{
            borderRadius: 'var(--radius-card)',
            background: reached
              ? 'var(--success-gradient)'
              : 'var(--accent-gradient)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            Fasting · target {active.targetHours}h
          </p>
          <p className="mt-1 text-5xl font-black tabular-nums">{fmt(elapsedMs)}</p>
          <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-white/85">
            {reached
              ? 'Target reached — well done! 🎉'
              : `${fmt(targetMs - elapsedMs)} to your ${active.targetHours}h goal · ${Math.round(percent)}%`}
          </p>
        </div>
        <Journey elapsedHours={elapsedMs / 3600000} />
        <button
          type="button"
          onClick={end}
          className="rounded-2xl py-3.5 text-sm font-bold text-white bg-[image:var(--accent-gradient)]"
        >
          End fast &amp; log it
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-center text-xs font-semibold text-[var(--muted)]"
        >
          Cancel (don't log)
        </button>
        <History history={history} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Timer size={26} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--text)]">Start a fast</p>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map(p => (
            <button
              key={p.hours}
              type="button"
              onClick={() => setTarget(p.hours)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={
                target === p.hours
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => start(target)}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white bg-[image:var(--accent-gradient)]"
        >
          Start {target}h fast
        </button>
      </div>
      <History history={history} />
    </div>
  );
}

// The stages a fast passes through, with the current one marked and the next
// one previewed — it turns a bare countdown into something worth watching.
function Journey({ elapsedHours }: { elapsedHours: number }) {
  const current = stageIndexAt(elapsedHours);
  const stage = FASTING_STAGES[current];
  const next = FASTING_STAGES[current + 1];

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">The journey</p>

      <div className="flex gap-1">
        {FASTING_STAGES.map((s, i) => {
          const done = i <= current;
          return (
            <div key={s.fromHour} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="h-1 w-full rounded-full"
                style={{ background: done ? 'var(--accent)' : 'var(--card-border)' }}
              />
              <span
                className="text-center text-[10px] font-bold leading-tight"
                style={{ color: i === current ? 'var(--accent)' : 'var(--muted)' }}
              >
                {s.label}
              </span>
              <span className="text-[10px] text-[var(--muted)]">{s.fromHour}h</span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--card-border)] pt-3">
        <p className="text-xs leading-relaxed text-[var(--text)]">{stage.detail}</p>
        {next ? (
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
            <span className="font-bold uppercase tracking-wide">Next</span> · {next.label} at {next.fromHour}h.{' '}
            {next.detail}
          </p>
        ) : null}
      </div>

      <p className="text-[10px] leading-relaxed text-[var(--muted)]">
        Rough guides only — real timings vary with your last meal, activity and sleep.
      </p>
    </div>
  );
}

function History({ history }: { history: { start: string; hours: number }[] }) {
  if (history.length === 0) return null;
  return (
    <div className="glass-card p-5">
      <p className="mb-2 text-sm font-semibold text-[var(--text)]">Recent fasts</p>
      {history.slice(0, 10).map((h, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--card-border)] py-2 text-xs last:border-b-0">
          <span className="text-[var(--muted)]">
            {new Date(h.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-semibold text-[var(--text)]">{h.hours}h</span>
        </div>
      ))}
    </div>
  );
}
