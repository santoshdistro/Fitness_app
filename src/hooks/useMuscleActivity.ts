import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, todayDateString } from '../utils/date';
import { classifyMuscles, type MuscleKey } from '../data/muscles';
import type { ExerciseSet, WorkoutLog } from '../types/database';

export type MusclePeriod = 'today' | 'week';

export type ExerciseStat = { name: string; sets: number; reps: number; volume: number };

export type MuscleActivity = {
  volumes: Partial<Record<MuscleKey, number>>;
  intensity: Partial<Record<MuscleKey, number>>; // 0..1, max-normalised
  maxVolume: number;
  exercises: ExerciseStat[]; // logged exercises, highest volume first
};

export function useMuscleActivity(period: MusclePeriod) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [data, setData] = useState<MuscleActivity>({
    volumes: {},
    intensity: {},
    maxVolume: 0,
    exercises: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setData({ volumes: {}, intensity: {}, maxVolume: 0, exercises: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    const start = period === 'today' ? today : addDays(today, -6);

    supabase
      .from('workout_logs')
      .select('session_timestamp, exercise_data')
      .eq('user_id', userId)
      .gte('session_timestamp', startOfDateIso(start))
      .then(({ data: rows }) => {
        if (cancelled) return;
        const workouts = (rows as Pick<WorkoutLog, 'session_timestamp' | 'exercise_data'>[]) ?? [];
        const volumes: Partial<Record<MuscleKey, number>> = {};
        const exMap = new Map<string, ExerciseStat>();
        for (const w of workouts) {
          for (const set of (w.exercise_data ?? []) as ExerciseSet[]) {
            const name = (set.exercise || '').trim();
            // Bodyweight moves (weight 0) still count via reps.
            const vol = Math.max(1, set.weight || 0) * Math.max(1, set.reps || 1);
            if (name) {
              const cur = exMap.get(name) ?? { name, sets: 0, reps: 0, volume: 0 };
              cur.sets += 1;
              cur.reps += set.reps || 0;
              cur.volume += vol;
              exMap.set(name, cur);
            }
            const muscles = classifyMuscles(name);
            for (const m of muscles) volumes[m] = (volumes[m] ?? 0) + vol;
          }
        }
        const exercises = [...exMap.values()].sort((a, b) => b.volume - a.volume);
        const maxVolume = Math.max(0, ...Object.values(volumes));
        const intensity: Partial<Record<MuscleKey, number>> = {};
        if (maxVolume > 0) {
          for (const [m, v] of Object.entries(volumes)) {
            // Soft curve so lightly-worked muscles still show a hint of colour.
            intensity[m as MuscleKey] = Math.pow((v as number) / maxVolume, 0.6);
          }
        }
        setData({ volumes, intensity, maxVolume, exercises });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, period]);

  return { data, loading };
}
