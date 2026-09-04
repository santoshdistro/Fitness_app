import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { addDays, startOfDateIso, startOfWeek, todayDateString } from '../utils/date';
import type { CardioLog, DailyLog, FoodLog, Measurement, WorkoutLog } from '../types/database';

export type Series = { label: string; value: number; date: string }[];

export type CardioSession = {
  date: string;
  label: string;
  activity: string;
  km: number | null;
  minutes: number | null;
  /** Minutes per km. Null unless BOTH distance and duration were logged. */
  pace: number | null;
};

export type CardioSummary = {
  sessions: number;
  totalKm: number;
  totalMinutes: number;
  /** Fastest pace in the window — lower is better, so this is a min. */
  bestPace: number | null;
  avgPace: number | null;
  longestKm: number | null;
  /** Pace of the most recent paced session, against the one before it. */
  latestPace: number | null;
  paceDelta: number | null;
};

/** How much history Trends shows, in days. null means everything ever logged. */
export type TrendRange = number | null;

export type Trends = {
  weight: Series;
  weightMovingAvg: number[];
  calories: Series; // per day, or per week once the range is long
  protein: Series;
  steps: Series;
  caffeine: Series;
  hasCaffeine: boolean;
  volume: Series; // per workout session
  cardioDistance: Series; // km per cardio session
  totalKm: number;
  /** Per-session cardio, newest last, for the running panel. */
  cardioSessions: CardioSession[];
  cardioSummary: CardioSummary | null;
  waist: Series; // inches, per recording
  bodyFat: Series; // %, per recording
  workoutsPerWeek: Series; // sessions per week (Mon-anchored)
  totalWorkouts: number; // sessions in window
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  avgCaffeine: number | null;
  /** Whether intake charts are bucketed by day or by week for this range. */
  intakeBucket: 'day' | 'week';
  /** Did anything get eaten on each of the last 14 days (most recent last). */
  loggedDays: { date: string; logged: boolean }[];
  /** Days actually covered, for labelling ("last 90 days" etc.). */
  spanDays: number;
};

// Past this many days a bar per day stops being readable on a phone, so the
// intake charts switch to weekly averages instead.
const DAILY_BAR_LIMIT = 31;
const ADHERENCE_DAYS = 14;

function shortLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime();
  return Math.round(ms / 86400000) + 1;
}

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    return Math.round((slice.reduce((s, v) => s + v, 0) / slice.length) * 10) / 10;
  });
}

