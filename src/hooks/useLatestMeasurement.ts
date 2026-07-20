import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Measurement } from '../types/database';

export function useLatestMeasurement() {
  const { session } = useAuth();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setMeasurement(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', session.user.id)
      .order('entry_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    setMeasurement(data as Measurement | null);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { measurement, loading, refresh };
}
