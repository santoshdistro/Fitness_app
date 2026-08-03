import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import { useMuscleActivity, type MusclePeriod } from '../hooks/useMuscleActivity';
import { exercisesForMuscle, MUSCLE_LABEL, muscleHeat, type MuscleExercise, type MuscleKey } from '../data/muscles';
import { useWorkoutPlan } from '../hooks/useWorkoutPlan';
import { addDays, startOfWeek, todayDateString } from '../utils/date';
import { MuscleMap } from './MuscleMap';
import { ExerciseDetail } from './ExerciseDetail';
import { Sheet } from './Sheet';

export function BodyMapCard({ large }: { large?: boolean } = {}) {
  const [period, setPeriod] = useState<MusclePeriod>('week');
  const [viewAnchor, setViewAnchor] = useState(todayDateString());
  const { data, loading } = useMuscleActivity(period, viewAnchor);
  const { addExercise } = useWorkoutPlan();
  const [selected, setSelected] = useState<MuscleKey | null>(null);
  const [selectedEx, setSelectedEx] = useState<MuscleExercise | null>(null);
  const [planDate, setPlanDate] = useState(todayDateString());
  const [added, setAdded] = useState(false);

  const today = todayDateString();
  // Already viewing the current day / week? (then forward is disabled)
  const atPresent =
    period === 'today' ? viewAnchor >= today : startOfWeek(viewAnchor) >= startOfWeek(today);

  function stepView(dir: -1 | 1) {
    setViewAnchor(a => addDays(a, dir * (period === 'today' ? 1 : 7)));
  }

  function fmtShort(d: string): string {
    return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  // Label for the window being viewed — a day, or a Mon–Sun range.
  function periodRangeLabel(): string {
    if (period === 'today') return viewAnchor === today ? 'Today' : fmtShort(viewAnchor);
    const ws = startOfWeek(viewAnchor);
    return `${fmtShort(ws)} – ${fmtShort(addDays(ws, 6))}`;
  }

  function closeSheet() {
    setSelected(null);
    setSelectedEx(null);
    setAdded(false);
  }

  function dayLabel(date: string): string {
    if (date === todayDateString()) return 'today';
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  const ranked = (Object.keys(data.volumes) as MuscleKey[]).sort(
    (a, b) => (data.volumes[b] ?? 0) - (data.volumes[a] ?? 0),
  );

  return (
    <div className="flex flex-col gap-4">
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">Muscles worked</p>
        <div className="flex rounded-full bg-[var(--bg)] p-0.5">
          {([
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This week' },
          ] as const).map(o => (
            <button
              key={o.key}
              type="button"
              onClick={() => setPeriod(o.key)}
              className="rounded-full px-3 py-1 text-[10px] font-bold"
              style={
                period === o.key
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { color: 'var(--muted)' }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date navigation — page back through days / weeks */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => stepView(-1)}
          aria-label="Earlier"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]"
        >
          <ChevronLeft size={16} />
        </button>
        <label className="relative flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
          <CalendarDays size={13} className="text-[var(--accent)]" />
          {periodRangeLabel()}
          <input
            type="date"
            value={viewAnchor}
            max={today}
            onChange={e => e.target.value && setViewAnchor(e.target.value)}
            aria-label="Jump to date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => stepView(1)}
          disabled={atPresent}
          aria-label="Later"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] disabled:opacity-30 active:bg-[var(--bg)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <MuscleMap intensity={data.intensity} onSelect={setSelected} large={large} />

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-[9px] text-[var(--muted)]">
        <span>Less</span>
        <span className="flex h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #eef1f6, #fdba74, #b91c1c)' }} />
        <span>More</span>
      </div>

      {/* Ranked list */}
      {loading ? (
        <p className="text-center text-xs text-[var(--muted)]">Loading…</p>
      ) : ranked.length === 0 ? (
        <p className="text-center text-xs text-[var(--muted)]">
          Log a workout and the muscles you trained light up here.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {ranked.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              className="flex items-center gap-2.5 rounded-xl bg-[var(--bg)] px-3 py-2 text-left"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: muscleHeat(data.intensity[m] ?? 0) }} />
              <span className="flex-1 text-xs font-semibold text-[var(--text)]">{MUSCLE_LABEL[m]}</span>
              <span className="text-[11px] tabular-nums text-[var(--muted)]">
                {Math.round(data.volumes[m] ?? 0).toLocaleString()}
              </span>
            </button>
          ))}
          <p className="mt-1 text-[9px] text-[var(--muted)]">
            Numbers are training volume (weight × reps). Tap a muscle for exercises.
          </p>
        </div>
      )}
    </div>

    {/* Workouts done, ranked high -> low by volume */}
    <div className="glass-card flex flex-col gap-1.5 p-5">
      <p className="text-sm font-semibold text-[var(--text)]">
        Workouts done · {periodRangeLabel()}
      </p>
      {loading ? (
        <p className="text-center text-xs text-[var(--muted)]">Loading…</p>
      ) : data.exercises.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          No workouts logged in this window. Log a session and every exercise ranks here — hardest
          first.
        </p>
      ) : (
        <>
          {data.exercises.map(ex => {
            const top = data.exercises[0].volume || 1;
            const frac = ex.volume / top;
            const t = Math.pow(frac, 0.6);
            return (
              <div key={ex.name} className="relative overflow-hidden rounded-xl bg-[var(--bg)]">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.max(8, frac * 100)}%`,
                    background: `color-mix(in srgb, ${muscleHeat(t)} 24%, transparent)`,
                  }}
                />
                <div className="relative flex items-center gap-2.5 px-3 py-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: muscleHeat(t) }} />
                  <span className="flex-1 truncate text-xs font-semibold capitalize text-[var(--text)]">
                    {ex.name}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-[var(--muted)]">
                    ×{ex.sets} · {ex.reps} reps
                  </span>
                </div>
              </div>
            );
          })}
          <p className="mt-1 text-[9px] text-[var(--muted)]">
            Bar length = training volume (weight × reps). Hardest-hit on top. ×sets · total reps.
          </p>
        </>
      )}
    </div>

      <Sheet
        open={selected != null}
        onClose={closeSheet}
        title={selected ? MUSCLE_LABEL[selected] : 'Muscle'}
      >
        {selected && selectedEx ? (
          // Drill-in: how-to for one exercise + add to plan
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedEx(null);
                setAdded(false);
              }}
              className="flex items-center gap-1 self-start text-xs font-semibold text-[var(--accent)]"
            >
              <ChevronLeft size={14} /> Back to {MUSCLE_LABEL[selected].toLowerCase()}
            </button>
            <ExerciseDetail name={selectedEx.name} exerciseId={selectedEx.id} sets={3} reps="8-10" />

            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--muted)]">Add to which day?</p>
              <label className="relative flex items-center justify-between gap-2 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text)]">
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-[var(--accent)]" />
                  {dayLabel(planDate)}
                </span>
                <span className="text-[11px] text-[var(--muted)]">tap to change</span>
                <input
                  type="date"
                  value={planDate}
                  min={todayDateString()}
                  onChange={e => {
                    if (e.target.value) {
                      setPlanDate(e.target.value);
                      setAdded(false);
                    }
                  }}
                  aria-label="Plan date"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                addExercise(planDate, { name: selectedEx.name, sets: 3, reps: '8-10' });
                setAdded(true);
              }}
              disabled={added}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-70"
              style={{ background: added ? '#22c55e' : 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
            >
              {added ? (
                <>
                  <Check size={16} /> Added to {dayLabel(planDate)}'s plan
                </>
              ) : (
                <>
                  <Plus size={16} /> Add to {dayLabel(planDate)}'s plan
                </>
              )}
            </button>
          </div>
        ) : selected ? (
          // Muscle overview: volume + tappable exercise list
          <div className="flex flex-col gap-3">
            <div className="glass-card flex items-center justify-between p-4">
              <span className="text-xs text-[var(--muted)]">
                {period === 'today' ? 'Today' : 'This week'} volume
              </span>
              <span className="text-sm font-bold text-[var(--text)]">
                {Math.round(data.volumes[selected] ?? 0).toLocaleString()}
              </span>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--text)]">
                Exercises for {MUSCLE_LABEL[selected].toLowerCase()}
              </p>
              <div className="flex flex-col gap-1.5">
                {exercisesForMuscle(selected).map(ex => (
                  <button
                    key={ex.id ?? ex.name}
                    type="button"
                    onClick={() => {
                      setSelectedEx(ex);
                      setAdded(false);
                    }}
                    className="flex items-center justify-between rounded-xl bg-[var(--bg)] px-4 py-2.5 text-left text-sm capitalize text-[var(--text)]"
                  >
                    <span>{ex.name}</span>
                    <ChevronRight size={15} className="text-[var(--muted)]" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[var(--muted)]">
                Tap an exercise for the how-to and to add it to your plan.
              </p>
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
