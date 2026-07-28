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

type Body = { query?: string };

type FoodResult = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  confidence: 'low' | 'medium' | 'high';
};

const PROMPT = `You estimate nutrition for any food or dish the user names — including home-cooked and regional dishes (e.g. Indian, and other cuisines) that aren't in packaged-food databases.
Use the portion the user gives; if none is given, assume one typical serving and say so in the name.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"name" (string, the dish + the portion you assumed, e.g. "Aloo methi (1 bowl, ~200g)"),
"calories" (integer kcal for that portion),
"protein_g" (integer),
"carbs_g" (integer),
"fat_g" (integer),
"fiber_g" (integer),
"sodium_mg" (integer),
"confidence" ("low" | "medium" | "high").
Give realistic, honest estimates for the whole portion.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const query = (body.query ?? '').toString().trim();
  if (!query) {
    res.status(400).json({ error: 'Describe a food to estimate.' });
    return;
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 400,
      system: PROMPT,
      messages: [{ role: 'user', content: `Estimate nutrition for: ${query}` }],
    });

    const result = extractJson<FoodResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Could not estimate that food. Try again.' });
  }
}
