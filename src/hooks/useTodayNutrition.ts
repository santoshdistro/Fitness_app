import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { endOfDateIso, startOfDateIso, todayDateString } from '../utils/date';
import type { FoodLog } from '../types/database';

export type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  sugar_g: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  poly_fat_g: number;
  mono_fat_g: number;
  mealCount: number;
};

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sodium_mg: 0,
  sugar_g: 0,
  saturated_fat_g: 0,
  trans_fat_g: 0,
  poly_fat_g: 0,
  mono_fat_g: 0,
  mealCount: 0,
};

function computeTotals(meals: FoodLog[]): NutritionTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories ?? 0),
      protein_g: acc.protein_g + (meal.protein_g ?? 0),
      carbs_g: acc.carbs_g + (meal.carbs_g ?? 0),
      fat_g: acc.fat_g + (meal.fat_g ?? 0),
      fiber_g: acc.fiber_g + (meal.fiber_g ?? 0),
      sodium_mg: acc.sodium_mg + (meal.sodium_mg ?? 0),
      sugar_g: acc.sugar_g + (meal.sugar_g ?? 0),
      saturated_fat_g: acc.saturated_fat_g + (meal.saturated_fat_g ?? 0),
      trans_fat_g: acc.trans_fat_g + (meal.trans_fat_g ?? 0),
      poly_fat_g: acc.poly_fat_g + (meal.poly_fat_g ?? 0),
      mono_fat_g: acc.mono_fat_g + (meal.mono_fat_g ?? 0),
      mealCount: acc.mealCount + 1,
    }),
    { ...EMPTY_TOTALS },
  );
}

export function useTodayNutrition(dateStr: string = todayDateString()) {
  const { session } = useAuth();
  const [meals, setMeals] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('meal_timestamp', startOfDateIso(dateStr))
      .lt('meal_timestamp', endOfDateIso(dateStr))
      .order('meal_timestamp', { ascending: false });

    setMeals((data as FoodLog[]) ?? []);
    setLoading(false);
  }, [session?.user, dateStr]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteMeal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('food_logs').delete().eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { totals: computeTotals(meals), meals, loading, refresh, deleteMeal };
}
