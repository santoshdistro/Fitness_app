import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { useFasting } from '../hooks/useFasting';

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
              ? 'linear-gradient(135deg, #22c55e, #15803d)'
              : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
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
            {reached ? 'Target reached — well done! 🎉' : `${Math.round(percent)}% there`}
          </p>
        </div>
        <button
          type="button"
          onClick={end}
          className="rounded-2xl py-3.5 text-sm font-bold text-white bg-[linear-gradient(135deg,var(--accent),var(--accent-dark))]"
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
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white bg-[linear-gradient(135deg,var(--accent),var(--accent-dark))]"
        >
          Start {target}h fast
        </button>
      </div>
      <History history={history} />
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
