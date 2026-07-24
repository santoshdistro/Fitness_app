import { useState } from 'react';
import { Bell, ChevronRight, Flame, RefreshCw } from 'lucide-react';
import { useTodayLog } from '../hooks/useTodayLog';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useLoggingStreak } from '../hooks/useLoggingStreak';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useProfile } from '../hooks/useProfile';
import { useCoachInsight, type CoachPayload } from '../hooks/useCoachInsight';
import { SleepBarChart } from '../components/charts/SleepBarChart';
import { ActivityRings, RingLegend, type Ring } from '../components/charts/ActivityRings';
import { CoachCard } from '../components/CoachCard';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
} from '../utils/calculations';

const REFERENCE_CALORIE_TARGET = 2000;
const STEP_GOAL = 10000;

function formatSleepDuration(hours: number | null): string {
  if (!hours) return '--';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

function shortDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: '2-digit' });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

type Props = {
  onNavigateStats: () => void;
  onOpenProfile: () => void;
};

export function HomeScreen({ onNavigateStats, onOpenProfile }: Props) {
  const { log: todayLog, loading: todayLoading, refresh: refreshToday } = useTodayLog();
  const { logs: recentLogs, loading: recentLoading, refresh: refreshRecent } =
    useRecentDailyLogs(14);
  const { streak } = useLoggingStreak();
  const { totals, refresh: refreshNutrition } = useTodayNutrition();
  const { profile } = useProfile();
  const [coachKey, setCoachKey] = useState(0);

  const refreshing = todayLoading || recentLoading;
  const onRefresh = () => {
    refreshToday();
    refreshRecent();
    refreshNutrition();
    setCoachKey(k => k + 1);
  };

  const waterLiters = todayLog?.water_ml ? (todayLog.water_ml / 1000).toFixed(2) : '--';
  const sleepEntries = recentLogs.slice(-6).map(entry => ({
    label: shortDayLabel(entry.log_date),
    hours: entry.sleep_hours,
  }));
  const latestSleepHours = recentLogs[recentLogs.length - 1]?.sleep_hours ?? null;

  // Weight trend for the coach payload.
  const weightEntries = recentLogs.filter(
    (l): l is typeof l & { weight: number } => l.weight != null,
  );
  const latestWeight = todayLog?.weight ?? weightEntries[weightEntries.length - 1]?.weight ?? null;
  const weightTrend =
    weightEntries.length >= 2
      ? `${(weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight).toFixed(1)}kg over last ${weightEntries.length} entries`
      : null;

  // Personalized calorie + macro targets (mirrors the Stats screen).
  const deficitKcal = profile?.calorie_deficit_kcal ?? 500;
  const canComputeTarget = Boolean(
    profile?.gender && profile?.height && profile?.birth_date && latestWeight,
  );
  const calorieTarget = canComputeTarget
    ? computeDailyCalorieTarget({
        bmr: computeBMR({
          gender: profile!.gender!,
          weightKg: latestWeight!,
          heightCm: profile!.height!,
          ageYears: ageFromBirthDate(profile!.birth_date!),
        }),
        activeCalories: todayLog?.active_calories_burned ?? 0,
        deficitKcal,
      })
    : REFERENCE_CALORIE_TARGET;
  const suggestedMacros = canComputeTarget
    ? computeSuggestedMacros({ weightKg: latestWeight!, calorieTarget, deficitKcal })
    : null;
  const proteinTarget = profile?.protein_target_g ?? suggestedMacros?.proteinG ?? null;

  const rings: Ring[] = [
    { label: 'Calories', value: totals.calories, target: calorieTarget, color: '#6c63ff' },
    {
      label: 'Protein',
      value: totals.protein_g,
      target: proteinTarget ?? Math.round((calorieTarget * 0.3) / 4),
      color: '#22c55e',
      unit: 'g',
    },
    { label: 'Steps', value: todayLog?.steps ?? 0, target: STEP_GOAL, color: '#f97316' },
  ];

  const hasAnyData =
    totals.mealCount > 0 ||
    todayLog?.steps != null ||
    todayLog?.water_ml != null ||
    latestWeight != null;

  const coachPayload: CoachPayload = {
    goal: deficitKcal > 0 ? 'deficit' : deficitKcal < 0 ? 'surplus' : 'maintenance',
    caloriesLogged: Math.round(totals.calories),
    calorieTarget,
    proteinLogged: Math.round(totals.protein_g),
    proteinTarget,
    carbsLogged: Math.round(totals.carbs_g),
    fatLogged: Math.round(totals.fat_g),
    steps: todayLog?.steps ?? null,
    waterMl: todayLog?.water_ml ?? null,
    latestWeight,
    weightTrend,
    streak,
    mealCount: totals.mealCount,
  };
  const coach = useCoachInsight(coachPayload, hasAnyData, coachKey);

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            aria-label="Edit profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)]"
          >
            <span className="text-sm font-bold text-white">U</span>
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {greeting()}
            </p>
            <p className="text-sm font-bold text-[var(--text)]">Today</p>
          </div>
          {streak > 0 ? (
            <div className="ml-1 flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1.5">
              <Flame size={13} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-500">{streak}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            aria-label="Refresh"
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <RefreshCw
              size={15}
              className={`text-[var(--muted)] ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <div className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <Bell size={16} className="text-[var(--muted)]" />
          </div>
        </div>
      </div>

      {/* Activity rings dashboard */}
      <div
        className="glass-card anim-fade-rise mt-5 flex items-center gap-5 p-5"
        style={{ animationDelay: '0.1s' }}
      >
        <ActivityRings rings={rings} />
        <div className="flex-1">
          <RingLegend rings={rings} />
          <button
            onClick={onNavigateStats}
            className="mt-3 flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            See full stats
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* AI coach */}
      <div className="mt-4">
        <CoachCard
          status={coach.status}
          insight={coach.status === 'ready' ? coach.insight : undefined}
          message={coach.status === 'error' ? coach.message : undefined}
          onRetry={() => setCoachKey(k => k + 1)}
        />
      </div>

      {/* Water quick glance */}
      <div className="anim-fade-rise mt-4 flex gap-3" style={{ animationDelay: '0.28s' }}>
        <div className="glass-card flex-1 p-4">
          <p className="text-2xl font-bold tracking-tight text-[var(--text)]">{waterLiters}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Water (L)
          </p>
        </div>
        <div className="glass-card flex-1 p-4">
          <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
            {todayLog?.active_calories_burned ?? '--'}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Active kcal
          </p>
        </div>
      </div>

      {/* Sleep */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-4 p-5"
        style={{ animationDelay: '0.32s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <span>🌙</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Sleep</p>
              <p className="text-[11px] text-[var(--muted)]">
                {latestSleepHours && latestSleepHours < 7
                  ? 'You slept too little last night'
                  : latestSleepHours
                    ? 'Nice, you hit your sleep window'
                    : 'No sleep data logged yet'}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text)]">
            {formatSleepDuration(latestSleepHours)}
          </p>
        </div>

        <SleepBarChart entries={sleepEntries} goalHours={8} maxScaleHours={10} />
      </div>
    </div>
  );
}
