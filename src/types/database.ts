export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  weight: number | null;
  steps: number | null;
  active_calories_burned: number | null;
  sleep_hours: number | null;
  water_ml: number | null;
  caffeine_mg: number | null;
  mood: number | null;
  energy: number | null;
};

export type Measurement = {
  id: string;
  user_id: string;
  entry_timestamp: string;
  neck: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  biceps: number | null;
  thighs: number | null;
  belly: number | null;
  calves: number | null;
  forearms: number | null;
  calculated_body_fat: number | null;
};

export type MealCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'supplement'
  | 'other';

export type FoodLog = {
  id: string;
  user_id: string;
  meal_timestamp: string;
  meal_name: string;
  meal_category: MealCategory;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  sugar_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  poly_fat_g: number | null;
  mono_fat_g: number | null;
};

export type ProgressPhoto = {
  id: string;
  user_id: string;
  storage_path: string;
  taken_on: string;
  weight_kg: number | null;
  note: string | null;
  created_at: string;
};

export type BodyScan = {
  id: string;
  user_id: string;
  summary: string;
  focus_areas: string[];
  training_focus: string | null;
  nutrition_focus: string | null;
  created_at: string;
};

export type CardioLog = {
  id: string;
  user_id: string;
  activity_type: string;
  distance_km: number | null;
  duration_min: number | null;
  calories: number | null;
  session_timestamp: string;
  created_at: string;
};

export type ExerciseSet = {
  exercise: string;
  reps: number;
  weight: number;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  session_timestamp: string;
  routine_name: string | null;
  exercise_data: ExerciseSet[];
};
