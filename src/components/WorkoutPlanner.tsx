import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Dumbbell, Play, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import {
  useTrainingSplit,
  WEEKDAYS,
  SPLIT_FOCUSES,
  MUSCLE_FOCUSES,
  focusParts,
  shortFocus,
} from '../hooks/useTrainingSplit';
import { useWorkoutPlan, type RangeEntry } from '../hooks/useWorkoutPlan';
import { generateWorkoutPlan } from '../lib/aiClient';
import { templatesForFocus, classifyFocus, type TemplateExercise } from '../data/splitTemplates';
import { planLabel } from '../data/exerciseKind';
import { EQUIPMENT_OPTIONS } from '../data/workoutPrograms';
import { PHYSIQUE_GOALS, physiqueByValue, type PhysiqueGoal } from '../data/physiqueGoals';
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

export const GYM_LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Extreme'] as const;
type GymLevel = (typeof GYM_LEVELS)[number];

// How many sets to add/remove per exercise for each level (clamped to 2..6).
const LEVEL_SET_DELTA: Record<GymLevel, number> = {
  Beginner: -1,
  Novice: 0,
  Intermediate: 1,
  Advanced: 2,
  Extreme: 3,
};

function scaleByLevel(exercises: TemplateExercise[], level: GymLevel): TemplateExercise[] {
  const delta = LEVEL_SET_DELTA[level] ?? 0;
  return exercises.map(e => ({ ...e, sets: Math.min(6, Math.max(2, e.sets + delta)) }));
}

const PLAN_PREFS_KEY = 'fb-ai-plan-prefs';

