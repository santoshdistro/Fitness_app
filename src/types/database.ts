export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  weight: number | null;
  steps: number | null;
  active_calories_burned: number | null;
  sleep_hours: number | null;
  water_ml: number | null;
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
  calculated_body_fat: number | null;
};

export type FoodLog = {
  id: string;
  user_id: string;
  meal_timestamp: string;
  meal_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};
