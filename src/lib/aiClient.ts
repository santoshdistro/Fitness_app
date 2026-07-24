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
export type WorkoutPlanResult = { name: string; description: string; days: WorkoutPlanDay[] };

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
