import { Check } from 'lucide-react';

export type GamePlanItem = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  /** 0–1 completion for the subtle progress bar. */
  progress: number;
};

export function TodayGamePlan({ items }: { items: GamePlanItem[] }) {
  const doneCount = items.filter(i => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Today's game plan</p>
          <p className="text-[11px] text-[var(--muted)]">
            {allDone ? 'Every box ticked — champion. 🏆' : 'Tick these off to win the day'}
          </p>
        </div>
        <div
          className="flex h-11 w-11 flex-col items-center justify-center rounded-full text-white"
          style={{
            background: allDone
              ? 'linear-gradient(135deg, #22c55e, #15803d)'
              : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
          }}
        >
          <span className="text-sm font-black leading-none">{doneCount}</span>
          <span className="text-[8px] font-bold leading-none opacity-80">/ {items.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={
                item.done
                  ? { background: '#22c55e', color: '#fff' }
                  : { border: '2px solid var(--card-border)' }
              }
            >
              {item.done ? <Check size={13} strokeWidth={3} /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={`text-xs font-semibold ${
                    item.done ? 'text-[var(--muted)] line-through' : 'text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[10px] font-medium text-[var(--muted)]">{item.detail}</p>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--bg)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, item.progress * 100)}%`,
                    background: item.done ? '#22c55e' : 'var(--accent)',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
