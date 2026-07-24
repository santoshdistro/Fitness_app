import type { ApiReq, ApiRes } from './_anthropic';

// Pulls this-month-to-date spend from Anthropic's organization Cost API.
// Requires an ADMIN key (sk-ant-admin01-...), which only ORGANIZATION accounts
// have — individual accounts can't use it. If ANTHROPIC_ADMIN_KEY isn't set we
// return { configured: false } and the app falls back to in-app tracking.

type CostResult = { amount?: string; currency?: string };
type CostBucket = { results?: CostResult[] };
type CostReport = { data?: CostBucket[]; has_more?: boolean; next_page?: string | null };

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
  if (!adminKey) {
    res.status(200).json({ configured: false });
    return;
  }

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const startingAt = start.toISOString();

  try {
    let cents = 0;
    let page: string | null = null;
    let currency = 'USD';

    // Cost amounts are decimal-string cents (e.g. "123.45" = $1.23). Sum across
    // daily buckets, following pagination until has_more is false.
    for (let guard = 0; guard < 12; guard += 1) {
      const url = new URL('https://api.anthropic.com/v1/organizations/cost_report');
      url.searchParams.set('starting_at', startingAt);
      url.searchParams.set('bucket_width', '1d');
      url.searchParams.set('limit', '31');
      if (page) url.searchParams.set('page', page);

      const response = await fetch(url, {
        headers: { 'anthropic-version': '2023-06-01', 'x-api-key': adminKey },
      });

      if (!response.ok) {
        res.status(200).json({
          configured: true,
          error:
            response.status === 401 || response.status === 403
              ? 'Admin key rejected. Check it is an org Admin key (sk-ant-admin01-...).'
              : 'Anthropic billing is temporarily unavailable.',
        });
        return;
      }

      const report = (await response.json()) as CostReport;
      for (const bucket of report.data ?? []) {
        for (const result of bucket.results ?? []) {
          cents += Number(result.amount ?? '0') || 0;
          if (result.currency) currency = result.currency;
        }
      }

      if (report.has_more && report.next_page) {
        page = report.next_page;
      } else {
        break;
      }
    }

    res.status(200).json({
      configured: true,
      month: startingAt.slice(0, 7),
      totalUsd: cents / 100,
      currency,
    });
  } catch {
    res.status(200).json({ configured: true, error: 'Anthropic billing is temporarily unavailable.' });
  }
}
