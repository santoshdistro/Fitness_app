import {
  apiErrorStatus,
  extractJson,
  extractText,
  getClient,
  preflight,
  TEXT_MODEL,
  usageOf,
  type ApiReq,
  type ApiRes,
} from './_anthropic.js';

type Body = {
  goal?: string;
  diet?: string;
  likes?: string;
  dislikes?: string;
  mealsPerDay?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  days?: number;
};

type PlanItem = {
  meal: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};
type PlanDay = { items: PlanItem[] };
type PlanResult = { summary: string; days: PlanDay[] };

const PROMPT = `You are a practical diet planner. Build a realistic, varied day-by-day eating plan the user can actually follow.
Respect their diet type, likes and dislikes at all times — never include a disliked or off-diet food.
Keep each day's totals close to any calorie and protein targets provided.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2 short sentences on the approach, string),
"days" (array — one entry per day requested) where each day is:
  { "items": [ { "meal": "Breakfast"|"Lunch"|"Dinner"|"Snack", "name": specific food + portion, "calories": integer, "protein_g": integer, "carbs_g": integer, "fat_g": integer, "fiber_g": integer } ] }.
Give each day the requested number of meals, with real portion sizes and honest macro estimates. Vary the meals across days so it isn't repetitive.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const days = Math.min(Math.max(Number(body.days) || 7, 1), 7);
  const details = [
    `Number of days to plan: ${days}`,
    `Goal: ${body.goal || 'general health'}`,
    `Diet preference: ${body.diet || 'no restrictions'}`,
    body.likes ? `Foods they like: ${body.likes}` : '',
    body.dislikes ? `Foods to avoid: ${body.dislikes}` : '',
    `Meals per day: ${body.mealsPerDay || 3}`,
    body.calorieTarget ? `Daily calorie target: ${body.calorieTarget} kcal` : '',
    body.proteinTarget ? `Daily protein target: ${body.proteinTarget} g` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 5000,
      system: PROMPT,
      messages: [{ role: 'user', content: `Build my diet plan.\n${details}` }],
    });

    const result = extractJson<PlanResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res
      .status(apiErrorStatus(error))
      .json({ error: 'Could not build a plan right now. Try again.' });
  }
}
