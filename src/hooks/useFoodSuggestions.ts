import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { FoodLog, MealCategory } from '../types/database';

export type FoodSuggestion = {
  key: string;
  mealName: string;
  category: MealCategory;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  count: number;
};

const HISTORY_LIMIT = 150;
const SUGGESTION_LIMIT = 8;

/** Recent + frequent distinct meals from history, for one-tap re-logging. */
export function useFoodSuggestions() {
  const { session } = useAuth();
  const [recent, setRecent] = useState<FoodSuggestion[]>([]);
  const [frequent, setFrequent] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session?.user) {
        setRecent([]);
        setFrequent([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('meal_timestamp', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (cancelled) return;

      const meals = (data as FoodLog[]) ?? [];
      const byName = new Map<string, FoodSuggestion>();
      for (const meal of meals) {
        const key = meal.meal_name.trim().toLowerCase();
        const existing = byName.get(key);
        if (existing) {
          existing.count += 1;
          continue;
        }
        byName.set(key, {
          key,
          mealName: meal.meal_name,
          category: meal.meal_category,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          fiber_g: meal.fiber_g,
          sodium_mg: meal.sodium_mg,
          count: 1,
        });
      }

      // Map preserves insertion order, which followed the descending timestamp query.
      const distinct = Array.from(byName.values());
      setRecent(distinct.slice(0, SUGGESTION_LIMIT));
      setFrequent(
        distinct
          .slice()
          .sort((a, b) => b.count - a.count)
          .slice(0, SUGGESTION_LIMIT),
      );
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return { recent, frequent, loading };
}
