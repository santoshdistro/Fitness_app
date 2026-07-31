import type { ApiReq, ApiRes } from './_anthropic.js';

// Server-side proxy for Open Food Facts (barcode lookup + text search). OFF asks
// clients to identify themselves with a descriptive User-Agent and rate-limits /
// blocks anonymous browser requests, which is why direct client calls fail. We
// forward from the server with a proper UA and return the upstream JSON as-is.

const BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'FitnessTracker/1.0 (personal fitness app)';

type Body = { code?: string; search?: string };

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

  let url: string;
  if (body.code) {
    const code = body.code.replace(/\D/g, '');
    if (!code) {
      res.status(400).json({ error: 'No barcode provided.' });
      return;
    }
    url = `${BASE}/api/v2/product/${encodeURIComponent(
      code,
    )}.json?fields=product_name,brands,serving_size,nutriments`;
  } else if (body.search?.trim()) {
    url =
      `${BASE}/cgi/search.pl?` +
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
    if (!upstream.ok) {
      res.status(502).json({ error: `Open Food Facts returned ${upstream.status}.` });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch {
    res.status(502).json({ error: 'Could not reach Open Food Facts.' });
  }
}
