import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Shared day-schedule times (wake / gym / last meal / sleep) so both the
// schedule card and the diet plan can line meals up to the same clock.
export type DayScheduleInputs = {
  wake: string;
  gym: string;
  lastMeal: string;
  sleep: string;
  hasWorkout: boolean;
};

export const DAY_SCHEDULE_DEFAULTS: DayScheduleInputs = {
  wake: '07:00',
  gym: '18:00',
  lastMeal: '20:00',
  sleep: '23:00',
  hasWorkout: true,
};

function key(userId: string): string {
  return `day_schedule:${userId}`;
}

export function useDaySchedule() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [inputs, setInputs] = useState<DayScheduleInputs>(DAY_SCHEDULE_DEFAULTS);

  useEffect(() => {
    if (!userId) {
      setInputs(DAY_SCHEDULE_DEFAULTS);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      setInputs(raw ? { ...DAY_SCHEDULE_DEFAULTS, ...(JSON.parse(raw) as Partial<DayScheduleInputs>) } : DAY_SCHEDULE_DEFAULTS);
    } catch {
      setInputs(DAY_SCHEDULE_DEFAULTS);
    }
  }, [userId]);

  const update = useCallback(
    (partial: Partial<DayScheduleInputs>) => {
      setInputs(prev => {
        const next = { ...prev, ...partial };
        if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  return { inputs, update };
}
