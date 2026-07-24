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
};

type CoachMeal = { meal: string; idea: string; approxCalories: number; protein_g: number };
type CoachRecipe = { name: string; why: string; ingredients: string[]; steps: string[] };
type CoachResult = {
  summary: string;
  foods: string[];
  avoid: string[];
  dayPlan: CoachMeal[];
  recipes: CoachRecipe[];
};

const PROMPT = `You are a friendly, practical nutrition and diet coach. Using the user's goal and food preferences, draft a personalised eating plan.
Respect their diet type, likes and dislikes at all times — never suggest a disliked or off-diet food.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2 sentences of encouraging, concrete guidance, string),
"foods" (array of 6-8 specific foods to prioritise, strings),
"avoid" (array of 3-5 things to limit, strings),
"dayPlan" (array of meals for one day) where each meal is:
  { "meal": "Breakfast", "idea": short description, "approxCalories": integer, "protein_g": integer },
"recipes" (array of exactly 2 recipes) where each recipe is:
  { "name": string, "why": one sentence on why it fits, "ingredients": [string], "steps": [string] }.
Keep the day plan's calories and protein aligned with any targets provided.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const details = [
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
      max_tokens: 1600,
      system: PROMPT,
      messages: [{ role: 'user', content: `Draft my nutrition plan.\n${details}` }],
    });

    const result = extractJson<CoachResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res
      .status(apiErrorStatus(error))
      .json({ error: 'Could not draft a plan right now. Try again.' });
  }
}
