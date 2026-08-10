// Warm-up (before) and stretch / cool-down (after) routines for a training day,
// tailored to the day's focus. Attached to every planned workout day.

export type Move = { name: string; note: string };

const GENERAL_WARMUP: Move[] = [
  { name: '5 min easy cardio', note: 'Row, bike, or brisk treadmill walk to raise your heart rate.' },
  { name: 'Arm circles', note: '10 forward + 10 back, each arm.' },
  { name: 'Leg swings', note: '10 front-to-back & 10 side-to-side per leg.' },
  { name: 'Bodyweight squats', note: '15 slow reps to open the hips & knees.' },
  { name: 'Cat–cow', note: '8 slow rounds to mobilise the spine.' },
];

const UPPER_WARMUP: Move[] = [
  { name: 'Band pull-aparts', note: '15 reps for the upper back & rear delts.' },
  { name: 'Shoulder dislocates', note: '10 slow reps with a band or stick to open the shoulders.' },
  { name: 'Push-ups', note: '10 easy reps to prime the chest & triceps.' },
];

const LOWER_WARMUP: Move[] = [
  { name: 'Walking lunges', note: '10 per leg to warm the hips & quads.' },
  { name: 'Glute bridges', note: '15 reps to switch on the glutes.' },
  { name: 'Ankle & hip circles', note: '10 each to loosen the joints.' },
];

const CORE_WARMUP: Move[] = [
  { name: 'Plank', note: '20-30s to brace the core.' },
  { name: 'Dead bug', note: '8 per side, slow and controlled.' },
];

const GENERAL_STRETCH: Move[] = [
  { name: 'Standing forward fold', note: 'Hold 30s — hamstrings & lower back.' },
  { name: 'Child’s pose', note: '30s to relax the back & shoulders.' },
];

const UPPER_STRETCH: Move[] = [
  { name: 'Cross-body shoulder stretch', note: '30s per arm.' },
  { name: 'Triceps overhead stretch', note: '30s per arm.' },
  { name: 'Chest doorway stretch', note: '30s per side — opens the chest.' },
  { name: 'Lat stretch (reach & lean)', note: '30s per side.' },
];

const LOWER_STRETCH: Move[] = [
  { name: 'Quad stretch', note: '30s per leg.' },
  { name: 'Hamstring stretch', note: '30s per leg.' },
  { name: 'Figure-4 glute stretch', note: '30s per side.' },
  { name: 'Calf stretch on a wall', note: '30s per leg.' },
];

const CORE_STRETCH: Move[] = [
  { name: 'Cobra / upward dog', note: '20-30s to stretch the abs.' },
  { name: 'Seated spinal twist', note: '30s per side.' },
];

function regions(focus: string): { upper: boolean; lower: boolean; core: boolean } {
  const f = (focus || '').toLowerCase();
  const full = /full|crossfit|conditioning/.test(f);
  return {
    upper: full || /push|pull|upper|chest|back|shoulder|arm|bicep|tricep|lat|delt|trap|row|press/.test(f),
    lower: full || /leg|lower|quad|hamstring|glute|calf|squat|lunge/.test(f),
    core: full || /core|\bab/.test(f),
  };
}

// Dynamic warm-up for a day's focus (always includes the general prep).
export function warmupFor(focus: string): Move[] {
  const r = regions(focus);
  const list = [...GENERAL_WARMUP];
  if (r.upper) list.push(...UPPER_WARMUP);
  if (r.lower) list.push(...LOWER_WARMUP);
  if (r.core) list.push(...CORE_WARMUP);
  return list;
}

// Post-workout static stretches for a day's focus.
export function stretchFor(focus: string): Move[] {
  const r = regions(focus);
  const list: Move[] = [];
  if (r.upper) list.push(...UPPER_STRETCH);
  if (r.lower) list.push(...LOWER_STRETCH);
  if (r.core) list.push(...CORE_STRETCH);
  // Always finish with a gentle general stretch; fall back to it entirely for
  // focuses that don't map (e.g. plain cardio).
  return list.length ? [...list, ...GENERAL_STRETCH] : GENERAL_STRETCH;
}
