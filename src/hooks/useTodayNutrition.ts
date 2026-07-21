import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { startOfTodayIso } from '../utils/date';
import type { FoodLog } from '../types/database';

export type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  mealCount: number;
};

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  sodium_mg: 0,
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
      mealCount: acc.mealCount + 1,
    }),
    { ...EMPTY_TOTALS },
  );
}

export function useTodayNutrition() {
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
      .gte('meal_timestamp', startOfTodayIso())
      .order('meal_timestamp', { ascending: false });

    setMeals((data as FoodLog[]) ?? []);
    setLoading(false);
  }, [session?.user]);

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
