import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Droplet,
  Dumbbell,
  Footprints,
  Leaf,
  Moon,
  Sparkles,
  Sunrise,
  Utensils,
  Zap,
} from 'lucide-react';
import { buildDaySchedule, type ScheduleEntry, type ScheduleKind, type DaySchedule } from '../lib/daySchedule';
import { generateDaySchedule } from '../lib/aiClient';

type Inputs = { wake: string; gym: string; lastMeal: string; sleep: string; hasWorkout: boolean };

const DEFAULTS: Inputs = { wake: '07:00', gym: '18:00', lastMeal: '20:00', sleep: '23:00', hasWorkout: true };

const KIND_STYLE: Record<ScheduleKind, { color: string; Icon: typeof Utensils }> = {
  wake: { color: '#f59e0b', Icon: Sunrise },
  hydrate: { color: '#0ea5e9', Icon: Droplet },
  wellness: { color: '#10b981', Icon: Leaf },
  meal: { color: '#6c63ff', Icon: Utensils },
  pre: { color: '#f97316', Icon: Zap },
  workout: { color: '#ef4444', Icon: Dumbbell },
  post: { color: '#f97316', Icon: Zap },
  walk: { color: '#14b8a6', Icon: Footprints },
  sleep: { color: '#8b5cf6', Icon: Moon },
};

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

export function DayScheduleCard({
  userId,
  goal,
  diet,
}: {
  userId?: string;
  goal?: string;
  diet?: string;
}) {
  const storageKey = userId ? `day_schedule:${userId}` : null;
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Inputs>(() => {
    if (!storageKey) return DEFAULTS;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Inputs>) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });
  const [ai, setAi] = useState<DaySchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(inputs));
  }, [storageKey, inputs]);

  const curated = useMemo(
    () =>
      buildDaySchedule({
        wake: inputs.wake,
        gym: inputs.hasWorkout ? inputs.gym : null,
        lastMeal: inputs.lastMeal,
        sleep: inputs.sleep,
        hasWorkout: inputs.hasWorkout,
      }),
    [inputs],
  );

  const schedule = ai ?? curated;

  function set<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }));
    setAi(null); // inputs changed — fall back to the fresh curated schedule
  }

  async function refineWithAi() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const r = await generateDaySchedule(userId, {
        wake: inputs.wake,
        gym: inputs.hasWorkout ? inputs.gym : null,
        lastMeal: inputs.lastMeal,
        sleep: inputs.sleep,
        hasWorkout: inputs.hasWorkout,
        goal,
        diet,
      });
      setAi(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refine right now.');
    } finally {
      setBusy(false);
    }
  }

  const timeInput =
    'rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] outline-none';

  return (
    <div className="glass-card flex flex-col gap-2 p-4">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center justify-between gap-2 text-left">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Sunrise size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">My day schedule</p>
            <p className="text-[10px] text-[var(--muted)]">
              When to eat, train &amp; hydrate — around your times
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className="text-[var(--muted)] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open ? (
        <>
          {/* Time inputs */}
          <div className="mt-1 grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Wake</span>
              <input type="time" value={inputs.wake} onChange={e => set('wake', e.target.value)} className={timeInput} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Last meal</span>
              <input type="time" value={inputs.lastMeal} onChange={e => set('lastMeal', e.target.value)} className={timeInput} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Sleep</span>
              <input type="time" value={inputs.sleep} onChange={e => set('sleep', e.target.value)} className={timeInput} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Gym</span>
              <input
                type="time"
                value={inputs.gym}
                disabled={!inputs.hasWorkout}
                onChange={e => set('gym', e.target.value)}
                className={`${timeInput} disabled:opacity-40`}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => set('hasWorkout', !inputs.hasWorkout)}
            className="self-start text-[11px] font-semibold"
            style={{ color: inputs.hasWorkout ? 'var(--accent)' : 'var(--muted)' }}
          >
            {inputs.hasWorkout ? '✓ Training day' : '+ Add a workout'}
          </button>

          <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{schedule.summary}</p>

          {/* Timeline */}
          <div className="mt-1 flex flex-col">
            {schedule.entries.map((entry, i) => (
              <TimelineRow key={`${entry.time}-${i}`} entry={entry} last={i === schedule.entries.length - 1} />
            ))}
          </div>

          {error ? <p className="text-[11px] text-red-500">{error}</p> : null}

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={refineWithAi}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
            >
              {busy ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Sparkles size={12} />
              )}
              {busy ? 'Refining…' : 'Refine with AI'}
            </button>
            {ai ? (
              <button type="button" onClick={() => setAi(null)} className="text-[11px] font-semibold text-[var(--muted)]">
                Back to curated
              </button>
            ) : null}
          </div>
          <p className="text-[9px] text-[var(--muted)]">
            General wellness guidance, not medical advice.
          </p>
        </>
      ) : null}
    </div>
  );
}

function TimelineRow({ entry, last }: { entry: ScheduleEntry; last: boolean }) {
  const style = KIND_STYLE[entry.kind] ?? KIND_STYLE.meal;
  const Icon = style.Icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: `color-mix(in srgb, ${style.color} 15%, transparent)` }}
        >
          <Icon size={13} style={{ color: style.color }} />
        </div>
        {!last ? <div className="w-px flex-1 bg-[var(--card-border)]" /> : null}
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold text-[var(--text)]">{entry.title}</p>
          <p className="shrink-0 text-[10px] font-semibold text-[var(--muted)]">{to12h(entry.time)}</p>
        </div>
        <p className="text-[11px] leading-snug text-[var(--muted)]">{entry.detail}</p>
      </div>
    </div>
  );
}
