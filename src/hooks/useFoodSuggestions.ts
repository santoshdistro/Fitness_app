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
  sugar_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  poly_fat_g: number | null;
  mono_fat_g: number | null;
  count: number;
};

const HISTORY_LIMIT = 150;
const SUGGESTION_LIMIT = 8;

/** Recent + frequent distinct meals from history, for one-tap re-logging. */
export function useFoodSuggestions() {
  const { session } = useAuth();
  const [recent, setRecent] = useState<FoodSuggestion[]>([]);
  const [frequent, setFrequent] = useState<FoodSuggestion[]>([]);
  const [all, setAll] = useState<FoodSuggestion[]>([]);
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
          sugar_g: meal.sugar_g,
          saturated_fat_g: meal.saturated_fat_g,
          trans_fat_g: meal.trans_fat_g,
          poly_fat_g: meal.poly_fat_g,
          mono_fat_g: meal.mono_fat_g,
          count: 1,
        });
      }

      // Map preserves insertion order, which followed the descending timestamp query.
      const distinct = Array.from(byName.values());
      setAll(distinct);
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

  return { recent, frequent, all, loading };
}

// Match the user's own logged foods by name tokens (all must appear).
export function searchMyFoods(all: FoodSuggestion[], query: string, limit = 8): FoodSuggestion[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return all.filter(f => tokens.every(t => f.mealName.toLowerCase().includes(t))).slice(0, limit);
}
