import { useState } from 'react';
import { Flag, Plus, Trash2 } from 'lucide-react';
import { MILESTONE_COLORS, useMilestones } from '../hooks/useMilestones';
import { todayDateString } from '../utils/date';

function fmt(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Manage timeline milestones — they appear as flags on the trend charts so old
// trends read in context ("started cut", "changed program", "injury").
export function MilestonesCard() {
  const { milestones, add, remove } = useMilestones();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayDateString());
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(MILESTONE_COLORS[0]);

  function save() {
    if (!label.trim()) return;
    add(date, label, color);
    setLabel('');
    setDate(todayDateString());
    setColor(MILESTONE_COLORS[0]);
    setOpen(false);
  }

  return (
    <div className="glass-card flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Flag size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Milestones</p>
            <p className="text-[10px] text-[var(--muted)]">Flags on your trend charts</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {open ? (
        <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-[var(--bg)] p-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Started cut"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              max={todayDateString()}
              onChange={e => e.target.value && setDate(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--text)]"
            />
            <div className="flex gap-1.5">
              {MILESTONE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  className="h-6 w-6 rounded-full"
                  style={{ background: c, outline: color === c ? '2px solid var(--text)' : 'none', outlineOffset: 1 }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!label.trim()}
            className="rounded-xl py-2 text-xs font-bold text-[var(--on-accent)] disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            Save milestone
          </button>
        </div>
      ) : null}

      {milestones.length === 0 ? (
        <p className="py-1 text-[11px] text-[var(--muted)]">
          None yet. Add one to mark a change on your charts.
        </p>
      ) : (
        <div className="mt-1 flex flex-col">
          {milestones
            .slice()
            .reverse()
            .map(m => (
              <div
                key={m.id}
                className="flex items-center gap-2 border-b border-[var(--card-border)] py-2 last:border-b-0"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--text)]">{m.label}</span>
                <span className="shrink-0 text-[10px] text-[var(--muted)]">{fmt(m.date)}</span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label="Delete milestone"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-500/70"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
