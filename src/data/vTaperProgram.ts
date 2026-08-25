// The 12-week V-taper programme, hardcoded so "load the plan" seeds real dates
// instead of calling the AI. Everything here comes from the written booklet:
// four phases with their own eating rules, a five-day training split, and three
// meal architectures (everyday vegetarian, Monday fast, and the non-veg variant
// used in the phases that allow it).
//
// Scheduling assumptions, made explicit because the booklet doesn't state them:
//   • Split runs Mon–Fri, Sat/Sun rest.
//   • Monday fasting applies in the pure-vegetarian phases (1 and 3). Phase 2
//     defines its non-veg window as Wed–Mon, so Monday is an eating day there,
//     and phase 4 follows the same pattern.
//   • Tuesdays stay pure vegetarian in the non-veg phases, and the Diwali
//     window (18–23 Oct) is vegetarian throughout.

import type { DietPlanItem } from '../lib/aiClient';

export type ProgramPhase = {
  key: string;
  name: string;
  /** Inclusive ISO dates. */
  from: string;
  to: string;
  kcal: string;
  protein: string;
  /** Pure vegetarian for the whole phase. */
  vegOnly: boolean;
  focus: string;
};

export const PROGRAM_START = '2026-08-24';
export const PROGRAM_END = '2026-11-24';

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    key: 'p1',
    name: 'Shravan & Ganpati Cut',
    from: '2026-08-24',
    to: '2026-09-26',
    kcal: '1,550 kcal',
    protein: '140 g protein',
    vegOnly: true,
    focus: 'Soya, paneer, skyr, besan. Fibre control, Monday fasting.',
  },
  {
    key: 'p2',
    name: 'Lean Protein Acceleration',
    from: '2026-09-27',
    to: '2026-10-10',
    kcal: '1,500 kcal',
    protein: '145 g protein',
    vegOnly: false,
    focus: 'Chicken breast and egg whites Wed–Mon. Tuesdays stay pure veg.',
  },
  {
    key: 'p3',
    name: 'Navratri Reset',
    from: '2026-10-11',
    to: '2026-10-19',
    kcal: '1,550 kcal',
    protein: '135–140 g protein',
    vegOnly: true,
    focus: 'Plant protein, high-volume greens, water shedding.',
  },
  {
    key: 'p4',
    name: 'Peak Conditioning',
    from: '2026-10-20',
    to: '2026-11-24',
    kcal: '1,450–1,500 kcal',
    protein: '145 g protein',
    vegOnly: false,
    focus: 'Final push to 70.5 kg and 16–18% body fat. Diwali stays veg.',
  },
];

/** Diwali — vegetarian regardless of which phase the date falls in. */
const VEG_OVERRIDE: { from: string; to: string }[] = [{ from: '2026-10-18', to: '2026-10-23' }];

export function phaseFor(date: string): ProgramPhase | null {
  return PROGRAM_PHASES.find(p => date >= p.from && date <= p.to) ?? null;
}

/* ---------------------------------------------------------------- Training */

export type ProgramExercise = {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  /** The booklet's form cue, surfaced as the how-to for moves with no photo. */
  form: string;
};

export type ProgramDay = {
  /** 1 = Monday … 5 = Friday. */
  weekday: number;
  title: string;
  exercises: ProgramExercise[];
};

