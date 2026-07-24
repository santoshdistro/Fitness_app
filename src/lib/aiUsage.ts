import { supabase } from './supabaseClient';
import { costUsd } from '../utils/aiPricing';

export type AiUsage = { model: string; input_tokens: number; output_tokens: number };
export type AiFeature = 'coach' | 'food_scan' | 'body_scan' | 'workout_plan' | 'nutrition_coach';

/**
 * Records one AI call's token usage + estimated cost for the in-app spend
 * screen. Best-effort — a logging failure never blocks the feature itself.
 */
export async function logAiUsage(
  userId: string,
  feature: AiFeature,
  usage: AiUsage,
): Promise<void> {
  try {
    await supabase.from('ai_usage').insert({
      user_id: userId,
      feature,
      model: usage.model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cost_usd: costUsd(usage.model, usage.input_tokens, usage.output_tokens),
    });
  } catch {
    // ignore — spend tracking is non-critical
  }
}
