import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { startOfWeek, todayDateString } from '../utils/date';

export type StepTotals = { week: number; month: number; year: number };

// Sums logged steps for the current week (Mon–today), month, and year.
export function useStepTotals() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [totals, setTotals] = useState<StepTotals>({ week: 0, month: 0, year: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setTotals({ week: 0, month: 0, year: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    const yearStart = `${today.slice(0, 4)}-01-01`;
    const monthStart = `${today.slice(0, 7)}-01`;
    const weekStart = startOfWeek(today); // Monday

    supabase
      .from('daily_logs')
      .select('log_date, steps')
      .eq('user_id', userId)
      .gte('log_date', yearStart)
      .lte('log_date', today)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data as { log_date: string; steps: number | null }[]) ?? [];
        let week = 0;
        let month = 0;
        let year = 0;
        for (const r of rows) {
          const s = r.steps ?? 0;
          year += s;
          if (r.log_date >= monthStart) month += s;
          if (r.log_date >= weekStart) week += s;
        }
        setTotals({ week, month, year });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { totals, loading };
}
