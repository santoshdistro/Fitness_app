import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, todayDateString } from '../utils/date';
import type { CardioLog, DailyLog, FoodLog, WorkoutLog } from '../types/database';

export type Series = { label: string; value: number; date: string }[];

export type Trends = {
  weight: Series;
  weightMovingAvg: number[];
  calories: Series; // last 30 days, per day
  protein: Series;
  steps: Series;
  caffeine: Series;
  volume: Series; // per workout session
  cardioDistance: Series; // km per cardio session
  totalKm: number;
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  avgCaffeine: number | null;
};

const DAYS = 90;

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
    ]).then(([dailyRes, foodRes, workoutRes, cardioRes]) => {
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

      // Steps last 30 days.
      const steps: Series = dailies
        .filter(d => d.log_date >= start30 && d.steps != null)
        .map(d => ({ label: shortLabel(d.log_date), value: d.steps as number, date: d.log_date }));

      // Caffeine last 30 days.
      const caffeine: Series = dailies
        .filter(d => d.log_date >= start30 && d.caffeine_mg != null)
        .map(d => ({ label: shortLabel(d.log_date), value: d.caffeine_mg as number, date: d.log_date }));

      // Calories + protein per day (last 30).
      const calByDay = new Map<string, { kcal: number; protein: number }>();
      for (const m of meals) {
        const day = new Date(m.meal_timestamp).toLocaleDateString('en-CA');
        const acc = calByDay.get(day) ?? { kcal: 0, protein: 0 };
        acc.kcal += m.calories ?? 0;
        acc.protein += m.protein_g ?? 0;
        calByDay.set(day, acc);
      }
      const days = [...calByDay.keys()].sort();
      const calories: Series = days.map(d => ({ label: shortLabel(d), value: Math.round(calByDay.get(d)!.kcal), date: d }));
      const protein: Series = days.map(d => ({ label: shortLabel(d), value: Math.round(calByDay.get(d)!.protein), date: d }));

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

      const avg = (arr: Series) =>
        arr.length ? Math.round(arr.reduce((s, p) => s + p.value, 0) / arr.length) : null;

      setTrends({
        weight,
        weightMovingAvg,
        calories,
        protein,
        steps,
        caffeine,
        volume,
        cardioDistance,
        totalKm,
        avgCalories: avg(calories),
        avgProtein: avg(protein),
        avgSteps: avg(steps),
        avgCaffeine: avg(caffeine),
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { trends, loading };
}
