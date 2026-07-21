import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { DailyLog } from '../types/database';

export function useRecentDailyLogs(limit: number) {
  const { session } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('log_date', { ascending: false })
      .limit(limit);
    // Return oldest -> newest so charts read left to right.
    setLogs(((data as DailyLog[]) ?? []).slice().reverse());
    setLoading(false);
  }, [session?.user, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearWeight = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('daily_logs').update({ weight: null }).eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { logs, loading, refresh, clearWeight };
}
