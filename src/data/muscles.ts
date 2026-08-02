// Muscle groups, an exercise-name -> muscle classifier, and a few sample
// exercises per muscle. Used by the body-map heatmap and the tap-to-browse view.

export type MuscleKey =
  | 'neck'
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'back'
  | 'traps'
  | 'lowerBack'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export const MUSCLE_LABEL: Record<MuscleKey, string> = {
  neck: 'Neck',
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  back: 'Back / lats',
  traps: 'Traps',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

// Ordered keyword rules — first matching multi-word rules win where it matters
// (e.g. "leg curl" -> hamstrings before the generic "curl" -> biceps).
const RULES: { test: RegExp; muscles: MuscleKey[] }[] = [
  { test: /\bneck\b/, muscles: ['neck'] },
  { test: /leg curl|lying curl|seated curl.*ham|hamstring/, muscles: ['hamstrings'] },
  { test: /romanian|rdl|good morning|stiff leg/, muscles: ['hamstrings', 'glutes', 'lowerBack'] },
  { test: /deadlift/, muscles: ['back', 'hamstrings', 'glutes', 'lowerBack'] },
  { test: /hip thrust|glute/, muscles: ['glutes'] },
  { test: /squat|leg press|hack squat/, muscles: ['quads', 'glutes'] },
  { test: /lunge|bulgarian|step[- ]?up/, muscles: ['quads', 'glutes'] },
  { test: /leg extension|quad/, muscles: ['quads'] },
  { test: /calf|calves/, muscles: ['calves'] },
  { test: /back extension|hyperextension|lower back/, muscles: ['lowerBack'] },
  { test: /shrug|trap\b/, muscles: ['traps'] },
  { test: /face pull/, muscles: ['traps', 'shoulders'] },
  { test: /lat pulldown|pulldown|pull[- ]?up|pull up|chin[- ]?up|\blat\b/, muscles: ['back', 'biceps'] },
  { test: /\brow\b|barbell row|seated row|cable row/, muscles: ['back'] },
  { test: /lateral raise|side raise|delt|overhead|shoulder press|military|arnold|upright row/, muscles: ['shoulders'] },
  { test: /pushdown|skull|kickback|close[- ]?grip|tricep|dip/, muscles: ['triceps'] },
  { test: /forearm|wrist|grip/, muscles: ['forearms'] },
  { test: /curl/, muscles: ['biceps'] },
  { test: /plank|crunch|sit[- ]?up|leg raise|russian|\bab\b|abs|core/, muscles: ['abs'] },
  { test: /incline|bench|chest|fly|push[- ]?up|pec/, muscles: ['chest'] },
  { test: /\bpress\b/, muscles: ['chest'] },
];

export function classifyMuscles(exerciseName: string): MuscleKey[] {
  const n = exerciseName.toLowerCase();
  for (const rule of RULES) {
    if (rule.test.test(n)) return rule.muscles;
  }
  return [];
}

export const MUSCLE_EXERCISES: Record<MuscleKey, string[]> = {
  neck: ['Neck curls', 'Neck extension', 'Weighted neck harness', 'Neck side flexion'],
  chest: ['Barbell bench press', 'Incline dumbbell press', 'Chest fly', 'Push-ups', 'Cable crossover'],
  shoulders: ['Overhead press', 'Lateral raises', 'Arnold press', 'Rear delt fly', 'Upright row'],
  biceps: ['Barbell curl', 'Dumbbell curl', 'Hammer curl', 'Preacher curl', 'Cable curl'],
  triceps: ['Triceps pushdown', 'Skull crushers', 'Close-grip bench', 'Overhead extension', 'Dips'],
  forearms: ['Wrist curls', 'Reverse curls', 'Farmer’s carry', 'Dead hang'],
  abs: ['Hanging leg raises', 'Cable crunch', 'Plank', 'Russian twists', 'Ab wheel'],
  back: ['Pull-ups', 'Lat pulldown', 'Barbell row', 'Seated cable row', 'Deadlift'],
  traps: ['Barbell shrugs', 'Dumbbell shrugs', 'Face pulls', 'Upright rows'],
  lowerBack: ['Back extensions', 'Romanian deadlift', 'Good mornings', 'Deadlift'],
  glutes: ['Hip thrust', 'Barbell squat', 'Bulgarian split squat', 'Glute bridge', 'Lunges'],
  quads: ['Barbell squat', 'Leg press', 'Leg extension', 'Walking lunges', 'Hack squat'],
  hamstrings: ['Romanian deadlift', 'Leg curl', 'Good mornings', 'Nordic curl'],
  calves: ['Standing calf raise', 'Seated calf raise', 'Calf press'],
};

// --- Exercises per muscle, backed by the how-to database where possible ---
import { EXERCISE_DETAILS } from './exerciseDetails';

const DETAIL_MUSCLE: Record<string, MuscleKey> = {
  neck: 'neck',
  abdominals: 'abs',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'back',
  'lower back': 'lowerBack',
  'middle back': 'back',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  triceps: 'triceps',
  forearms: 'forearms',
  traps: 'traps',
};

export type MuscleExercise = { id?: string; name: string };

// Exercises that train a muscle. Prefers the how-to DB (so a tap opens a proper
// guide); falls back to the curated name list for muscles it doesn't cover.
export function exercisesForMuscle(m: MuscleKey): MuscleExercise[] {
  const fromDb: MuscleExercise[] = [];
  for (const [id, d] of Object.entries(EXERCISE_DETAILS)) {
    if (d.primaryMuscles.some(pm => DETAIL_MUSCLE[pm] === m)) {
      fromDb.push({ id, name: id.replace(/_/g, ' ') });
    }
  }
  if (fromDb.length > 0) return fromDb;
  return (MUSCLE_EXERCISES[m] ?? []).map(name => ({ name }));
}

// Heat colour from an intensity 0..1 (light orange -> deep red). 0 = idle.
export function muscleHeat(t: number): string {
  if (t <= 0) return '#dfe3ea';
  const from = [253, 186, 116]; // #fdba74 light orange
  const to = [185, 28, 28]; // #b91c1c deep red
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * Math.min(1, t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
