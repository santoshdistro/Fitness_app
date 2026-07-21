import { Trash2 } from 'lucide-react';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';

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
};

export function WorkoutsScreen({ onLogWorkout }: Props) {
  const { workouts, deleteWorkout } = useRecentWorkouts(20);

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
