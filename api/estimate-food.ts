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

RAW vs COOKED — this matters a lot for dry staples (rice, pasta, oats, lentils/dal, quinoa):
- Cooking does NOT add calories, it adds water. So 100g dry rice (~360 kcal) becomes ~250-300g cooked with the SAME ~360 kcal.
- If the user says "raw", "dry" or "uncooked", use the dry weight and its dry calorie density.
- If the user says "cooked", "boiled" or "prepared", use the cooked density (much lower per 100g).
- If they give a weight but DON'T say which, assume it is the COOKED/as-served weight (that is how people usually weigh a plate) and use cooked density.
- ALWAYS make the state explicit in the name, e.g. "White rice (cooked, ~200g)" or "Rolled oats (dry, 50g)", so the user can see which basis you used.

Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"name" (string, the dish + raw/cooked state + the portion you assumed, e.g. "White rice (cooked, ~200g)"),
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
