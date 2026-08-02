// A curated, best-practice daily eating & wellness timetable built from your
// wake / gym / last-meal times. Rule-based so it's instant, free and offline;
// the AI "refine" path returns the same shape.

export type ScheduleKind =
  | 'wake'
  | 'hydrate'
  | 'wellness'
  | 'meal'
  | 'pre'
  | 'workout'
  | 'post'
  | 'walk'
  | 'sleep';

export type ScheduleEntry = {
  time: string; // "HH:MM"
  title: string;
  detail: string;
  kind: ScheduleKind;
};

export type DaySchedule = { summary: string; entries: ScheduleEntry[] };

export type ScheduleInput = {
  wake: string;
  gym: string | null;
  lastMeal: string;
  sleep: string;
  hasWorkout: boolean;
};

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
function toStr(mins: number): string {
  const v = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
}

// Clock times for standard meals derived from wake & last-meal, so the diet
// plan lines up with the day schedule (breakfast soon after waking, dinner =
// last meal, lunch/snack spaced between).
export function mealTimesFromSchedule(input: { wake: string; lastMeal: string }): Record<string, string> {
  const wake = toMin(input.wake);
  const lastMeal = toMin(input.lastMeal);
  const lunch = Math.max(wake + 300, toMin('13:00'));
  const snack = Math.min(lunch + 210, lastMeal - 180);
  return {
    Breakfast: toStr(wake + 45),
    Lunch: toStr(lunch),
    Snack: toStr(snack),
    Dinner: toStr(lastMeal),
  };
}

export function buildDaySchedule(input: ScheduleInput): DaySchedule {
  const wake = toMin(input.wake);
  const sleep = toMin(input.sleep);
  const lastMeal = toMin(input.lastMeal);
  const gym = input.hasWorkout && input.gym ? toMin(input.gym) : null;

  const e: ScheduleEntry[] = [];

  e.push({
    time: toStr(wake),
    title: 'Wake — warm jeera / ajwain water',
    detail:
      'A glass of warm water with soaked jeera (cumin) or a pinch of ajwain on an empty stomach fires up digestion and cuts morning bloat.',
    kind: 'wellness',
  });
  e.push({
    time: toStr(wake + 45),
    title: 'Breakfast',
    detail: 'Protein + fibre within ~45 min of waking to steady energy and hunger.',
    kind: 'meal',
  });
  e.push({
    time: toStr(wake + 180),
    title: 'Hydrate · green tea',
    detail: 'Water or green tea; keep sipping through the morning (aim 2.5–3 L across the day).',
    kind: 'hydrate',
  });

  // Lunch — keep after breakfast, around midday.
  const lunch = Math.max(wake + 300, toMin('13:00'));
  e.push({ time: toStr(lunch), title: 'Lunch', detail: 'Your biggest balanced meal — protein, complex carbs, veg.', kind: 'meal' });
  e.push({
    time: toStr(lunch + 30),
    title: 'Saunf / ajwain if heavy',
    detail: 'Chew fennel (saunf) or sip ajwain water after a heavy lunch to beat gas and bloating.',
    kind: 'wellness',
  });

  if (gym != null) {
    e.push({
      time: toStr(gym - 60),
      title: 'Pre-workout fuel',
      detail: 'Light carbs + a little protein ~1 hr before training (banana + coffee, or oats). Avoid a heavy meal right before.',
      kind: 'pre',
    });
    e.push({ time: toStr(gym), title: 'Gym · workout', detail: 'Train. Sip water through the session; add electrolytes if you sweat a lot.', kind: 'workout' });
    e.push({
      time: toStr(gym + 30),
      title: 'Post-workout protein',
      detail: 'Protein (shake or meal) within ~30–45 min to kick-start recovery.',
      kind: 'post',
    });
  } else {
    e.push({ time: toStr(wake + 540), title: 'Evening snack', detail: 'Protein-led snack (yogurt, nuts, or a shake) to bridge to dinner.', kind: 'meal' });
  }

  e.push({ time: toStr(lastMeal), title: 'Dinner (last meal)', detail: 'Lighter than lunch, protein + veg. Try to finish 2.5–3 hrs before bed.', kind: 'meal' });
  e.push({
    time: toStr(lastMeal + 20),
    title: '10-minute walk',
    detail: 'A short easy walk after dinner speeds digestion and noticeably reduces bloating.',
    kind: 'walk',
  });
  e.push({
    time: toStr(sleep - 60),
    title: 'Wind down',
    detail: 'Stop screens; a warm fennel or chamomile tea is fine. No heavy food or big drinks now.',
    kind: 'sleep',
  });
  e.push({ time: toStr(sleep), title: 'Sleep', detail: 'Aim for 7–8 hrs — recovery and appetite both depend on it.', kind: 'sleep' });

  const entries = e.sort((a, b) => toMin(a.time) - toMin(b.time));

  const gapMin = sleep - lastMeal;
  const gapNote =
    gapMin > 0 && gapMin < 150
      ? ' Your last meal is close to bedtime — nudge dinner earlier to sleep lighter and avoid bloating.'
      : '';
  const summary = `Built around a ${input.wake} wake and ${input.lastMeal} last meal.${gapNote} Times are guides — shift them to your day.`;

  return { summary, entries };
}
