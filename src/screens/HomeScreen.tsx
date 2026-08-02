import { useEffect, useState } from 'react';
import { Flame, RefreshCw, Settings } from 'lucide-react';
import { useTodayLog } from '../hooks/useTodayLog';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useLoggingStreak } from '../hooks/useLoggingStreak';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useProfile } from '../hooks/useProfile';
import { useSettings } from '../hooks/useSettings';
import { useCoachInsight, type CoachPayload } from '../hooks/useCoachInsight';
import { useWeeklyReview } from '../hooks/useWeeklyReview';
import { useStartWeight } from '../hooks/useStartWeight';
import { SleepBarChart } from '../components/charts/SleepBarChart';
import { type Ring } from '../components/charts/ActivityRings';
import { CoachCard } from '../components/CoachCard';
import { type GamePlanItem } from '../components/TodayGamePlan';
import { TodayDashboard } from '../components/TodayDashboard';
import { WorkoutOverviewCard } from '../components/WorkoutOverviewCard';
import { GoalProgressCard } from '../components/GoalProgressCard';
import { WeeklyReviewCard } from '../components/WeeklyReviewCard';
import { StepsCard } from '../components/StepsSummary';
import { DateNavigator } from '../components/DateNavigator';
import { addDays, isToday, todayDateString } from '../utils/date';
import { initialsFromName } from '../utils/name';
import { getSyncShortcutName, runSyncShortcut } from '../utils/healthShortcut';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeGoalProgress,
  computeSuggestedMacros,
  computeTDEE,
} from '../utils/calculations';

const REFERENCE_CALORIE_TARGET = 2000;

