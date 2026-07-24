import { configureWebPush, webpush, type PushReq, type PushRes } from './_push';

// Sends a single test notification to the subscription in the request body, so
// the user can confirm reminders reach their device.
export default async function handler(req: PushReq, res: PushRes): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!configureWebPush()) {
    res.status(500).json({ error: 'Push is not configured. Add VAPID keys in Vercel.' });
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
    await webpush.sendNotification(
      body.subscription,
      JSON.stringify({
        title: 'Reminders are on ✅',
        body: "Nice — you'll get nudges at your set times. Let's get lean. 💪",
        tag: 'test',
      }),
    );
    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'Could not send the test notification.' });
  }
}
