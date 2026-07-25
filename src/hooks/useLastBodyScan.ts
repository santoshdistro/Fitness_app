import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { BodyResult } from '../lib/aiClient';

export type StoredBodyScan = { result: BodyResult; scannedAt: string };

// Persist the latest physique-scan read locally (per user). The photo itself is
// never stored — only the AI's text feedback, as a personal reference.
function storageKey(userId: string): string {
  return `last_body_scan:${userId}`;
}

export function useLastBodyScan() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [scan, setScan] = useState<StoredBodyScan | null>(null);

  useEffect(() => {
    if (!userId) {
      setScan(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId));
      setScan(raw ? (JSON.parse(raw) as StoredBodyScan) : null);
    } catch {
      setScan(null);
    }
  }, [userId]);

  const saveScan = useCallback(
    (result: BodyResult) => {
      if (!userId) return;
      const next: StoredBodyScan = { result, scannedAt: new Date().toISOString() };
      localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setScan(next);
    },
    [userId],
  );

  const clearScan = useCallback(() => {
    if (!userId) return;
    localStorage.removeItem(storageKey(userId));
    setScan(null);
  }, [userId]);

  return { scan, saveScan, clearScan };
}
