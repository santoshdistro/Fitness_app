import type { ProgramDay } from './workoutPrograms';

// Predefined programs organised by goal / body part (exercise IDs map into the
// bundled exercise-detail database, so every move is tappable for a how-to).
export type GoalProgram = {
  id: string;
  name: string;
  focus: string;
  emoji: string;
  gradient: [string, string];
  days: ProgramDay[];
};

export const GOAL_PROGRAMS: GoalProgram[] = [
  {
    id: 'muscle_building',
    name: 'General muscle building',
    focus: 'Full-body · 3 days',
    emoji: '💪',
    gradient: ['#6c63ff', '#4b3fe0'],
    days: [
      {
        day: 'Day 1',
        focus: 'Push',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', exerciseId: 'Barbell_Bench_Press_-_Medium_Grip' },
          { name: 'Overhead Press', sets: 3, reps: '8-10', exerciseId: 'Standing_Military_Press' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', exerciseId: 'Incline_Dumbbell_Press' },
          { name: 'Triceps Pushdown', sets: 3, reps: '12-15', exerciseId: 'Triceps_Pushdown' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Pull',
        exercises: [
          { name: 'Pull-up', sets: 4, reps: '6-10', exerciseId: 'Pullups' },
          { name: 'Barbell Row', sets: 3, reps: '8-10', exerciseId: 'Bent_Over_Barbell_Row' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', exerciseId: 'Wide-Grip_Lat_Pulldown' },
          { name: 'Barbell Curl', sets: 3, reps: '12-15', exerciseId: 'Barbell_Curl' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Legs',
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: '6-8', exerciseId: 'Barbell_Squat' },
          { name: 'Romanian Deadlift', sets: 3, reps: '8-10', exerciseId: 'Romanian_Deadlift' },
          { name: 'Leg Press', sets: 3, reps: '10-12', exerciseId: 'Leg_Press' },
          { name: 'Calf Raise', sets: 4, reps: '15-20', exerciseId: 'Standing_Barbell_Calf_Raise' },
        ],
      },
    ],
  },
  {
    id: 'chest',
    name: 'Powerful chest',
    focus: 'Chest session',
    emoji: '🎯',
    gradient: ['#ef4444', '#b91c1c'],
    days: [
      {
        day: 'Chest day',
        focus: 'Build a bigger chest',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', exerciseId: 'Barbell_Bench_Press_-_Medium_Grip' },
          { name: 'Incline Dumbbell Press', sets: 4, reps: '8-12', exerciseId: 'Incline_Dumbbell_Press' },
          { name: 'Dumbbell Bench Press', sets: 3, reps: '10-12', exerciseId: 'Dumbbell_Bench_Press' },
          { name: 'Cable Chest Press', sets: 3, reps: '12-15', exerciseId: 'Standing_Cable_Chest_Press' },
          { name: 'Wide Push-up', sets: 3, reps: 'To failure', exerciseId: 'Push-Up_Wide' },
        ],
      },
    ],
  },
  {
    id: 'arms',
    name: 'Big arms',
    focus: 'Biceps & triceps',
    emoji: '💥',
    gradient: ['#f59e0b', '#d97706'],
    days: [
      {
        day: 'Arm day',
        focus: 'Biceps + triceps supersets',
        exercises: [
          { name: 'Barbell Curl', sets: 4, reps: '8-12', exerciseId: 'Barbell_Curl' },
          { name: 'Triceps Pushdown', sets: 4, reps: '10-15', exerciseId: 'Triceps_Pushdown' },
          { name: 'EZ-Bar Curl', sets: 3, reps: '10-12', exerciseId: 'Close-Grip_EZ-Bar_Curl_with_Band' },
          { name: 'Triceps Dips', sets: 3, reps: '8-12', exerciseId: 'Dips_-_Triceps_Version' },
        ],
      },
    ],
  },
  {
    id: 'back',
    name: 'Wide back',
    focus: 'Lats & upper back',
    emoji: '🦅',
    gradient: ['#0ea5e9', '#0369a1'],
    days: [
      {
        day: 'Back day',
        focus: 'Build a wider back',
        exercises: [
          { name: 'Pull-up', sets: 4, reps: '6-10', exerciseId: 'Pullups' },
          { name: 'Barbell Row', sets: 4, reps: '8-10', exerciseId: 'Bent_Over_Barbell_Row' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', exerciseId: 'Wide-Grip_Lat_Pulldown' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12', exerciseId: 'Seated_Cable_Rows' },
          { name: 'One-Arm Dumbbell Row', sets: 3, reps: '10-12', exerciseId: 'One-Arm_Dumbbell_Row' },
        ],
      },
    ],
  },
  {
    id: 'shoulders',
    name: 'Boulder shoulders',
    focus: 'Delts',
    emoji: '🪨',
    gradient: ['#8b5cf6', '#6d28d9'],
    days: [
      {
        day: 'Shoulder day',
        focus: 'Round, capped delts',
        exercises: [
          { name: 'Overhead Press', sets: 4, reps: '6-10', exerciseId: 'Standing_Military_Press' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', exerciseId: 'Dumbbell_Shoulder_Press' },
          { name: 'Band Pull-Apart', sets: 3, reps: '15-20', exerciseId: 'Band_Pull_Apart' },
        ],
      },
    ],
  },
  {
    id: 'legs',
    name: 'Strong legs',
    focus: 'Quads, hams & glutes',
    emoji: '🦵',
    gradient: ['#10b981', '#047857'],
    days: [
      {
        day: 'Leg day',
        focus: 'Full lower body',
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: '6-8', exerciseId: 'Barbell_Squat' },
          { name: 'Romanian Deadlift', sets: 3, reps: '8-10', exerciseId: 'Romanian_Deadlift' },
          { name: 'Leg Press', sets: 3, reps: '10-12', exerciseId: 'Leg_Press' },
          { name: 'Lying Leg Curl', sets: 3, reps: '12-15', exerciseId: 'Lying_Leg_Curls' },
          { name: 'Calf Raise', sets: 4, reps: '15-20', exerciseId: 'Standing_Barbell_Calf_Raise' },
        ],
      },
    ],
  },
  {
    id: 'weight_loss',
    name: 'Weight loss',
    focus: 'Full-body fat-burn circuit',
    emoji: '🔥',
    gradient: ['#ec4899', '#be185d'],
    days: [
      {
        day: 'Circuit',
        focus: '3 rounds, minimal rest',
        exercises: [
          { name: 'Goblet Squat', sets: 3, reps: '15', exerciseId: 'Goblet_Squat' },
          { name: 'Wide Push-up', sets: 3, reps: '12-15', exerciseId: 'Push-Up_Wide' },
          { name: 'Kettlebell Swing', sets: 3, reps: '20', exerciseId: 'One-Arm_Kettlebell_Swings' },
          { name: 'Walking Lunge', sets: 3, reps: '12 / leg', exerciseId: 'Dumbbell_Lunges' },
          { name: 'Plank', sets: 3, reps: '45-60s', exerciseId: 'Plank' },
        ],
      },
    ],
  },
  {
    id: 'six_pack',
    name: 'Six-pack core',
    focus: 'Abs & core',
    emoji: '🧱',
    gradient: ['#14b8a6', '#0f766e'],
    days: [
      {
        day: 'Core day',
        focus: 'Carve out your abs',
        exercises: [
          { name: 'Hanging Leg Raise', sets: 4, reps: '12-15', exerciseId: 'Hanging_Leg_Raise' },
          { name: 'Cross-Body Crunch', sets: 3, reps: '20-30', exerciseId: 'Cross-Body_Crunch' },
          { name: 'Plank', sets: 3, reps: '45-60s', exerciseId: 'Plank' },
          { name: 'Superman', sets: 3, reps: '15-20', exerciseId: 'Superman' },
          { name: 'Glute Bridge', sets: 3, reps: '15-20', exerciseId: 'Single_Leg_Glute_Bridge' },
        ],
      },
    ],
  },
];