export function useTrends(range: TrendRange = 30) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setTrends(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = todayDateString();
    // null range means "everything", so the queries drop their lower bound
    // rather than silently capping at a fixed window.
    const start = range == null ? null : addDays(today, -(range - 1));
    // The adherence strip is a fixed 14 days, so the food query has to reach
    // back at least that far whatever range is selected. It did not: on the
    // 7-day range only 7 days of food were ever fetched, so the older half of
    // the strip was blank by construction and the app reported "7 of 14 days"
    // no matter how long the streak actually was. The wider window only adds
    // map entries — every series below iterates the SELECTED range and reads
    // from the map, so nothing else changes shape.
    const adherenceStart = addDays(today, -(ADHERENCE_DAYS - 1));
    const foodStart = start == null ? null : start < adherenceStart ? start : adherenceStart;

    const since = <T extends { gte: (col: string, v: string) => T }>(q: T, col: string, value: string | null) =>
      value == null ? q : q.gte(col, value);

    Promise.all([
      since(
        supabase.from('daily_logs').select('log_date, weight, steps, caffeine_mg').eq('user_id', userId),
        'log_date',
        start,
      )
        .lte('log_date', today)
        .order('log_date', { ascending: true }),
      since(
        supabase.from('food_logs').select('meal_timestamp, calories, protein_g').eq('user_id', userId),
        'meal_timestamp',
        foodStart && startOfDateIso(foodStart),
      ),
      since(
        supabase.from('workout_logs').select('session_timestamp, exercise_data').eq('user_id', userId),
        'session_timestamp',
        start && startOfDateIso(start),
      ).order('session_timestamp', { ascending: true }),
      since(
        supabase
          .from('cardio_logs')
          .select('session_timestamp, distance_km, duration_min, activity_type')
          .eq('user_id', userId),
        'session_timestamp',
        start && startOfDateIso(start),
      ).order('session_timestamp', { ascending: true }),
      since(
        supabase
          .from('measurements')
          .select('entry_timestamp, waist, calculated_body_fat')
          .eq('user_id', userId),
        'entry_timestamp',
        start && startOfDateIso(start),
      ).order('entry_timestamp', { ascending: true }),
    ]).then(([dailyRes, foodRes, workoutRes, cardioRes, measureRes]) => {
      if (cancelled) return;
      const dailies =
        (dailyRes.data as Pick<DailyLog, 'log_date' | 'weight' | 'steps' | 'caffeine_mg'>[]) ?? [];
      const meals = (foodRes.data as Pick<FoodLog, 'meal_timestamp' | 'calories' | 'protein_g'>[]) ?? [];
      const workouts = (workoutRes.data as Pick<WorkoutLog, 'session_timestamp' | 'exercise_data'>[]) ?? [];

      // Weight series (weigh-ins) + moving average.
      const weight: Series = dailies
        .filter(d => d.weight != null)
        .map(d => ({ label: shortLabel(d.log_date), value: d.weight as number, date: d.log_date }));
      const weightMovingAvg = movingAverage(weight.map(w => w.value), 5);

      // Build lookup maps so we can render a continuous window (every day shown,
      // gaps filled with 0) rather than only the days that happen to have data.
      const stepsMap = new Map<string, number>();
      const caffeineMap = new Map<string, number>();
      for (const d of dailies) {
        if (d.steps != null) stepsMap.set(d.log_date, d.steps);
        if (d.caffeine_mg != null) caffeineMap.set(d.log_date, d.caffeine_mg);
      }

      const kcalMap = new Map<string, number>();
      const proteinMap = new Map<string, number>();
      for (const m of meals) {
        const day = new Date(m.meal_timestamp).toLocaleDateString('en-CA');
        kcalMap.set(day, (kcalMap.get(day) ?? 0) + (m.calories ?? 0));
        proteinMap.set(day, (proteinMap.get(day) ?? 0) + (m.protein_g ?? 0));
      }

      // On "all", the window starts at the earliest thing actually logged, so an
      // empty account doesn't render years of blank days.
      const earliest = [
        ...dailies.map(d => d.log_date),
        ...Array.from(kcalMap.keys()),
        ...workouts.map(w => w.session_timestamp.slice(0, 10)),
      ].sort()[0];
      const windowStart = start ?? earliest ?? today;
      const spanDays = Math.max(1, daysBetween(windowStart, today));
      const intakeBucket: 'day' | 'week' = spanDays > DAILY_BAR_LIMIT ? 'week' : 'day';

      // One bar per day across the window (missing days read as 0).
      const daily = (map: Map<string, number>): Series =>
        Array.from({ length: spanDays }, (_, k) => {
          const date = addDays(today, -(spanDays - 1 - k));
          return { label: shortLabel(date), value: Math.round(map.get(date) ?? 0), date };
        });

      // One bar per Monday-anchored week, averaged over the days in that week
      // that actually have data — a week with three logged days shouldn't look
      // like a low week just because four days are blank.
      const weekly = (map: Map<string, number>): Series => {
        const sums = new Map<string, { sum: number; count: number }>();
        for (let k = 0; k < spanDays; k++) {
          const date = addDays(today, -(spanDays - 1 - k));
          const v = map.get(date);
          if (v == null) continue;
          const wk = startOfWeek(date);
          const cur = sums.get(wk) ?? { sum: 0, count: 0 };
          cur.sum += v;
          cur.count += 1;
          sums.set(wk, cur);
        }
        return Array.from(sums.entries())
          .sort((a, b) => (a[0] < b[0] ? -1 : 1))
          .map(([wk, { sum, count }]) => ({
            label: shortLabel(wk),
            value: Math.round(sum / count),
            date: wk,
          }));
      };

      const series = (map: Map<string, number>) => (intakeBucket === 'week' ? weekly(map) : daily(map));

      // Average over the days that actually have data (ignore the filled zeros).
      const avgLogged = (map: Map<string, number>): number | null => {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < spanDays; i++) {
          const v = map.get(addDays(today, -i));
          if (v != null) {
            sum += v;
            count += 1;
          }
        }
        return count ? Math.round(sum / count) : null;
      };

      const steps = series(stepsMap);
      const caffeine = series(caffeineMap);
      const calories = series(kcalMap);
      const protein = series(proteinMap);
      const hasCaffeine = caffeineMap.size > 0;

      // Fixed 14-day adherence strip, genuinely independent of the selected
      // range now that the query reaches back far enough to fill it.
      const loggedDays = Array.from({ length: ADHERENCE_DAYS }, (_, k) => {
        const date = addDays(today, -(ADHERENCE_DAYS - 1 - k));
        return { date, logged: (kcalMap.get(date) ?? 0) > 0 };
      });

      // Training volume per session.
      const volume: Series = workouts.map(w => {
        const vol = (w.exercise_data ?? []).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
        const date = w.session_timestamp.slice(0, 10);
        return { label: shortLabel(date), value: Math.round(vol), date };
      });

      const cardio =
        (cardioRes.data as Pick<
          CardioLog,
          'session_timestamp' | 'distance_km' | 'duration_min' | 'activity_type'
        >[]) ?? [];
      const cardioDistance: Series = cardio
        .filter(c => c.distance_km != null)
        .map(c => {
          const date = c.session_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: Math.round((c.distance_km as number) * 10) / 10, date };
        });
      const totalKm = Math.round(cardioDistance.reduce((s, p) => s + p.value, 0) * 10) / 10;

      // Pace only means something when both halves were logged, so a session
      // with just a distance still counts for volume but not for pace.
      const cardioSessions: CardioSession[] = cardio.map(c => {
        const date = c.session_timestamp.slice(0, 10);
        const km = c.distance_km ?? null;
        const minutes = c.duration_min ?? null;
        return {
          date,
          label: shortLabel(date),
          activity: c.activity_type || 'Cardio',
          km,
          minutes,
          pace: km != null && km > 0 && minutes != null && minutes > 0 ? minutes / km : null,
        };
      });
      const paced = cardioSessions.filter(c => c.pace != null);
      const totalMinutes = cardioSessions.reduce((sum, c) => sum + (c.minutes ?? 0), 0);
      const cardioSummary: CardioSummary | null = cardioSessions.length
        ? {
            sessions: cardioSessions.length,
            totalKm,
            totalMinutes,
            bestPace: paced.length ? Math.min(...paced.map(c => c.pace as number)) : null,
            avgPace: paced.length
              ? paced.reduce((sum, c) => sum + (c.pace as number), 0) / paced.length
              : null,
            longestKm: cardioDistance.length ? Math.max(...cardioDistance.map(p => p.value)) : null,
            latestPace: paced.length ? (paced[paced.length - 1].pace as number) : null,
            paceDelta:
              paced.length > 1
                ? (paced[paced.length - 1].pace as number) - (paced[paced.length - 2].pace as number)
                : null,
          }
        : null;

      // Body composition from measurements.
      const measures =
        (measureRes.data as Pick<Measurement, 'entry_timestamp' | 'waist' | 'calculated_body_fat'>[]) ?? [];
      const waist: Series = measures
        .filter(m => m.waist != null)
        .map(m => {
          const date = m.entry_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: m.waist as number, date };
        });
      const bodyFat: Series = measures
        .filter(m => m.calculated_body_fat != null)
        .map(m => {
          const date = m.entry_timestamp.slice(0, 10);
          return { label: shortLabel(date), value: Math.round((m.calculated_body_fat as number) * 10) / 10, date };
        });

      // Workout sessions grouped per Monday-anchored week.
      const weekCounts = new Map<string, number>();
      for (const w of workouts) {
        const wk = startOfWeek(w.session_timestamp.slice(0, 10));
        weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1);
      }
      const workoutsPerWeek: Series = Array.from(weekCounts.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([wk, count]) => ({ label: shortLabel(wk), value: count, date: wk }));
      const totalWorkouts = workouts.length;

      setTrends({
        weight,
        weightMovingAvg,
        calories,
        protein,
        steps,
        caffeine,
        hasCaffeine,
        volume,
        cardioDistance,
        totalKm,
        cardioSessions,
        cardioSummary,
        waist,
        bodyFat,
        workoutsPerWeek,
        totalWorkouts,
        avgCalories: avgLogged(kcalMap),
        avgProtein: avgLogged(proteinMap),
        avgSteps: avgLogged(stepsMap),
        avgCaffeine: avgLogged(caffeineMap),
        intakeBucket,
        loggedDays,
        spanDays,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, range]);

  return { trends, loading };
}
