import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, endOfDateIso, startOfDateIso, todayDateString } from '../utils/date';
import type { DailyLog, FoodLog } from '../types/database';

export type WeeklyReview = {
  daysLogged: number;
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  /** Days (of those logged) where protein met the target. */
  proteinHitDays: number | null;
  /** Days (of those logged) within ±15% of the calorie target. */
  calorieOnTargetDays: number | null;
  weightChangeKg: number | null;
};

type Args = { calorieTarget?: number | null; proteinTarget?: number | null };

// Aggregates the last 7 days into a Sunday-review style summary: how consistent
// you were, how close to target, and which way the scale moved.
export function useWeeklyReview({ calorieTarget, proteinTarget }: Args) {
  const { session } = useAuth();
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setReview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    const start = addDays(today, -6);

    const [foodRes, dailyRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('meal_timestamp', startOfDateIso(start))
        .lt('meal_timestamp', endOfDateIso(today)),
      supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('log_date', start)
        .lte('log_date', today)
        .order('log_date', { ascending: true }),
    ]);

    const meals = (foodRes.data as FoodLog[]) ?? [];
    const dailies = (dailyRes.data as DailyLog[]) ?? [];

    // Group meals by local day.
    const perDay = new Map<string, { calories: number; protein: number }>();
    for (const m of meals) {
      const day = new Date(m.meal_timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD local
      const acc = perDay.get(day) ?? { calories: 0, protein: 0 };
      acc.calories += m.calories ?? 0;
      acc.protein += m.protein_g ?? 0;
      perDay.set(day, acc);
    }

    const days = [...perDay.values()];
    const daysLogged = days.length;
    const avgCalories =
      daysLogged > 0 ? Math.round(days.reduce((s, d) => s + d.calories, 0) / daysLogged) : null;
    const avgProtein =
      daysLogged > 0 ? Math.round(days.reduce((s, d) => s + d.protein, 0) / daysLogged) : null;

    const proteinHitDays =
      proteinTarget && daysLogged > 0
        ? days.filter(d => d.protein >= proteinTarget * 0.95).length
        : null;
    const calorieOnTargetDays =
      calorieTarget && daysLogged > 0
        ? days.filter(d => Math.abs(d.calories - calorieTarget) <= calorieTarget * 0.15).length
        : null;

    const stepValues = dailies.map(d => d.steps).filter((s): s is number => s != null);
    const avgSteps =
      stepValues.length > 0
        ? Math.round(stepValues.reduce((s, v) => s + v, 0) / stepValues.length)
        : null;

    const weights = dailies.filter((d): d is DailyLog & { weight: number } => d.weight != null);
    const weightChangeKg =
      weights.length >= 2
        ? Math.round((weights[weights.length - 1].weight - weights[0].weight) * 10) / 10
        : null;

    setReview({
      daysLogged,
      avgCalories,
      avgProtein,
      avgSteps,
      proteinHitDays,
      calorieOnTargetDays,
      weightChangeKg,
    });
    setLoading(false);
  }, [session?.user, calorieTarget, proteinTarget]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { review, loading, refresh };
}
