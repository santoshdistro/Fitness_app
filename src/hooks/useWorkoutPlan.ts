import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// A personal per-date workout plan (single-device localStorage). Each date holds
// the exercises planned for that day, filled from the weekly split, AI, or by hand.

export type PlannedExercise = { id: string; name: string; sets: number; reps: string };
export type StoredWorkoutPlan = { summary: string; byDate: Record<string, PlannedExercise[]> };

function key(userId: string): string {
  return `workout_plan_dates:${userId}`;
}
function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const EMPTY: StoredWorkoutPlan = { summary: '', byDate: {} };

export type RangeEntry = { date: string; exercises: Omit<PlannedExercise, 'id'>[] };

export function useWorkoutPlan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [plan, setPlan] = useState<StoredWorkoutPlan>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setPlan(EMPTY);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      const parsed = raw ? (JSON.parse(raw) as StoredWorkoutPlan) : null;
      setPlan(parsed?.byDate ? { summary: parsed.summary ?? '', byDate: parsed.byDate } : EMPTY);
    } catch {
      setPlan(EMPTY);
    }
  }, [userId]);

  const persist = useCallback(
    (next: StoredWorkoutPlan) => {
      setPlan(next);
      if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
    },
    [userId],
  );

  const exercisesFor = useCallback(
    (date: string): PlannedExercise[] => plan.byDate[date] ?? [],
    [plan],
  );

  const addExercise = useCallback(
    (date: string, ex: Omit<PlannedExercise, 'id'>) => {
      const list = plan.byDate[date] ?? [];
      persist({ ...plan, byDate: { ...plan.byDate, [date]: [...list, { ...ex, id: newId() }] } });
    },
    [plan, persist],
  );

  const removeExercise = useCallback(
    (date: string, id: string) => {
      const list = (plan.byDate[date] ?? []).filter(e => e.id !== id);
      persist({ ...plan, byDate: { ...plan.byDate, [date]: list } });
    },
    [plan, persist],
  );

  // Bulk-fill a set of dates (prefill from split, or an AI plan). Only the given
  // dates are overwritten; everything else is preserved.
  const applyRange = useCallback(
    (entries: RangeEntry[], summary?: string) => {
      const byDate = { ...plan.byDate };
      for (const e of entries) {
        byDate[e.date] = e.exercises.map(ex => ({ ...ex, id: newId() }));
      }
      persist({ summary: summary ?? plan.summary, byDate });
    },
    [plan, persist],
  );

  const clearDate = useCallback(
    (date: string) => {
      const byDate = { ...plan.byDate };
      delete byDate[date];
      persist({ ...plan, byDate });
    },
    [plan, persist],
  );

  const clearAll = useCallback(() => persist(EMPTY), [persist]);

  const hasPlan = Object.values(plan.byDate).some(list => list.length > 0);

  return { plan, hasPlan, exercisesFor, addExercise, removeExercise, applyRange, clearDate, clearAll };
}
