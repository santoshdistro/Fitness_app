import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { CardioLog } from '../types/database';

export function useCardioLogs(limit = 30) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('user_id', userId)
      .order('session_timestamp', { ascending: false })
      .limit(limit);
    setLogs((data as CardioLog[]) ?? []);
    setLoading(false);
  }, [userId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCardio = useCallback(
    async (entry: {
      activity_type: string;
      distance_km: number | null;
      duration_min: number | null;
      calories: number | null;
    }) => {
      if (!userId) return { error: new Error('Not signed in') };
      const { error } = await supabase.from('cardio_logs').insert({ user_id: userId, ...entry });
      if (!error) await refresh();
      return { error };
    },
    [userId, refresh],
  );

  const deleteCardio = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('cardio_logs').delete().eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { logs, loading, refresh, addCardio, deleteCardio };
}
