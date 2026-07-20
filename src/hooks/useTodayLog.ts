import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { todayDateString } from '../utils/date';
import type { DailyLog } from '../types/database';

export function useTodayLog() {
  const { session } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setLog(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('log_date', todayDateString())
      .maybeSingle();
    setLog(data as DailyLog | null);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { log, loading, refresh };
}
