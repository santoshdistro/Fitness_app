// Reminders come in two shapes:
//  - fixed daily reminders that fire once at a set time
//  - a water reminder that repeats on an interval within a daytime window
// Keys match the server's message map in api/send-reminders.ts.

export type FixedReminderKey = 'weighin' | 'breakfast' | 'lunch' | 'workout' | 'dinner';

export type ReminderPref = { enabled: boolean; time: string };
export type WaterReminder = {
  enabled: boolean;
  everyHours: number;
  startTime: string;
  endTime: string;
};

export type ReminderPrefs = {
  items: Record<FixedReminderKey, ReminderPref>;
  water: WaterReminder;
};

export const REMINDER_DEFS: {
  key: FixedReminderKey;
  label: string;
  emoji: string;
  defaultTime: string;
}[] = [
  { key: 'weighin', label: 'Morning weigh-in', emoji: '⚖️', defaultTime: '07:30' },
  { key: 'breakfast', label: 'Log breakfast', emoji: '🍳', defaultTime: '08:30' },
  { key: 'lunch', label: 'Log lunch', emoji: '🥗', defaultTime: '13:00' },
  { key: 'workout', label: 'Workout time', emoji: '🏋️', defaultTime: '18:00' },
  { key: 'dinner', label: 'Log dinner', emoji: '🍽️', defaultTime: '19:30' },
];

export const WATER_INTERVAL_OPTIONS = [
  { value: 1, label: 'Every hour' },
  { value: 2, label: 'Every 2 hours' },
  { value: 3, label: 'Every 3 hours' },
];

export function defaultReminderPrefs(): ReminderPrefs {
  const items = REMINDER_DEFS.reduce((acc, def) => {
    acc[def.key] = { enabled: def.key !== 'workout', time: def.defaultTime };
    return acc;
  }, {} as Record<FixedReminderKey, ReminderPref>);

  return {
    items,
    water: { enabled: true, everyHours: 2, startTime: '09:00', endTime: '23:00' },
  };
}

/** Merges stored prefs over the defaults, tolerating older/partial shapes. */
export function mergeReminderPrefs(saved: Partial<ReminderPrefs> | null | undefined): ReminderPrefs {
  const def = defaultReminderPrefs();
  return {
    items: { ...def.items, ...(saved?.items ?? {}) },
    water: { ...def.water, ...(saved?.water ?? {}) },
  };
}
