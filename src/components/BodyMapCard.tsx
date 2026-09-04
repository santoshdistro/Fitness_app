import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import { useMuscleActivity, type MusclePeriod } from '../hooks/useMuscleActivity';
import { primaryMuscle, MUSCLE_LABEL, muscleHeat, type MuscleKey } from '../data/muscles';
import { exercisesForMuscle, type MuscleExercise } from '../data/muscleExercises';
import { useWorkoutPlan } from '../hooks/useWorkoutPlan';
import { addDays, startOfWeek, todayDateString } from '../utils/date';
import { MuscleMap } from './MuscleMap';
import { ExerciseDetail } from './ExerciseDetail';
import { Sheet } from './Sheet';
import { SkeletonLines } from './Skeleton';

export function BodyMapCard({ large }: { large?: boolean } = {}) {
  const [period, setPeriod] = useState<MusclePeriod>('week');
  const [viewAnchor, setViewAnchor] = useState(todayDateString());
  const { data, loading } = useMuscleActivity(period, viewAnchor);
  const { addExercise } = useWorkoutPlan();
  const [selected, setSelected] = useState<MuscleKey | null>(null);
  const [selectedEx, setSelectedEx] = useState<MuscleExercise | null>(null);
  const [planDate, setPlanDate] = useState(todayDateString());
  const [added, setAdded] = useState(false);
  const [openMuscle, setOpenMuscle] = useState<string | null>(null);

  // Group "workouts done" by muscle, using the SAME volumes as the muscles-worked
  // list above so the two stay in sync — each muscle's total is its training
  // volume, and expanding shows every exercise that trained it.
  const doneGroups = useMemo(() => {
    const ranked = (Object.keys(data.volumes) as MuscleKey[]).sort(
      (a, b) => (data.volumes[b] ?? 0) - (data.volumes[a] ?? 0),
    );
    return ranked
      .map(m => ({
        key: m as string,
        label: MUSCLE_LABEL[m],
        volume: data.volumes[m] ?? 0,
        exercises: data.exercises.filter(ex => primaryMuscle(ex.name) === m),
      }))
      .filter(g => g.exercises.length > 0);
  }, [data]);

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
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
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
      <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--muted)]">
        <span>Less</span>
        <span className="flex h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #eef1f6, #fdba74, #b91c1c)' }} />
        <span>More</span>
      </div>

      {/* Ranked list */}
      {loading ? (
        <SkeletonLines lines={4} label="Loading muscle ranking" />
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
          <p className="mt-1 text-[10px] text-[var(--muted)]">
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
        <SkeletonLines lines={3} label="Loading workouts" />
      ) : data.exercises.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">
          No workouts logged in this window. Log a session and every exercise ranks here — hardest
          first.
        </p>
      ) : (
        <>
          {doneGroups.map(g => {
            const groupTop = doneGroups[0].volume || 1;
            const gFrac = g.volume / groupTop;
            const gT = Math.pow(gFrac, 0.6);
            const open = openMuscle === g.key;
            const exTop = Math.max(1, ...g.exercises.map(e => e.volume));
            return (
              <div key={g.key} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setOpenMuscle(open ? null : g.key)}
                  className="relative overflow-hidden rounded-xl bg-[var(--bg)] text-left"
                >
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{ width: `${Math.max(8, gFrac * 100)}%`, background: `color-mix(in srgb, ${muscleHeat(gT)} 24%, transparent)` }}
                  />
                  <div className="relative flex items-center gap-2.5 px-3 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: muscleHeat(gT) }} />
                    <span className="flex-1 text-xs font-bold text-[var(--text)]">
                      {g.label}
                      <span className="ml-1 font-medium text-[var(--muted)]">· {g.exercises.length}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
                      {Math.round(g.volume).toLocaleString()}
                    </span>
                    <ChevronRight
                      size={13}
                      className="shrink-0 text-[var(--muted)] transition-transform"
                      style={{ transform: open ? 'rotate(90deg)' : 'none' }}
                    />
                  </div>
                </button>
                {open ? (
                  <div className="flex flex-col gap-1 pl-3">
                    {g.exercises
                      .slice()
                      .sort((a, b) => b.volume - a.volume)
                      .map(ex => {
                        const frac = ex.volume / exTop;
                        const t = Math.pow(frac, 0.6);
                        return (
                          <div key={ex.name} className="relative overflow-hidden rounded-lg bg-[var(--bg)]">
                            <div
                              className="absolute inset-y-0 left-0"
                              style={{ width: `${Math.max(8, frac * 100)}%`, background: `color-mix(in srgb, ${muscleHeat(t)} 20%, transparent)` }}
                            />
                            <div className="relative flex items-center gap-2 px-3 py-1.5">
                              <span className="flex-1 truncate text-[11px] capitalize text-[var(--text)]">{ex.name}</span>
                              <span className="shrink-0 text-[10px] tabular-nums text-[var(--muted)]">
                                ×{ex.sets} · {ex.reps} reps
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : null}
              </div>
            );
          })}
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            Grouped by muscle · bar = training volume (weight × reps). Tap a muscle to see its
            exercises. ×sets · total reps.
          </p>
        </>
      )}
    </div>

    {/* Cardio — time/distance work that isn't muscle-mapped */}
    {data.cardio.length > 0 ? (
      <div className="glass-card flex flex-col gap-1.5 p-5">
        <p className="text-sm font-semibold text-[var(--text)]">Cardio · {periodRangeLabel()}</p>
        {data.cardio.map(c => (
          <div key={c.name} className="flex items-center gap-2.5 rounded-xl bg-[var(--bg)] px-3 py-2">
            <span className="flex-1 text-xs font-semibold capitalize text-[var(--text)]">{c.name}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
              {c.durationMin > 0 ? `${Math.round(c.durationMin)} min` : `${c.sets}×`}
              {c.distanceKm > 0 ? ` · ${Math.round(c.distanceKm * 10) / 10} km` : ''}
            </span>
          </div>
        ))}
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          Cardio is tracked by time &amp; distance, so it's shown here rather than on the muscle map.
        </p>
      </div>
    ) : null}

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
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold disabled:opacity-70"
              style={{
                background: added ? '#22c55e' : 'var(--accent-gradient)',
                color: added ? '#ffffff' : 'var(--on-accent)',
              }}
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
