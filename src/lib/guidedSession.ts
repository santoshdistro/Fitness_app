// Persists an in-progress guided workout so an accidental reload, reading a
// how-to, or leaving the screen doesn't wipe the sets already logged. One active
// session at a time (single device).
import type { GuidedExercise } from '../components/GuidedWorkout';
import type { ExerciseSet } from '../types/database';

export type GuidedSaved = {
  title: string;
  exercises: GuidedExercise[];
  logged: ExerciseSet[];
  exIndex: number;
  setNum: number;
  savedAt: number;
};

const KEY = 'guided_session_v1';

export function saveGuided(s: GuidedSaved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadGuided(): GuidedSaved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuidedSaved) : null;
  } catch {
    return null;
  }
}

export function clearGuided(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Does a saved session match the workout being opened? (same title + the same
// list of exercises), so we only resume into the right session.
export function sameSession(saved: GuidedSaved | null, title: string, exercises: GuidedExercise[]): boolean {
  if (!saved || saved.title !== title || saved.exercises.length !== exercises.length) return false;
  return saved.exercises.every((e, i) => e.name === exercises[i]?.name);
}
