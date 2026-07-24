import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { NutritionPlanResult, NutritionPreferences } from '../lib/aiClient';

// Persist the user's diet preferences + latest coach plan locally. Personal,
// single-device convenience data — no extra Supabase table needed.
function prefsKey(userId: string): string {
  return `nutrition_prefs:${userId}`;
}
function planKey(userId: string): string {
  return `nutrition_plan:${userId}`;
}

export function useNutritionCoach() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [prefs, setPrefs] = useState<NutritionPreferences | null>(null);
  const [plan, setPlan] = useState<NutritionPlanResult | null>(null);

  useEffect(() => {
    if (!userId) {
      setPrefs(null);
      setPlan(null);
      return;
    }
    try {
      const rawPrefs = localStorage.getItem(prefsKey(userId));
      setPrefs(rawPrefs ? (JSON.parse(rawPrefs) as NutritionPreferences) : null);
      const rawPlan = localStorage.getItem(planKey(userId));
      setPlan(rawPlan ? (JSON.parse(rawPlan) as NutritionPlanResult) : null);
    } catch {
      setPrefs(null);
      setPlan(null);
    }
  }, [userId]);

  const save = useCallback(
    (nextPrefs: NutritionPreferences, nextPlan: NutritionPlanResult) => {
      if (!userId) return;
      localStorage.setItem(prefsKey(userId), JSON.stringify(nextPrefs));
      localStorage.setItem(planKey(userId), JSON.stringify(nextPlan));
      setPrefs(nextPrefs);
      setPlan(nextPlan);
    },
    [userId],
  );

  const clear = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(planKey(userId));
    setPlan(null);
  }, [userId]);

  return { prefs, plan, save, clear };
}
