import { SPLIT_TEMPLATES } from '../data/splitTemplates';
import type { WorkoutPlanResult } from '../lib/aiClient';

export type CuratedGoal = 'build' | 'lose' | 'strength' | 'general';

export const CURATED_GOALS: { value: CuratedGoal; label: string }[] = [
  { value: 'build', label: 'Build muscle' },
  { value: 'lose', label: 'Lose fat / lean' },
  { value: 'strength', label: 'Gain strength' },
  { value: 'general', label: 'General fitness' },
];

export const CURATED_LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Extreme'] as const;
export type CuratedLevel = (typeof CURATED_LEVELS)[number];

const LEVEL_SET_DELTA: Record<CuratedLevel, number> = {
  Beginner: -1,
  Novice: 0,
  Intermediate: 1,
  Advanced: 2,
  Extreme: 3,
};

// Which training focuses to run for a given weekly frequency.
function splitForDays(days: number): string[] {
  switch (days) {
    case 2:
      return ['Full body', 'Full body'];
    case 3:
      return ['Push', 'Pull', 'Legs'];
    case 4:
      return ['Upper', 'Lower', 'Upper', 'Lower'];
    case 5:
      return ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];
    default:
      return ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs']; // 6
  }
}

// Goal shapes the rep target: strength = heavy/low, fat-loss = higher reps,
// muscle/general = hypertrophy range (keep the template's own reps).
function repsForGoal(baseReps: string, goal: CuratedGoal): string {
  if (goal === 'strength') return '4-6';
  if (goal === 'lose') return '12-15';
  return baseReps;
}

const GOAL_LABEL: Record<CuratedGoal, string> = {
  build: 'Muscle',
  lose: 'Lean',
  strength: 'Strength',
  general: 'Fitness',
};

// Build a ready-made program deterministically — no AI call, no credit spent.
export function buildCuratedPlan(
  goal: CuratedGoal,
  level: CuratedLevel,
  days: number,
): WorkoutPlanResult {
  const delta = LEVEL_SET_DELTA[level] ?? 0;
  const focuses = splitForDays(days);
  const planDays = focuses.map((focus, i) => ({
    day: `Day ${i + 1}`,
    focus,
    exercises: (SPLIT_TEMPLATES[focus] ?? []).map(e => ({
      name: e.name,
      sets: Math.min(6, Math.max(2, e.sets + delta)),
      reps: repsForGoal(e.reps, goal),
    })),
  }));

  return {
    name: `${GOAL_LABEL[goal]} · ${level}`,
    description: `${days}-day ${focuses.join(' / ').toLowerCase()} split, tuned for ${level.toLowerCase()}. Swap any exercise in the planner.`,
    days: planDays,
  };
}
