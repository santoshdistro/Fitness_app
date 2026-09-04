// The one piece of muscle logic that needs the big how-to database
// (EXERCISE_DETAILS, ~200KB). Kept out of muscles.ts so importing the core
// classifiers (classifyMuscles / primaryMuscle) doesn't pull the whale into
// every chunk — it now only loads where the muscle exercise list is shown.
import { EXERCISE_DETAILS } from './exerciseDetails';
import { MUSCLE_EXERCISES, type MuscleKey } from './muscles';

const DETAIL_MUSCLE: Record<string, MuscleKey> = {
  neck: 'neck',
  abdominals: 'abs',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'back',
  'lower back': 'lowerBack',
  'middle back': 'back',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  triceps: 'triceps',
  forearms: 'forearms',
  traps: 'traps',
};

export type MuscleExercise = { id?: string; name: string };

// Exercises that train a muscle. Prefers the how-to DB (so a tap opens a proper
// guide); falls back to the curated name list for muscles it doesn't cover.
export function exercisesForMuscle(m: MuscleKey): MuscleExercise[] {
  const fromDb: MuscleExercise[] = [];
  for (const [id, d] of Object.entries(EXERCISE_DETAILS)) {
    if (d.primaryMuscles.some(pm => DETAIL_MUSCLE[pm] === m)) {
      fromDb.push({ id, name: id.replace(/_/g, ' ') });
    }
  }
  if (fromDb.length > 0) return fromDb;
  return (MUSCLE_EXERCISES[m] ?? []).map(name => ({ name }));
}
