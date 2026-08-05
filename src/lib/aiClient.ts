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
  strengths: string[];
  weakPoints: string[];
  focusAreas: string[];
  actionPlan: string[];
  trainingFocus: string;
  nutritionFocus: string;
  sinceLast: string;
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
  /** Optional local meal time, "HH:MM". Falls back to a per-meal default. */
  time?: string;
};
export type DietPlanDay = { items: DietPlanItem[] };
export type DietPlanResult = { summary: string; days: DietPlanDay[] };
// dayTypes: Mon..Sun kind of day (Veg / Non-veg / IF 16:8 / Fasting (OMAD) …).
// The extra fields let the plan read like a dietitian's: where each day is
// spent (Home = cook fresh, Office = easy prep / salads / portable), what the
// person already has, their preferred breakfast, and cook-fresh vs batch-prep.
export type DietPlanInput = NutritionPreferences & {
  days?: number;
  dayTypes?: string[];
  dayLocations?: string[]; // aligned with dayTypes; 'Home' | 'Office'
  ingredients?: string;
  breakfast?: string;
  prepStyle?: string;
};

export type MealPrepItem = {
  name: string;
  batch: string; // how much to cook / batch note
  keeps: string; // fridge / freezer shelf life
  reuse: string; // how to reuse it through the week
  protein_g?: number;
  calories?: number;
};
export type MealPrepResult = { summary: string; items: MealPrepItem[]; shoppingList: string[] };

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
  context: {
    goal?: string;
    bodyFatPercent?: number | null;
    weightKg?: number | null;
    lastScanSummary?: string | null;
    lastScanWeakPoints?: string[] | null;
    measurementsSummary?: string | null;
    activity?: string | null;
    recentTraining?: string | null;
    scanCount?: number | null;
  },
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

// Daily eating & wellness schedule — shares the diet-plan function
// (kind:'schedule'). Returns the same shape as the curated builder.
export async function generateDaySchedule(
  userId: string,
  input: { wake: string; gym: string | null; lastMeal: string; sleep: string; hasWorkout: boolean; goal?: string; diet?: string; notes?: string },
): Promise<import('./daySchedule').DaySchedule> {
  const { result, usage } = await postJson<import('./daySchedule').DaySchedule>('/api/diet-plan', {
    ...input,
    kind: 'schedule',
  });
  if (usage) void logAiUsage(userId, 'diet_plan', usage);
  return result;
}

// Weekend batch-cook planner — shares the diet-plan function (kind:'prep') to
// stay within the serverless function budget.
export async function generateMealPrep(
  userId: string,
  input: { goal?: string; diet?: string; likes?: string; dislikes?: string; servings?: number },
): Promise<MealPrepResult> {
  const { result, usage } = await postJson<MealPrepResult>('/api/diet-plan', { ...input, kind: 'prep' });
  if (usage) void logAiUsage(userId, 'diet_plan', usage);
  return result;
}

export type RecipeIngredient = { item: string; grams: number };
export type RecipeResult = {
  title: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tip?: string;
};

// How-to-prep recipe for a planned meal, with per-ingredient gram quantities.
// Shares the diet-plan function (kind:'recipe').
export async function generateRecipe(
  userId: string,
  input: { mealName: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; diet?: string },
): Promise<RecipeResult> {
  const { result, usage } = await postJson<RecipeResult>('/api/diet-plan', {
    kind: 'recipe',
    mealName: input.mealName,
    calorieTarget: input.calories,
    proteinTarget: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
    diet: input.diet,
  });
  if (usage) void logAiUsage(userId, 'diet_plan', usage);
  return result;
}
