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
  mealCount: number;
};

const EMPTY_TOTALS: NutritionTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  mealCount: 0,
};

export function useTodayNutrition() {
  const { session } = useAuth();
  const [totals, setTotals] = useState<NutritionTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setTotals(EMPTY_TOTALS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('meal_timestamp', startOfTodayIso());

    const meals = (data as FoodLog[]) ?? [];
    setTotals(
      meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories ?? 0),
          protein_g: acc.protein_g + (meal.protein_g ?? 0),
          carbs_g: acc.carbs_g + (meal.carbs_g ?? 0),
          fat_g: acc.fat_g + (meal.fat_g ?? 0),
          mealCount: acc.mealCount + 1,
        }),
        { ...EMPTY_TOTALS },
      ),
    );
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { totals, loading, refresh };
}
