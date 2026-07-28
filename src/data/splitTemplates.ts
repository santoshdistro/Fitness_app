// Default exercises for each training-split focus, used to pre-populate a
// planned day from the user's weekly split without needing AI.

export type TemplateExercise = { name: string; sets: number; reps: string };

export const SPLIT_TEMPLATES: Record<string, TemplateExercise[]> = {
  Push: [
    { name: 'Barbell bench press', sets: 4, reps: '6-8' },
    { name: 'Incline dumbbell press', sets: 3, reps: '8-10' },
    { name: 'Overhead shoulder press', sets: 3, reps: '8-10' },
    { name: 'Lateral raises', sets: 3, reps: '12-15' },
    { name: 'Triceps rope pushdown', sets: 3, reps: '10-12' },
  ],
  Pull: [
    { name: 'Pull-ups / lat pulldown', sets: 4, reps: '6-10' },
    { name: 'Barbell row', sets: 4, reps: '6-8' },
    { name: 'Seated cable row', sets: 3, reps: '10-12' },
    { name: 'Face pulls', sets: 3, reps: '12-15' },
    { name: 'Barbell / dumbbell curls', sets: 3, reps: '10-12' },
  ],
  Legs: [
    { name: 'Barbell back squat', sets: 4, reps: '6-8' },
    { name: 'Romanian deadlift', sets: 3, reps: '8-10' },
    { name: 'Leg press', sets: 3, reps: '10-12' },
    { name: 'Leg curl', sets: 3, reps: '12-15' },
    { name: 'Standing calf raise', sets: 4, reps: '12-15' },
  ],
  Upper: [
    { name: 'Bench press', sets: 4, reps: '6-8' },
    { name: 'Barbell row', sets: 4, reps: '6-8' },
    { name: 'Overhead press', sets: 3, reps: '8-10' },
    { name: 'Lat pulldown', sets: 3, reps: '10-12' },
    { name: 'Curls + triceps superset', sets: 3, reps: '10-12' },
  ],
  Lower: [
    { name: 'Back squat', sets: 4, reps: '6-8' },
    { name: 'Deadlift', sets: 3, reps: '5' },
    { name: 'Walking lunges', sets: 3, reps: '10-12 / leg' },
    { name: 'Leg extension', sets: 3, reps: '12-15' },
    { name: 'Calf raise', sets: 4, reps: '12-15' },
  ],
  'Full body': [
    { name: 'Squat', sets: 3, reps: '6-8' },
    { name: 'Bench press', sets: 3, reps: '6-8' },
    { name: 'Barbell row', sets: 3, reps: '8-10' },
    { name: 'Overhead press', sets: 3, reps: '8-10' },
    { name: 'Plank', sets: 3, reps: '45-60s' },
  ],
  Cardio: [
    { name: 'Incline treadmill walk / run', sets: 1, reps: '25-35 min' },
    { name: 'Intervals (30s hard / 90s easy)', sets: 8, reps: 'rounds' },
    { name: 'Cool-down walk', sets: 1, reps: '5 min' },
  ],
  Core: [
    { name: 'Hanging leg raises', sets: 3, reps: '10-15' },
    { name: 'Cable crunch', sets: 3, reps: '12-15' },
    { name: 'Plank', sets: 3, reps: '45-60s' },
    { name: 'Russian twists', sets: 3, reps: '20' },
  ],
  Rest: [],
};

// Map an AI plan day's free-text focus onto a canonical split bucket.
export function classifyFocus(focus: string): string | null {
  const f = focus.toLowerCase();
  if (f.includes('push')) return 'Push';
  if (f.includes('pull')) return 'Pull';
  if (f.includes('leg')) return 'Legs';
  if (f.includes('upper')) return 'Upper';
  if (f.includes('lower')) return 'Lower';
  if (f.includes('full')) return 'Full body';
  if (f.includes('cardio') || f.includes('condition')) return 'Cardio';
  if (f.includes('core') || f.includes('ab')) return 'Core';
  return null;
}
