import { useEffect, useReducer } from 'react';
import type { Bucket } from '../lib/timeBuckets';

// A milestone is a dated annotation the user drops on their timeline
// ("started cut", "changed program", "injury") so old trends read in context.
export type Milestone = { id: string; date: string; label: string; color: string };

export const MILESTONE_COLORS = ['#f59e0b', '#22c55e', '#ef4444', '#6c63ff', '#0ea5e9'];

const KEY = 'app_milestones';

function read(): Milestone[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Milestone[]) : [];
  } catch {
    return [];
  }
}

// Tiny module store so the manager card and every chart stay in sync.
let cache: Milestone[] | null = null;
const listeners = new Set<() => void>();

function current(): Milestone[] {
  if (cache === null) cache = read();
  return cache;
}

function commit(next: Milestone[]): void {
  cache = next.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach(l => l());
}

export function useMilestones() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);

  return {
    milestones: current(),
    add: (date: string, label: string, color: string) =>
      commit([...current(), { id: `${Date.now()}`, date, label: label.trim(), color }]),
    remove: (id: string) => commit(current().filter(m => m.id !== id)),
  };
}

export type ChartMark = { left: number; label: string; color: string; date: string };

// Which milestones fall inside the visible buckets, and their x-position (%).
export function milestonesForBuckets(milestones: Milestone[], buckets: Bucket[]): ChartMark[] {
  const n = buckets.length;
  const out: ChartMark[] = [];
  for (const m of milestones) {
    const t = new Date(`${m.date}T12:00:00`).getTime();
    const idx = buckets.findIndex(b => t >= b.start && t < b.end);
    if (idx === -1) continue;
    out.push({ left: n === 1 ? 50 : (idx / (n - 1)) * 100, label: m.label, color: m.color, date: m.date });
  }
  return out;
}
