import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, todayDateString } from '../utils/date';
import type { DailyLog, FoodLog } from '../types/database';

const KCAL_PER_KG = 7700;
const WINDOW_DAYS = 21;

export type AdaptiveTdee = {
  ready: boolean;
  reason?: string;
  observedTdee: number;
  avgCalories: number;
  weightChangeKg: number;
  spanDays: number;
  daysWithFood: number;
};

// Estimates real maintenance calories from what you actually ate vs how your
// weight actually moved — the ground truth that formulas only approximate.
export function useAdaptiveTdee() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [data, setData] = useState<AdaptiveTdee | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    const start = addDays(today, -(WINDOW_DAYS - 1));

    const [foodRes, dailyRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('meal_timestamp, calories')
        .eq('user_id', userId)
        .gte('meal_timestamp', startOfDateIso(start)),
      supabase
        .from('daily_logs')
        .select('log_date, weight')
        .eq('user_id', userId)
        .gte('log_date', start)
        .lte('log_date', today)
        .order('log_date', { ascending: true }),
    ]);

    const meals = (foodRes.data as Pick<FoodLog, 'meal_timestamp' | 'calories'>[]) ?? [];
    const dailies = (dailyRes.data as Pick<DailyLog, 'log_date' | 'weight'>[]) ?? [];

    // Calories per local day.
    const perDay = new Map<string, number>();
    for (const m of meals) {
      const day = new Date(m.meal_timestamp).toLocaleDateString('en-CA');
      perDay.set(day, (perDay.get(day) ?? 0) + (m.calories ?? 0));
    }
    const dayCalories = [...perDay.values()].filter(c => c > 0);
    const daysWithFood = dayCalories.length;
    const avgCalories =
      daysWithFood > 0 ? Math.round(dayCalories.reduce((s, c) => s + c, 0) / daysWithFood) : 0;

    const weighIns = dailies.filter((d): d is { log_date: string; weight: number } => d.weight != null);
    const first = weighIns[0];
    const last = weighIns[weighIns.length - 1];
    const spanDays = first && last ? daysBetween(first.log_date, last.log_date) : 0;
    const weightChangeKg = first && last ? Math.round((last.weight - first.weight) * 100) / 100 : 0;

    if (daysWithFood < 7 || weighIns.length < 2 || spanDays < 10) {
      setData({
        ready: false,
        reason:
          'Log your meals on ~7+ days and weigh in across ~10+ days, then your real maintenance appears here.',
        observedTdee: 0,
        avgCalories,
        weightChangeKg,
        spanDays,
        daysWithFood,
      });
      setLoading(false);
      return;
    }

    const observedTdee = Math.round(avgCalories - (weightChangeKg * KCAL_PER_KG) / spanDays);
    setData({
      ready: true,
      observedTdee,
      avgCalories,
      weightChangeKg,
      spanDays,
      daysWithFood,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}
