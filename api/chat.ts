import {
  apiErrorStatus,
  extractText,
  getClient,
  preflight,
  TEXT_MODEL,
  usageOf,
  type ApiReq,
  type ApiRes,
} from './_anthropic.js';

type ChatMsg = { role: 'user' | 'assistant'; content: string };
type Body = { context?: string; messages?: ChatMsg[] };

const SYSTEM = `You are the user's personal fitness & nutrition coach, living inside their tracking app.
You are given a snapshot of everything they've logged — goal, calorie/protein targets, weight trend, nutrition averages, recent workouts and personal records. Use it to:
- validate what they've logged and whether it actually supports their goal (fat loss, muscle gain, or maintenance),
- point out concretely what is helping their progress and what is holding it back,
- answer their questions using their real numbers.
Be concise, warm, and honest — short paragraphs or bullet points, no filler. Never invent data you weren't given; if something isn't logged, say so and suggest they log it. You are not a doctor; keep advice general and safe.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  const messages = (body.messages ?? [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16); // cap history sent to the model

  if (messages.length === 0) {
    res.status(400).json({ error: 'No message provided.' });
    return;
  }

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 900,
      system: `${SYSTEM}\n\n--- The user's logged data ---\n${body.context || '(nothing logged yet)'}`,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = extractText(message).trim();
    res.status(200).json({ result: { reply }, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res.status(apiErrorStatus(error)).json({ error: 'Coach is unavailable right now. Try again.' });
  }
}
