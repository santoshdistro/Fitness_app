import type { ApiReq, ApiRes } from './_anthropic.js';

// Combined server-side proxy for external food databases:
//   { usdaQuery } -> USDA FoodData Central search
//   { code }      -> Open Food Facts barcode lookup
//   { search }    -> Open Food Facts text search
// Both are proxied from the server so the USDA key stays secret and Open Food
// Facts receives a descriptive User-Agent (it rate-limits anonymous browser
// requests). Kept as ONE function to stay within Vercel's Hobby function limit.

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';
const OFF_BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'FitnessTracker/1.0 (personal fitness app)';

type Body = { usdaQuery?: string; code?: string; search?: string };

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

  // ── USDA search ──
  if (body.usdaQuery !== undefined) {
    const query = body.usdaQuery.trim();
    const apiKey = process.env.USDA_API_KEY;
    if (!query || !apiKey) {
      // Unconfigured or empty — return empty so the client falls back gracefully.
      res.status(200).json({ foods: [] });
      return;
    }
    try {
      const url = `${USDA_BASE}/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(
        query,
      )}&pageSize=15&dataType=Foundation,SR%20Legacy,Survey%20%28FNDDS%29,Branded`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        res.status(200).json({ foods: [] });
        return;
      }
      const data = (await upstream.json()) as { foods?: unknown[] };
      res.status(200).json({ foods: data.foods ?? [] });
    } catch {
      res.status(200).json({ foods: [] });
    }
    return;
  }

  // ── Open Food Facts (barcode or text search) ──
  let url: string;
  if (body.code) {
    const code = body.code.replace(/\D/g, '');
    if (!code) {
      res.status(400).json({ error: 'No barcode provided.' });
      return;
    }
    url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(
      code,
    )}.json?fields=product_name,brands,serving_size,nutriments`;
  } else if (body.search?.trim()) {
    url =
      `${OFF_BASE}/cgi/search.pl?` +
      new URLSearchParams({
        search_terms: body.search.trim(),
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '20',
        fields: 'code,product_name,brands,serving_size,nutriments',
      }).toString();
  } else {
    res.status(400).json({ error: 'Nothing to look up.' });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    });
    // OFF returns HTTP 404 with a JSON body ({ status: 0 }) when a barcode isn't
    // in its catalogue — that's "not found", not a reachability failure. Pass any
    // JSON body straight through (200) so the client can tell the two apart; only
    // a non-JSON response or a thrown fetch is a genuine "could not reach".
    const text = await upstream.text();
    try {
      res.status(200).json(JSON.parse(text));
    } catch {
      res.status(502).json({ error: `Open Food Facts returned ${upstream.status}.` });
    }
  } catch {
    res.status(502).json({ error: 'Could not reach Open Food Facts.' });
  }
}