export const PROGRAM_SPLIT: ProgramDay[] = [
  {
    weekday: 1,
    title: 'Upper A · Lat flare & upper chest',
    exercises: [
      {
        name: 'Wide-Grip Lat Pulldown',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Hook grip; drive elbows down toward your back pockets; full stretch at the top. Never pull the bar behind your neck — chest up, pull to the clavicle.',
      },
      {
        name: 'Incline Dumbbell Bench Press',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Bench on the 2nd notch (about 30°); press the dumbbells up and inward over the upper collarbone. Keep elbows at 45° to the torso, not flared to 90°.',
      },
      {
        name: 'Single-Arm Dumbbell Row',
        sets: 3,
        reps: '10-12',
        restSec: 60,
        form: 'Torso parallel to the bench; pull the elbow toward your hip crease to target the lower lat.',
      },
      {
        name: 'Dumbbell Lateral Raise',
        sets: 4,
        reps: '12-15',
        restSec: 45,
        form: 'Lead with the elbows, pinkies high, zero body sway.',
      },
      {
        name: 'Cable Tricep Rope Pushdown',
        sets: 3,
        reps: '12-15',
        restSec: 45,
        form: 'Pin the elbows at your sides; flare the rope apart aggressively at the bottom.',
      },
      {
        name: 'Stair Climber',
        sets: 1,
        reps: '15 min steady',
        restSec: 0,
        form: 'Steady pace with your hands completely off the rails.',
      },
    ],
  },
  {
    weekday: 2,
    title: 'Lower & anti-oblique core',
    exercises: [
      {
        name: 'Leg Press',
        sets: 4,
        reps: '10-12',
        restSec: 90,
        form: 'Feet shoulder-width; lower the sled until the knees reach a clean 90°.',
      },
      {
        name: 'Dumbbell Romanian Deadlift',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Soft knees; push the hips straight backward; feel a deep stretch in the hamstrings.',
      },
      {
        name: 'Dumbbell Walking Lunge',
        sets: 3,
        reps: '10 paces per leg',
        restSec: 60,
        form: 'Chest upright; hover the back knee an inch above the floor on each step.',
      },
      {
        name: 'Hanging Leg Raise',
        sets: 4,
        reps: '12-15',
        restSec: 45,
        form: 'Roll the pelvis upward at the top and curl the lower abs. No swinging — curl the pelvis toward the sternum rather than just lifting the legs.',
      },
      {
        name: 'Plank',
        sets: 3,
        reps: '60s hold',
        restSec: 45,
        form: 'Squeeze the glutes tight; pull the navel inward toward the spine.',
      },
      {
        name: 'Incline Treadmill Walk',
        sets: 1,
        reps: '15 min · 4.8 km/h · 10% incline',
        restSec: 0,
        form: 'Steady walk at 4.8 km/h with the incline at 10%. Hands off the rails.',
      },
    ],
  },
  {
    weekday: 3,
    title: 'Upper B · Shoulder caps & mid-back',
    exercises: [
      {
        name: 'Seated Dumbbell Shoulder Press',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Bench at 85°; lower the weights to ear level; press overhead smoothly.',
      },
      {
        name: 'Close-Grip Lat Pulldown',
        sets: 4,
        reps: '8-10',
        restSec: 75,
        form: 'Neutral V-bar. Deep overhead stretch, then pull the bar to the upper chest with a slight arch.',
      },
      {
        name: 'Flat Dumbbell Bench Press',
        sets: 3,
        reps: '8-10',
        restSec: 75,
        form: 'Shoulder blades retracted; elbows tucked at 45° to protect the rotator cuffs.',
      },
      {
        name: 'Single-Arm Cable Lateral Raise',
        sets: 4,
        reps: '12-15',
        restSec: 45,
        form: 'Cable set at knee height; keep constant tension pulling across the body.',
      },
      {
        name: 'Cable Face Pull',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Pull the rope to your forehead and rotate the thumbs backward to build rear delts and posture.',
      },
      {
        name: 'Elliptical Trainer',
        sets: 1,
        reps: '15 min moderate',
        restSec: 0,
        form: 'Moderate resistance, cadence above 60 RPM.',
      },
    ],
  },
  {
    weekday: 4,
    title: 'Functional power & belly flattening',
    exercises: [
      {
        name: 'Kettlebell Swing',
        sets: 4,
        reps: '15-20',
        restSec: 60,
        form: 'A hip hinge, not a squat. An explosive glute squeeze drives the bell up.',
      },
      {
        name: 'Dumbbell Box Step-Up',
        sets: 3,
        reps: '12 per leg',
        restSec: 60,
        form: 'Drive through the front heel to stand tall; control the descent smoothly.',
      },
      {
        name: 'Cable Kneeling Crunch',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Lock the hips stationary; curl the ribcage downward toward the pelvis.',
      },
      {
        name: "Farmer's Walk",
        sets: 4,
        reps: '30 metres',
        restSec: 60,
        form: 'Heavy dumbbells; stand tall, pack the shoulder blades, brace the core.',
      },
      {
        name: 'Stair Climber HIIT',
        sets: 1,
        reps: '15 min · 1 min fast / 1 min easy',
        restSec: 0,
        form: 'Alternate one minute of fast climbing with one minute of recovery pace.',
      },
    ],
  },
  {
    weekday: 5,
    title: 'Frame detailing & arms',
    exercises: [
      {
        name: 'Lean-Away Dumbbell Lateral Raise',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Hold an upright post and lean your body out about 20°; raise the dumbbell to parallel.',
      },
      {
        name: 'Reverse Pec Deck Fly',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Squeeze the rear delts at the peak; keep the traps relaxed. Bent-over dumbbell flyes work as a substitute.',
      },
      {
        name: 'Incline Dumbbell Curl',
        sets: 3,
        reps: '10-12',
        restSec: 60,
        form: 'Bench at 45°; full stretch at the bottom; supinate the wrists at the top.',
      },
      {
        name: 'Overhead Cable Tricep Extension',
        sets: 3,
        reps: '12-15',
        restSec: 60,
        form: 'Low cable setting; extend the rope overhead to stretch the long head of the tricep.',
      },
      {
        name: 'Dumbbell Hammer Curl',
        sets: 3,
        reps: '10-12',
        restSec: 45,
        form: 'Palms neutral throughout — targets the brachialis to add upper-arm thickness.',
      },
      {
        name: 'Incline Treadmill Walk',
        sets: 1,
        reps: '20 min · 4.8 km/h · 11% incline',
        restSec: 0,
        form: 'Steady walk at 4.8 km/h with the incline at 11%. Hands off the rails.',
      },
    ],
  },
];

