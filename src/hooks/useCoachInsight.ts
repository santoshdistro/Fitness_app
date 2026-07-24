import { useEffect, useState } from 'react';

export type CoachPayload = {
  goal?: 'deficit' | 'surplus' | 'maintenance';
  caloriesLogged?: number;
  calorieTarget?: number;
  proteinLogged?: number;
  proteinTarget?: number | null;
  carbsLogged?: number;
  fatLogged?: number;
  steps?: number | null;
  waterMl?: number | null;
  latestWeight?: number | null;
  weightTrend?: string | null;
  streak?: number;
  mealCount?: number;
};

type State =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; insight: string }
  | { status: 'error'; message: string };

/**
 * Fetches a coaching insight from the serverless /api/coach endpoint.
 * `ready` gates the request so we don't call before the day's data exists.
 * `refreshKey` lets callers re-fetch after logging something new.
 */
export function useCoachInsight(payload: CoachPayload, ready: boolean, refreshKey: number) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const body = JSON.stringify(payload);

  useEffect(() => {
    if (!ready) {
      setState({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
      .then(async res => {
        const data = (await res.json().catch(() => null)) as
          | { insight?: string; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.insight) {
          setState({
            status: 'error',
            message: data?.error ?? 'Coaching is unavailable right now.',
          });
          return;
        }
        setState({ status: 'ready', insight: data.insight });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error', message: 'Coaching is unavailable right now.' });
        }
      });

    return () => {
      cancelled = true;
    };
    // body captures every payload field; refreshKey forces manual re-fetch.
  }, [body, ready, refreshKey]);

  return state;
}
