import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// A 7-slot weekly plan (Mon..Sun) of what to train each day.
export const SPLIT_OPTIONS = [
  'Rest',
  'Push',
  'Pull',
  'Legs',
  'Upper',
  'Lower',
  'Full body',
  'Cardio',
  'Core',
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT: string[] = ['Push', 'Pull', 'Legs', 'Rest', 'Upper', 'Lower', 'Rest'];

function key(userId: string): string {
  return `training_split:${userId}`;
}

export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // Mon = 0
}

export function useTrainingSplit() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [split, setSplit] = useState<string[]>(DEFAULT);

  useEffect(() => {
    if (!userId) {
      setSplit(DEFAULT);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      const parsed = raw ? (JSON.parse(raw) as string[]) : null;
      setSplit(parsed && parsed.length === 7 ? parsed : DEFAULT);
    } catch {
      setSplit(DEFAULT);
    }
  }, [userId]);

  const setDay = useCallback(
    (index: number, value: string) => {
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
