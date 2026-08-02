import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, startOfWeek, todayDateString } from '../utils/date';
import type { CardioLog, DailyLog, FoodLog, Measurement, WorkoutLog } from '../types/database';

export type Series = { label: string; value: number; date: string }[];

export type Trends = {
  weight: Series;
  weightMovingAvg: number[];
  calories: Series; // last 30 days, per day
  protein: Series;
  steps: Series;
  caffeine: Series;
  hasCaffeine: boolean;
  volume: Series; // per workout session
  cardioDistance: Series; // km per cardio session
  totalKm: number;
  waist: Series; // inches, per recording
  bodyFat: Series; // %, per recording
  workoutsPerWeek: Series; // sessions per week (Mon-anchored)
  totalWorkouts: number; // sessions in window
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  avgCaffeine: number | null;
};

const DAYS = 90;
const WINDOW = 7; // continuous days shown for daily-intake charts

function shortLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    return Math.round((slice.reduce((s, v) => s + v, 0) / slice.length) * 10) / 10;
  });
}

export function useTrends() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setTrends(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    const start = addDays(today, -(DAYS - 1));
    const start30 = addDays(today, -29);

    Promise.all([
      supabase
        .from('daily_logs')
        .select('log_date, weight, steps, caffeine_mg')
        .eq('user_id', userId)
        .gte('log_date', start)
        .lte('log_date', today)
        .order('log_date', { ascending: true }),
      supabase
        .from('food_logs')
        .select('meal_timestamp, calories, protein_g')
        .eq('user_id', userId)
        .gte('meal_timestamp', startOfDateIso(start30)),
      supabase
        .from('workout_logs')
        .select('session_timestamp, exercise_data')
        .eq('user_id', userId)
        .gte('session_timestamp', startOfDateIso(start))
        .order('session_timestamp', { ascending: true }),
      supabase
        .from('cardio_logs')
        .select('session_timestamp, distance_km')
        .eq('user_id', userId)
        .gte('session_timestamp', startOfDateIso(start))
        .order('session_timestamp', { ascending: true }),
      supabase
        .from('measurements')
        .select('entry_timestamp, waist, calculated_body_fat')
        .eq('user_id', userId)
        .gte('entry_timestamp', startOfDateIso(start))
        .order('entry_timestamp', { ascending: true }),
    ]).then(([dailyRes, foodRes, workoutRes, cardioRes, measureRes]) => {
      if (cancelled) return;
      const dailies =
        (dailyRes.data as Pick<DailyLog, 'log_date' | 'weight' | 'steps' | 'caffeine_mg'>[]) ?? [];
      const meals = (foodRes.data as Pick<FoodLog, 'meal_timestamp' | 'calories' | 'protein_g'>[]) ?? [];
      const workouts = (workoutRes.data as Pick<WorkoutLog, 'session_timestamp' | 'exercise_data'>[]) ?? [];

      // Weight series (weigh-ins) + moving average.
      const weight: Series = dailies
        .filter(d => d.weight != null)
        .map(d => ({ label: shortLabel(d.log_date), value: d.weight as number, date: d.log_date }));
      const weightMovingAvg = movingAverage(weight.map(w => w.value), 5);

      // Build lookup maps so we can render a continuous window (every day shown,
      // gaps filled with 0) rather than only the days that happen to have data.
      const stepsMap = new Map<string, number>();
      const caffeineMap = new Map<string, number>();
      for (const d of dailies) {
        if (d.steps != null) stepsMap.set(d.log_date, d.steps);
        if (d.caffeine_mg != null) caffeineMap.set(d.log_date, d.caffeine_mg);
      }

      const kcalMap = new Map<string, number>();
      const proteinMap = new Map<string, number>();
      for (const m of meals) {
        const day = new Date(m.meal_timestamp).toLocaleDateString('en-CA');
        kcalMap.set(day, (kcalMap.get(day) ?? 0) + (m.calories ?? 0));
        proteinMap.set(day, (proteinMap.get(day) ?? 0) + (m.protein_g ?? 0));
      }

      // Continuous last-N-days series ending today.
      const continuous = (map: Map<string, number>, days: number): Series =>
        Array.from({ length: days }, (_, k) => {
          const date = addDays(today, -(days - 1 - k));
          return { label: shortLabel(date), value: Math.round(map.get(date) ?? 0), date };
        });
      // Average over the days that actually have data (ignore the filled zeros).
      const avgLogged = (map: Map<string, number>, days: number): number | null => {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < days; i++) {
          const v = map.get(addDays(today, -i));
          if (v != null) {
            sum += v;
            count += 1;
          }
        }
        return count ? Math.round(sum / count) : null;
      };

      const steps = continuous(stepsMap, WINDOW);
      const caffeine = continuous(caffeineMap, WINDOW);
      const calories = continuous(kcalMap, WINDOW);
      const protein = continuous(proteinMap, WINDOW);
      const hasCaffeine = caffeineMap.size > 0;

      // Training volume per session.
      const volume: Series = workouts.map(w => {
        const vol = (w.exercise_data ?? []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
        const date = w.session_timestamp.slice(0, 10);
        return { label: shortLabel(date), value: Math.round(vol), date };
      });

      const cardio = (cardioRes.data as Pick<CardioLog, 'session_timestamp' | 'distance_km'>[]) ?? [];
      const cardioDistance: Series = cardio
        .filter(c => c.distance_km != null)
        .map(c => {
          const date = c.session_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: Math.round((c.distance_km as number) * 10) / 10, date };
        });
      const totalKm = Math.round(cardioDistance.reduce((s, p) => s + p.value, 0) * 10) / 10;

      // Body composition from measurements.
      const measures =
        (measureRes.data as Pick<Measurement, 'entry_timestamp' | 'waist' | 'calculated_body_fat'>[]) ?? [];
      const waist: Series = measures
        .filter(m => m.waist != null)
        .map(m => {
          const date = m.entry_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: m.waist as number, date };
        });
      const bodyFat: Series = measures
        .filter(m => m.calculated_body_fat != null)
        .map(m => {
          const date = m.entry_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: Math.round((m.calculated_body_fat as number) * 10) / 10, date };
        });

      // Workout sessions grouped per Monday-anchored week.
      const weekCounts = new Map<string, number>();
      for (const w of workouts) {
        const wk = startOfWeek(w.session_timestamp.slice(0, 10));
        weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1);
      }
      const workoutsPerWeek: Series = Array.from(weekCounts.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([wk, count]) => ({ label: shortLabel(wk), value: count, date: wk }));
      const totalWorkouts = workouts.length;

      setTrends({
        weight,
        weightMovingAvg,
        calories,
        protein,
        steps,
        caffeine,
        hasCaffeine,
        volume,
        cardioDistance,
        totalKm,
        waist,
        bodyFat,
        workoutsPerWeek,
        totalWorkouts,
        avgCalories: avgLogged(kcalMap, WINDOW),
        avgProtein: avgLogged(proteinMap, WINDOW),
        avgSteps: avgLogged(stepsMap, WINDOW),
        avgCaffeine: avgLogged(caffeineMap, WINDOW),
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { trends, loading };
}
