import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useLoggingStreak } from './useLoggingStreak';
import { useProfile } from './useProfile';
import { computeGoalProgress } from '../utils/calculations';

export type Achievement = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  current: number;
  threshold: number;
  earned: boolean;
};

type Counts = {
  meals: number;
  workouts: number;
  weighIns: number;
  photos: number;
  scans: number;
  startWeight: number | null;
  latestWeight: number | null;
};

export function useAchievements() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { streak } = useLoggingStreak();
  const { profile } = useProfile();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setCounts(null);
      return;
    }
    (async () => {
      const countOf = (table: string) =>
        supabase.from(table).select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const [meals, workouts, weighIns, photos, scans, firstW, lastW] = await Promise.all([
        countOf('food_logs'),
        countOf('workout_logs'),
        supabase
          .from('daily_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('weight', 'is', null),
        countOf('progress_photos'),
        countOf('body_scans'),
        supabase
          .from('daily_logs')
          .select('weight')
          .eq('user_id', userId)
          .not('weight', 'is', null)
          .order('log_date', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('daily_logs')
          .select('weight')
          .eq('user_id', userId)
          .not('weight', 'is', null)
          .order('log_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setCounts({
        meals: meals.count ?? 0,
        workouts: workouts.count ?? 0,
        weighIns: weighIns.count ?? 0,
        photos: photos.count ?? 0,
        scans: scans.count ?? 0,
        startWeight: (firstW.data as { weight: number } | null)?.weight ?? null,
        latestWeight: (lastW.data as { weight: number } | null)?.weight ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const goalReached =
    computeGoalProgress({
      goalType: profile?.goal_type,
      startWeight: counts?.startWeight,
      currentWeight: counts?.latestWeight,
      targetWeight: profile?.target_weight_kg,
      weeklyRateKg: profile?.weekly_rate_kg,
    })?.reached ?? false;

  const c = counts ?? { meals: 0, workouts: 0, weighIns: 0, photos: 0, scans: 0, startWeight: null, latestWeight: null };

  const list: Achievement[] = [
    a('first_meal', '🥗', 'First meal logged', 'Log any meal', c.meals, 1),
    a('meals_50', '🍽️', '50 meals logged', 'Consistency counts', c.meals, 50),
    a('meals_250', '📖', '250 meals logged', 'A real habit now', c.meals, 250),
    a('first_workout', '🏋️', 'First workout', 'Log a training session', c.workouts, 1),
    a('workouts_10', '💪', '10 workouts', 'Building momentum', c.workouts, 10),
    a('workouts_50', '🔥', '50 workouts', 'Seriously committed', c.workouts, 50),
    a('streak_3', '⚡', '3-day streak', 'Log 3 days in a row', streak, 3),
    a('streak_7', '🔥', '7-day streak', 'A full week logged', streak, 7),
    a('streak_30', '🏆', '30-day streak', 'A month straight', streak, 30),
    a('first_weighin', '⚖️', 'First weigh-in', 'Log your weight', c.weighIns, 1),
    a('first_photo', '📸', 'First progress photo', 'Start your visual journey', c.photos, 1),
    a('first_scan', '🤳', 'First physique scan', 'Get an AI read', c.scans, 1),
    {
      id: 'goal_reached',
      emoji: '🎯',
      title: 'Reached your goal weight',
      desc: 'Hit your target',
      current: goalReached ? 1 : 0,
      threshold: 1,
      earned: goalReached,
    },
  ];

  const earnedCount = list.filter(x => x.earned).length;
  return { achievements: list, earnedCount, total: list.length, loading: counts == null };
}

function a(id: string, emoji: string, title: string, desc: string, current: number, threshold: number): Achievement {
  return { id, emoji, title, desc, current, threshold, earned: current >= threshold };
}
