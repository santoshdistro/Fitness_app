import { Zap } from 'lucide-react';
import { useTodayLog } from '../hooks/useTodayLog';
import { todayDateString } from '../utils/date';
import { ELECTROLYTES } from '../data/electrolytes';

export function ElectrolytesCard({ onLog }: { onLog: () => void }) {
  const { log } = useTodayLog(todayDateString());

  const rows = ELECTROLYTES.map(e => {
    const value = (log?.[e.column] as number | null) ?? 0;
    const pct = Math.min(100, Math.round((value / e.target) * 100));
    return { ...e, value, pct };
  });
  const logged = rows.some(r => r.value > 0);
  const low = rows.filter(r => r.value > 0 && r.pct < 60);

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Zap size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Electrolytes</p>
            <p className="text-[10px] text-[var(--muted)]">Cramps · hydration · bloating</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLog}
          className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          {logged ? 'Update' : '+ Log'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rows.map(r => (
          <div key={r.key} className="rounded-2xl bg-[var(--bg)] p-2.5">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-[var(--text)]">
                {r.label} <span className="text-[var(--muted)]">{r.short}</span>
              </span>
              <span className="text-[10px] tabular-nums text-[var(--muted)]">
                {Math.round(r.value)}/{r.target}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card)]">
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>

      {!logged ? (
        <p className="text-[10px] text-[var(--muted)]">
          Tap Log to add salt, coconut water, banana and more — one tap each.
        </p>
      ) : low.length ? (
        <p className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>
          Low on {low.map(l => l.label).join(' & ')} — top up to ease cramps & fatigue.
        </p>
      ) : (
        <p className="text-[10px] text-[var(--muted)]">Nicely balanced so far today.</p>
      )}
    </div>
  );
}
