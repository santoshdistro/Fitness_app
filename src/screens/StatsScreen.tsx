import { useState } from 'react';
import { Activity, Camera, Check, ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useRecentMeasurements } from '../hooks/useRecentMeasurements';
import { useTodayLog } from '../hooks/useTodayLog';
import { useProfile } from '../hooks/useProfile';
import { useSettings } from '../hooks/useSettings';
import { weightValue } from '../utils/units';
import { useBodyScans, scanToResult } from '../hooks/useBodyScans';
import { useAdaptiveTdee } from '../hooks/useAdaptiveTdee';
import { BodyScanReadout } from '../components/BodyScanReadout';
import { BmiCard } from '../components/BmiCard';
import { AdaptiveTdeeCard } from '../components/AdaptiveTdeeCard';
import { MetabolicAgeCard } from '../components/MetabolicAgeCard';
import { TrendsPanel } from '../components/TrendsPanel';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { CalorieGauge } from '../components/charts/CalorieGauge';
import { WeightSparkline } from '../components/charts/WeightSparkline';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeMetabolicAge,
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

function formatScanDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
  const [tab, setTab] = useState<'stats' | 'trends'>('stats');
  const { handlers, change, animClass } = useTabSwipe(['stats', 'trends'] as const, tab, setTab);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const { session } = useAuth();
  const { totals, meals, deleteMeal, refresh: refreshMeals } = useTodayNutrition(selectedDate);
  const { logs: weightLogs, clearWeight } = useRecentDailyLogs(14);
  const { measurements, deleteMeasurement } = useRecentMeasurements(5);
  const { log: todayLog } = useTodayLog();
  const { profile } = useProfile();
  const { scans: bodyScans, removeScan } = useBodyScans();
  const { data: adaptiveTdee } = useAdaptiveTdee();
  const { settings } = useSettings();
  const wUnit = settings.weightUnit;
  const [openScanId, setOpenScanId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [addedMealIds, setAddedMealIds] = useState<Set<string>>(new Set());
  const [addingMealId, setAddingMealId] = useState<string | null>(null);

  const measurement = measurements[0];
  const weightEntries = weightLogs.filter((l): l is typeof l & { weight: number } => l.weight != null);
  const weightValues = weightEntries.map(l => l.weight);
  const latestWeight = todayLog?.weight ?? weightValues[weightValues.length - 1];

  const deficitKcal = profile?.calorie_deficit_kcal ?? 500;
  const canComputeTarget = Boolean(profile?.gender && profile?.height && profile?.birth_date && latestWeight);
  const tdee = canComputeTarget
    ? Math.round(
        computeTDEE(
          computeBMR({
            gender: profile!.gender!,
            weightKg: latestWeight!,
            heightCm: profile!.height!,
            ageYears: ageFromBirthDate(profile!.birth_date!),
          }),
          profile!.activity_level,
        ),
      )
    : null;
  const calorieTarget =
    profile?.calorie_target_override ??
    (tdee != null ? computeDailyCalorieTarget({ tdee, deficitKcal }) : REFERENCE_CALORIE_TARGET);

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

  // Re-log a single meal from a past day into today's diary (leaves the DB
  // meal_timestamp at its default of now, i.e. today).
  async function addMealToToday(meal: FoodLog) {
    if (!session?.user) return;
    setAddingMealId(meal.id);
    await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: meal.meal_name,
      meal_category: meal.meal_category,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      fiber_g: meal.fiber_g,
      sodium_mg: meal.sodium_mg,
      saturated_fat_g: meal.saturated_fat_g,
      trans_fat_g: meal.trans_fat_g,
      poly_fat_g: meal.poly_fat_g,
      mono_fat_g: meal.mono_fat_g,
    });
    setAddedMealIds(prev => new Set(prev).add(meal.id));
    setAddingMealId(null);
    // If we're viewing today, reflect the new row immediately.
    if (isToday(selectedDate)) await refreshMeals();
  }

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      {/* Tabs: Stats / Trends */}
      <div className="anim-drop-in mt-2 flex rounded-2xl bg-[var(--bg)] p-1">
        {([
          { key: 'stats', label: 'Stats' },
          { key: 'trends', label: 'Trends' },
        ] as const).map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => change(t.key)}
              className="flex-1 rounded-xl py-2 text-xs font-bold"
              style={
                active
                  ? { background: 'var(--card)', color: 'var(--text)', boxShadow: '0 2px 8px -3px rgba(0,0,0,0.25)' }
                  : { color: 'var(--muted)' }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} {...handlers} className={animClass}>
      {tab === 'trends' ? (
        <div className="anim-fade-rise mt-4">
          <TrendsPanel />
        </div>
      ) : (
        <>
      <div className="anim-drop-in mt-4 flex items-center justify-center gap-3">
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

      {/* BMI */}
      {profile?.height && latestWeight ? (
        <div className="mt-4">
          <BmiCard weightKg={latestWeight} heightCm={profile.height} weightUnit={wUnit} />
        </div>
      ) : null}

      {/* Metabolic age */}
      {(() => {
        if (!profile?.birth_date || !profile?.gender || !profile?.height || latestWeight == null) return null;
        const actualAge = ageFromBirthDate(profile.birth_date);
        const bmiVal = latestWeight / Math.pow(profile.height / 100, 2);
        const bodyFat = measurement?.calculated_body_fat ?? null;
        const metabolicAge = computeMetabolicAge({
          ageYears: actualAge,
          gender: profile.gender,
          bmi: bmiVal,
          bodyFatPercent: bodyFat,
          activity: profile.activity_level ?? null,
        });
        if (metabolicAge == null) return null;
        return (
          <div className="mt-4">
            <MetabolicAgeCard
              metabolicAge={metabolicAge}
              actualAge={actualAge}
              basis={bodyFat != null ? 'bodyFat' : 'bmi'}
            />
          </div>
        );
      })()}

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

        {tdee != null ? (
          <div className="rounded-2xl bg-[var(--bg)] p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Calorie guide · at your current weight
            </p>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { label: 'Maintain weight', kcal: tdee },
                { label: 'Lose 0.5 kg / week', kcal: tdee - 550 },
                { label: 'Lose 1 kg / week', kcal: tdee - 1100 },
                { label: 'Gain 0.5 kg / week', kcal: tdee + 550 },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">{r.label}</span>
                  <span className="font-semibold text-[var(--text)]">{Math.max(0, r.kcal)} kcal/day</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[9px] text-[var(--muted)]">
              Estimates from your BMR + activity. Losing faster than ~1 kg/week or eating below
              ~1500 kcal isn't usually recommended.
            </p>
          </div>
        ) : null}
      </div>

      {/* Adaptive maintenance from real data */}
      {adaptiveTdee ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.13s' }}>
          <AdaptiveTdeeCard data={adaptiveTdee} formulaTdee={tdee} />
        </div>
      ) : null}


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
                    <div className="flex shrink-0 items-center gap-1">
                      {!isToday(selectedDate) ? (
                        <button
                          type="button"
                          onClick={() => addMealToToday(meal)}
                          disabled={addingMealId === meal.id || addedMealIds.has(meal.id)}
                          aria-label={`Add ${meal.meal_name} to today`}
                          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-70"
                          style={
                            addedMealIds.has(meal.id)
                              ? { background: 'color-mix(in srgb, #22c55e 15%, transparent)', color: '#16a34a' }
                              : { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }
                          }
                        >
                          {addedMealIds.has(meal.id) ? (
                            <>
                              <Check size={12} /> Added
                            </>
                          ) : (
                            <>
                              <Plus size={12} /> Today
                            </>
                          )}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteMeal(meal.id)}
                        aria-label={`Delete ${meal.meal_name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
                ? `${weightValue(weightValues[0], wUnit)}${wUnit} -> ${weightValue(latestWeight, wUnit)}${wUnit} over last ${weightValues.length} entries`
                : 'Log your weight to start a trend'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-16 items-end justify-between">
          <p className="text-5xl font-black tracking-tighter text-[var(--text)]">
            {latestWeight != null ? weightValue(latestWeight, wUnit) : '--'}
            {latestWeight != null ? (
              <span className="text-lg font-bold text-[var(--muted)]"> {wUnit}</span>
            ) : null}
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
                  {formatShortDate(entry.log_date)} ·{' '}
                  <span className="font-semibold">
                    {weightValue(entry.weight, wUnit)}
                    {wUnit}
                  </span>
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

      {/* Physique scan history */}
      {bodyScans.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.25s' }}>
          <p className="mb-1 text-sm font-semibold text-[var(--text)]">Physique scans</p>
          <p className="mb-3 text-[10px] text-[var(--muted)]">
            {bodyScans.length} scan{bodyScans.length === 1 ? '' : 's'} · directional AI coaching, not
            a medical assessment
          </p>

          {/* Latest, expanded */}
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
              {formatScanDate(bodyScans[0].created_at)} · latest
            </p>
            <button
              type="button"
              onClick={() => removeScan(bodyScans[0].id)}
              aria-label="Delete scan"
              className="flex h-7 w-7 items-center justify-center rounded-full text-red-500/70"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <BodyScanReadout result={scanToResult(bodyScans[0])} />

          {/* Earlier scans — tap to expand */}
          {bodyScans.length > 1 ? (
            <div className="mt-4 border-t border-[var(--card-border)] pt-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Earlier
              </p>
              {bodyScans.slice(1).map(scan => {
                const open = openScanId === scan.id;
                return (
                  <div key={scan.id} className="border-b border-[var(--card-border)] py-2 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenScanId(open ? null : scan.id)}
                        className="flex flex-1 items-center justify-between text-left"
                      >
                        <span className="text-xs text-[var(--text)]">{formatScanDate(scan.created_at)}</span>
                        <ChevronRight
                          size={14}
                          className="text-[var(--muted)] transition-transform"
                          style={{ transform: open ? 'rotate(90deg)' : 'none' }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeScan(scan.id)}
                        aria-label="Delete scan"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-red-500/70"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {open ? (
                      <div className="mt-2">
                        <BodyScanReadout result={scanToResult(scan)} />
                      </div>
                    ) : (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted)]">{scan.summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

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
        </>
      )}
      </div>
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
