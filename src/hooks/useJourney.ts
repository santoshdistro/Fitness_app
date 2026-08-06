import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// A manually-set journey baseline (start weight + the day it began). Stored
// locally per user so someone who has logged for weeks can say "start my journey
// now" without their old weigh-ins dragging the baseline back.
type JourneyMark = { startDate: string; startWeightKg: number };

function keyFor(userId: string | undefined): string | null {
  return userId ? `journey:${userId}` : null;
}

function read(userId: string | undefined): JourneyMark | null {
  const key = keyFor(userId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as JourneyMark) : null;
  } catch {
    return null;
  }
}

/**
 * The starting point for the "Your journey" card: a manual mark if the user set
 * one, otherwise their earliest recorded weigh-in. Returns the weight, the date
 * it began, and controls to (re)start or clear the journey.
 */
export function useJourney() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [mark, setMark] = useState<JourneyMark | null>(() => read(userId));
  const [earliest, setEarliest] = useState<{ weight: number; date: string } | null>(null);

  // Re-read the stored mark whenever the user changes.
  useEffect(() => {
    setMark(read(userId));
  }, [userId]);

  // The earliest logged weight is the fallback baseline (and its date).
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setEarliest(null);
      return;
    }
    supabase
      .from('daily_logs')
      .select('weight, log_date')
      .eq('user_id', userId)
      .not('weight', 'is', null)
      .order('log_date', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { weight: number; log_date: string } | null;
        setEarliest(row ? { weight: row.weight, date: row.log_date } : null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const startWeight = mark?.startWeightKg ?? earliest?.weight ?? null;
  const startDate = mark?.startDate ?? earliest?.date ?? null;

  const startJourney = useCallback(
    (startWeightKg: number, startDate: string) => {
      const key = keyFor(userId);
      const next: JourneyMark = { startWeightKg, startDate };
      if (key) localStorage.setItem(key, JSON.stringify(next));
      setMark(next);
    },
    [userId],
  );

  const clearJourney = useCallback(() => {
    const key = keyFor(userId);
    if (key) localStorage.removeItem(key);
    setMark(null);
  }, [userId]);

  return { startWeight, startDate, isManual: mark != null, startJourney, clearJourney };
}
