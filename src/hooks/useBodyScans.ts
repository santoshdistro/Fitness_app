import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { BodyResult } from '../lib/aiClient';
import type { BodyScan } from '../types/database';

// History of physique-scan readouts (newest first). Text only — no photo.
export function useBodyScans() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scans, setScans] = useState<BodyScan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setScans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setScans((data as BodyScan[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addScan = useCallback(
    async (result: BodyResult) => {
      if (!userId) return { error: new Error('Not signed in') };
      const { error } = await supabase.from('body_scans').insert({
        user_id: userId,
        summary: result.summary,
        focus_areas: result.focusAreas,
        training_focus: result.trainingFocus,
        nutrition_focus: result.nutritionFocus,
      });
      if (!error) await refresh();
      return { error };
    },
    [userId, refresh],
  );

  const removeScan = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('body_scans').delete().eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { scans, loading, refresh, addScan, removeScan };
}

/** Adapts a stored row into the BodyResult shape the readout component expects. */
export function scanToResult(scan: BodyScan): BodyResult {
  return {
    summary: scan.summary,
    focusAreas: scan.focus_areas ?? [],
    trainingFocus: scan.training_focus ?? '',
    nutritionFocus: scan.nutrition_focus ?? '',
  };
}
