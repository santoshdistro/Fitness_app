import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { canonicalExercise } from '../data/exerciseCanonical';
import type { WorkoutLog } from '../types/database';

export type ExerciseRecord = {
  exercise: string;
  bestWeight: number;
  best1RM: number;
  lastWeight: number;
  lastReps: number;
  lastDate: string;
  sessions: number;
  history: { date: string; oneRm: number }[];
};

export type LastSet = { weight: number; reps: number };

function epley(weight: number, reps: number): number {
  return reps > 0 ? weight * (1 + reps / 30) : weight;
}

// Derives personal records + per-exercise progression from workout logs.
export function useStrengthRecords() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setWorkouts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('session_timestamp', { ascending: true })
      .limit(300)
      .then(({ data }) => {
        if (!cancelled) {
          setWorkouts((data as WorkoutLog[]) ?? []);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const records = useMemo<ExerciseRecord[]>(() => {
    const map = new Map<string, ExerciseRecord>();
    for (const w of workouts) {
      const date = w.session_timestamp.slice(0, 10);
      // Best 1RM per exercise within this session (for the progression line).
      const sessionBest = new Map<string, number>();
      for (const set of w.exercise_data ?? []) {
        const name = canonicalExercise(set.exercise);
        if (!name || !set.weight) continue;
        const oneRm = epley(set.weight, set.reps);
        sessionBest.set(name, Math.max(sessionBest.get(name) ?? 0, oneRm));

        const rec =
          map.get(name) ??
          ({
            exercise: name,
            bestWeight: 0,
            best1RM: 0,
            lastWeight: 0,
            lastReps: 0,
            lastDate: date,
            sessions: 0,
            history: [],
          } as ExerciseRecord);
        rec.bestWeight = Math.max(rec.bestWeight, set.weight);
        rec.best1RM = Math.max(rec.best1RM, oneRm);
        rec.lastWeight = set.weight;
        rec.lastReps = set.reps;
        rec.lastDate = date;
        map.set(name, rec);
      }
      for (const [name, oneRm] of sessionBest) {
        const rec = map.get(name)!;
        rec.history.push({ date, oneRm: Math.round(oneRm) });
        rec.sessions += 1;
      }
    }
    return [...map.values()]
      .map(r => ({ ...r, best1RM: Math.round(r.best1RM) }))
      .sort((a, b) => (b.lastDate > a.lastDate ? 1 : -1));
  }, [workouts]);

  const lastByExercise = useMemo(() => {
    const m = new Map<string, LastSet>();
    for (const r of records) m.set(r.exercise, { weight: r.lastWeight, reps: r.lastReps });
    return m;
  }, [records]);

  return { records, lastByExercise, loading };
}
