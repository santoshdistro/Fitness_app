export type EquipmentPreference = 'full_gym' | 'dumbbells' | 'bodyweight' | 'minimal';

export const EQUIPMENT_OPTIONS: { value: EquipmentPreference; label: string }[] = [
  { value: 'full_gym', label: 'Full gym' },
  { value: 'dumbbells', label: 'Dumbbells only' },
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'minimal', label: 'Minimal equipment' },
];

/**
 * `exerciseId` points at an entry in the free-exercise-db (yuhonas/free-exercise-db,
 * MIT-licensed, no API key) so we can show a real reference photo. Exercises with no
 * close match in that database are left without an id and fall back to a plain icon.
 */
export type ProgramExercise = { name: string; sets: number; reps: string; exerciseId?: string };
export type ProgramDay = { day: string; focus: string; exercises: ProgramExercise[] };
export type WorkoutProgram = {
  equipment: EquipmentPreference;
  name: string;
  description: string;
  days: ProgramDay[];
};

const EXERCISE_IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export function exerciseImageUrl(exerciseId: string): string {
  return `${EXERCISE_IMAGE_BASE}/${exerciseId}/0.jpg`;
}

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    equipment: 'full_gym',
    name: 'Full Gym Split',
    description: '4-day upper/lower split using barbells, machines, and cables.',
    days: [
      {
        day: 'Day 1',
        focus: 'Upper Body Push',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8', exerciseId: 'Barbell_Bench_Press_-_Medium_Grip' },
          { name: 'Overhead Press', sets: 3, reps: '8-10', exerciseId: 'Standing_Military_Press' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', exerciseId: 'Incline_Dumbbell_Press' },
          { name: 'Triceps Pushdown', sets: 3, reps: '12-15', exerciseId: 'Triceps_Pushdown' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Lower Body',
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: '6-8', exerciseId: 'Barbell_Squat' },
          { name: 'Romanian Deadlift', sets: 3, reps: '8-10', exerciseId: 'Romanian_Deadlift' },
          { name: 'Leg Press', sets: 3, reps: '10-12', exerciseId: 'Leg_Press' },
          { name: 'Calf Raise', sets: 4, reps: '15-20', exerciseId: 'Standing_Barbell_Calf_Raise' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Upper Body Pull',
        exercises: [
          { name: 'Pull-up', sets: 4, reps: '6-10', exerciseId: 'Pullups' },
          { name: 'Barbell Row', sets: 3, reps: '8-10', exerciseId: 'Bent_Over_Barbell_Row' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12', exerciseId: 'Wide-Grip_Lat_Pulldown' },
          { name: 'Barbell Curl', sets: 3, reps: '12-15', exerciseId: 'Barbell_Curl' },
        ],
      },
      {
        day: 'Day 4',
        focus: 'Lower Body & Core',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: '5-6', exerciseId: 'Barbell_Deadlift' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', exerciseId: 'Split_Squat_with_Dumbbells' },
          { name: 'Leg Curl', sets: 3, reps: '12-15', exerciseId: 'Lying_Leg_Curls' },
          { name: 'Hanging Leg Raise', sets: 3, reps: '12-15', exerciseId: 'Hanging_Leg_Raise' },
        ],
      },
    ],
  },
  {
    equipment: 'dumbbells',
    name: 'Dumbbell Only Program',
    description: '3-day full-body program using just a pair of dumbbells.',
    days: [
      {
        day: 'Day 1',
        focus: 'Full Body A',
        exercises: [
          { name: 'Dumbbell Squat', sets: 4, reps: '10-12', exerciseId: 'Dumbbell_Squat' },
          { name: 'Dumbbell Bench Press', sets: 4, reps: '10-12', exerciseId: 'Dumbbell_Bench_Press' },
          { name: 'Dumbbell Row', sets: 3, reps: '10-12', exerciseId: 'One-Arm_Dumbbell_Row' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', exerciseId: 'Dumbbell_Shoulder_Press' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Full Body B',
        exercises: [
          { name: 'Dumbbell Romanian Deadlift', sets: 4, reps: '10-12', exerciseId: 'Stiff-Legged_Dumbbell_Deadlift' },
          { name: 'Dumbbell Incline Press', sets: 3, reps: '10-12', exerciseId: 'Incline_Dumbbell_Press' },
          { name: 'Renegade Row', sets: 3, reps: '8-10', exerciseId: 'Alternating_Renegade_Row' },
          { name: 'Dumbbell Lunge', sets: 3, reps: '10-12 per leg', exerciseId: 'Dumbbell_Lunges' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Full Body C',
        exercises: [
          { name: 'Goblet Squat', sets: 4, reps: '12-15', exerciseId: 'Goblet_Squat' },
          { name: 'Dumbbell Floor Press', sets: 3, reps: '10-12', exerciseId: 'Dumbbell_Floor_Press' },
          { name: 'Single-Arm Row', sets: 3, reps: '10-12 per arm', exerciseId: 'One-Arm_Dumbbell_Row' },
          { name: 'Dumbbell Curl & Press', sets: 3, reps: '10-12' },
        ],
      },
    ],
  },
  {
    equipment: 'bodyweight',
    name: 'Bodyweight Only Program',
    description: '3-day full-body program with no equipment needed.',
    days: [
      {
        day: 'Day 1',
        focus: 'Push & Core',
        exercises: [
          { name: 'Push-up', sets: 4, reps: '12-20', exerciseId: 'Push-Up_Wide' },
          { name: 'Pike Push-up', sets: 3, reps: '8-12' },
          { name: 'Triceps Dip (chair)', sets: 3, reps: '10-15', exerciseId: 'Dips_-_Triceps_Version' },
          { name: 'Plank', sets: 3, reps: '45-60s', exerciseId: 'Plank' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Legs',
        exercises: [
          { name: 'Bodyweight Squat', sets: 4, reps: '15-20', exerciseId: 'Bodyweight_Squat' },
          { name: 'Walking Lunge', sets: 3, reps: '12 per leg', exerciseId: 'Bodyweight_Walking_Lunge' },
          { name: 'Glute Bridge', sets: 3, reps: '15-20', exerciseId: 'Single_Leg_Glute_Bridge' },
          { name: 'Calf Raise', sets: 4, reps: '20-25' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Pull & Core',
        exercises: [
          { name: 'Inverted Row (table/bar)', sets: 4, reps: '10-15', exerciseId: 'Inverted_Row' },
          { name: 'Superman', sets: 3, reps: '15-20', exerciseId: 'Superman' },
          { name: 'Bicycle Crunch', sets: 3, reps: '20-30', exerciseId: 'Cross-Body_Crunch' },
          { name: 'Side Plank', sets: 3, reps: '30-45s per side' },
        ],
      },
    ],
  },
  {
    equipment: 'minimal',
    name: 'Minimal Equipment Program',
    description: '3-day program using resistance bands and/or a single kettlebell.',
    days: [
      {
        day: 'Day 1',
        focus: 'Push',
        exercises: [
          { name: 'Band Chest Press', sets: 4, reps: '12-15', exerciseId: 'Standing_Cable_Chest_Press' },
          { name: 'Push-up', sets: 3, reps: '12-15', exerciseId: 'Push-Up_Wide' },
          { name: 'Band Overhead Press', sets: 3, reps: '12-15', exerciseId: 'Standing_Military_Press' },
          { name: 'Band Triceps Pushdown', sets: 3, reps: '15-20', exerciseId: 'Triceps_Pushdown' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Legs',
        exercises: [
          { name: 'Kettlebell Goblet Squat', sets: 4, reps: '12-15', exerciseId: 'Goblet_Squat' },
          { name: 'Kettlebell Deadlift', sets: 4, reps: '10-12', exerciseId: 'Kettlebell_One-Legged_Deadlift' },
          { name: 'Band Lateral Walk', sets: 3, reps: '15 per side' },
          { name: 'Bodyweight Calf Raise', sets: 4, reps: '20-25' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Pull',
        exercises: [
          { name: 'Band Row', sets: 4, reps: '12-15', exerciseId: 'Seated_Cable_Rows' },
          { name: 'Band Pull-Apart', sets: 3, reps: '15-20', exerciseId: 'Band_Pull_Apart' },
          { name: 'Kettlebell Swing', sets: 3, reps: '15-20', exerciseId: 'One-Arm_Kettlebell_Swings' },
          { name: 'Band Curl', sets: 3, reps: '15-20', exerciseId: 'Close-Grip_EZ-Bar_Curl_with_Band' },
        ],
      },
    ],
  },
];

export function getProgram(equipment: string | null | undefined): WorkoutProgram | null {
  return WORKOUT_PROGRAMS.find(p => p.equipment === equipment) ?? null;
}
