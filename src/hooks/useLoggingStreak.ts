import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, dateToDateString, todayDateString } from '../utils/date';

// Rows per request. The streak counts DAYS, but the query returns ROWS, and a
// day of the programme is a dozen-plus logged items — so a fixed row cap silently
// became a cap on the streak itself: it froze at the number of days the window
// happened to cover instead of counting on. Pages are fetched until the streak
// is provably over, so the ceiling is the streak's own length.
const PAGE_SIZE = 1000;
const MAX_PAGES = 12;

/**
 * Walks back from today. Also reports the first day with nothing logged, which
 * is what tells the caller whether the answer is settled or just ran out of data.
 */
function walkStreak(loggedDates: Set<string>): { streak: number; firstMissing: string } {
  let cursor = todayDateString();
  if (!loggedDates.has(cursor)) {
    const yesterday = addDays(cursor, -1);
    if (!loggedDates.has(yesterday)) return { streak: 0, firstMissing: cursor };
    cursor = yesterday;
  }
  let streak = 0;
  while (loggedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return { streak, firstMissing: cursor };
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
      const loggedDates = new Set<string>();
      let oldestFetched: string | undefined;

      for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = await supabase
          .from('food_logs')
          .select('meal_timestamp')
          .eq('user_id', session.user.id)
          .order('meal_timestamp', { ascending: false })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        if (cancelled) return;

        const rows = (data as { meal_timestamp: string }[]) ?? [];
        for (const row of rows) {
          const date = dateToDateString(new Date(row.meal_timestamp));
          loggedDates.add(date);
          oldestFetched = date; // rows arrive newest-first, so the last one is oldest
        }

        // Out of rows, or the streak broke on a day we can actually see. A break
        // older than everything fetched is not a break — it is the edge of the page.
        const { firstMissing } = walkStreak(loggedDates);
        if (rows.length < PAGE_SIZE) break;
        if (oldestFetched && firstMissing > oldestFetched) break;
      }

      setStreak(walkStreak(loggedDates).streak);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return { streak, loading };
}