/** The session planned for a date, or null on a rest day (Sat/Sun). */
export function workoutFor(date: string): ProgramDay | null {
  const day = new Date(`${date}T00:00:00`).getDay(); // 0 = Sunday
  return PROGRAM_SPLIT.find(d => d.weekday === day) ?? null;
}

/* ------------------------------------------------------------------ Eating */

type Item = DietPlanItem;

const i = (
  meal: string,
  time: string,
  name: string,
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  fiber_g = 0,
): Item => ({ meal, time, name, calories, protein_g, carbs_g, fat_g, fiber_g });

/** Everyday vegetarian blueprint — the default eating day. */
const VEG_DAY: Item[] = [
  i('Breakfast', '07:30', '300ml lukewarm plain water (gut reset)', 0, 0, 0, 0),
  i(
    'Breakfast',
    '08:15',
    'Overnight bowl · 50g oats + 150g skyr + 15g peanut butter + 15g seed mix + 100g fruit',
    450,
    28,
    50,
    15,
    7,
  ),
  i('Snack', '10:00', 'Black coffee, 1 tsp in 150ml hot water (caffeine cut-off 13:00)', 5, 0, 1, 0),
  i(
    'Lunch',
    '12:45',
    'Batch bowl · 50g soya chunks + 50g paneer + 50g rice & moong dal + salad',
    510,
    42,
    52,
    14,
    9,
  ),
  i('Snack', '15:00', '5 almonds + 2 walnuts + 1 medjool date', 100, 2, 9, 7, 2),
  i('Snack', '16:45', '1 scoop whey in 200ml water (pre-gym)', 140, 25, 6, 2),
  i(
    'Dinner',
    '19:30',
    'White vatana & soya ragda bowl + 150g skyr + 1 square 85% dark chocolate',
    350,
    38,
    30,
    8,
    8,
  ),
  i('Dinner', '20:15', '200ml lukewarm fennel (saunf) water', 0, 0, 0, 0),
];

