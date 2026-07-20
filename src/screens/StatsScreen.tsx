import { Activity } from 'lucide-react';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useLatestMeasurement } from '../hooks/useLatestMeasurement';
import { CalorieGauge } from '../components/charts/CalorieGauge';
import { WeightSparkline } from '../components/charts/WeightSparkline';

const REFERENCE_CALORIE_TARGET = 2000;

export function StatsScreen() {
  const { totals } = useTodayNutrition();
  const { logs: weightLogs } = useRecentDailyLogs(14);
  const { measurement } = useLatestMeasurement();

  const weightValues = weightLogs
    .map(l => l.weight)
    .filter((w): w is number => w != null);
  const latestWeight = weightValues[weightValues.length - 1];

  return (
    <div className="min-h-full bg-[#EAECEF] px-6 pt-4 pb-8">
      <div className="mt-2 flex items-center justify-center">
        <h1 className="text-sm font-bold tracking-wide text-gray-800">Statistics</h1>
      </div>

      {/* Calories */}
      <div className="mt-4 flex flex-col gap-4 rounded-[2rem] border border-gray-100/50 bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
              <Activity size={16} color="#4f46e5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Calories</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Logged today
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {Math.round(totals.calories)}{' '}
            <span className="text-xs font-semibold text-gray-400">kcal</span>
          </p>
        </div>

        <div className="flex gap-2">
          <MacroTile label="Carbs" value={`${Math.round(totals.carbs_g)}g`} />
          <MacroTile label="Protein" value={`${Math.round(totals.protein_g)}g`} />
          <MacroTile label="Fats" value={`${Math.round(totals.fat_g)}g`} />
        </div>

        <CalorieGauge
          percent={totals.calories / REFERENCE_CALORIE_TARGET}
          valueLabel={String(Math.max(0, REFERENCE_CALORIE_TARGET - Math.round(totals.calories)))}
        />
        <p className="-mt-2 text-center text-[10px] text-gray-400">
          vs {REFERENCE_CALORIE_TARGET} kcal reference &middot; personalized target coming soon
        </p>
      </div>

      {/* Weight */}
      <div className="mt-4 flex flex-col gap-2 rounded-[2rem] bg-[#FFE8E2] p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Activity size={16} color="#ea580c" />
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-950">Weight</p>
            <p className="text-[10px] font-medium text-orange-700">
              {weightValues.length >= 2
                ? `${weightValues[0]}kg -> ${latestWeight}kg over last ${weightValues.length} entries`
                : 'Log your weight to start a trend'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-16 items-end justify-between">
          <p className="text-5xl font-black tracking-tighter text-orange-950">
            {latestWeight ?? '--'}
          </p>
          {weightValues.length >= 2 ? <WeightSparkline values={weightValues} /> : null}
        </div>
      </div>

      {/* Body fat */}
      <div className="mt-4 flex items-center gap-3 rounded-[2rem] bg-[#F2EBFC] p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
          <Activity size={16} color="#9333ea" />
        </div>
        <div>
          <p className="text-xs font-semibold text-purple-950">Body Fat</p>
          <p className="text-[10px] text-purple-700">
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
    <div className="flex flex-1 flex-col items-center rounded-2xl border border-gray-50 bg-gray-50/60 p-2.5">
      <p className="text-xs font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[8px] font-bold uppercase text-gray-400">{label}</p>
    </div>
  );
}
