// Collapses the many ways the same lift gets named (case, plurals, and
// "A / B" pick-one labels from plans) into a single canonical name, so strength
// charts and records show one continuous line instead of several near-duplicates.

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
// Rough singular key: drop a trailing "s" on each word ("presses"→"presse" is
// avoided by also trimming a trailing "e" after that only for known forms).
function key(s: string): string {
  return norm(s)
    .split(' ')
    .map(w => w.replace(/s$/, ''))
    .join(' ');
}

// "Pick one of these" plan labels → their canonical single-exercise key.
const COMPOSITE: Record<string, string> = {
  'pull up lat pulldown': 'lat pulldown',
  'lat pulldown pull up': 'lat pulldown',
  'pullup lat pulldown': 'lat pulldown',
  'barbell dumbbell curl': 'barbell curl',
  'dumbbell barbell curl': 'barbell curl',
  'barbell dumbbell bench pres': 'bench pres',
  'barbell deadlift': 'deadlift',
};

// Canonical display label for a normalized-singular key. Anything not listed
// keeps its original name (no risky merging of genuinely different moves).
const LABEL: Record<string, string> = {
  'lat pulldown': 'Lat pulldown',
  'barbell curl': 'Barbell curl',
  'bench pres': 'Bench press',
  'incline bench pres': 'Incline bench press',
  'overhead pres': 'Overhead press',
  'barbell row': 'Barbell row',
  'seated cable row': 'Seated cable row',
  'face pull': 'Face pulls',
  'lateral raise': 'Lateral raise',
  'tricep pushdown': 'Triceps pushdown',
  deadlift: 'Deadlift',
  squat: 'Squat',
  'barbell squat': 'Squat',
  'preacher curl': 'Preacher curl',
  'hammer curl': 'Hammer curl',
  'leg pres': 'Leg press',
  'romanian deadlift': 'Romanian deadlift',
};

// The canonical display name for a logged exercise.
export function canonicalExercise(name: string): string {
  let k = key(name);
  if (COMPOSITE[k]) k = COMPOSITE[k];
  return LABEL[k] ?? name.trim();
}
