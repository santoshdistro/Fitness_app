// The 90-day V-taper blueprint, hardcoded so "load the plan" seeds real dates
// instead of calling the AI. Everything here is transcribed from the written
// booklet: four phases with their own targets and eating protocol, a four-week
// rotating menu, the Monday fasting protocol, and the five-day training split.
//
// Scheduling assumptions, made explicit because the booklet doesn't state them:
//   • The split runs Mon–Fri with Sat/Sun rest.
//   • The four menu weeks rotate in order from the programme start. Weeks 1–2
//     are the vegetarian menus and weeks 3–4 the hybrid ones, so a vegetarian
//     phase cycles 1→2 and a hybrid phase cycles 3→4.
//   • Monday is a fasting day throughout — the booklet gives the protocol
//     without scoping it to a phase.
//   • Tuesdays stay pure vegetarian in the hybrid phases, and the Diwali window
//     (18–23 Oct) is vegetarian whichever phase it falls in; both fall back to
//     the vegetarian menu for that week's slot.

import type { DietPlanItem } from '../lib/aiClient';

export type ProgramPhase = {
  key: string;
  name: string;
  /** Inclusive ISO dates. */
  from: string;
  to: string;
  kcal: number;
  protein: number;
  /** Pure vegetarian for the whole phase. */
  vegOnly: boolean;
  focus: string;
};

export const PROGRAM_START = '2026-08-25';
export const PROGRAM_END = '2026-11-24';

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    key: 'p1',
    name: 'Shravan / Ganpati',
    from: '2026-08-25',
    to: '2026-09-26',
    kcal: 1550,
    protein: 140,
    vegOnly: true,
    focus: 'Pure vegetarian. Spiced legumes, soya, paneer and fresh fruit.',
  },
  {
    key: 'p2',
    name: 'Hybrid non-veg',
    from: '2026-09-27',
    to: '2026-10-10',
    kcal: 1500,
    protein: 145,
    vegOnly: false,
    focus: 'Chicken breast and eggs. Tuesdays stay pure vegetarian.',
  },
  {
    key: 'p3',
    name: 'Navratri reset',
    from: '2026-10-11',
    to: '2026-10-19',
    kcal: 1550,
    protein: 138,
    vegOnly: true,
    focus: 'Pure vegetarian. Plant protein and high-volume greens.',
  },
  {
    key: 'p4',
    name: 'Hybrid cut',
    from: '2026-10-20',
    to: '2026-11-24',
    kcal: 1480,
    protein: 145,
    vegOnly: false,
    focus: 'Final push to 70.0–70.5 kg and 16–18% body fat. Diwali stays veg.',
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
  /** Label shown on the weekly-split calendar. */
  splitLabel: string;
  exercises: ProgramExercise[];
};

