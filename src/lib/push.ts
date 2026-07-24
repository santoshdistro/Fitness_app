import { supabase } from './supabaseClient';
import type { ReminderPrefs } from '../data/reminders';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY);
}

export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js');
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/** Requests permission and subscribes this device to push. Throws on failure. */
export async function subscribeToPush(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC_KEY) throw new Error('Push is not configured (missing VAPID key).');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was denied.');

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

export async function saveSubscription(
  userId: string,
  subscription: PushSubscription,
  prefs: ReminderPrefs,
): Promise<{ error: Error | null }> {
  const tzOffset = -new Date().getTimezoneOffset(); // minutes east of UTC (IST = +330)
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription: subscription.toJSON(),
      tz_offset_minutes: tzOffset,
      prefs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  return { error: error ? new Error(error.message) : null };
}

export async function updatePrefs(
  endpoint: string,
  prefs: ReminderPrefs,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ prefs, tz_offset_minutes: -new Date().getTimezoneOffset(), updated_at: new Date().toISOString() })
    .eq('endpoint', endpoint);
  return { error: error ? new Error(error.message) : null };
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

export async function sendTestPush(subscription: PushSubscription): Promise<void> {
  const res = await fetch('/api/push-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'Could not send a test notification.');
  }
}
