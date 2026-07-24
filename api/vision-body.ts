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
} from './_anthropic';

type Body = {
  imageBase64?: string;
  mediaType?: ImageMediaType;
  goal?: string;
  bodyFatPercent?: number | null;
};

type BodyResult = {
  summary: string;
  focusAreas: string[];
  trainingFocus: string;
  nutritionFocus: string;
};

const PROMPT = `You are a supportive, knowledgeable fitness coach reviewing a progress photo the user took of their own body.
Give encouraging, practical, directional guidance to help them build a leaner, more defined physique. This is general fitness coaching, not a medical or clinical assessment — never diagnose, never comment on health conditions, and be body-positive.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2-3 warm sentences on what you observe and the overall direction, string),
"focusAreas" (array of 2-4 short muscle-group or area strings to prioritise, e.g. "Core", "Upper chest"),
"trainingFocus" (1-2 sentences on how to train for their goal, string),
"nutritionFocus" (1-2 sentences on the diet approach that fits, string).
Keep every field concise.`;

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
  const promptText = context.length ? `${PROMPT}\n\nContext: ${context.join(' ')}` : PROMPT;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 500,
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