export const PROGRAM_SPLIT: ProgramDay[] = [
  {
    weekday: 1,
    title: 'Upper A · Lat flare & upper chest',
    splitLabel: 'Pull + Chest',
    exercises: [
      {
        name: 'Wide-Grip Lat Pulldown',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Hook grip; drive the elbows down toward your back pockets; keep the chest elevated and pull to the upper chest. Never behind the neck.',
      },
      {
        name: 'Incline Dumbbell Bench Press',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Bench at 30°; elbows tucked at 45°; press upward and inward so the dumbbells finish above the upper collarbone.',
      },
      {
        name: 'Single-Arm Dumbbell Row',
        sets: 3,
        reps: '10-12',
        restSec: 60,
        form: 'Torso parallel to the flat bench; pull the elbow toward the hip crease to reach the lower lat.',
      },
      {
        name: 'Dumbbell Lateral Raise',
        sets: 4,
        reps: '12-15',
        restSec: 45,
        form: 'Standing. Lead with the elbows, pinkies high, zero body sway.',
      },
      {
        name: 'Cable Tricep Rope Pushdown',
        sets: 3,
        reps: '12-15',
        restSec: 45,
        form: 'Pin the elbows at your sides; flare the rope apart at the bottom.',
      },
      {
        name: 'Stair Climber',
        sets: 1,
        reps: '15 min steady',
        restSec: 0,
        form: 'Steady pace, hands off the rails.',
      },
    ],
  },
  {
    weekday: 2,
    title: 'Lower body & anti-oblique core',
    splitLabel: 'Legs + Core',
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
        form: 'Soft knees, flat spine; push the hips straight back with the dumbbells close to the shins. Feel the hamstring stretch at mid-shin.',
      },
      {
        name: 'Dumbbell Walking Lunge',
        sets: 3,
        reps: '10 paces per leg',
        restSec: 60,
        form: 'Chest upright; hover the back knee an inch above the floor each step.',
      },
      {
        name: 'Hanging Leg Raise',
        sets: 4,
        reps: '12-15',
        restSec: 45,
        form: 'Roll the pelvis up toward the sternum to isolate the lower abs. Zero body swinging.',
      },
      {
        name: 'Plank',
        sets: 3,
        reps: '60s hold',
        restSec: 45,
        form: 'Floor elbow plank. Squeeze the glutes; pull the navel in toward the spine.',
      },
      {
        name: 'Incline Treadmill Walk',
        sets: 1,
        reps: '15 min · 4.8 km/h · 10% incline',
        restSec: 0,
        form: 'Steady walk at 4.8 km/h, incline 10%, hands off the rails.',
      },
    ],
  },
  {
    weekday: 3,
    title: 'Upper B · Shoulder caps & rear delts',
    splitLabel: 'Shoulders + Back',
    exercises: [
      {
        name: 'Seated Dumbbell Shoulder Press',
        sets: 4,
        reps: '8-10',
        restSec: 90,
        form: 'Bench at 85°; lower to ear level; press overhead smoothly.',
      },
      {
        name: 'Close-Grip Lat Pulldown',
        sets: 4,
        reps: '8-10',
        restSec: 75,
        form: 'Neutral V-bar. Deep overhead stretch, then pull to the upper chest with a slight arch.',
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
        form: 'Cable at knee height; constant tension pulling across the body.',
      },
      {
        name: 'Cable Face Pull',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Rope attached high, pulled to the bridge of the nose with the thumbs back. External rotation at the peak; squeeze the rear delts.',
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
    title: 'Functional power & midsection',
    splitLabel: 'Full body + Core',
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
        form: 'Plyo box. Drive through the front heel to stand tall; control the descent.',
      },
      {
        name: 'Cable Kneeling Crunch',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Hips locked stationary; curl the ribcage down toward the pelvis.',
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
        reps: '15 min · 1 min fast / 1 min steady',
        restSec: 0,
        form: 'Alternate one minute fast with one minute steady.',
      },
    ],
  },
  {
    weekday: 5,
    title: 'Frame detailing & arms',
    splitLabel: 'Shoulders + Biceps + Triceps',
    exercises: [
      {
        name: 'Lean-Away Dumbbell Lateral Raise',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Hold an upright post and lean out about 20°; raise the dumbbell to parallel.',
      },
      {
        name: 'Reverse Pec Deck Fly',
        sets: 4,
        reps: '15',
        restSec: 45,
        form: 'Squeeze the rear delts at the peak, traps relaxed. Bent-over dumbbell flyes substitute.',
      },
      {
        name: 'Incline Dumbbell Curl',
        sets: 3,
        reps: '10-12',
        restSec: 60,
        form: 'Bench at 45°; full stretch at the bottom; supinate at the top.',
      },
      {
        name: 'Overhead Cable Tricep Extension',
        sets: 3,
        reps: '12-15',
        restSec: 60,
        form: 'Low cable; extend the rope overhead to stretch the long head.',
      },
      {
        name: 'Dumbbell Hammer Curl',
        sets: 3,
        reps: '10-12',
        restSec: 45,
        form: 'Palms neutral throughout — targets the brachialis for upper-arm thickness.',
      },
      {
        name: 'Incline Treadmill Walk',
        sets: 1,
        reps: '20 min · 4.8 km/h · 11% incline',
        restSec: 0,
        form: 'Steady walk at 4.8 km/h, incline 11%, hands off the rails.',
      },
    ],
  },
];

