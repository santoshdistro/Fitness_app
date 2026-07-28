import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Play, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useTrainingSplit, SPLIT_OPTIONS, WEEKDAYS } from '../hooks/useTrainingSplit';
import { useWorkoutPlan, type RangeEntry } from '../hooks/useWorkoutPlan';
import { generateWorkoutPlan } from '../lib/aiClient';
import { SPLIT_TEMPLATES, classifyFocus } from '../data/splitTemplates';
import { EQUIPMENT_OPTIONS } from '../data/workoutPrograms';
import { addDays, todayDateString } from '../utils/date';
import { Sheet } from './Sheet';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './forms/formStyles';

const STRIP_DAYS = 14;

function fmt(date: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, opts);
}
function longDate(date: string): string {
  return fmt(date, { weekday: 'long', day: 'numeric', month: 'short' });
}
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00`).getDay() + 6) % 7; // Mon = 0
}

type Props = {
  onStartGuided: (title: string, exercises: { name: string; sets: number; reps: string }[]) => void;
};

export function WorkoutPlanner({ onStartGuided }: Props) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { split, setDay } = useTrainingSplit();
  const { plan, hasPlan, exercisesFor, addExercise, removeExercise, applyRange, clearDate, clearAll } =
    useWorkoutPlan();

  const today = todayDateString();
  const [viewDate, setViewDate] = useState(today);
  const [stripStart, setStripStart] = useState(today);
  const [addOpen, setAddOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  const focus = split[weekdayIndex(viewDate)];
  const exercises = exercisesFor(viewDate);

  const nonRestDays = useMemo(() => split.filter(f => f !== 'Rest').length, [split]);

  function jumpTo(date: string) {
    setViewDate(date);
    setStripStart(date);
  }

  // Deterministic prefill: fill 14 days from the strip start using each day's
  // split focus → template exercises.
  function autofillFromSplit() {
    const entries: RangeEntry[] = [];
    for (let i = 0; i < STRIP_DAYS; i++) {
      const date = addDays(stripStart, i);
      const dayFocus = split[weekdayIndex(date)];
      entries.push({ date, exercises: SPLIT_TEMPLATES[dayFocus] ?? [] });
    }
    applyRange(entries);
    setViewDate(stripStart);
  }

  function startGuidedToday() {
    if (exercises.length === 0) return;
    onStartGuided(
      `${focus} · ${fmt(viewDate, { day: 'numeric', month: 'short' })}`,
      exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Weekly split editor */}
      <div className="glass-card p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Weekly split</p>
        <div className="flex flex-col gap-1.5">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="flex items-center gap-2">
              <span className="w-12 text-xs font-bold text-[var(--muted)]">{d}</span>
              <select
                value={split[i]}
                onChange={e => setDay(i, e.target.value)}
                className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs outline-none"
                style={{ color: split[i] === 'Rest' ? 'var(--muted)' : 'var(--text)' }}
              >
                {SPLIT_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Fill actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={autofillFromSplit}
          className="glass-card flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-[var(--text)]"
        >
          <Wand2 size={15} className="text-[var(--accent)]" /> Auto-fill from split
        </button>
        <button
          type="button"
          onClick={() => setBuilderOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          <Sparkles size={15} /> Build with AI
        </button>
      </div>
      <p className="-mt-2 text-[10px] text-[var(--muted)]">
        Fills 14 days from {fmt(stripStart, { day: 'numeric', month: 'short' })}, matching each day to
        your split. Every day stays editable.
      </p>

      {plan.summary ? (
        <p className="rounded-2xl bg-[var(--bg)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
          {plan.summary}
        </p>
      ) : null}

      {/* Calendar navigator */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => jumpTo(addDays(stripStart, -STRIP_DAYS))}
          aria-label="Previous fortnight"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]"
        >
          <ChevronLeft size={16} />
        </button>
        <label className="relative flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
          <CalendarDays size={14} className="text-[var(--accent)]" />
          <span>{fmt(stripStart, { day: 'numeric', month: 'short' })}</span>
          <span className="text-[var(--muted)]">→ {fmt(addDays(stripStart, STRIP_DAYS - 1), { day: 'numeric', month: 'short' })}</span>
          <input
            type="date"
            value={viewDate}
            onChange={e => e.target.value && jumpTo(e.target.value)}
            aria-label="Jump to date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => jumpTo(addDays(stripStart, STRIP_DAYS))}
          aria-label="Next fortnight"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: STRIP_DAYS }, (_, i) => {
          const date = addDays(stripStart, i);
          const active = date === viewDate;
          const dayFocus = split[weekdayIndex(date)];
          const filled = (plan.byDate[date]?.length ?? 0) > 0;
          const rest = dayFocus === 'Rest';
          return (
            <button
              key={date}
              type="button"
              onClick={() => setViewDate(date)}
              className="flex shrink-0 flex-col items-center rounded-2xl px-3 py-2"
              style={
                active
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--bg)', color: rest ? 'var(--muted)' : 'var(--text)' }
              }
            >
              <span className="text-[9px] font-bold uppercase opacity-80">
                {date === today ? 'Today' : fmt(date, { weekday: 'short' })}
              </span>
              <span className="text-sm font-bold">{fmt(date, { day: 'numeric' })}</span>
              <span className="text-[8px] font-semibold opacity-90">{dayFocus}</span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                style={{ background: filled ? (active ? 'white' : 'var(--accent)') : 'transparent' }}
              />
            </button>
          );
        })}
      </div>

      {/* Selected day */}
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold text-[var(--text)]">{longDate(viewDate)}</p>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
        >
          {focus}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {exercises.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-1 p-6 text-center">
            <Dumbbell size={22} className="text-[var(--muted)]" />
            <p className="text-sm font-semibold text-[var(--text)]">
              {focus === 'Rest' ? 'Rest day' : `Nothing planned for your ${focus} day`}
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {focus === 'Rest'
                ? 'Recover — or add something light below.'
                : 'Auto-fill from your split, build with AI, or add exercises by hand.'}
            </p>
            {focus !== 'Rest' && SPLIT_TEMPLATES[focus]?.length ? (
              <button
                type="button"
                onClick={() =>
                  applyRange([{ date: viewDate, exercises: SPLIT_TEMPLATES[focus] }])
                }
                className="mt-2 rounded-full px-4 py-2 text-[11px] font-bold text-white"
                style={{ background: 'var(--accent)' }}
              >
                Prefill {focus} exercises
              </button>
            ) : null}
          </div>
        ) : (
          <div className="glass-card p-4">
            <div className="flex flex-col gap-2.5">
              {exercises.map(ex => (
                <div key={ex.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text)]">{ex.name}</p>
                    <p className="text-[10px] text-[var(--muted)]">{ex.sets} × {ex.reps}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(viewDate, ex.id)}
                    aria-label="Remove"
                    className="shrink-0 text-[var(--muted)]"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={startGuidedToday}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
            >
              <Play size={15} fill="currentColor" /> Start guided session
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="glass-card flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[var(--accent)]"
        >
          <Plus size={16} /> Add exercise
        </button>
        {exercises.length > 0 ? (
          <button
            type="button"
            onClick={() => clearDate(viewDate)}
            className="text-center text-[11px] font-semibold text-[var(--muted)]"
          >
            Clear this day
          </button>
        ) : null}
      </div>

      {hasPlan ? (
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear every planned day?')) clearAll();
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500"
        >
          <Trash2 size={13} /> Clear entire plan
        </button>
      ) : null}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Add exercise · ${longDate(viewDate)}`}>
        <AddExerciseForm
          onAdd={ex => {
            addExercise(viewDate, ex);
            setAddOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={builderOpen} onClose={() => setBuilderOpen(false)} title="Build 2-week plan">
        <AiBuilderForm
          userId={session?.user?.id}
          split={split}
          defaultEquipment={profile?.equipment_preference ?? undefined}
          defaultGoal={profile?.goal_type ?? undefined}
          daysPerWeek={nonRestDays || 4}
          startDate={stripStart}
          onBuilt={(entries, summary) => {
            applyRange(entries, summary);
            setViewDate(stripStart);
            setBuilderOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function AddExerciseForm({
  onAdd,
}: {
  onAdd: (ex: { name: string; sets: number; reps: string }) => void;
}) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8-10');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), sets: Math.max(1, Math.round(Number(sets) || 1)), reps: reps.trim() || '—' });
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="we-name">Exercise</label>
        <input
          id="we-name"
          className={inputClass}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Incline dumbbell press"
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="we-sets">Sets</label>
          <input
            id="we-sets"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="1"
            value={sets}
            onChange={e => setSets(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="we-reps">Reps</label>
          <input
            id="we-reps"
            className={inputClass}
            type="text"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="e.g. 8-10"
          />
        </div>
      </div>
      <button type="submit" disabled={!name.trim()} className={submitButtonClass}>
        Add to plan
      </button>
    </form>
  );
}

function AiBuilderForm({
  userId,
  split,
  defaultEquipment,
  defaultGoal,
  daysPerWeek,
  startDate,
  onBuilt,
}: {
  userId?: string;
  split: string[];
  defaultEquipment?: string;
  defaultGoal?: string;
  daysPerWeek: number;
  startDate: string;
  onBuilt: (entries: RangeEntry[], summary: string) => void;
}) {
  const [equipment, setEquipment] = useState(defaultEquipment ?? '');
  const [goal, setGoal] = useState(defaultGoal ?? 'build');
  const [experience, setExperience] = useState('intermediate');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setGenerating(true);
    setError(null);
    try {
      const splitText = WEEKDAYS.map((d, i) => `${d}: ${split[i]}`).join(', ');
      const result = await generateWorkoutPlan(userId, {
        equipment: equipment || undefined,
        goal,
        experience,
        daysPerWeek,
        notes: `Align to my weekly split — ${splitText}. Give exercises for each training focus.`,
      });

      // Map generated days onto split focuses, then lay across 14 days.
      const focusMap = new Map<string, { name: string; sets: number; reps: string }[]>();
      for (const day of result.days) {
        const bucket = classifyFocus(day.focus) ?? classifyFocus(day.day);
        if (bucket && !focusMap.has(bucket)) {
          focusMap.set(
            bucket,
            day.exercises.map(x => ({ name: x.name, sets: x.sets, reps: x.reps })),
          );
        }
      }
      const entries: RangeEntry[] = [];
      for (let i = 0; i < 14; i++) {
        const date = addDays(startDate, i);
        const dayFocus = split[(new Date(`${date}T00:00:00`).getDay() + 6) % 7];
        const fromAi = focusMap.get(dayFocus);
        entries.push({
          date,
          exercises: fromAi ?? SPLIT_TEMPLATES[dayFocus] ?? [],
        });
      }
      onBuilt(entries, result.description || result.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a plan.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="mb-3 text-xs text-[var(--muted)]">
        AI drafts exercises for each focus in your split, then lays them across the 2 weeks from{' '}
        {fmt(startDate, { weekday: 'long', day: 'numeric', month: 'short' })}. Everything stays editable.
      </p>
      <div className="mb-3">
        <label className={labelClass} htmlFor="wb-goal">Goal</label>
        <select id="wb-goal" className={inputClass} value={goal} onChange={e => setGoal(e.target.value)}>
          <option value="lose">Lose fat</option>
          <option value="build">Build muscle</option>
          <option value="maintain">Maintain / general</option>
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="wb-exp">Experience</label>
        <select id="wb-exp" className={inputClass} value={experience} onChange={e => setExperience(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div className="mb-4">
        <label className={labelClass} htmlFor="wb-equip">Equipment</label>
        <select id="wb-equip" className={inputClass} value={equipment} onChange={e => setEquipment(e.target.value)}>
          <option value="">Any / not set</option>
          {EQUIPMENT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={generating} className={submitButtonClass}>
        {generating ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building your plan…
          </>
        ) : (
          <>
            <Sparkles size={15} className="mr-2" />
            Build my plan
          </>
        )}
      </button>
    </form>
  );
}