// Reuse the AI-plan form's remembered gym level as the default here.
function defaultGymLevel(): GymLevel {
  try {
    const p = JSON.parse(localStorage.getItem(PLAN_PREFS_KEY) ?? '{}') as { experience?: string };
    return (GYM_LEVELS as readonly string[]).includes(p.experience ?? '')
      ? (p.experience as GymLevel)
      : 'Novice';
  } catch {
    return 'Novice';
  }
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
  const [autofillOpen, setAutofillOpen] = useState(false);
  const [autofillLevel, setAutofillLevel] = useState<GymLevel>(defaultGymLevel());
  const [autofillPhysique, setAutofillPhysique] = useState<PhysiqueGoal>('balanced');
  // Which weekday's focus is being edited (multi-select picker), and the
  // in-progress selection for it.
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [pending, setPending] = useState<string[]>([]);

  function openDayPicker(index: number) {
    setPending(focusParts(split[index]));
    setEditingDay(index);
  }
  function toggleFocus(f: string) {
    setPending(prev => (prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]));
  }
  function saveDayPicker() {
    if (editingDay === null) return;
    setDay(editingDay, pending.length ? pending.join(' + ') : 'Rest');
    setEditingDay(null);
  }

  const focus = split[weekdayIndex(viewDate)];
  const exercises = exercisesFor(viewDate);

  const nonRestDays = useMemo(() => split.filter(f => f !== 'Rest').length, [split]);

  function jumpTo(date: string) {
    setViewDate(date);
    setStripStart(date);
  }

  // Deterministic prefill: fill 14 days from the strip start using each day's
  // split focus → template exercises, with volume scaled to the chosen level.
  function autofillFromSplit(level: GymLevel, physique: PhysiqueGoal) {
    const reps = physiqueByValue(physique)?.reps; // '' keeps template reps
    const entries: RangeEntry[] = [];
    for (let i = 0; i < STRIP_DAYS; i++) {
      const date = addDays(stripStart, i);
      const dayFocus = split[weekdayIndex(date)];
      const scaled = scaleByLevel(templatesForFocus(dayFocus), level);
      entries.push({ date, exercises: reps ? scaled.map(e => ({ ...e, reps })) : scaled });
    }
    applyRange(entries);
    setViewDate(stripStart);
    setAutofillOpen(false);
  }

  // Copy the 7 days immediately before the strip start into this fortnight's
  // first week — replicate last week's training forward. Empty source days are
  // skipped so they don't wipe anything already planned.
  const lastWeekHasPlan = useMemo(() => {
    for (let i = 1; i <= 7; i++) {
      if ((plan.byDate[addDays(stripStart, -i)]?.length ?? 0) > 0) return true;
    }
    return false;
  }, [plan, stripStart]);

  function copyLastWeek() {
    const entries: RangeEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const src = exercisesFor(addDays(stripStart, i - 7));
      if (src.length) {
        entries.push({
          date: addDays(stripStart, i),
          exercises: src.map(({ name, sets, reps }) => ({ name, sets, reps })),
        });
      }
    }
    if (entries.length) {
      applyRange(entries);
      setViewDate(stripStart);
    }
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
        <p className="mb-1 text-sm font-semibold text-[var(--text)]">Weekly split</p>
        <p className="mb-2 text-[10px] text-[var(--muted)]">
          Tap a day to pick a split or specific muscles — combine several (e.g. Chest + Triceps).
        </p>
        <div className="flex flex-col gap-1.5">
          {WEEKDAYS.map((d, i) => {
            const rest = split[i] === 'Rest' || !split[i];
            return (
              <button
                key={d}
                type="button"
                onClick={() => openDayPicker(i)}
                className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2.5 py-2 text-left"
              >
                <span className="w-10 shrink-0 text-xs font-bold text-[var(--muted)]">{d}</span>
                <span
                  className="flex-1 truncate text-xs font-semibold"
                  style={{ color: rest ? 'var(--muted)' : 'var(--text)' }}
                >
                  {split[i] || 'Rest'}
                </span>
                <ChevronRight size={14} className="shrink-0 text-[var(--muted)]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Fill actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAutofillOpen(true)}
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
      {lastWeekHasPlan ? (
        <button
          type="button"
          onClick={copyLastWeek}
          className="glass-card -mt-2 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-[var(--text)]"
        >
          <Copy size={14} className="text-[var(--accent)]" /> Copy last week here
        </button>
      ) : null}
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
              <span className="text-[8px] font-semibold opacity-90">{shortFocus(dayFocus)}</span>
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
            {focus !== 'Rest' && templatesForFocus(focus).length ? (
              <button
                type="button"
                onClick={() =>
                  applyRange([{ date: viewDate, exercises: templatesForFocus(focus) }])
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
                    <p className="text-[10px] text-[var(--muted)]">{planLabel(ex.name, ex.sets, ex.reps)}</p>
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

      <Sheet
        open={editingDay !== null}
        onClose={() => setEditingDay(null)}
        title={editingDay !== null ? `Train on ${WEEKDAYS[editingDay]}` : 'Pick focus'}
      >
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setPending([])}
            className="rounded-xl px-3 py-2 text-xs font-bold"
            style={
              pending.length === 0
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--bg)', color: 'var(--muted)' }
            }
          >
            Rest day
          </button>

          <div>
            <p className={labelClass}>Splits</p>
            <div className="flex flex-wrap gap-1.5">
              {SPLIT_FOCUSES.map(f => (
                <FocusChip key={f} label={f} on={pending.includes(f)} onClick={() => toggleFocus(f)} />
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Muscles — tap several to combine</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_FOCUSES.map(f => (
                <FocusChip key={f} label={f} on={pending.includes(f)} onClick={() => toggleFocus(f)} />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[var(--muted)]">
            {pending.length ? `This day: ${pending.join(' + ')}` : 'This day: Rest'}
          </p>
          <button type="button" onClick={saveDayPicker} className={submitButtonClass}>
            Save day
          </button>
        </div>
      </Sheet>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Add exercise · ${longDate(viewDate)}`}>
        <AddExerciseForm
          onAdd={ex => {
            addExercise(viewDate, ex);
            setAddOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={autofillOpen} onClose={() => setAutofillOpen(false)} title="Auto-fill from split">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--muted)]">
            Fills 14 days from {fmt(stripStart, { weekday: 'long', day: 'numeric', month: 'short' })} using
            each day's split focus. Pick your gym level — higher levels add more sets per exercise.
          </p>
          <div>
            <label className={labelClass}>Gym level</label>
            <div className="flex flex-wrap gap-1.5">
              {GYM_LEVELS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setAutofillLevel(l)}
                  className="rounded-xl px-3 py-2 text-xs font-bold"
                  style={
                    autofillLevel === l
                      ? { background: 'var(--accent)', color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--muted)' }
                  }
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">
              {LEVEL_SET_DELTA[autofillLevel] === 0
                ? 'Uses the template set counts as-is.'
                : `${LEVEL_SET_DELTA[autofillLevel] > 0 ? '+' : ''}${LEVEL_SET_DELTA[autofillLevel]} set per exercise vs. the base template.`}
            </p>
          </div>
          <div>
            <label className={labelClass}>Target physique</label>
            <div className="flex flex-wrap gap-1.5">
              {PHYSIQUE_GOALS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setAutofillPhysique(p.value)}
                  className="rounded-xl px-3 py-2 text-xs font-bold"
                  style={
                    autofillPhysique === p.value
                      ? { background: 'var(--accent)', color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--muted)' }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">
              {physiqueByValue(autofillPhysique)?.reps
                ? `Sets reps to ${physiqueByValue(autofillPhysique)?.reps} for that look.`
                : 'Keeps each template’s own rep ranges.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => autofillFromSplit(autofillLevel, autofillPhysique)}
            className={submitButtonClass}
          >
            <Wand2 size={15} className="mr-2" /> Fill 14 days
          </button>
        </div>
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

function FocusChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-bold"
      style={on ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--muted)' }}
    >
      {label}
    </button>
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
  const [experience, setExperience] = useState<GymLevel>(defaultGymLevel());
  const [physique, setPhysique] = useState<PhysiqueGoal>('balanced');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setGenerating(true);
    setError(null);
    try {
      const splitText = WEEKDAYS.map((d, i) => `${d}: ${split[i]}`).join(', ');
      const physPrompt = physiqueByValue(physique)?.aiPrompt;
      const result = await generateWorkoutPlan(userId, {
        equipment: equipment || undefined,
        goal,
        experience,
        daysPerWeek,
        notes: `Align to my weekly split — ${splitText}. Give exercises for each training focus.${
          physPrompt && physique !== 'balanced' ? ` Target physique: ${physPrompt}.` : ''
        }`,
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
          exercises: fromAi ?? templatesForFocus(dayFocus),
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
        <label className={labelClass} htmlFor="wb-physique">Target physique</label>
        <select
          id="wb-physique"
          className={inputClass}
          value={physique}
          onChange={e => setPhysique(e.target.value as PhysiqueGoal)}
        >
          {PHYSIQUE_GOALS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label} — {p.blurb}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="wb-exp">Gym level</label>
        <select
          id="wb-exp"
          className={inputClass}
          value={experience}
          onChange={e => setExperience(e.target.value as GymLevel)}
        >
          {GYM_LEVELS.map(l => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
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
