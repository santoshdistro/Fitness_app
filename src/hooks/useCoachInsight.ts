import { useMemo } from 'react';
import { generateCoachInsight } from '../utils/coachInsights';

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

type State = { status: 'idle' } | { status: 'ready'; insight: string };

/**
 * Produces the Home coaching line locally from the day's numbers — no API call,
 * no credit used. `ready` gates it so it only shows once there's data to coach on.
 */
export function useCoachInsight(payload: CoachPayload, ready: boolean): State {
  const body = JSON.stringify(payload);
  return useMemo<State>(() => {
    if (!ready) return { status: 'idle' };
    return { status: 'ready', insight: generateCoachInsight(payload) };
    // body captures every payload field for memoisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, ready]);
}
