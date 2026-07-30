import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// The earliest weight ever logged — the baseline for "how far you've come".
export function useStartWeight() {
  const { session } = useAuth();
  const [startWeight, setStartWeight] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!session?.user) {
      setStartWeight(null);
      return;
    }
    supabase
      .from('daily_logs')
      .select('weight, log_date')
      .eq('user_id', session.user.id)
      .not('weight', 'is', null)
      .order('log_date', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setStartWeight((data as { weight: number } | null)?.weight ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  return startWeight;
}
