import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  getExistingSubscription,
  isPushConfigured,
  isPushSupported,
  saveSubscription,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
  updatePrefs,
} from '../lib/push';
import { defaultReminderPrefs, mergeReminderPrefs, type ReminderPrefs } from '../data/reminders';

export type PushStatus = 'unsupported' | 'unconfigured' | 'off' | 'on';

export function usePushReminders() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [status, setStatus] = useState<PushStatus>('off');
  const [prefs, setPrefs] = useState<ReminderPrefs>(defaultReminderPrefs());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) {
        if (!cancelled) setStatus('unsupported');
        return;
      }
      if (!isPushConfigured()) {
        if (!cancelled) setStatus('unconfigured');
        return;
      }
      const sub = await getExistingSubscription();
      if (cancelled) return;
      if (sub && userId) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('prefs')
          .eq('endpoint', sub.endpoint)
          .maybeSingle();
        const savedPrefs = (data as { prefs?: Partial<ReminderPrefs> } | null)?.prefs;
        setPrefs(mergeReminderPrefs(savedPrefs));
        setStatus('on');
      } else {
        setStatus('off');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const enable = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const sub = await subscribeToPush();
      const { error: saveError } = await saveSubscription(userId, sub, prefs);
      if (saveError) throw saveError;
      setStatus('on');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable reminders.');
    } finally {
      setBusy(false);
    }
  }, [userId, prefs]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setStatus('off');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn off reminders.');
    } finally {
      setBusy(false);
    }
  }, []);

  const savePrefs = useCallback(async (next: ReminderPrefs) => {
    setPrefs(next);
    const sub = await getExistingSubscription();
    if (sub) await updatePrefs(sub.endpoint, next);
  }, []);

  const test = useCallback(async () => {
    setError(null);
    try {
      const sub = await getExistingSubscription();
      if (!sub) throw new Error('Turn on reminders first.');
      await sendTestPush(sub);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a test.');
    }
  }, []);

  return { status, prefs, busy, error, enable, disable, savePrefs, test };
}
