import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type ActiveFast = { startedAt: string; targetHours: number };
export type FastRecord = { start: string; end: string; hours: number };
type Stored = { active: ActiveFast | null; history: FastRecord[] };

const EMPTY: Stored = { active: null, history: [] };

function key(userId: string): string {
  return `fasting:${userId}`;
}

export function useFasting() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [data, setData] = useState<Stored>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setData(EMPTY);
      return;
    }
    try {
      const raw = localStorage.getItem(key(userId));
      setData(raw ? (JSON.parse(raw) as Stored) : EMPTY);
    } catch {
      setData(EMPTY);
    }
  }, [userId]);

  const persist = useCallback(
    (next: Stored) => {
      if (userId) localStorage.setItem(key(userId), JSON.stringify(next));
      setData(next);
    },
    [userId],
  );

  const start = useCallback(
    (targetHours: number) => {
      persist({ ...data, active: { startedAt: new Date().toISOString(), targetHours } });
    },
    [data, persist],
  );

  const end = useCallback(() => {
    if (!data.active) return;
    const endIso = new Date().toISOString();
    const hours =
      Math.round(((Date.now() - new Date(data.active.startedAt).getTime()) / 3600000) * 10) / 10;
    const record: FastRecord = { start: data.active.startedAt, end: endIso, hours };
    persist({ active: null, history: [record, ...data.history].slice(0, 30) });
  }, [data, persist]);

  const cancel = useCallback(() => {
    persist({ ...data, active: null });
  }, [data, persist]);

  return { active: data.active, history: data.history, start, end, cancel };
}
