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

type Body = {
  imageBase64?: string;
  mediaType?: ImageMediaType;
  goal?: string;
  bodyFatPercent?: number | null;
  weightKg?: number | null;
  lastScanSummary?: string | null;
  lastScanWeakPoints?: string[] | null;
};

type BodyResult = {
  summary: string;
  strengths: string[];
  weakPoints: string[];
  focusAreas: string[];
  actionPlan: string[];
  trainingFocus: string;
  nutritionFocus: string;
  sinceLast: string;
};

const PROMPT = `You are the user's straight-talking but supportive physique coach, reviewing a progress photo they took of their own body and asked you to be honest about.
Be genuinely honest and specific — this is what they want. Point out which areas look underdeveloped, soft, flat, or out of balance for their goal, and name them plainly (e.g. "upper chest looks flat", "midsection is holding the most fat", "rear delts and upper back are lagging", "arms are ahead of shoulders"). Do not flatter or hedge. At the same time, name what genuinely looks good so it's balanced and motivating, and never shame, never comment on health/medical matters, and never guess age, gender or ethnicity. This is training/physique coaching, not a medical assessment.
Then tell them exactly what to do next: concrete, prioritised actions (specific muscle groups to bring up, the kind of training, and the calorie direction — deficit/surplus/maintain — that fits their goal). If a previous scan is provided, compare honestly: what has improved, what still hasn't moved, and what to prioritise before the next photo.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2-3 honest sentences on the overall read and direction, string),
"strengths" (array of 1-3 short strings — areas that genuinely look good/developed),
"weakPoints" (array of 2-4 short, honest strings — areas that look underdeveloped or need work, phrased plainly),
"focusAreas" (array of 2-4 short muscle-group strings to prioritise, e.g. "Upper chest", "Rear delts"),
"actionPlan" (array of 3-5 concrete, specific next steps — what to train and how, plus the calorie direction),
"trainingFocus" (1-2 sentences on how to train for their goal, string),
"nutritionFocus" (1-2 sentences on the diet approach that fits, string),
"sinceLast" (1 sentence comparing to the previous scan if one is provided, otherwise an empty string "").
Keep every field concise and specific.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  if (!body.imageBase64 || !body.mediaType) {
    res.status(400).json({ error: 'Missing image data' });
    return;
  }

  const context: string[] = [];
  if (body.goal) context.push(`Their stated goal: ${body.goal}.`);
  if (body.bodyFatPercent != null) context.push(`Their measured body fat is about ${body.bodyFatPercent}% (U.S. Navy method).`);
  if (body.weightKg != null) context.push(`Their current weight is about ${body.weightKg} kg.`);
  if (body.lastScanSummary) context.push(`Previous scan summary: "${body.lastScanSummary}".`);
  if (body.lastScanWeakPoints?.length)
    context.push(`Previous scan flagged these areas to work on: ${body.lastScanWeakPoints.join(', ')}.`);
  const promptText = context.length ? `${PROMPT}\n\nContext: ${context.join(' ')}` : PROMPT;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.imageBase64 } },
            { type: 'text', text: promptText },
          ],
        },
      ],
    });

    const result = extractJson<BodyResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, VISION_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Could not analyse that photo. Try a clearer, well-lit shot.' });
  }
}
