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
  { test: /deadlift|rack pull/, muscles: ['back', 'hamstrings', 'glutes', 'lowerBack'] },
  { test: /clean|snatch/, muscles: ['back', 'hamstrings', 'glutes', 'traps'] },
  { test: /swing/, muscles: ['glutes', 'hamstrings'] },
  { test: /pull[- ]?apart/, muscles: ['shoulders', 'back'] },
  { test: /box jump|broad jump|jump squat|plyo/, muscles: ['quads', 'glutes'] },
  { test: /burpee/, muscles: ['quads', 'chest'] },
  { test: /thruster/, muscles: ['shoulders', 'quads'] },
  { test: /superman|bird[- ]?dog/, muscles: ['lowerBack'] },
  { test: /farmer|suitcase|\bcarry\b/, muscles: ['traps', 'forearms'] },
  { test: /dead hang/, muscles: ['forearms'] },
  { test: /hip thrust|glute/, muscles: ['glutes'] },
  { test: /squat|leg press|hack squat/, muscles: ['quads', 'glutes'] },
  { test: /lunge|bulgarian|step[- ]?up/, muscles: ['quads', 'glutes'] },
  { test: /leg extension|quad/, muscles: ['quads'] },
  { test: /calf|calves/, muscles: ['calves'] },
  { test: /back extension|hyperextension|lower back/, muscles: ['lowerBack'] },
  { test: /shrug|trap\b/, muscles: ['traps'] },
  { test: /face pull/, muscles: ['traps', 'shoulders'] },
  { test: /lat pulldown|pulldown|pull[- ]?up|pull up|chin[- ]?up|\blat\b/, muscles: ['back', 'biceps'] },
  { test: /upright row/, muscles: ['shoulders', 'traps'] },
  { test: /\brow\b|barbell row|seated row|cable row/, muscles: ['back'] },
  { test: /lateral raise|side raise|front raise|delt|reverse fly|rear fly|reverse pec|overhead|shoulder press|military|arnold|upright row|battle rope/, muscles: ['shoulders'] },
  { test: /pushdown|skull|kickback|close[- ]?grip|tricep|dip/, muscles: ['triceps'] },
  { test: /forearm|wrist|grip/, muscles: ['forearms'] },
  { test: /curl/, muscles: ['biceps'] },
  { test: /plank|crunch|sit[- ]?up|leg raise|russian|wood ?chop|mountain climber|\bab\b|abs|core/, muscles: ['abs'] },
  { test: /incline|bench|chest|fly|push[- ]?up|pec|crossover/, muscles: ['chest'] },
  { test: /\bpress\b/, muscles: ['chest'] },
];

export function classifyMuscles(exerciseName: string): MuscleKey[] {
  const n = exerciseName.toLowerCase();
  for (const rule of RULES) {
    if (rule.test.test(n)) return rule.muscles;
  }
  return [];
}

// The single muscle an exercise most belongs to (its primary mover) — the first
// muscle in its rule. Used to file each logged exercise under exactly one muscle
// so a "back" lift (pulldown, row, deadlift) lands under Back, not also Biceps.
export function primaryMuscle(exerciseName: string): MuscleKey | null {
  return classifyMuscles(exerciseName)[0] ?? null;
}

export type BodyRegion = 'upper' | 'lower' | 'core';

const MUSCLE_REGION: Record<MuscleKey, BodyRegion> = {
  neck: 'upper',
  chest: 'upper',
  shoulders: 'upper',
  biceps: 'upper',
  triceps: 'upper',
  forearms: 'upper',
  back: 'upper',
  traps: 'upper',
  abs: 'core',
  lowerBack: 'core',
  glutes: 'lower',
  quads: 'lower',
  hamstrings: 'lower',
  calves: 'lower',
};

// Coarse body-region for an exercise, from its primary muscle. Used to group
// the strength chart/table into upper / lower / core. Unknown names → null.
export function exerciseRegion(exerciseName: string): BodyRegion | null {
  const muscles = classifyMuscles(exerciseName);
  return muscles.length ? MUSCLE_REGION[muscles[0]] : null;
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

/** CSS gradient for a legend, so it cannot drift from what the figures draw. */
export const MUSCLE_HEAT_GRADIENT =
  'linear-gradient(90deg, var(--muscle-idle), var(--muscle-cool), var(--muscle-hot))';

/**
 * Heat colour for an intensity 0..1, between the theme's two ramp stops.
 *
 * The stops differ per theme on purpose — warm orange-to-red on white, accent
 * on black. See --muscle-cool in index.css for why the warm ramp cannot simply
 * be reused on the dark card.
 *
 * Mixed by the browser rather than in JS so it follows the live theme; a value
 * computed here would freeze to whichever theme happened to be loaded. Inline
 * color-mix is safe — the build only mangles it in hand-authored CSS.
 */
export function muscleHeat(t: number): string {
  if (t <= 0) return 'var(--muscle-idle)';
  const pct = Math.round(Math.min(1, t) * 100);
  return `color-mix(in srgb, var(--muscle-hot) ${pct}%, var(--muscle-cool))`;
}
