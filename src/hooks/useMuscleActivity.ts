import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, startOfWeek, todayDateString } from '../utils/date';
import { primaryMuscle, type MuscleKey } from '../data/muscles';
import { isCardio } from '../data/exerciseKind';
import type { ExerciseSet, WorkoutLog } from '../types/database';

export type MusclePeriod = 'today' | 'week';

export type ExerciseStat = {
  name: string;
  sets: number;
  reps: number;
  volume: number;
  cardio: boolean;
  durationMin: number;
  distanceKm: number;
};

export type MuscleActivity = {
  volumes: Partial<Record<MuscleKey, number>>;
  intensity: Partial<Record<MuscleKey, number>>; // 0..1, max-normalised
  maxVolume: number;
  exercises: ExerciseStat[]; // logged strength exercises, highest volume first
  cardio: ExerciseStat[]; // logged cardio, aggregated by name
};

export function useMuscleActivity(period: MusclePeriod, anchorDate?: string) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [data, setData] = useState<MuscleActivity>({
    volumes: {},
    intensity: {},
    maxVolume: 0,
    exercises: [],
    cardio: [],
  });
  const [loading, setLoading] = useState(true);

  const anchor = anchorDate ?? todayDateString();

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setData({ volumes: {}, intensity: {}, maxVolume: 0, exercises: [], cardio: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    // Window bounded on both ends so past days/weeks can be browsed, not just
    // "since a start date up to now".
    const start = period === 'today' ? anchor : startOfWeek(anchor);
    const end = period === 'today' ? addDays(anchor, 1) : addDays(start, 7);

    supabase
      .from('workout_logs')
      .select('session_timestamp, exercise_data')
      .eq('user_id', userId)
      .gte('session_timestamp', startOfDateIso(start))
      .lt('session_timestamp', startOfDateIso(end))
      .then(({ data: rows }) => {
        if (cancelled) return;
        const workouts = (rows as Pick<WorkoutLog, 'session_timestamp' | 'exercise_data'>[]) ?? [];
        const volumes: Partial<Record<MuscleKey, number>> = {};
        const exMap = new Map<string, ExerciseStat>();
        for (const w of workouts) {
          for (const set of (w.exercise_data ?? []) as ExerciseSet[]) {
            const name = (set.exercise || '').trim();
            if (!name) continue;
            const cardio = isCardio(name);
            // Bodyweight moves (weight 0) still count via reps.
            const vol = Math.max(1, set.weight || 0) * Math.max(1, set.reps || 1);
            const cur =
              exMap.get(name) ?? { name, sets: 0, reps: 0, volume: 0, cardio, durationMin: 0, distanceKm: 0 };
            cur.sets += 1;
            cur.reps += set.reps || 0;
            cur.volume += vol;
            cur.durationMin += set.durationMin || 0;
            cur.distanceKm += set.distanceKm || 0;
            exMap.set(name, cur);
            // Cardio is time/distance work — it never credits a muscle (so a
            // treadmill "incline" run doesn't land under Chest). Strength credits
            // only its primary mover, keeping both lists in sync.
            if (!cardio) {
              const primary = primaryMuscle(name);
              if (primary) volumes[primary] = (volumes[primary] ?? 0) + vol;
            }
          }
        }
        const all = [...exMap.values()];
        const exercises = all.filter(e => !e.cardio).sort((a, b) => b.volume - a.volume);
        const cardio = all.filter(e => e.cardio).sort((a, b) => b.durationMin - a.durationMin);
        const maxVolume = Math.max(0, ...Object.values(volumes));
        const intensity: Partial<Record<MuscleKey, number>> = {};
        if (maxVolume > 0) {
          for (const [m, v] of Object.entries(volumes)) {
            // Soft curve so lightly-worked muscles still show a hint of colour.
            intensity[m as MuscleKey] = Math.pow((v as number) / maxVolume, 0.6);
          }
        }
        setData({ volumes, intensity, maxVolume, exercises, cardio });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, period, anchor]);

  return { data, loading };
}
