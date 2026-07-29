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
  equipment?: string;
  goal?: string;
  experience?: string;
  daysPerWeek?: number;
  notes?: string;
};

type PlanExercise = { name: string; sets: number; reps: string };
type PlanDay = { day: string; focus: string; exercises: PlanExercise[] };
type ProgressionStep = { label: string; detail: string };
type PlanResult = { name: string; description: string; days: PlanDay[]; progression: ProgressionStep[] };

const PROMPT = `You are a strength & conditioning coach. Design a personalised weekly workout program from the user's inputs that PROGRESSIVELY OVERLOADS week by week.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"name" (short program name, string),
"description" (1 sentence summary, string),
"days" (array, one entry per training day) where each day is:
  { "day": "Day 1", "focus": "e.g. Push", "exercises": [ { "name": string, "sets": integer, "reps": "e.g. 8-12" } ] },
"progression" (array of 4-5 steps describing how to advance week by week) where each step is:
  { "label": "e.g. Week 1-2", "detail": "concrete progression instruction" }.
Rules:
- Only prescribe exercises possible with the stated equipment.
- Match volume and intensity to the stated gym level and goal. The "days" represent Week 1's starting prescription.
- The "progression" must scale to the gym level: beginners add small increments (1-2 reps or ~2.5kg, add a set occasionally); advanced/extreme use larger jumps, intensity techniques (drop sets, RPE 9, tempo, rest-pause), and higher frequency. Include a deload week near the end.
- Give 4-6 exercises per day. Produce exactly the requested number of training days.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const details = [
    `Equipment available: ${body.equipment || 'basic gym'}`,
    `Goal: ${body.goal || 'build muscle'}`,
    `Gym level: ${body.experience || 'beginner'}`,
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
