// The fixed set of daily reminders the user can toggle and time. Keys match the
// server's message map in api/send-reminders.ts.
export type ReminderKey =
  | 'weighin'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'water'
  | 'workout';

export type ReminderPref = { enabled: boolean; time: string };
export type ReminderPrefs = Record<ReminderKey, ReminderPref>;

export const REMINDER_DEFS: { key: ReminderKey; label: string; emoji: string; defaultTime: string }[] = [
  { key: 'weighin', label: 'Morning weigh-in', emoji: '⚖️', defaultTime: '07:30' },
  { key: 'breakfast', label: 'Log breakfast', emoji: '🍳', defaultTime: '08:30' },
  { key: 'lunch', label: 'Log lunch', emoji: '🥗', defaultTime: '13:00' },
  { key: 'water', label: 'Hydration check', emoji: '💧', defaultTime: '15:00' },
  { key: 'workout', label: 'Workout time', emoji: '🏋️', defaultTime: '18:00' },
  { key: 'dinner', label: 'Log dinner', emoji: '🍽️', defaultTime: '19:30' },
];

export function defaultReminderPrefs(): ReminderPrefs {
  return REMINDER_DEFS.reduce((acc, def) => {
    // Meals + weigh-in on by default; water/workout off so it isn't noisy.
    acc[def.key] = {
      enabled: def.key !== 'water' && def.key !== 'workout',
      time: def.defaultTime,
    };
    return acc;
  }, {} as ReminderPrefs);
}
