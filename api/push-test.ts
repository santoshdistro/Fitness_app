import { configureWebPush, webpush, type PushReq, type PushRes } from './_push.js';

// Sends a single test notification to the subscription in the request body, so
// the user can confirm reminders reach their device. Surfaces the underlying
// push-service error so setup problems are diagnosable.
export default async function handler(req: PushReq, res: PushRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const missing: string[] = [];
  if (!process.env.VAPID_PUBLIC_KEY) missing.push('VAPID_PUBLIC_KEY');
  if (!process.env.VAPID_PRIVATE_KEY) missing.push('VAPID_PRIVATE_KEY');
  if (missing.length > 0) {
    res.status(500).json({ error: `Missing env var(s) in Vercel: ${missing.join(', ')}. Add them and redeploy.` });
    return;
  }

  let body: { subscription?: webpush.PushSubscription };
  try {
    body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as typeof body;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  if (!body.subscription) {
    res.status(400).json({ error: 'Missing subscription' });
    return;
  }

  try {
    configureWebPush(); // may throw if VAPID_SUBJECT is malformed
  } catch (error) {
    res.status(500).json({
      error: `VAPID setup rejected: ${error instanceof Error ? error.message : 'check VAPID_SUBJECT (must be a mailto: or https: URL).'}`,
    });
    return;
  }

  try {
    await webpush.sendNotification(
      body.subscription,
      JSON.stringify({
        title: 'Reminders are on ✅',
        body: "Nice — you'll get nudges at your set times. Let's get lean. 💪",
        tag: 'test',
      }),
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const bodyText = (error as { body?: string }).body;
    const message = (error as { message?: string }).message;
    res.status(502).json({
      error: `Push service rejected the send${statusCode ? ` (HTTP ${statusCode})` : ''}: ${bodyText || message || 'unknown error'}`,
    });
  }
}
