import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { WorkoutPlanResult } from '../lib/aiClient';

// Persist the latest AI-generated plan locally (per user). It's a personal
// convenience artifact, not shared data, so localStorage avoids another table.
function storageKey(userId: string): string {
  return `ai_workout_plan:${userId}`;
}

export function useAiWorkoutPlan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [plan, setPlan] = useState<WorkoutPlanResult | null>(null);

  useEffect(() => {
    if (!userId) {
      setPlan(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setPlan(raw ? (JSON.parse(raw) as WorkoutPlanResult) : null);
    } catch {
      setPlan(null);
    }
  }, [userId]);

  const savePlan = useCallback(
    (next: WorkoutPlanResult) => {
      if (!userId) return;
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setPlan(next);
    },
    [userId],
  );

  const clearPlan = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(storageKey(userId));
    setPlan(null);
  }, [userId]);

  return { plan, savePlan, clearPlan };
}
