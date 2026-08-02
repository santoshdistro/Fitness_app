import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// A 7-slot weekly plan (Mon..Sun) of what *kind* of day you're eating, mirroring
// the training split. The AI diet planner respects each day's type.
export const DIET_DAY_OPTIONS = [
  'Any',
  'Veg',
  'Non-veg',
  'Egg',
  'Vegan',
  'Low-carb',
  'High-protein',
  'Keto',
  'IF 16:8',
  'Fasting (OMAD)',
] as const;

export type DietDayType = (typeof DIET_DAY_OPTIONS)[number];

export const DIET_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT: DietDayType[] = ['Non-veg', 'Veg', 'Non-veg', 'Veg', 'Non-veg', 'Veg', 'Fasting (OMAD)'];

function key(userId: string): string {
  return `diet_split:${userId}`;
}

export function useDietSplit() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [split, setSplit] = useState<DietDayType[]>(DEFAULT);

  useEffect(() => {
    if (!userId) {
      setSplit(DEFAULT);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      const parsed = raw ? (JSON.parse(raw) as DietDayType[]) : null;
      setSplit(parsed && parsed.length === 7 ? parsed : DEFAULT);
    } catch {
      setSplit(DEFAULT);
    }
  }, [userId]);

  const setDay = useCallback(
    (index: number, value: DietDayType) => {
      setSplit(prev => {
        const next = prev.slice();
        next[index] = value;
        if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  return { split, setDay };
}
