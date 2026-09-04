import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Focuses the coach has proposed and you've accepted. Kept in localStorage per
// user, alongside the journey mark and the guided-session state — this is a
// single-person app, so a device-local store needs no migration and no network.

export type CoachGoal = {
  id: string;
  title: string;
  detail: string;
  /** How often it applies, in the coach's words ("Every day", "3× a week"). */
  cadence: string;
  createdAt: string;
};

/** A goal the coach proposed but that hasn't been accepted yet. */
export type GoalSuggestion = Omit<CoachGoal, 'id' | 'createdAt'>;

function keyFor(userId: string | undefined): string | null {
  return userId ? `coach_goals:${userId}` : null;
}

function read(userId: string | undefined): CoachGoal[] {
  const key = keyFor(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as CoachGoal[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCoachGoals() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [goals, setGoals] = useState<CoachGoal[]>(() => read(userId));

  useEffect(() => {
    setGoals(read(userId));
  }, [userId]);

  const persist = useCallback(
    (next: CoachGoal[]) => {
      setGoals(next);
      const key = keyFor(userId);
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore quota / private-mode errors */
      }
    },
    [userId],
  );

  const add = useCallback(
    (s: GoalSuggestion) => {
      const goal: CoachGoal = {
        ...s,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      persist([goal, ...read(userId)]);
    },
    [persist, userId],
  );

  const remove = useCallback(
    (id: string) => persist(read(userId).filter(g => g.id !== id)),
    [persist, userId],
  );

  /** Same-title match, so an already-accepted focus isn't offered twice. */
  const has = useCallback(
    (title: string) => goals.some(g => g.title.trim().toLowerCase() === title.trim().toLowerCase()),
    [goals],
  );

  return { goals, add, remove, has };
}

// The coach appends a fenced ```goal block when it proposes something concrete.
// Split it out so the block never renders as raw text in the conversation, and
// so a malformed one degrades to "just a normal reply" rather than breaking it.
export function splitGoalSuggestion(reply: string): { text: string; goal: GoalSuggestion | null } {
  const match = reply.match(/```goal\s*([\s\S]*?)```/);
  if (!match) return { text: reply, goal: null };
  const text = reply.replace(match[0], '').trim();
  try {
    const raw = JSON.parse(match[1].trim()) as Partial<GoalSuggestion>;
    if (!raw.title || !raw.detail) return { text, goal: null };
    return {
      text,
      goal: {
        title: String(raw.title).slice(0, 80),
        detail: String(raw.detail).slice(0, 240),
        cadence: String(raw.cadence ?? 'Every day').slice(0, 40),
      },
    };
  } catch {
    return { text, goal: null };
  }
}
