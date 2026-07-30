import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Measurement } from '../types/database';

export function useRecentMeasurements(limit: number) {
  const { session } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setMeasurements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', session.user.id)
      .order('entry_timestamp', { ascending: false })
      .limit(limit);
    setMeasurements((data as Measurement[]) ?? []);
    setLoading(false);
  }, [session?.user, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteMeasurement = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { measurements, loading, refresh, deleteMeasurement };
}