/** Monday fasting protocol — pure-vegetarian phases only. */
const FAST_DAY: Item[] = [
  i(
    'Breakfast',
    '08:30',
    'Nutribullet glow elixir · apple, carrot, amla, lemon, ginger, coconut water',
    120,
    2,
    28,
    0,
    5,
  ),
  i('Lunch', '13:00', '200g watermelon or papaya + 1 cup green tea', 60, 1, 14, 0, 2),
  i('Snack', '16:45', '1 scoop whey in water (pre-workout)', 116, 24, 3, 1),
  i(
    'Dinner',
    '19:30',
    'Fast-breaking bowl · 60g soya + 80g paneer + 50g spinach rice + 150g skyr + salad',
    820,
    68,
    72,
    24,
    12,
  ),
];

/** Non-veg variant — chicken breast at lunch and dinner. */
const NONVEG_DAY: Item[] = [
  i('Breakfast', '07:30', '300ml lukewarm plain water (gut reset)', 0, 0, 0, 0),
  i(
    'Breakfast',
    '08:15',
    'Overnight bowl · 50g oats + 150g skyr + 15g peanut butter + 15g seed mix + 100g fruit',
    450,
    28,
    50,
    15,
    7,
  ),
  i('Snack', '10:00', 'Black coffee, 1 tsp in 150ml hot water (caffeine cut-off 13:00)', 5, 0, 1, 0),
  i(
    'Lunch',
    '12:45',
    '150g lemon-garlic grilled chicken breast + 50g rice & moong dal + salad',
    430,
    52,
    40,
    6,
    6,
  ),
  i('Snack', '15:00', '5 almonds + 2 walnuts + 1 medjool date', 100, 2, 9, 7, 2),
  i('Snack', '16:45', '1 scoop whey in 200ml water (pre-gym)', 140, 25, 6, 2),
  i(
    'Dinner',
    '19:30',
    '100g grilled chicken + veg stir-fry + 150g skyr + 1 square 85% dark chocolate',
    375,
    46,
    22,
    12,
    5,
  ),
  i('Dinner', '20:15', '200ml lukewarm fennel (saunf) water', 0, 0, 0, 0),
];

function inVegOverride(date: string): boolean {
  return VEG_OVERRIDE.some(w => date >= w.from && date <= w.to);
}

/** The eating plan for a date, following the phase and day-of-week rules. */
export function mealsFor(date: string): Item[] {
  const phase = phaseFor(date);
  if (!phase) return [];
  const weekday = new Date(`${date}T00:00:00`).getDay();

  // Monday fasting runs in the pure-vegetarian phases. Phase 2 defines its
  // non-veg window as Wed–Mon, so Monday is an eating day there.
  if (phase.vegOnly && weekday === 1) return FAST_DAY;

  const veg = phase.vegOnly || weekday === 2 || inVegOverride(date);
  return veg ? VEG_DAY : NONVEG_DAY;
}

/** Every date in the programme, inclusive. */
export function programDates(): string[] {
  const out: string[] = [];
  const end = new Date(`${PROGRAM_END}T00:00:00`).getTime();
  for (let d = new Date(`${PROGRAM_START}T00:00:00`); d.getTime() <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toLocaleDateString('en-CA'));
  }
  return out;
}

/** Form cue for a programme move, for the how-to fallback. */
export function programFormCue(name: string): string | null {
  for (const day of PROGRAM_SPLIT) {
    const hit = day.exercises.find(e => e.name.toLowerCase() === name.trim().toLowerCase());
    if (hit) return hit.form;
  }
  return null;
}
