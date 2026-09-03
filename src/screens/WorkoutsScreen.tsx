import { useState } from 'react';
import { CalendarPlus, ChevronRight, Dumbbell, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useStrengthRecords } from '../hooks/useStrengthRecords';
import { useProfile } from '../hooks/useProfile';
import { WeightSparkline } from '../components/charts/WeightSparkline';
import { useAiWorkoutPlan } from '../hooks/useAiWorkoutPlan';
import { Sheet } from '../components/Sheet';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { GuidedWorkout, type GuidedExercise } from '../components/GuidedWorkout';
import { WorkoutPlanner } from '../components/WorkoutPlanner';
import { WorkoutProgressChart, type WorkoutGroup } from '../components/WorkoutProgressChart';
import { WorkoutHistoryTable } from '../components/WorkoutHistoryTable';
import { BodyMapCard } from '../components/BodyMapCard';
import { MonthPager } from '../components/MonthPager';
import { useWorkoutPlan } from '../hooks/useWorkoutPlan';
import { addDays, isSameMonth, todayDateString } from '../utils/date';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { weeklyProgress } from '../utils/weeklyProgression';
import {
  buildCuratedPlan,
  CURATED_GOALS,
  CURATED_LEVELS,
  type CuratedGoal,
  type CuratedLevel,
} from '../utils/curatedPlan';
import { PHYSIQUE_GOALS, type PhysiqueGoal } from '../data/physiqueGoals';
import {
  EQUIPMENT_OPTIONS,
  exerciseImageUrl,
  getProgram,
  type EquipmentPreference,
  type ProgramExercise,
} from '../data/workoutPrograms';
import { GOAL_PROGRAMS, type GoalProgram } from '../data/goalPrograms';
import { isCardio, loggedSetLabel, planLabel } from '../data/exerciseKind';
import { loadGuided, clearGuided, type GuidedSaved } from '../lib/guidedSession';
import { GOAL_PROGRAM_IMAGES, HERO_IMAGE } from '../data/gymImagery';
import { PhotoBackdrop } from '../components/PhotoBackdrop';

type SelectedExercise = { name: string; exerciseId?: string; sets: number; reps: string };

type WorkoutsTab = 'workouts' | 'plan' | 'heatmap';

// Persist the active tab across remounts. AppShell keys this screen by a
// refreshKey that bumps whenever a workout is saved, which would otherwise
// reset the tab back to "Workouts". Keeping it at module scope lets the
// remounted component pick up where the user left off (Plan / Heat map).
let persistedWorkoutsTab: WorkoutsTab = 'workouts';

function formatWorkoutDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type Props = {
  onLogWorkout: () => void;
  onGeneratePlan: () => void;
};

