import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { WorkoutPlanResult } from '../lib/aiClient';
import { todayDateString } from '../utils/date';

// Persist the latest AI-generated plan locally (per user). It's a personal
// convenience artifact, not shared data, so localStorage avoids another table.
function storageKey(userId: string): string {
  return `ai_workout_plan:${userId}`;
}

// Stored shape adds the date the plan began, used to compute the current week
// for progressive overload.
type StoredPlan = WorkoutPlanResult & { startedOn?: string };

function weeksSince(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const now = new Date(`${todayDateString()}T00:00:00`).getTime();
  const days = Math.floor((now - start) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function useAiWorkoutPlan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [plan, setPlan] = useState<StoredPlan | null>(null);

  useEffect(() => {
    if (!userId) {
      setPlan(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setPlan(raw ? (JSON.parse(raw) as StoredPlan) : null);
    } catch {
      setPlan(null);
    }
  }, [userId]);

  const savePlan = useCallback(
    (next: WorkoutPlanResult) => {
      if (!userId) return;
      const stored: StoredPlan = { ...next, startedOn: todayDateString() };
      localStorage.setItem(storageKey(userId), JSON.stringify(stored));
      setPlan(stored);
    },
    [userId],
  );

  const clearPlan = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(storageKey(userId));
    setPlan(null);
  }, [userId]);

  // Restart the progression clock (back to Week 1) without regenerating.
  const restartWeek = useCallback(() => {
    if (!userId || !plan) return;
    const stored: StoredPlan = { ...plan, startedOn: todayDateString() };
    localStorage.setItem(storageKey(userId), JSON.stringify(stored));
    setPlan(stored);
  }, [userId, plan]);

  const currentWeek = plan?.startedOn ? weeksSince(plan.startedOn) : null;

  return { plan, savePlan, clearPlan, restartWeek, currentWeek };
}
