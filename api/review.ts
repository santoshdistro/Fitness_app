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

type SetEntry = { ex: string; reps: number | string; kg: number };
type WorkoutEntry = { date: string; name?: string | null; sets: SetEntry[] };
type RecordEntry = { ex: string; bestKg: number; e1rm: number; sessions: number };

type Body = {
  goal?: string | null;
  level?: string | null;
  workouts?: WorkoutEntry[];
  records?: RecordEntry[];
};

type ReviewResult = {
  summary: string;
  strengths: string[];
  improvements: string[];
  focus: string[];
};

const PROMPT = `You are an experienced strength & conditioning coach reviewing a client's recent training log.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (1-2 encouraging but honest sentences on how training is going),
"strengths" (array of 2-4 short strings — concrete things they're doing well: consistency, progressive overload, balance, volume),
"improvements" (array of 2-4 short strings — concrete gaps: muscle groups being neglected, stalled lifts, lopsided volume, too little/too much frequency),
"focus" (array of 2-3 short, actionable next steps for the coming weeks).
Rules:
- Be specific and reference the actual data (exercise names, weights, how often they train, which muscles are missing).
- If there is little data, say so kindly and suggest what to log next.
- Keep each bullet under ~16 words. No preamble.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const workouts = body.workouts ?? [];
  const records = body.records ?? [];

  const details = [
    `Goal: ${body.goal || 'general fitness'}`,
    body.level ? `Gym level: ${body.level}` : '',
    `Sessions logged (most recent first):`,
    workouts.length
      ? workouts
          .map(
            w =>
              `- ${w.date}${w.name ? ` (${w.name})` : ''}: ` +
              w.sets.map(s => `${s.ex} ${s.kg}kg×${s.reps}`).join('; '),
          )
          .join('\n')
      : '(none logged yet)',
    records.length
      ? `Personal records:\n${records
          .map(r => `- ${r.ex}: best ${r.bestKg}kg, est 1RM ${r.e1rm}kg, ${r.sessions} sessions`)
          .join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 1200,
      system: PROMPT,
      messages: [{ role: 'user', content: `Review my training.\n${details}` }],
    });

    const result = extractJson<ReviewResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Could not generate a review right now. Try again.' });
  }
}
