import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// A 7-slot weekly plan (Mon..Sun) of what to train each day. A day can combine
// several groups joined by " + " (e.g. "Chest + Triceps").
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

// Classic split focuses (pickable alongside specific muscles).
export const SPLIT_FOCUSES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full body', 'Cardio', 'Core', 'Crossfit'];

// Specific muscle groups — combine several on a day.
export const MUSCLE_FOCUSES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
];

/** Split a day's composite focus into its parts (empty for Rest). */
export function focusParts(focus: string): string[] {
  if (!focus || focus === 'Rest') return [];
  return focus.split('+').map(p => p.trim()).filter(Boolean);
}

/** Short label for tight spaces: "Chest +1" for multi-group days. */
export function shortFocus(focus: string): string {
  const parts = focusParts(focus);
  if (parts.length <= 1) return focus || 'Rest';
  return `${parts[0]} +${parts.length - 1}`;
}

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
