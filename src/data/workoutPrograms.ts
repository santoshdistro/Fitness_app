export type EquipmentPreference = 'full_gym' | 'dumbbells' | 'bodyweight' | 'minimal';

export const EQUIPMENT_OPTIONS: { value: EquipmentPreference; label: string }[] = [
  { value: 'full_gym', label: 'Full gym' },
  { value: 'dumbbells', label: 'Dumbbells only' },
  { value: 'bodyweight', label: 'Bodyweight only' },
  { value: 'minimal', label: 'Minimal equipment' },
];

export type ProgramExercise = { name: string; sets: number; reps: string };
export type ProgramDay = { day: string; focus: string; exercises: ProgramExercise[] };
export type WorkoutProgram = {
  equipment: EquipmentPreference;
  name: string;
  description: string;
  days: ProgramDay[];
};

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
          { name: 'Barbell Bench Press', sets: 4, reps: '6-8' },
          { name: 'Overhead Press', sets: 3, reps: '8-10' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
          { name: 'Triceps Pushdown', sets: 3, reps: '12-15' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Lower Body',
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: '6-8' },
          { name: 'Romanian Deadlift', sets: 3, reps: '8-10' },
          { name: 'Leg Press', sets: 3, reps: '10-12' },
          { name: 'Calf Raise', sets: 4, reps: '15-20' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Upper Body Pull',
        exercises: [
          { name: 'Pull-up', sets: 4, reps: '6-10' },
          { name: 'Barbell Row', sets: 3, reps: '8-10' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
          { name: 'Barbell Curl', sets: 3, reps: '12-15' },
        ],
      },
      {
        day: 'Day 4',
        focus: 'Lower Body & Core',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: '5-6' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12' },
          { name: 'Leg Curl', sets: 3, reps: '12-15' },
          { name: 'Hanging Leg Raise', sets: 3, reps: '12-15' },
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
          { name: 'Dumbbell Squat', sets: 4, reps: '10-12' },
          { name: 'Dumbbell Bench Press', sets: 4, reps: '10-12' },
          { name: 'Dumbbell Row', sets: 3, reps: '10-12' },
          { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Full Body B',
        exercises: [
          { name: 'Dumbbell Romanian Deadlift', sets: 4, reps: '10-12' },
          { name: 'Dumbbell Incline Press', sets: 3, reps: '10-12' },
          { name: 'Renegade Row', sets: 3, reps: '8-10' },
          { name: 'Dumbbell Lunge', sets: 3, reps: '10-12 per leg' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Full Body C',
        exercises: [
          { name: 'Goblet Squat', sets: 4, reps: '12-15' },
          { name: 'Dumbbell Floor Press', sets: 3, reps: '10-12' },
          { name: 'Single-Arm Row', sets: 3, reps: '10-12 per arm' },
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
          { name: 'Push-up', sets: 4, reps: '12-20' },
          { name: 'Pike Push-up', sets: 3, reps: '8-12' },
          { name: 'Triceps Dip (chair)', sets: 3, reps: '10-15' },
          { name: 'Plank', sets: 3, reps: '45-60s' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Legs',
        exercises: [
          { name: 'Bodyweight Squat', sets: 4, reps: '15-20' },
          { name: 'Walking Lunge', sets: 3, reps: '12 per leg' },
          { name: 'Glute Bridge', sets: 3, reps: '15-20' },
          { name: 'Calf Raise', sets: 4, reps: '20-25' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Pull & Core',
        exercises: [
          { name: 'Inverted Row (table/bar)', sets: 4, reps: '10-15' },
          { name: 'Superman', sets: 3, reps: '15-20' },
          { name: 'Bicycle Crunch', sets: 3, reps: '20-30' },
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
          { name: 'Band Chest Press', sets: 4, reps: '12-15' },
          { name: 'Push-up', sets: 3, reps: '12-15' },
          { name: 'Band Overhead Press', sets: 3, reps: '12-15' },
          { name: 'Band Triceps Pushdown', sets: 3, reps: '15-20' },
        ],
      },
      {
        day: 'Day 2',
        focus: 'Legs',
        exercises: [
          { name: 'Kettlebell Goblet Squat', sets: 4, reps: '12-15' },
          { name: 'Kettlebell Deadlift', sets: 4, reps: '10-12' },
          { name: 'Band Lateral Walk', sets: 3, reps: '15 per side' },
          { name: 'Bodyweight Calf Raise', sets: 4, reps: '20-25' },
        ],
      },
      {
        day: 'Day 3',
        focus: 'Pull',
        exercises: [
          { name: 'Band Row', sets: 4, reps: '12-15' },
          { name: 'Band Pull-Apart', sets: 3, reps: '15-20' },
          { name: 'Kettlebell Swing', sets: 3, reps: '15-20' },
          { name: 'Band Curl', sets: 3, reps: '15-20' },
        ],
      },
    ],
  },
];

export function getProgram(equipment: string | null | undefined): WorkoutProgram | null {
  return WORKOUT_PROGRAMS.find(p => p.equipment === equipment) ?? null;
}
