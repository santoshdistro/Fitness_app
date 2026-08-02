import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addDays } from '../utils/date';
import type { DietPlanItem, DietPlanResult } from '../lib/aiClient';

// A personal eating plan kept locally (single-device convenience data, no
// Supabase table). Items are keyed by real calendar date, so you can plan any
// day — this week, next week, or further out.

export const PLAN_SPAN = 14;

export type PlanItem = DietPlanItem & { id: string };
export type StoredPlan = { summary: string; byDate: Record<string, PlanItem[]> };

function key(userId: string): string {
  return `diet_plan_dates:${userId}`;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

const EMPTY: StoredPlan = { summary: '', byDate: {} };

export function useDietPlan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [plan, setPlan] = useState<StoredPlan>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setPlan(EMPTY);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      const parsed = raw ? (JSON.parse(raw) as StoredPlan) : null;
      setPlan(parsed?.byDate ? { summary: parsed.summary ?? '', byDate: parsed.byDate } : EMPTY);
    } catch {
      setPlan(EMPTY);
    }
  }, [userId]);

  const persist = useCallback(
    (next: StoredPlan) => {
      setPlan(next);
      if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
    },
    [userId],
  );

  const itemsFor = useCallback((date: string): PlanItem[] => plan.byDate[date] ?? [], [plan]);

  const addItem = useCallback(
    (date: string, item: DietPlanItem) => {
      const list = plan.byDate[date] ?? [];
      persist({
        ...plan,
        byDate: { ...plan.byDate, [date]: [...list, { ...item, id: newId() }] },
      });
    },
    [plan, persist],
  );

  const removeItem = useCallback(
    (date: string, id: string) => {
      const list = (plan.byDate[date] ?? []).filter(it => it.id !== id);
      persist({ ...plan, byDate: { ...plan.byDate, [date]: list } });
    },
    [plan, persist],
  );

  // Set the time for every item in a meal on a given day (a meal is eaten once).
  const setMealTime = useCallback(
    (date: string, meal: string, time: string) => {
      const list = (plan.byDate[date] ?? []).map(it => (it.meal === meal ? { ...it, time } : it));
      persist({ ...plan, byDate: { ...plan.byDate, [date]: list } });
    },
    [plan, persist],
  );

  // Append several items to a date at once (e.g. a whole predefined day).
  const addItems = useCallback(
    (date: string, itemsToAdd: DietPlanItem[]) => {
      const list = plan.byDate[date] ?? [];
      persist({
        ...plan,
        byDate: {
          ...plan.byDate,
          [date]: [...list, ...itemsToAdd.map(it => ({ ...it, id: newId() }))],
        },
      });
    },
    [plan, persist],
  );

  // Lay an AI result (a handful of unique days) across `span` days starting at
  // `startDate`, cycling through the source days. Only the affected dates are
  // overwritten — plans on other dates are kept.
  const applyAiPlan = useCallback(
    (result: DietPlanResult, startDate: string, span = PLAN_SPAN) => {
      const source = result.days.filter(d => d.items?.length);
      if (source.length === 0) return;
      const byDate = { ...plan.byDate };
      for (let i = 0; i < span; i++) {
        const date = addDays(startDate, i);
        byDate[date] = source[i % source.length].items.map(it => ({ ...it, id: newId() }));
      }
      persist({ summary: result.summary ?? plan.summary, byDate });
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

  return { plan, hasPlan, itemsFor, addItem, addItems, removeItem, setMealTime, applyAiPlan, clearDate, clearAll };
}
