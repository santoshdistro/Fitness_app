import { logAiUsage, type AiUsage } from './aiUsage';
import type { EncodedImage } from '../utils/image';

export type FoodResult = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  confidence: 'low' | 'medium' | 'high';
};

export type BodyResult = {
  summary: string;
  focusAreas: string[];
  trainingFocus: string;
  nutritionFocus: string;
};

export type WorkoutPlanExercise = { name: string; sets: number; reps: string };
export type WorkoutPlanDay = { day: string; focus: string; exercises: WorkoutPlanExercise[] };
export type WorkoutProgressionStep = { label: string; detail: string };
export type WorkoutPlanResult = {
  name: string;
  description: string;
  days: WorkoutPlanDay[];
  progression?: WorkoutProgressionStep[];
};

export type NutritionMeal = { meal: string; idea: string; approxCalories: number; protein_g: number };
export type NutritionRecipe = { name: string; why: string; ingredients: string[]; steps: string[] };
export type NutritionPlanResult = {
  summary: string;
  foods: string[];
  avoid: string[];
  dayPlan: NutritionMeal[];
  recipes: NutritionRecipe[];
};

export type NutritionPreferences = {
  goal: string;
  diet: string;
  likes?: string;
  dislikes?: string;
  mealsPerDay?: number;
  calorieTarget?: number;
  proteinTarget?: number;
};

export type DietPlanItem = {
  meal: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};
export type DietPlanDay = { items: DietPlanItem[] };
export type DietPlanResult = { summary: string; days: DietPlanDay[] };
export type DietPlanInput = NutritionPreferences & { days?: number };

type ApiResponse<T> = { result?: T; usage?: AiUsage; error?: string };

async function postJson<T>(url: string, payload: unknown): Promise<{ result: T; usage?: AiUsage }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !data?.result) {
    throw new Error(data?.error ?? 'The AI request failed. Please try again.');
  }
  return { result: data.result, usage: data.usage };
}

export async function scanFood(
  userId: string,
  image: EncodedImage,
  note?: string,
): Promise<FoodResult> {
  const { result, usage } = await postJson<FoodResult>('/api/vision-food', {
    imageBase64: image.data,
    mediaType: image.mediaType,
    note,
  });
  if (usage) void logAiUsage(userId, 'food_scan', usage);
  return result;
}

export async function estimateFood(userId: string, query: string): Promise<FoodResult> {
  const { result, usage } = await postJson<FoodResult>('/api/estimate-food', { query });
  if (usage) void logAiUsage(userId, 'food_estimate', usage);
  return result;
}

export async function analyzeBody(
  userId: string,
  image: EncodedImage,
  context: { goal?: string; bodyFatPercent?: number | null },
): Promise<BodyResult> {
  const { result, usage } = await postJson<BodyResult>('/api/vision-body', {
    imageBase64: image.data,
    mediaType: image.mediaType,
    ...context,
  });
  if (usage) void logAiUsage(userId, 'body_scan', usage);
  return result;
}

export async function generateWorkoutPlan(
  userId: string,
  input: { equipment?: string; goal?: string; experience?: string; daysPerWeek?: number; notes?: string },
): Promise<WorkoutPlanResult> {
  const { result, usage } = await postJson<WorkoutPlanResult>('/api/workout-plan', input);
  if (usage) void logAiUsage(userId, 'workout_plan', usage);
  return result;
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function chatCoach(
  userId: string,
  input: { context: string; messages: ChatMessage[] },
): Promise<{ reply: string }> {
  const { result, usage } = await postJson<{ reply: string }>('/api/chat', input);
  if (usage) void logAiUsage(userId, 'chat', usage);
  return result;
}

export async function generateNutritionPlan(
  userId: string,
  input: NutritionPreferences,
): Promise<NutritionPlanResult> {
  const { result, usage } = await postJson<NutritionPlanResult>('/api/nutrition-coach', input);
  if (usage) void logAiUsage(userId, 'nutrition_coach', usage);
  return result;
}

export async function generateDietPlan(
  userId: string,
  input: DietPlanInput,
): Promise<DietPlanResult> {
  const { result, usage } = await postJson<DietPlanResult>('/api/diet-plan', input);
  if (usage) void logAiUsage(userId, 'diet_plan', usage);
  return result;
}
