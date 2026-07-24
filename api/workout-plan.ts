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
} from './_anthropic';

type Body = {
  equipment?: string;
  goal?: string;
  experience?: string;
  daysPerWeek?: number;
  notes?: string;
};

type PlanExercise = { name: string; sets: number; reps: string };
type PlanDay = { day: string; focus: string; exercises: PlanExercise[] };
type PlanResult = { name: string; description: string; days: PlanDay[] };

const PROMPT = `You are a strength & conditioning coach. Design a personalised weekly workout program from the user's inputs.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"name" (short program name, string),
"description" (1 sentence summary, string),
"days" (array, one entry per training day) where each day is:
  { "day": "Day 1", "focus": "e.g. Push", "exercises": [ { "name": string, "sets": integer, "reps": "e.g. 8-12" } ] }.
Rules:
- Only prescribe exercises possible with the stated equipment.
- Match volume and intensity to the stated experience level and goal.
- Give 4-6 exercises per day. Produce exactly the requested number of training days.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const details = [
    `Equipment available: ${body.equipment || 'basic gym'}`,
    `Goal: ${body.goal || 'build muscle'}`,
    `Experience: ${body.experience || 'beginner'}`,
    `Training days per week: ${body.daysPerWeek || 3}`,
    body.notes ? `Extra notes: ${body.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 1500,
      system: PROMPT,
      messages: [{ role: 'user', content: `Build my program.\n${details}` }],
    });

    const result = extractJson<PlanResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Could not generate a plan right now. Try again.' });
  }
}
