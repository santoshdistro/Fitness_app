import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { WorkoutLog } from '../types/database';

export type ExercisePoint = { t: number; topWeight: number; oneRm: number; volume: number };

export type ExerciseSeries = {
  name: string;
  points: ExercisePoint[]; // ascending by time, one aggregated point per session
  latest: number; // most recent session's top weight
  prev: number | null; // the session before that
  best: number; // best top weight ever
  sessions: number;
};

function epley(weight: number, reps: number): number {
  return reps > 0 ? weight * (1 + reps / 30) : weight;
}

// Per-exercise progression from workout logs: each session contributes one
// point (its heaviest set), so the chart/table read as weight-over-time.
export function useExerciseProgress() {
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
      .limit(400)
      .then(({ data }) => {
        if (cancelled) return;
        setWorkouts((data as WorkoutLog[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const series = useMemo<ExerciseSeries[]>(() => {
    const map = new Map<string, ExercisePoint[]>();
    for (const w of workouts) {
      const t = new Date(w.session_timestamp).getTime();
      // Aggregate each exercise within this one session first.
      const perEx = new Map<string, { topWeight: number; oneRm: number; volume: number }>();
      for (const set of w.exercise_data ?? []) {
        const name = (set.exercise || '').trim();
        if (!name) continue;
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const cur = perEx.get(name) ?? { topWeight: 0, oneRm: 0, volume: 0 };
        cur.topWeight = Math.max(cur.topWeight, weight);
        cur.oneRm = Math.max(cur.oneRm, epley(weight, reps));
        cur.volume += Math.max(1, weight) * Math.max(1, reps);
        perEx.set(name, cur);
      }
      for (const [name, agg] of perEx) {
        const arr = map.get(name) ?? [];
        arr.push({ t, topWeight: agg.topWeight, oneRm: Math.round(agg.oneRm), volume: agg.volume });
        map.set(name, arr);
      }
    }
    return [...map.entries()]
      .map(([name, points]) => {
        const latest = points[points.length - 1].topWeight;
        const prev = points.length >= 2 ? points[points.length - 2].topWeight : null;
        const best = Math.max(...points.map(p => p.topWeight));
        return { name, points, latest, prev, best, sessions: points.length };
      })
      // Most recently trained first.
      .sort((a, b) => b.points[b.points.length - 1].t - a.points[a.points.length - 1].t);
  }, [workouts]);

  return { series, loading };
}
