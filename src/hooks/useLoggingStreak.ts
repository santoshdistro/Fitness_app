import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, dateToDateString, todayDateString } from '../utils/date';

const HISTORY_LIMIT = 400;

function computeStreak(loggedDates: Set<string>): number {
  let cursor = todayDateString();
  if (!loggedDates.has(cursor)) {
    const yesterday = addDays(cursor, -1);
    if (!loggedDates.has(yesterday)) return 0;
    cursor = yesterday;
  }
  let streak = 0;
  while (loggedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Consecutive days (up to today, or still alive through yesterday) with at least one meal logged. */
export function useLoggingStreak() {
  const { session } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!session?.user) {
        setStreak(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('food_logs')
        .select('meal_timestamp')
        .eq('user_id', session.user.id)
        .order('meal_timestamp', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (cancelled) return;

      const loggedDates = new Set(
        ((data as { meal_timestamp: string }[]) ?? []).map(row =>
          dateToDateString(new Date(row.meal_timestamp)),
        ),
      );
      setStreak(computeStreak(loggedDates));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return { streak, loading };
}
