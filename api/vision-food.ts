import {
  apiErrorStatus,
  extractJson,
  extractText,
  getClient,
  preflight,
  usageOf,
  VISION_MODEL,
  type ApiReq,
  type ApiRes,
  type ImageMediaType,
} from './_anthropic.js';

type Body = { imageBase64?: string; mediaType?: ImageMediaType; note?: string };

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

const PROMPT = `You estimate nutrition from a photo of a meal.
Estimate the nutrition for the WHOLE visible portion shown (not per 100g).
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"name" (short dish name, string),
"calories" (kcal, integer),
"protein_g" (grams, integer),
"carbs_g" (grams, integer),
"fat_g" (grams, integer),
"fiber_g" (grams, integer),
"sodium_mg" (integer),
"confidence" (one of "low", "medium", "high").
Give your best estimate even if unsure, and set confidence accordingly.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  if (!body.imageBase64 || !body.mediaType) {
    res.status(400).json({ error: 'Missing image data' });
    return;
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.imageBase64 } },
            { type: 'text', text: body.note ? `${PROMPT}\n\nUser note: ${body.note}` : PROMPT },
          ],
        },
      ],
    });

    const result = extractJson<FoodResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, VISION_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Could not read that photo. Try a clearer shot.' });
  }
}