function formatSleepDuration(hours: number | null): string {
  if (!hours) return '--';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

function weekdayLetter(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
}

function dayNumber(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return String(date.getDate());
}

type Props = {
  onNavigateStats: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
};

export function HomeScreen({ onNavigateStats, onOpenProfile, onOpenSettings }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [syncShortcut] = useState(getSyncShortcutName());
  const viewingToday = isToday(selectedDate);

  const { log: dayLog, loading: dayLoading, refresh: refreshDay } = useTodayLog(selectedDate);
  const { logs: recentLogs, loading: recentLoading, refresh: refreshRecent } =
    useRecentDailyLogs(14);
  const { streak } = useLoggingStreak();
  const { totals, refresh: refreshNutrition } = useTodayNutrition(selectedDate);
  const { profile } = useProfile();
  const { settings } = useSettings();
  const startWeight = useStartWeight();
  const { workouts } = useRecentWorkouts(20);

  const refreshing = dayLoading || recentLoading;
  const reloadData = () => {
    refreshDay();
    refreshRecent();
    refreshNutrition();
  };
  const onRefresh = () => {
    // If a Health-sync Shortcut is configured, run it (jumps to Shortcuts,
    // which posts today's metrics), then reload. When the user returns to the
    // app the visibility handler below reloads again so fresh data shows.
    if (syncShortcut) runSyncShortcut(syncShortcut);
    reloadData();
  };

  // Reload whenever the app comes back to the foreground — e.g. after the
  // Health-sync Shortcut ran and the user swiped back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Continuous 7-day window ending on the selected date, so every day shows on
  // the axis whether or not sleep was logged.
  const sleepByDate = new Map(recentLogs.map(l => [l.log_date, l.sleep_hours]));
  const sleepEntries = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(selectedDate, i - 6);
    return {
      weekday: weekdayLetter(date),
      day: dayNumber(date),
      hours: sleepByDate.get(date) ?? null,
    };
  });
  const latestSleepHours = sleepByDate.get(selectedDate) ?? null;

  const weightEntries = recentLogs.filter(
    (l): l is typeof l & { weight: number } => l.weight != null,
  );
  const latestWeight = dayLog?.weight ?? weightEntries[weightEntries.length - 1]?.weight ?? null;
  const weightTrend =
    weightEntries.length >= 2
      ? `${(weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight).toFixed(1)}kg over last ${weightEntries.length} entries`
      : null;

  const deficitKcal = profile?.calorie_deficit_kcal ?? 500;
  const canComputeTarget = Boolean(
    profile?.gender && profile?.height && profile?.birth_date && latestWeight,
  );
  const calorieTarget =
    profile?.calorie_target_override ??
    (canComputeTarget
      ? computeDailyCalorieTarget({
          tdee: computeTDEE(
            computeBMR({
              gender: profile!.gender!,
              weightKg: latestWeight!,
              heightCm: profile!.height!,
              ageYears: ageFromBirthDate(profile!.birth_date!),
            }),
            profile!.activity_level,
          ),
          deficitKcal,
        })
      : REFERENCE_CALORIE_TARGET);
  const suggestedMacros = canComputeTarget
    ? computeSuggestedMacros({ weightKg: latestWeight!, calorieTarget, deficitKcal })
    : null;
  const proteinTarget = profile?.protein_target_g ?? suggestedMacros?.proteinG ?? null;

  const goalProgress = computeGoalProgress({
    goalType: profile?.goal_type,
    startWeight,
    currentWeight: latestWeight,
    targetWeight: profile?.target_weight_kg,
    weeklyRateKg: profile?.weekly_rate_kg,
  });
  const { review: weeklyReview } = useWeeklyReview({ calorieTarget, proteinTarget });

  const proteinGoal = proteinTarget ?? Math.round((calorieTarget * 0.3) / 4);
  const workoutToday = workouts.some(
    w => new Date(w.session_timestamp).toLocaleDateString('en-CA') === selectedDate,
  );
  const steps = dayLog?.steps ?? 0;
  const waterMl = dayLog?.water_ml ?? 0;
  // Exercise "earns back" calorie budget: net intake = eaten − active kcal burned.
  const burnedKcal = Math.max(0, Math.round(dayLog?.active_calories_burned ?? 0));
  const netCalories = Math.max(0, Math.round(totals.calories - burnedKcal));
  const gamePlan: GamePlanItem[] = [
    {
      key: 'calories',
      label: 'Eat around your target',
      detail:
        burnedKcal > 0
          ? `${Math.round(totals.calories)} − ${burnedKcal} = ${netCalories} / ${calorieTarget} kcal`
          : `${Math.round(totals.calories)} / ${calorieTarget} kcal`,
      done: netCalories >= calorieTarget * 0.85 && netCalories <= calorieTarget * 1.05,
      progress: calorieTarget > 0 ? netCalories / calorieTarget : 0,
    },
    {
      key: 'protein',
      label: 'Hit your protein',
      detail: `${Math.round(totals.protein_g)} / ${proteinGoal} g`,
      done: totals.protein_g >= proteinGoal * 0.95,
      progress: proteinGoal > 0 ? totals.protein_g / proteinGoal : 0,
    },
    {
      key: 'burn',
      label: 'Burn active calories',
      detail: `${burnedKcal} / ${settings.activeCalorieGoal} kcal`,
      done: settings.activeCalorieGoal > 0 && burnedKcal >= settings.activeCalorieGoal,
      progress: settings.activeCalorieGoal > 0 ? burnedKcal / settings.activeCalorieGoal : 0,
    },
    {
      key: 'workout',
      label: 'Move your body',
      detail: workoutToday ? 'Workout logged' : 'Not yet',
      done: workoutToday,
      progress: workoutToday ? 1 : 0,
    },
  ];

  const rings: Ring[] = [
    { label: 'Calories', value: netCalories, target: calorieTarget, color: '#6c63ff' },
    {
      label: 'Protein',
      value: totals.protein_g,
      target: proteinTarget ?? Math.round((calorieTarget * 0.3) / 4),
      color: '#22c55e',
      unit: 'g',
    },
    { label: 'Water', value: waterMl, target: settings.waterGoalMl, color: '#0ea5e9', unit: 'ml' },
  ];

  const hasAnyData =
    totals.mealCount > 0 ||
    dayLog?.steps != null ||
    dayLog?.water_ml != null ||
    latestWeight != null;

  const coachPayload: CoachPayload = {
    goal: deficitKcal > 0 ? 'deficit' : deficitKcal < 0 ? 'surplus' : 'maintenance',
    caloriesLogged: Math.round(totals.calories),
    caloriesBurned: burnedKcal,
    calorieTarget,
    proteinLogged: Math.round(totals.protein_g),
    proteinTarget,
    carbsLogged: Math.round(totals.carbs_g),
    fatLogged: Math.round(totals.fat_g),
    steps: dayLog?.steps ?? null,
    waterMl: dayLog?.water_ml ?? null,
    latestWeight,
    weightTrend,
    streak,
    mealCount: totals.mealCount,
  };
  // Only coach for today — a past day's "calories left" would be nonsensical.
  const coach = useCoachInsight(coachPayload, hasAnyData && viewingToday);


  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      {/* Top bar */}
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            aria-label="Edit profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)]"
          >
            <span className="text-sm font-bold text-white">{initialsFromName(profile?.name)}</span>
          </button>
          {streak > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1.5">
              <Flame size={13} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{streak}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            aria-label={syncShortcut ? 'Sync Health & refresh' : 'Refresh'}
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <RefreshCw
              size={15}
              className={`${syncShortcut ? 'text-[var(--accent)]' : 'text-[var(--muted)]'} ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <Settings size={16} className="text-[var(--muted)]" />
          </button>
        </div>
      </div>

      {/* Date navigator: title + calendar + week strip */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.05s' }}>
        <DateNavigator selectedDate={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* 1. Your journey */}
      {viewingToday && goalProgress ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.06s' }}>
          <GoalProgressCard progress={goalProgress} weightUnit={settings.weightUnit} />
        </div>
      ) : null}

      {/* 2. Today's game plan (rings + goals) */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.08s' }}>
        <TodayDashboard rings={rings} items={gamePlan} onNavigateStats={onNavigateStats} />
      </div>

      {/* 3. Steps */}
      {viewingToday ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.1s' }}>
          <StepsCard steps={steps} goal={settings.stepGoal} />
        </div>
      ) : null}

      {/* 4. Sleep (compact) */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-2.5 p-4"
        style={{ animationDelay: '0.12s' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
              <span className="text-xs">🌙</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Sleep</p>
              <p className="text-[10px] text-[var(--muted)]">
                {latestSleepHours && latestSleepHours < 7
                  ? 'Slept too little last night'
                  : latestSleepHours
                    ? 'Hit your sleep window'
                    : 'No sleep data yet'}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text)]">
            {formatSleepDuration(latestSleepHours)}
          </p>
        </div>

        <SleepBarChart entries={sleepEntries} goalHours={8} maxScaleHours={10} />
      </div>

      {/* 5. Coach */}
      {viewingToday ? (
        <div className="mt-4">
          <CoachCard
            status={coach.status}
            insight={coach.status === 'ready' ? coach.insight : undefined}
          />
        </div>
      ) : null}

      {/* 6. Weekly progress */}
      {viewingToday ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.16s' }}>
          <WorkoutOverviewCard />
        </div>
      ) : null}

      {/* 7. This week */}
      {viewingToday && weeklyReview && weeklyReview.daysLogged > 0 ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.18s' }}>
          <WeeklyReviewCard review={weeklyReview} />
        </div>
      ) : null}
    </div>
  );
}
