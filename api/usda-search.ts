import type { ApiReq, ApiRes } from './_anthropic.js';

// Server-side proxy for USDA FoodData Central search. Keeps USDA_API_KEY on the
// server (never shipped in the client bundle) and returns the raw `foods` array
// for the client to map. Fails soft with an empty list so food search still
// works via the other sources if USDA is unconfigured or rate-limited.

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

type Body = { query?: string };

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: Body;
  try {
    body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as Body;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const query = (body.query ?? '').toString().trim();
  if (!query) {
    res.status(200).json({ foods: [] });
    return;
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    // Not configured — return empty so the client falls back to other sources.
    res.status(200).json({ foods: [] });
    return;
  }

  try {
    const url = `${BASE_URL}/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(
      query,
    )}&pageSize=15&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29,Branded`;
    const response = await fetch(url);
    if (!response.ok) {
      res.status(200).json({ foods: [] });
      return;
    }
    const data = (await response.json()) as { foods?: unknown[] };
    res.status(200).json({ foods: data.foods ?? [] });
  } catch {
    res.status(200).json({ foods: [] });
  }
}
