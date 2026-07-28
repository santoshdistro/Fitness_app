import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { DietPlanItem, DietPlanResult } from '../lib/aiClient';

// A personal 2-week eating plan, kept locally (single-device convenience data,
// no Supabase table). Each of the 14 days holds a list of planned food items.

export const PLAN_DAYS = 14;

export type PlanItem = DietPlanItem & { id: string };
export type PlanDay = { items: PlanItem[] };
export type StoredPlan = { summary: string; days: PlanDay[] };

function key(userId: string): string {
  return `diet_plan_2w:${userId}`;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function emptyDays(): PlanDay[] {
  return Array.from({ length: PLAN_DAYS }, () => ({ items: [] }));
}

export function useDietPlan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [plan, setPlan] = useState<StoredPlan>({ summary: '', days: emptyDays() });

  useEffect(() => {
    if (!userId) {
      setPlan({ summary: '', days: emptyDays() });
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPlan;
        // Normalise length in case PLAN_DAYS changed.
        const days = emptyDays().map((d, i) => parsed.days[i] ?? d);
        setPlan({ summary: parsed.summary ?? '', days });
      } else {
        setPlan({ summary: '', days: emptyDays() });
      }
    } catch {
      setPlan({ summary: '', days: emptyDays() });
    }
  }, [userId]);

  const persist = useCallback(
    (next: StoredPlan) => {
      setPlan(next);
      if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
    },
    [userId],
  );

  const addItem = useCallback(
    (dayIndex: number, item: DietPlanItem) => {
      const days = plan.days.map((d, i) =>
        i === dayIndex ? { items: [...d.items, { ...item, id: newId() }] } : d,
      );
      persist({ ...plan, days });
    },
    [plan, persist],
  );

  const removeItem = useCallback(
    (dayIndex: number, id: string) => {
      const days = plan.days.map((d, i) =>
        i === dayIndex ? { items: d.items.filter(it => it.id !== id) } : d,
      );
      persist({ ...plan, days });
    },
    [plan, persist],
  );

  // Lay an AI result (a handful of unique days) across the full 2 weeks by
  // cycling through them, so every day is filled and still individually editable.
  const applyAiPlan = useCallback(
    (result: DietPlanResult) => {
      const source = result.days.filter(d => d.items?.length);
      if (source.length === 0) return;
      const days: PlanDay[] = Array.from({ length: PLAN_DAYS }, (_, i) => ({
        items: source[i % source.length].items.map(it => ({ ...it, id: newId() })),
      }));
      persist({ summary: result.summary ?? '', days });
    },
    [persist],
  );

  const clear = useCallback(() => {
    persist({ summary: '', days: emptyDays() });
  }, [persist]);

  const hasPlan = plan.days.some(d => d.items.length > 0);

  return { plan, hasPlan, addItem, removeItem, applyAiPlan, clear };
}
