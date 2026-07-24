import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { AiFeature } from '../lib/aiUsage';

export type FeatureSpend = { feature: AiFeature; calls: number; costUsd: number };

type Row = { feature: AiFeature; cost_usd: number };

const FEATURE_ORDER: AiFeature[] = [
  'coach',
  'food_scan',
  'body_scan',
  'workout_plan',
  'nutrition_coach',
];

function monthStartIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useAiSpend() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [byFeature, setByFeature] = useState<FeatureSpend[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setByFeature([]);
      setTotalUsd(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('ai_usage')
      .select('feature, cost_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStartIso());

    const rows = (data as Row[]) ?? [];
    const map = new Map<AiFeature, FeatureSpend>();
    let total = 0;
    for (const row of rows) {
      const cost = Number(row.cost_usd) || 0;
      total += cost;
      const existing = map.get(row.feature) ?? { feature: row.feature, calls: 0, costUsd: 0 };
      existing.calls += 1;
      existing.costUsd += cost;
      map.set(row.feature, existing);
    }

    setByFeature(
      FEATURE_ORDER.filter(f => map.has(f)).map(f => map.get(f)!),
    );
    setTotalUsd(total);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { byFeature, totalUsd, loading, refresh };
}
