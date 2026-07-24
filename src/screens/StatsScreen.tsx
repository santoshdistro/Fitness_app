import { useState } from 'react';
import { Activity, Camera, ChevronLeft, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { useTodayLog } from '../hooks/useTodayLog';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CalorieGauge } from '../components/charts/CalorieGauge';
import { WeightSparkline } from '../components/charts/WeightSparkline';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
  computeTDEE,
} from '../utils/calculations';
import { addDays, endOfDateIso, isToday, startOfDateIso, todayDateString } from '../utils/date';
import type { FoodLog, MealCategory } from '../types/database';

const REFERENCE_CALORIE_TARGET = 2000;

const MEAL_CATEGORIES: { key: MealCategory; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
  { key: 'supplement', label: 'Supplements' },
  { key: 'other', label: 'Other' },
];

function formatMealTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function dateLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (dateStr === addDays(todayDateString(), -1)) return 'Yesterday';
  return formatShortDate(dateStr);
}

type Props = {
  onQuickAddCalories: () => void;
  onOpenProgressPhotos: () => void;
};

export function StatsScreen({ onQuickAddCalories, onOpenProgressPhotos }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const { session } = useAuth();
  const { totals, meals, deleteMeal, refresh: refreshMeals } = useTodayNutrition(selectedDate);
  const { logs: weightLogs, clearWeight } = useRecentDailyLogs(14);
  const { measurements, deleteMeasurement } = useRecentMeasurements(5);
  const { log: todayLog } = useTodayLog();
  const { profile } = useProfile();
  const [copying, setCopying] = useState(false);

  const measurement = measurements[0];
  const weightEntries = weightLogs.filter((l): l is typeof l & { weight: number } => l.weight != null);
  const weightValues = weightEntries.map(l => l.weight);
  const latestWeight = todayLog?.weight ?? weightValues[weightValues.length - 1];

  const deficitKcal = profile?.calorie_deficit_kcal ?? 500;
  const canComputeTarget = Boolean(profile?.gender && profile?.height && profile?.birth_date && latestWeight);
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

  const macroGoals = [
    {
      label: 'Protein',
      value: totals.protein_g,
      target: profile?.protein_target_g ?? suggestedMacros?.proteinG,
      unit: 'g',
      suggested: profile?.protein_target_g == null && suggestedMacros != null,
    },
    { label: 'Fiber', value: totals.fiber_g, target: profile?.fiber_target_g, unit: 'g', suggested: false },
    { label: 'Sodium', value: totals.sodium_mg, target: profile?.sodium_target_mg, unit: 'mg', suggested: false },
  ].filter((goal): goal is typeof goal & { target: number } => goal.target != null);

  const mealsByCategory = MEAL_CATEGORIES.map(category => ({
    ...category,
    meals: meals.filter(meal => meal.meal_category === category.key),
  }));

  async function copyYesterdaysMeals() {
    if (!session?.user) return;
    setCopying(true);
    const yesterday = addDays(selectedDate, -1);
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('meal_timestamp', startOfDateIso(yesterday))
      .lt('meal_timestamp', endOfDateIso(yesterday));

    const previousMeals = (data as FoodLog[]) ?? [];
    if (previousMeals.length > 0) {
      await supabase.from('food_logs').insert(
        previousMeals.map(meal => ({
          user_id: session.user!.id,
          meal_name: meal.meal_name,
          meal_category: meal.meal_category,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          fiber_g: meal.fiber_g,
          sodium_mg: meal.sodium_mg,
        })),
      );
      await refreshMeals();
    }
    setCopying(false);
  }

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setSelectedDate(current => addDays(current, -1))}
          aria-label="Previous day"
          className="glass flex h-7 w-7 items-center justify-center rounded-full"
        >
          <ChevronLeft size={14} className="text-[var(--muted)]" />
        </button>
        <h1 className="w-28 text-center text-sm font-bold tracking-wide text-[var(--text)]">
          {dateLabel(selectedDate)}
        </h1>
        <button
          type="button"
          onClick={() => setSelectedDate(current => addDays(current, 1))}
          disabled={isToday(selectedDate)}
          aria-label="Next day"
          className="glass flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronRight size={14} className="text-[var(--muted)]" />
        </button>
      </div>

      {/* Calories */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-4 p-5"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <Activity size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Calories</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Logged
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text)]">
            {Math.round(totals.calories)}{' '}
            <span className="text-xs font-semibold text-[var(--muted)]">kcal</span>
          </p>
        </div>

        <div className="flex gap-2">
          <MacroTile
            label="Carbs"
            value={`${Math.round(totals.carbs_g)}g`}
            target={suggestedMacros ? `${suggestedMacros.carbsG}g` : undefined}
          />
          <MacroTile
            label="Protein"
            value={`${Math.round(totals.protein_g)}g`}
            target={
              profile?.protein_target_g
                ? `${profile.protein_target_g}g`
                : suggestedMacros
                  ? `${suggestedMacros.proteinG}g`
                  : undefined
            }
          />
          <MacroTile
            label="Fats"
            value={`${Math.round(totals.fat_g)}g`}
            target={suggestedMacros ? `${suggestedMacros.fatG}g` : undefined}
          />
        </div>

        <CalorieGauge
          percent={totals.calories / calorieTarget}
          valueLabel={String(Math.max(0, calorieTarget - Math.round(totals.calories)))}
        />
        <p className="-mt-2 text-center text-[10px] text-[var(--muted)]">
          {canComputeTarget
            ? `${calorieTarget} kcal target · BMR + activity ${deficitKcal >= 0 ? '−' : '+'} ${Math.abs(deficitKcal)} kcal ${deficitKcal >= 0 ? 'deficit' : 'surplus'}`
            : `vs ${REFERENCE_CALORIE_TARGET} kcal reference · complete your profile and log weight for a personalized target`}
        </p>
      </div>

      {/* Macro goals */}
      {macroGoals.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-3 p-5" style={{ animationDelay: '0.12s' }}>
          <p className="text-sm font-semibold text-[var(--text)]">Today's Goals</p>
          {macroGoals.map(goal => {
            const percent = Math.min(100, (goal.value / goal.target) * 100);
            return (
              <div key={goal.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--text)]">
                    {goal.label}
                    {goal.suggested ? (
                      <span className="ml-1 text-[9px] font-medium text-[var(--muted)]">(suggested)</span>
                    ) : null}
                  </span>
                  <span className="text-[var(--muted)]">
                    {Math.round(goal.value)} / {goal.target}
                    {goal.unit}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Diary */}
      <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.14s' }}>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">Diary</p>
          <button
            type="button"
            onClick={onQuickAddCalories}
            className="text-xs font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            + Quick add
          </button>
        </div>

        {totals.mealCount === 0 && isToday(selectedDate) ? (
          <button
            type="button"
            onClick={copyYesterdaysMeals}
            disabled={copying}
            className="mb-2 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--card-border)] py-2.5 text-xs font-semibold disabled:opacity-50"
            style={{ color: 'var(--accent)' }}
          >
            <Copy size={13} />
            {copying ? 'Copying...' : "Copy yesterday's meals"}
          </button>
        ) : null}

        {totals.mealCount === 0 ? (
          <p className="text-xs text-[var(--muted)]">No meals logged for this day.</p>
        ) : (
          mealsByCategory.map(category =>
            category.meals.length > 0 ? (
              <div key={category.key} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    {category.label}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--muted)]">
                    {Math.round(category.meals.reduce((sum, m) => sum + (m.calories ?? 0), 0))} kcal
                  </p>
                </div>
                {category.meals.map(meal => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{meal.meal_name}</p>
                      <p className="text-[10px] text-[var(--muted)]">
                        {formatMealTime(meal.meal_timestamp)} · {meal.calories ?? 0} kcal ·{' '}
                        {meal.protein_g ?? 0}g protein
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMeal(meal.id)}
                      aria-label={`Delete ${meal.meal_name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null,
          )
        )}
      </div>

      {/* Weight */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-2 p-5"
        style={{
          animationDelay: '0.18s',
          background: 'linear-gradient(160deg, rgba(108,99,255,0.1), rgba(108,99,255,0.02))',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="glass flex h-8 w-8 items-center justify-center rounded-full">
            <Activity size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Weight</p>
            <p className="text-[10px] font-medium text-[var(--muted)]">
              {weightValues.length >= 2
                ? `${weightValues[0]}kg -> ${latestWeight}kg over last ${weightValues.length} entries`
                : 'Log your weight to start a trend'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-16 items-end justify-between">
          <p className="text-5xl font-black tracking-tighter text-[var(--text)]">
            {latestWeight ?? '--'}
          </p>
          {weightValues.length >= 2 ? <WeightSparkline values={weightValues} /> : null}
        </div>
      </div>

      {/* Weight history */}
      {weightEntries.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.22s' }}>
          <p className="mb-2 text-sm font-semibold text-[var(--text)]">Recent Weigh-ins</p>
          {weightEntries
            .slice()
            .reverse()
            .map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
              >
                <p className="text-sm text-[var(--text)]">
                  {formatShortDate(entry.log_date)} · <span className="font-semibold">{entry.weight}kg</span>
                </p>
                <button
                  type="button"
                  onClick={() => clearWeight(entry.id)}
                  aria-label="Delete weight entry"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
        </div>
      ) : null}

      {/* Progress photos */}
      <button
        type="button"
        onClick={onOpenProgressPhotos}
        className="glass-card anim-fade-rise mt-4 flex w-full items-center gap-3 p-4 text-left"
        style={{ animationDelay: '0.24s' }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Camera size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text)]">Progress photos</p>
          <p className="text-[10px] text-[var(--muted)]">
            Snap weekly photos and compare before / after
          </p>
        </div>
        <ChevronRight size={16} className="text-[var(--muted)]" />
      </button>

      {/* Body fat */}
      <div
        className="glass-card anim-fade-rise mt-4 flex items-center gap-3 p-4"
        style={{
          animationDelay: '0.26s',
          background: 'linear-gradient(160deg, rgba(147,51,234,0.08), rgba(147,51,234,0.02))',
        }}
      >
        <div className="glass flex h-8 w-8 items-center justify-center rounded-full">
          <Activity size={16} className="text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text)]">Body Fat</p>
          <p className="text-[10px] text-[var(--muted)]">
            {measurement?.calculated_body_fat != null
              ? `${measurement.calculated_body_fat.toFixed(1)}% - U.S. Navy method`
              : 'No measurements logged yet'}
          </p>
        </div>
      </div>

      {/* Measurement history */}
      {measurements.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.3s' }}>
          <p className="mb-2 text-sm font-semibold text-[var(--text)]">Recent Measurements</p>
          {measurements.map(entry => (
            <div
              key={entry.id}
              className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
            >
              <div>
                <p className="text-sm text-[var(--text)]">
                  {formatShortDate(entry.entry_timestamp.slice(0, 10))}
                  {entry.calculated_body_fat != null
                    ? ` · ${entry.calculated_body_fat.toFixed(1)}% BF`
                    : ''}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  Neck {entry.neck}in · Waist {entry.waist}in
                  {entry.hips != null ? ` · Hips ${entry.hips}in` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteMeasurement(entry.id)}
                aria-label="Delete measurement entry"
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MacroTile({ label, value, target }: { label: string; value: string; target?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-[var(--bg)] p-2.5">
      <p className="text-xs font-bold text-[var(--text)]">
        {value}
        {target ? <span className="font-medium text-[var(--muted)]"> / {target}</span> : null}
      </p>
      <p className="mt-0.5 text-[8px] font-bold uppercase text-[var(--muted)]">{label}</p>
    </div>
  );
}