export function WorkoutsScreen({ onLogWorkout, onGeneratePlan }: Props) {
  const { workouts, deleteWorkout, refresh: refreshWorkouts } = useRecentWorkouts(300);
  const { records, lastByExercise } = useStrengthRecords();
  const [tab, setTabState] = useState<WorkoutsTab>(persistedWorkoutsTab);
  const setTab = (next: WorkoutsTab) => {
    persistedWorkoutsTab = next;
    setTabState(next);
  };
  const { handlers, change, animClass } = useTabSwipe(
    ['workouts', 'plan', 'heatmap'] as const,
    tab,
    setTab,
  );
  const [guided, setGuided] = useState<{ title: string; exercises: GuidedExercise[] } | null>(null);
  // A guided session left in progress (e.g. after an accidental reload).
  const [resumable, setResumable] = useState<GuidedSaved | null>(() => {
    const s = loadGuided();
    return s && s.logged.length > 0 ? s : null;
  });
  const { profile } = useProfile();
  const { plan: aiPlan, savePlan, clearPlan, restartWeek, currentWeek } = useAiWorkoutPlan();
  const { applyRange: applyPlanToCalendar } = useWorkoutPlan();

  // Lay a generated plan onto the Plan tab's calendar: each week, the plan's
  // training days fill the first N days and the rest stay open (editable there).
  function sendPlanToCalendar() {
    if (!aiPlan) return;
    const start = todayDateString();
    const entries = [];
    for (let i = 0; i < 14; i++) {
      const day = aiPlan.days[i % 7];
      if (day) {
        entries.push({
          date: addDays(start, i),
          exercises: day.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
        });
      }
    }
    applyPlanToCalendar(entries);
    setTab('plan');
  }
  const week = currentWeek ? weeklyProgress(currentWeek) : null;
  const [curatedOpen, setCuratedOpen] = useState(false);
  const recommended = getProgram(profile?.equipment_preference);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPreference | null>(
    recommended?.equipment ?? null,
  );
  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [selectedGoalProgram, setSelectedGoalProgram] = useState<GoalProgram | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  // One plan day being assigned to a calendar date (from the generated plan).
  const [assignDay, setAssignDay] = useState<{ label: string; exercises: { name: string; sets: number; reps: string }[] } | null>(null);
  const [assignDate, setAssignDate] = useState(todayDateString());
  // Shared Upper/Lower/Core group so the strength chart and table stay in sync.
  const [workoutGroup, setWorkoutGroup] = useState<WorkoutGroup>('all');

  // Recent sessions list one calendar month at a time; the month pager steps
  // back through earlier months (all still in the database).
  const [sessionMonth, setSessionMonth] = useState(() => new Date());
  const monthWorkouts = workouts.filter(w => isSameMonth(new Date(w.session_timestamp), sessionMonth));
  const activeProgram = getProgram(selectedEquipment) ?? recommended;

  function openGuided(next: { title: string; exercises: GuidedExercise[] }) {
    setResumable(null);
    setGuided(next);
  }

  if (guided) {
    return (
      <GuidedWorkout
        title={guided.title}
        exercises={guided.exercises}
        lastByExercise={lastByExercise}
        onClose={() => {
          // Leaving without finishing keeps the progress saved for resuming.
          setGuided(null);
          setResumable(loadGuided());
        }}
        onSaved={() => {
          setGuided(null);
          setResumable(null);
          refreshWorkouts();
        }}
      />
    );
  }

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Workouts</h1>
        <button
          type="button"
          onClick={onLogWorkout}
          className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--on-accent)]"
          style={{ background: 'var(--accent-gradient)' }}
        >
          + Log workout
        </button>
      </div>

      {/* Resume an in-progress guided session (survives reload / leaving) */}
      {resumable ? (
        <div className="anim-fade-rise mt-3 flex items-center gap-2 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[var(--text)]">
              Workout in progress · {resumable.title}
            </p>
            <p className="text-[10px] text-[var(--muted)]">
              {resumable.logged.length} set{resumable.logged.length === 1 ? '' : 's'} logged — pick up where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openGuided({ title: resumable.title, exercises: resumable.exercises })}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--on-accent)]"
            style={{ background: 'var(--accent-gradient)' }}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              clearGuided();
              setResumable(null);
            }}
            aria-label="Discard in-progress workout"
            className="shrink-0 rounded-full px-2 py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            Discard
          </button>
        </div>
      ) : null}

      {/* Motivational hero */}
      <div
        className="anim-fade-rise relative mt-4 flex h-32 flex-col justify-end overflow-hidden p-4"
        style={{ borderRadius: 'var(--radius-card)', animationDelay: '0.02s' }}
      >
        <PhotoBackdrop
          src={HERO_IMAGE}
          gradient="linear-gradient(135deg, #4b3fe0, #6c63ff)"
          photoOpacity={0.7}
        />
        <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-white/80">
          Today is a good day
        </p>
        <p className="relative z-10 text-lg font-black leading-tight text-white drop-shadow">
          Show up. Lift. Repeat.
        </p>
      </div>

      {/* Tabs: Workouts / Workout Plan */}
      <div className="anim-fade-rise mt-4 flex rounded-2xl bg-[var(--bg)] p-1" style={{ animationDelay: '0.03s' }}>
        {([
          { key: 'workouts', label: 'Workouts' },
          { key: 'plan', label: 'Plan' },
          { key: 'heatmap', label: 'Heat map' },
        ] as const).map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => change(t.key)}
              className="flex-1 rounded-xl py-2 text-xs font-bold"
              style={
                active
                  ? { background: 'var(--card)', color: 'var(--text)', boxShadow: '0 2px 8px -3px rgba(0,0,0,0.25)' }
                  : { color: 'var(--muted)' }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} {...handlers} className={animClass}>
      {tab === 'plan' ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.04s' }}>
          <WorkoutPlanner
            onStartGuided={(title, exercises) => setGuided({ title, exercises })}
          />
        </div>
      ) : tab === 'heatmap' ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.04s' }}>
          <BodyMapCard large />
        </div>
      ) : (
        <>
      {/* Predefined goal programs */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.04s' }}>
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Choose a program</p>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_PROGRAMS.map(program => (
            <button
              key={program.id}
              type="button"
              onClick={() => setSelectedGoalProgram(program)}
              className="relative flex h-28 flex-col justify-end overflow-hidden p-3 text-left"
              style={{
                borderRadius: 'var(--radius-card)',
                boxShadow: '0 10px 22px -12px rgba(20,20,43,0.5)',
              }}
            >
              <PhotoBackdrop
                src={GOAL_PROGRAM_IMAGES[program.id]}
                gradient={`linear-gradient(150deg, ${program.gradient[0]}, ${program.gradient[1]})`}
              />
              <span className="relative z-10 mt-auto text-sm font-bold leading-tight text-white drop-shadow">
                {program.name}
              </span>
              <span className="relative z-10 text-[10px] font-medium text-white/90 drop-shadow">
                {program.focus}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* AI plan */}
      {aiPlan ? (
        <div
          className="anim-fade-rise mt-4 overflow-hidden p-5"
          style={{
            borderRadius: 'var(--radius-card)',
            background: 'var(--accent-gradient)',
            boxShadow: '0 12px 28px -10px var(--accent-shadow)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles size={13} className="text-white" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Your AI plan</p>
              </div>
              <p className="text-sm font-bold text-white">{aiPlan.name}</p>
              <p className="text-[11px] text-white/80">{aiPlan.description}</p>
            </div>
            <button
              type="button"
              onClick={onGeneratePlan}
              className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-semibold text-white"
            >
              Regenerate
            </button>
          </div>

          {week ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/15 p-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-white">
                  {week.label}
                  {week.deload ? '' : ` · progressive overload`}
                </p>
                <p className="text-[11px] leading-snug text-white/85">{week.note}</p>
              </div>
              <button
                type="button"
                onClick={restartWeek}
                className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-semibold text-white"
              >
                Restart
              </button>
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-2">
            {aiPlan.days.map(day => (
              <button
                key={day.day}
                type="button"
                onClick={() => {
                  setAssignDate(todayDateString());
                  setAssignDay({
                    label: `${day.day} · ${day.focus}`,
                    exercises: day.exercises.map(ex => ({
                      name: ex.name,
                      sets: week ? week.setsFor(ex.sets) : ex.sets,
                      reps: ex.reps,
                    })),
                  });
                }}
                className="rounded-2xl bg-white/12 p-3 text-left active:bg-white/20"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">
                    {day.day} <span className="font-medium text-white/75">· {day.focus}</span>
                  </p>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-white/70">
                    add to a day <CalendarPlus size={11} />
                  </span>
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  {day.exercises.map(ex => {
                    const sets = week ? week.setsFor(ex.sets) : ex.sets;
                    return (
                      <div key={ex.name} className="flex items-center justify-between">
                        <p className="text-xs text-white/95">{ex.name}</p>
                        <p className="text-[10px] text-white/70">
                          {isCardio(ex.name) ? (
                            planLabel(ex.name, sets, ex.reps)
                          ) : (
                            <>
                              {sets} × {ex.reps}
                              {week && sets !== ex.sets ? (
                                <span className="text-white/50"> (was {ex.sets})</span>
                              ) : null}
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>

          {aiPlan.progression && aiPlan.progression.length > 0 ? (
            <div className="mt-3 rounded-2xl bg-white/12 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                Week-by-week progression
              </p>
              <div className="flex flex-col gap-2">
                {aiPlan.progression.map((step, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-white">{step.label}</p>
                      <p className="text-[11px] leading-snug text-white/85">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={sendPlanToCalendar}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-xs font-bold text-[#4b3fe0]"
          >
            <CalendarPlus size={15} /> Add to Plan calendar
          </button>
          <button
            type="button"
            onClick={clearPlan}
            className="mt-2 w-full rounded-2xl border border-white/25 py-2 text-[11px] font-semibold text-white/90"
          >
            Remove plan
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGeneratePlan}
          className="glass-card anim-fade-rise mt-4 flex w-full items-center gap-3 p-4 text-left"
          style={{ animationDelay: '0.06s' }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Generate an AI plan</p>
            <p className="text-[11px] text-[var(--muted)]">
              Personalized to your equipment, goal, and level.
            </p>
          </div>
        </button>
      )}

      {/* Instant, no-AI curated program */}
      <button
        type="button"
        onClick={() => setCuratedOpen(true)}
        className="anim-fade-rise mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--card-border)] py-2.5 text-xs font-semibold text-[var(--accent)]"
        style={{ animationDelay: '0.07s' }}
      >
        <Wand2 size={14} /> {aiPlan ? 'Swap for a quick program (no AI)' : 'Or build one instantly (no AI)'}
      </button>

      {/* Workout programs */}
      <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-3 p-5" style={{ animationDelay: '0.08s' }}>
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">
            {recommended ? 'Your Program' : 'Workout Programs'}
          </p>
          <p className="text-[10px] text-[var(--muted)]">
            {recommended
              ? 'Matched to your equipment preference from your profile.'
              : 'Set an equipment preference in your profile for a personalized pick, or browse below.'}
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {EQUIPMENT_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedEquipment(option.value)}
              className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap"
              style={
                activeProgram?.equipment === option.value
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        {activeProgram ? (
          <div className="mt-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{activeProgram.name}</p>
                <p className="text-[10px] text-[var(--muted)]">{activeProgram.description}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setGuided({
                    title: activeProgram.name,
                    exercises: activeProgram.days.flatMap(d =>
                      d.exercises.map(e => ({
                        name: e.name,
                        sets: e.sets,
                        reps: e.reps,
                        exerciseId: e.exerciseId,
                      })),
                    ),
                  })
                }
                className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-[var(--on-accent)] bg-[image:var(--accent-gradient)]"
              >
                ▶ Start
              </button>
            </div>
            {activeProgram.days.map(day => (
              <div key={day.day} className="rounded-2xl bg-[var(--bg)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--text)]">
                    {day.day} <span className="font-medium text-[var(--muted)]">· {day.focus}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignDate(todayDateString());
                      setAssignDay({
                        label: `${activeProgram.name} · ${day.day}`,
                        exercises: day.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
                      });
                    }}
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold text-[var(--accent)]"
                  >
                    add to a day <CalendarPlus size={11} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-col gap-2">
                  {day.exercises.map(ex => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() =>
                        setSelectedExercise({ name: ex.name, exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps })
                      }
                      className="flex items-center gap-2.5 text-left"
                    >
                      <ExerciseThumbnail exercise={ex} />
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-xs text-[var(--text)]">{ex.name}</p>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-[var(--muted)]">
                            {ex.sets} × {ex.reps}
                          </p>
                          <ChevronRight size={13} className="text-[var(--muted)]" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">Pick an equipment type above to see a program.</p>
        )}
      </div>

      {/* Personal records */}
      {records.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-3 p-5" style={{ animationDelay: '0.09s' }}>
          <p className="text-sm font-semibold text-[var(--text)]">🏆 Personal records</p>
          {records.slice(0, 8).map(r => (
            <div key={r.exercise} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text)]">{r.exercise}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  Best {r.bestWeight}kg · est 1RM {r.best1RM}kg · {r.sessions} session
                  {r.sessions === 1 ? '' : 's'}
                </p>
              </div>
              {r.history.length >= 2 ? (
                <WeightSparkline values={r.history.map(h => h.oneRm)} />
              ) : null}
            </div>
          ))}
          <p className="text-[10px] text-[var(--muted)]">
            Est. 1RM via Epley. The line tracks your strength trend per exercise.
          </p>
        </div>
      ) : null}

      {workouts.length === 0 ? (
        <div className="glass-card anim-fade-rise mt-6 p-6 text-center" style={{ animationDelay: '0.1s' }}>
          <p className="text-sm font-semibold text-[var(--text)]">No workouts logged yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Tap "Log workout" to record your first session.</p>
        </div>
      ) : (
        <>
          {/* Strength progress chart — pick an exercise, week/month/year, date paging */}
          <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.1s' }}>
            <WorkoutProgressChart group={workoutGroup} onGroupChange={setWorkoutGroup} />
          </div>

          {/* Condensed table — grouped by region, kept in sync with the chart */}
          <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.11s' }}>
            <WorkoutHistoryTable group={workoutGroup} />
          </div>

          {/* Recent sessions — this month only, ~4 visible then scroll, tap to expand */}
          <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.12s' }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text)]">Sessions</p>
              <MonthPager anchor={sessionMonth} onChange={setSessionMonth} />
            </div>
            {monthWorkouts.length === 0 ? (
              <p className="py-2 text-xs text-[var(--muted)]">
                No sessions this month. Use ‹ › to browse earlier months.
              </p>
            ) : (
            <div className="hide-scrollbar flex flex-col overflow-y-auto" style={{ maxHeight: 232 }}>
              {monthWorkouts.map(workout => {
                const open = openSessionId === workout.id;
                const exerciseCount = new Set(workout.exercise_data.map(s => s.exercise)).size;
                const volume = workout.exercise_data.reduce(
                  (sum, s) => sum + Math.max(1, s.weight || 0) * Math.max(1, s.reps || 0),
                  0,
                );
                return (
                  <div key={workout.id} className="border-b border-[var(--card-border)] py-2 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenSessionId(open ? null : workout.id)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-[var(--text)]">
                            {workout.routine_name || 'Workout'}
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            {formatWorkoutDate(workout.session_timestamp)} · {exerciseCount} exercise
                            {exerciseCount === 1 ? '' : 's'} · {Math.round(volume).toLocaleString()} kg vol
                          </span>
                        </span>
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-[var(--muted)] transition-transform"
                          style={{ transform: open ? 'rotate(90deg)' : 'none' }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWorkout(workout.id)}
                        aria-label="Delete workout"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-500/70"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {open ? (
                      <div className="mt-2 flex flex-col gap-1 pl-1">
                        {workout.exercise_data.map((set, setIndex) => (
                          <div key={setIndex} className="flex items-center justify-between">
                            <p className="text-xs capitalize text-[var(--text)]">{set.exercise}</p>
                            <p className="text-xs text-[var(--muted)]">{loggedSetLabel(set)}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </>
      )}
        </>
      )}
      </div>

      <Sheet
        open={selectedGoalProgram != null}
        onClose={() => setSelectedGoalProgram(null)}
        title={selectedGoalProgram?.name ?? 'Program'}
      >
        {selectedGoalProgram ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[var(--muted)]">{selectedGoalProgram.focus}</p>
            <button
              type="button"
              onClick={() => {
                setGuided({
                  title: selectedGoalProgram.name,
                  exercises: selectedGoalProgram.days.flatMap(d =>
                    d.exercises.map(e => ({
                      name: e.name,
                      sets: e.sets,
                      reps: e.reps,
                      exerciseId: e.exerciseId,
                    })),
                  ),
                });
                setSelectedGoalProgram(null);
              }}
              className="rounded-2xl py-3 text-sm font-bold text-[var(--on-accent)] bg-[image:var(--accent-gradient)]"
            >
              ▶ Start guided session
            </button>
            {selectedGoalProgram.days.map(day => (
              <div key={day.day} className="rounded-2xl bg-[var(--bg)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--text)]">
                    {day.day} <span className="font-medium text-[var(--muted)]">· {day.focus}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignDate(todayDateString());
                      setAssignDay({
                        label: `${selectedGoalProgram.name} · ${day.day}`,
                        exercises: day.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps })),
                      });
                      setSelectedGoalProgram(null);
                    }}
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold text-[var(--accent)]"
                  >
                    add to a day <CalendarPlus size={11} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  {day.exercises.map(ex => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() =>
                        setSelectedExercise({ name: ex.name, exerciseId: ex.exerciseId, sets: ex.sets, reps: ex.reps })
                      }
                      className="flex items-center justify-between gap-2 py-1 text-left"
                    >
                      <span className="text-xs text-[var(--text)]">{ex.name}</span>
                      <span className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--muted)]">
                          {ex.sets} × {ex.reps}
                        </span>
                        <ChevronRight size={13} className="text-[var(--muted)]" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[var(--muted)]">Tap any exercise for a step-by-step how-to.</p>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={assignDay != null} onClose={() => setAssignDay(null)} title="Add to a day">
        {assignDay ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">{assignDay.label}</p>
              <p className="text-[11px] text-[var(--muted)]">
                {assignDay.exercises.length} exercises · pick the date to add them to your plan.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Date
              </label>
              <input
                type="date"
                value={assignDate}
                onChange={e => e.target.value && setAssignDate(e.target.value)}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-3 text-sm text-[var(--text)]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                applyPlanToCalendar([{ date: assignDate, exercises: assignDay.exercises }]);
                setAssignDay(null);
                setTab('plan');
              }}
              className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-[var(--on-accent)]"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <CalendarPlus size={16} /> Add to {new Date(`${assignDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </button>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={curatedOpen} onClose={() => setCuratedOpen(false)} title="Quick program (no AI)">
        <CuratedPlanForm
          onBuild={(goal, level, days, physique) => {
            savePlan(buildCuratedPlan(goal, level, days, physique));
            setCuratedOpen(false);
          }}
        />
      </Sheet>

      <Sheet
        open={selectedExercise != null}
        onClose={() => setSelectedExercise(null)}
        title="Exercise"
      >
        {selectedExercise ? (
          <ExerciseDetail
            name={selectedExercise.name}
            exerciseId={selectedExercise.exerciseId}
            sets={selectedExercise.sets}
            reps={selectedExercise.reps}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function CuratedPlanForm({
  onBuild,
}: {
  onBuild: (goal: CuratedGoal, level: CuratedLevel, days: number, physique: PhysiqueGoal) => void;
}) {
  const [goal, setGoal] = useState<CuratedGoal>('build');
  const [level, setLevel] = useState<CuratedLevel>('Novice');
  const [days, setDays] = useState(4);
  const [physique, setPhysique] = useState<PhysiqueGoal>('balanced');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--muted)]">
        Instantly assembles a split from built-in templates — no AI credit. It picks up the same
        week-by-week progression once saved.
      </p>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--text)]">Target physique</p>
        <div className="flex flex-wrap gap-1.5">
          {PHYSIQUE_GOALS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPhysique(p.value)}
              className="rounded-xl px-3 py-2 text-xs font-bold"
              style={
                physique === p.value
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--muted)]">
          {PHYSIQUE_GOALS.find(p => p.value === physique)?.blurb}
          {physique !== 'balanced' ? ' — sets the rep style toward that look.' : ''}
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--text)]">Goal</p>
        <div className="flex flex-wrap gap-1.5">
          {CURATED_GOALS.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className="rounded-xl px-3 py-2 text-xs font-bold"
              style={
                goal === g.value
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--text)]">Gym level</p>
        <div className="flex flex-wrap gap-1.5">
          {CURATED_LEVELS.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className="rounded-xl px-3 py-2 text-xs font-bold"
              style={
                level === l
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--text)]">Days / week</p>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className="flex-1 rounded-xl py-2 text-xs font-bold"
              style={
                days === d
                  ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onBuild(goal, level, days, physique)}
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-[var(--on-accent)]"
        style={{ background: 'var(--accent-gradient)' }}
      >
        <Wand2 size={15} /> Build my program
      </button>
    </div>
  );
}

function ExerciseThumbnail({ exercise }: { exercise: ProgramExercise }) {
  const [failed, setFailed] = useState(false);

  if (!exercise.exerciseId || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--card)]">
        <Dumbbell size={14} className="text-[var(--muted)]" />
      </div>
    );
  }

  return (
    <img
      src={exerciseImageUrl(exercise.exerciseId)}
      alt={exercise.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-xl object-cover"
    />
  );
}
