import { useState } from 'react';
import { Dumbbell, Sparkles, Trash2 } from 'lucide-react';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useProfile } from '../hooks/useProfile';
import { useAiWorkoutPlan } from '../hooks/useAiWorkoutPlan';
import {
  EQUIPMENT_OPTIONS,
  exerciseImageUrl,
  getProgram,
  type EquipmentPreference,
  type ProgramExercise,
} from '../data/workoutPrograms';

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
  const { workouts, deleteWorkout } = useRecentWorkouts(20);
  const { profile } = useProfile();
  const { plan: aiPlan, clearPlan } = useAiWorkoutPlan();
  const recommended = getProgram(profile?.equipment_preference);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentPreference | null>(
    recommended?.equipment ?? null,
  );
  const activeProgram = getProgram(selectedEquipment) ?? recommended;

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Workouts</h1>
        <button
          type="button"
          onClick={onLogWorkout}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          + Log workout
        </button>
      </div>

      {/* AI plan */}
      {aiPlan ? (
        <div
          className="anim-fade-rise mt-4 overflow-hidden p-5"
          style={{
            borderRadius: 'var(--radius-card)',
            background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
            boxShadow: '0 12px 28px -10px rgba(108,99,255,0.6)',
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

          <div className="mt-3 flex flex-col gap-2">
            {aiPlan.days.map(day => (
              <div key={day.day} className="rounded-2xl bg-white/12 p-3">
                <p className="text-xs font-bold text-white">
                  {day.day} <span className="font-medium text-white/75">· {day.focus}</span>
                </p>
                <div className="mt-1.5 flex flex-col gap-1">
                  {day.exercises.map(ex => (
                    <div key={ex.name} className="flex items-center justify-between">
                      <p className="text-xs text-white/95">{ex.name}</p>
                      <p className="text-[10px] text-white/70">
                        {ex.sets} × {ex.reps}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={clearPlan}
            className="mt-3 w-full rounded-2xl border border-white/25 py-2 text-[11px] font-semibold text-white/90"
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
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              {option.label}
            </button>
          ))}
        </div>

        {activeProgram ? (
          <div className="mt-1 flex flex-col gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">{activeProgram.name}</p>
              <p className="text-[10px] text-[var(--muted)]">{activeProgram.description}</p>
            </div>
            {activeProgram.days.map(day => (
              <div key={day.day} className="rounded-2xl bg-[var(--bg)] p-3">
                <p className="text-xs font-bold text-[var(--text)]">
                  {day.day} <span className="font-medium text-[var(--muted)]">· {day.focus}</span>
                </p>
                <div className="mt-1.5 flex flex-col gap-2">
                  {day.exercises.map(ex => (
                    <div key={ex.name} className="flex items-center gap-2.5">
                      <ExerciseThumbnail exercise={ex} />
                      <div className="flex flex-1 items-center justify-between">
                        <p className="text-xs text-[var(--text)]">{ex.name}</p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {ex.sets} × {ex.reps}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">Pick an equipment type above to see a program.</p>
        )}
      </div>

      {workouts.length === 0 ? (
        <div className="glass-card anim-fade-rise mt-6 p-6 text-center" style={{ animationDelay: '0.1s' }}>
          <p className="text-sm font-semibold text-[var(--text)]">No workouts logged yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Tap "Log workout" to record your first session.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {workouts.map((workout, index) => (
            <div
              key={workout.id}
              className="glass-card anim-fade-rise p-5"
              style={{ animationDelay: `${0.06 * Math.min(index, 6)}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {workout.routine_name || 'Workout'}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {formatWorkoutDate(workout.session_timestamp)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteWorkout(workout.id)}
                  aria-label="Delete workout"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                {workout.exercise_data.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center justify-between">
                    <p className="text-xs text-[var(--text)]">{set.exercise}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {set.reps} reps · {set.weight}kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-xl object-cover"
    />
  );
}
