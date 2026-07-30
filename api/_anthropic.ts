import Anthropic from '@anthropic-ai/sdk';

// Files prefixed with _ are not treated as routes by Vercel — shared helpers.

export const VISION_MODEL = 'claude-haiku-4-5';
export const TEXT_MODEL = 'claude-haiku-4-5';

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export type Usage = { model: string; input_tokens: number; output_tokens: number };

export type ApiReq = { method?: string; body?: unknown };
export type ApiRes = {
  status: (code: number) => { json: (body: unknown) => void; end: () => void };
  setHeader: (name: string, value: string) => void;
};

export function getClient(): Anthropic {
  return new Anthropic();
}

export function usageOf(message: Anthropic.Message, model: string): Usage {
  return {
    model,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
}

export function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim();
}

/** Pulls the first {...} JSON object out of a model response and parses it. */
export function extractJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in response');
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/** Shared POST guards: method, JSON body, configured key. Returns parsed body or null (response already sent). */
export function preflight<T>(req: ApiReq, res: ApiRes): T | null {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return null;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'AI is not configured. Set ANTHROPIC_API_KEY in your Vercel project.' });
    return null;
  }
  try {
    return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as T;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return null;
  }
}

export function apiErrorStatus(error: unknown): number {
  return error instanceof Anthropic.APIError ? error.status ?? 502 : 502;
}