/** Mon..Sun labels for the weekly-split calendar. */
export const PROGRAM_SPLIT_LABELS: string[] = [
  ...PROGRAM_SPLIT.map(d => d.splitLabel),
  'Rest',
  'Rest',
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

const WAKE = i('Breakfast', '07:30', '300ml warm plain water (gut reset)', 0, 0, 0, 0);
const COFFEE = i('Snack', '10:00', 'Black coffee — 1 level tsp in 150ml hot water (1pm hard cut-off)', 5, 0, 1, 0);
const FENNEL = i(
  'Dinner',
  '20:15',
  '200ml lukewarm fennel (saunf) water — swap to jeera-ajwain-hing if bloated',
  0,
  0,
  0,
  0,
);
const PREGYM = (fruit: string, kcal = 140, carbs = 8) =>
  i('Snack', '16:45', `1 scoop whey in 200ml water + ${fruit}`, kcal, 25, carbs, 2);

/** Week 1 — pure vegetarian: spiced legumes, soya, paneer, fresh fruit. */
const WEEK_1: Item[] = [
  WAKE,
  i(
    'Breakfast',
    '08:15',
    '50g oats + 150g skyr + 15g peanut butter + 15g seed mix + banana or 100g melon',
    450,
    28,
    50,
    15,
    8,
  ),
  COFFEE,
  i(
    'Lunch',
    '12:45',
    '150g rajma masala + 50g Wada Kolam rice + 50g paneer + cucumber & tomato salad + multivitamin',
    520,
    38,
    58,
    15,
    12,
  ),
  i('Snack', '15:00', '5 almonds + 2 walnuts + 1 medjool date + 100g berries or apple', 140, 3, 22, 7, 4),
  PREGYM('30g fresh pineapple'),
  i(
    'Dinner',
    '19:30',
    '50g soya chunks sautéed with peppers & onions + 150g skyr + 1 square 85% dark chocolate',
    360,
    38,
    28,
    5,
    8,
  ),
  FENNEL,
];

/** Week 2 — pure vegetarian: sprouted pulses, dals, hydrating fruit. */
const WEEK_2: Item[] = [
  WAKE,
  i(
    'Breakfast',
    '08:15',
    'Sprouted moong & urad usal (80g cooked) + 150g skyr + 150g papaya',
    430,
    27,
    60,
    7,
    11,
  ),
  COFFEE,
  i(
    'Lunch',
    '12:45',
    '150g whole soya bean & tomato curry + 50g basmati rice + carrots & cucumber + multivitamin',
    490,
    38,
    52,
    14,
    11,
  ),
  i('Snack', '15:00', '15g roasted makhana + 100g watermelon', 90, 3, 18, 1, 2),
  PREGYM('30g fresh pineapple'),
  i(
    'Dinner',
    '19:30',
    '100g grilled paneer tikka + 150g steamed broccoli & carrots + 100g 0% Greek yogurt',
    380,
    28,
    18,
    20,
    6,
  ),
  FENNEL,
];

/** Week 3 — hybrid non-veg: chicken breast, eggs, fresh fruit. */
const WEEK_3: Item[] = [
  WAKE,
  i(
    'Breakfast',
    '08:15',
    '3 whole eggs scrambled + 1 slice wholemeal toast + 100g grapefruit or berries',
    380,
    24,
    28,
    16,
    5,
  ),
  COFFEE,
  i(
    'Lunch',
    '12:45',
    '150g lemon-garlic grilled chicken breast + 50g basmati rice + steamed broccoli & carrots + multivitamin',
    430,
    46,
    42,
    6,
    7,
  ),
  i('Snack', '15:00', '100g skyr + ½ orange or 100g apple slices', 110, 13, 12, 0, 2),
  PREGYM('½ banana or 30g pineapple', 145, 10),
  i(
    'Dinner',
    '19:30',
    '150g shredded chicken breast in 15g tahini-lemon dressing over mixed salad',
    390,
    44,
    12,
    16,
    6,
  ),
  FENNEL,
];

/** Week 4 — hybrid non-veg: egg whites, spiced poultry, fruit rotations. */
const WEEK_4: Item[] = [
  WAKE,
  i(
    'Breakfast',
    '08:15',
    '1 whole egg + 3 egg whites with spinach + 40g oats in water + 100g strawberries',
    400,
    26,
    50,
    9,
    7,
  ),
  COFFEE,
  i(
    'Lunch',
    '12:45',
    '150g garam masala chicken strips + 50g Wada Kolam rice + 100g yellow moong dal + salad + multivitamin',
    490,
    52,
    48,
    7,
    10,
  ),
  i('Snack', '15:00', '15g roasted makhana + 100g pineapple or papaya', 100, 2, 20, 0, 2),
  PREGYM('100g sliced melon'),
  i(
    'Dinner',
    '19:30',
    '150g grilled chicken breast + 150g steamed broccoli & carrots + 100g 0% Greek yogurt',
    340,
    46,
    14,
    5,
    6,
  ),
  FENNEL,
];

/** Monday fasting protocol — Nutribullet elixir through to a fast-breaking bowl. */
const FAST_DAY: Item[] = [
  i(
    'Breakfast',
    '08:30',
    'Nutribullet glow elixir · apple, carrot, amla, ½ lemon, ginger, 250ml water (unstrained)',
    120,
    2,
    28,
    0,
    5,
  ),
  i('Lunch', '13:00', 'Fruit refuel · 200g watermelon or papaya + green tea', 60, 1, 14, 0, 2),
  i('Snack', '16:45', '1 scoop whey in water (pre-workout)', 116, 24, 3, 1),
  i(
    'Dinner',
    '19:30',
    'Fast-breaking bowl · 60g soya + 80g paneer bhurji + 50g spinach rice + 150g skyr + salad',
    820,
    68,
    72,
    24,
    12,
  ),
  FENNEL,
];

const VEG_WEEKS = [WEEK_1, WEEK_2];
const HYBRID_WEEKS = [WEEK_3, WEEK_4];

function inVegOverride(date: string): boolean {
  return VEG_OVERRIDE.some(w => date >= w.from && date <= w.to);
}

/** Whole weeks elapsed since the programme started, for the menu rotation. */
function weekIndex(date: string): number {
  const ms =
    new Date(`${date}T00:00:00`).getTime() - new Date(`${PROGRAM_START}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / (7 * 86400000)));
}

/** The eating plan for a date, following the phase and day-of-week rules. */
export function mealsFor(date: string): Item[] {
  const phase = phaseFor(date);
  if (!phase) return [];
  const weekday = new Date(`${date}T00:00:00`).getDay();

  // The booklet gives the Monday fast as a standing protocol, not a per-phase one.
  if (weekday === 1) return FAST_DAY;

  // Vegetarian phases cycle weeks 1→2; hybrid phases cycle 3→4. Tuesdays and the
  // Diwali window drop back to the vegetarian menu for that week's slot.
  const veg = phase.vegOnly || weekday === 2 || inVegOverride(date);
  const weeks = veg ? VEG_WEEKS : HYBRID_WEEKS;
  return weeks[weekIndex(date) % weeks.length];
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
