import { Activity } from 'lucide-react';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useLatestMeasurement } from '../hooks/useLatestMeasurement';
import { useTodayLog } from '../hooks/useTodayLog';
import { useProfile } from '../hooks/useProfile';
import { CalorieGauge } from '../components/charts/CalorieGauge';
import { WeightSparkline } from '../components/charts/WeightSparkline';
import { ageFromBirthDate, computeBMR, computeDailyCalorieTarget } from '../utils/calculations';

const REFERENCE_CALORIE_TARGET = 2000;

export function StatsScreen() {
  const { totals } = useTodayNutrition();
  const { logs: weightLogs } = useRecentDailyLogs(14);
  const { measurement } = useLatestMeasurement();
  const { log: todayLog } = useTodayLog();
  const { profile } = useProfile();

  const weightValues = weightLogs
    .map(l => l.weight)
    .filter((w): w is number => w != null);
  const latestWeight = todayLog?.weight ?? weightValues[weightValues.length - 1];

  const canComputeTarget = Boolean(profile?.gender && profile?.height && profile?.birth_date && latestWeight);
  const calorieTarget = canComputeTarget
    ? computeDailyCalorieTarget({
        bmr: computeBMR({
          gender: profile!.gender!,
          weightKg: latestWeight!,
          heightCm: profile!.height!,
          ageYears: ageFromBirthDate(profile!.birth_date!),
        }),
        activeCalories: todayLog?.active_calories_burned ?? 0,
      })
    : REFERENCE_CALORIE_TARGET;

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-center">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Statistics</h1>
      </div>

      {/* Calories */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-4 p-5"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/15">
              <Activity size={16} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Calories</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Logged today
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text)]">
            {Math.round(totals.calories)}{' '}
            <span className="text-xs font-semibold text-[var(--muted)]">kcal</span>
          </p>
        </div>

        <div className="flex gap-2">
          <MacroTile label="Carbs" value={`${Math.round(totals.carbs_g)}g`} />
          <MacroTile label="Protein" value={`${Math.round(totals.protein_g)}g`} />
          <MacroTile label="Fats" value={`${Math.round(totals.fat_g)}g`} />
        </div>

        <CalorieGauge
          percent={totals.calories / calorieTarget}
          valueLabel={String(Math.max(0, calorieTarget - Math.round(totals.calories)))}
        />
        <p className="-mt-2 text-center text-[10px] text-[var(--muted)]">
          {canComputeTarget
            ? `${calorieTarget} kcal target · BMR + activity − 500 kcal deficit`
            : `vs ${REFERENCE_CALORIE_TARGET} kcal reference · complete your profile and log weight for a personalized target`}
        </p>
      </div>

      {/* Weight */}
      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-2 p-5"
        style={{
          animationDelay: '0.18s',
          background: 'linear-gradient(160deg, rgba(224,138,62,0.16), rgba(224,138,62,0.03))',
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

      {/* Body fat */}
      <div
        className="glass-card anim-fade-rise mt-4 flex items-center gap-3 p-4"
        style={{
          animationDelay: '0.26s',
          background: 'linear-gradient(160deg, rgba(147,51,234,0.14), rgba(147,51,234,0.03))',
        }}
      >
        <div className="glass flex h-8 w-8 items-center justify-center rounded-full">
          <Activity size={16} className="text-purple-300" />
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
    </div>
  );
}

function MacroTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-white/5 p-2.5">
      <p className="text-xs font-bold text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[8px] font-bold uppercase text-[var(--muted)]">{label}</p>
    </div>
  );
}
