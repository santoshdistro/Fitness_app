// Quick-start templates for the workout logger. Tapping one fills in the
// routine name and a sensible exercise list so you can just enter your numbers.
export type WorkoutTemplate = {
  name: string;
  emoji: string;
  exercises: { exercise: string; reps: number }[];
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    name: 'Push Day',
    emoji: '🔺',
    exercises: [
      { exercise: 'Bench Press', reps: 8 },
      { exercise: 'Overhead Press', reps: 10 },
      { exercise: 'Incline Dumbbell Press', reps: 10 },
      { exercise: 'Lateral Raise', reps: 15 },
      { exercise: 'Triceps Pushdown', reps: 12 },
    ],
  },
  {
    name: 'Pull Day',
    emoji: '🔻',
    exercises: [
      { exercise: 'Pull-up', reps: 8 },
      { exercise: 'Barbell Row', reps: 8 },
      { exercise: 'Lat Pulldown', reps: 12 },
      { exercise: 'Seated Cable Row', reps: 12 },
      { exercise: 'Barbell Curl', reps: 12 },
    ],
  },
  {
    name: 'Leg Day',
    emoji: '🦵',
    exercises: [
      { exercise: 'Barbell Squat', reps: 8 },
      { exercise: 'Romanian Deadlift', reps: 10 },
      { exercise: 'Leg Press', reps: 12 },
      { exercise: 'Lying Leg Curl', reps: 12 },
      { exercise: 'Calf Raise', reps: 15 },
    ],
  },
  {
    name: 'Upper Body',
    emoji: '💪',
    exercises: [
      { exercise: 'Bench Press', reps: 8 },
      { exercise: 'Barbell Row', reps: 8 },
      { exercise: 'Overhead Press', reps: 10 },
      { exercise: 'Lat Pulldown', reps: 12 },
      { exercise: 'Barbell Curl', reps: 12 },
      { exercise: 'Triceps Pushdown', reps: 12 },
    ],
  },
  {
    name: 'Lower Body',
    emoji: '🏋️',
    exercises: [
      { exercise: 'Barbell Squat', reps: 8 },
      { exercise: 'Romanian Deadlift', reps: 10 },
      { exercise: 'Leg Press', reps: 12 },
      { exercise: 'Lying Leg Curl', reps: 12 },
      { exercise: 'Calf Raise', reps: 15 },
    ],
  },
  {
    name: 'Full Body',
    emoji: '🔥',
    exercises: [
      { exercise: 'Barbell Squat', reps: 8 },
      { exercise: 'Bench Press', reps: 8 },
      { exercise: 'Deadlift', reps: 6 },
      { exercise: 'Overhead Press', reps: 10 },
      { exercise: 'Barbell Row', reps: 10 },
    ],
  },
  {
    name: 'Core & Abs',
    emoji: '🧱',
    exercises: [
      { exercise: 'Hanging Leg Raise', reps: 12 },
      { exercise: 'Cross-Body Crunch', reps: 20 },
      { exercise: 'Plank (seconds)', reps: 45 },
      { exercise: 'Cable Crunch', reps: 15 },
    ],
  },
];
