import { useState } from 'react';
import { Activity, Camera, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
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
import { Sheet } from '../components/Sheet';
import { BmiCard } from '../components/BmiCard';
import { HydrationCard } from '../components/HydrationCard';
import { computeHydrationTargets } from '../utils/calculations';
import { AdaptiveTdeeCard } from '../components/AdaptiveTdeeCard';
import { MetabolicAgeCard } from '../components/MetabolicAgeCard';
import { TrendsPanel } from '../components/TrendsPanel';
import { MeasurementTrendChart } from '../components/MeasurementTrendChart';
import { MeasurementProgressCard } from '../components/MeasurementProgressCard';
import { MilestonesCard } from '../components/MilestonesCard';
import { DateNavigator } from '../components/DateNavigator';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { usePersistentState } from '../hooks/usePersistentState';
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
import { isSameMonth, todayDateString } from '../utils/date';
import { MonthPager } from '../components/MonthPager';

const REFERENCE_CALORIE_TARGET = 2000;

const ACTIVITY_SHORT: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly active',
  moderate: 'Moderately active',
  very_active: 'Very active',
};

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

type Props = {
  onOpenProgressPhotos: () => void;
};

export function StatsScreen({ onOpenProgressPhotos }: Props) {
  const [tab, setTab] = usePersistentState<'stats' | 'trends'>('ui:statsTab', 'stats');
  const { handlers, change, animClass } = useTabSwipe(['stats', 'trends'] as const, tab, setTab);
  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const { totals } = useTodayNutrition(selectedDate);
  const { logs: weightLogs, clearWeight, refresh: refreshWeightLogs } = useRecentDailyLogs(365);
  const { measurements, deleteMeasurement } = useRecentMeasurements(200);
  const { log: todayLog, refresh: refreshTodayLog } = useTodayLog();
  const [refreshingWeight, setRefreshingWeight] = useState(false);
  const { profile } = useProfile();
  const { scans: bodyScans, removeScan } = useBodyScans();
  const { data: adaptiveTdee } = useAdaptiveTdee();
  const { settings, save: saveSettings } = useSettings();
  const wUnit = settings.weightUnit;
  const [openScanId, setOpenScanId] = useState<string | null>(null);
  const openScan = bodyScans.find(s => s.id === openScanId) ?? null;
  // Shared Upper/Lower/All group so the measurement chart and table stay in sync.
  const [measureGroup, setMeasureGroup] = useState<'all' | 'upper' | 'lower'>('all');

  const measurement = measurements[0];
  const weightEntries = weightLogs.filter((l): l is typeof l & { weight: number } => l.weight != null);
  const weightValues = weightEntries.map(l => l.weight);
  const latestWeight = todayLog?.weight ?? weightValues[weightValues.length - 1];

  // History lists default to the current month; the month pager steps back
  // through earlier months (older data stays in the DB and the trend charts).
  const [statsMonth, setStatsMonth] = useState(() => new Date());
  const monthWeighIns = weightEntries.filter(e => isSameMonth(new Date(`${e.log_date}T00:00:00`), statsMonth));
  const monthMeasurements = measurements.filter(m => isSameMonth(new Date(m.entry_timestamp), statsMonth));
  // Keep the compact sparkline readable regardless of how much history is loaded.
  const sparkValues = weightValues.slice(-24);

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
      <div className="anim-drop-in mt-4">
        <DateNavigator selectedDate={selectedDate} onChange={setSelectedDate} />
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
        const bodyFat = measurement?.calculated_body_fat ?? null;
        const metabolicAge = computeMetabolicAge({
          ageYears: actualAge,
          gender: profile.gender,
          weightKg: latestWeight,
          heightCm: profile.height,
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

      {/* Smart hydration + electrolytes */}
      {(() => {
        const targets = computeHydrationTargets({
          weightKg: latestWeight ?? null,
          gender: profile?.gender ?? null,
          proteinG: profile?.protein_target_g ?? suggestedMacros?.proteinG ?? null,
          fiberG: profile?.fiber_target_g ?? null,
          deficitKcal,
          activity: profile?.activity_level ?? null,
          activeKcal: todayLog?.active_calories_burned ?? null,
        });
        if (!targets) return null;
        // Today's intake: water + logged electrolytes, plus dietary sodium from meals.
        const intake = {
          waterMl: todayLog?.water_ml ?? 0,
          sodiumMg: (todayLog?.sodium_mg ?? 0) + Math.round(totals.sodium_mg ?? 0),
          potassiumMg: todayLog?.potassium_mg ?? 0,
          magnesiumMg: todayLog?.magnesium_mg ?? 0,
        };
        return (
          <div className="mt-4">
            <HydrationCard
              targets={targets}
              intake={intake}
              currentWaterGoalMl={settings.waterGoalMl}
              onApplyWater={ml => saveSettings({ waterGoalMl: ml })}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                setRefreshingWeight(true);
                await Promise.all([refreshWeightLogs(), refreshTodayLog()]);
                setRefreshingWeight(false);
              }}
              aria-label="Refresh with latest weight"
              title="Pull my latest weigh-in"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]"
            >
              <RefreshCw size={14} className={refreshingWeight ? 'animate-spin' : ''} />
            </button>
            <p className="text-sm font-bold text-[var(--text)]">
              {Math.round(totals.calories)}{' '}
              <span className="text-xs font-semibold text-[var(--muted)]">kcal</span>
            </p>
          </div>
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
            {latestWeight != null && profile?.height && profile?.birth_date && profile?.gender ? (
              <div className="mt-2 grid grid-cols-2 gap-x-3 border-t border-[var(--card-border)] pt-1.5 text-[9px] text-[var(--muted)]">
                <span>* Weight {weightValue(latestWeight, wUnit)}{wUnit}</span>
                <span>Height {Math.round(profile.height)} cm</span>
                <span>Age {ageFromBirthDate(profile.birth_date)} yr · {profile.gender}</span>
                <span>{ACTIVITY_SHORT[profile.activity_level ?? 'light'] ?? 'Lightly active'}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Progress photos */}
      <button
        type="button"
        onClick={onOpenProgressPhotos}
        className="glass-card anim-fade-rise mt-4 flex w-full items-center gap-3 p-4 text-left"
        style={{ animationDelay: '0.14s' }}
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
        <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.16s' }}>
          <p className="mb-1 text-sm font-semibold text-[var(--text)]">Physique scans</p>
          <p className="mb-3 text-[10px] text-[var(--muted)]">
            {bodyScans.length} scan{bodyScans.length === 1 ? '' : 's'} · directional AI coaching, not
            a medical assessment
          </p>

          {/* Scans — tap a row to open the full coaching read in a large sheet
             (latest first). Show ~2, the rest scroll so the section stays short. */}
          <div className="hide-scrollbar overflow-y-auto" style={{ maxHeight: 156 }}>
          {bodyScans.map((scan, i) => (
            <div key={scan.id} className="border-b border-[var(--card-border)] py-2 last:border-b-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenScanId(scan.id)}
                  className="flex min-w-0 flex-1 flex-col text-left"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--text)]">
                      {formatScanDate(scan.created_at)}
                      {i === 0 ? <span className="text-[var(--muted)]"> · latest</span> : null}
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-[var(--muted)]" />
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted)]">{scan.summary}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeScan(scan.id)}
                  aria-label="Delete scan"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-500/70"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : null}

      {/* Full physique-scan readout in a roomy sheet */}
      <Sheet
        open={openScan != null}
        onClose={() => setOpenScanId(null)}
        title={openScan ? `Physique scan · ${formatScanDate(openScan.created_at)}` : 'Physique scan'}
      >
        {openScan ? <BodyScanReadout result={scanToResult(openScan)} /> : null}
      </Sheet>

      {/* Weight (compact) — grouped with body measurements */}
      <div className="glass-card anim-fade-rise mt-4 p-4" style={{ animationDelay: '0.18s' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <Activity size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text)]">Weight</p>
              <p className="text-[10px] text-[var(--muted)]">
                {weightValues.length >= 2 ? `${weightValues.length} entries` : 'Log to start a trend'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sparkValues.length >= 2 ? (
              <WeightSparkline values={sparkValues} width={90} height={30} />
            ) : null}
            <p className="text-2xl font-black tracking-tight text-[var(--text)]">
              {latestWeight != null ? weightValue(latestWeight, wUnit) : '--'}
              {latestWeight != null ? (
                <span className="text-sm font-bold text-[var(--muted)]"> {wUnit}</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-[var(--card-border)] pt-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Weigh-ins
            </p>
            <MonthPager anchor={statsMonth} onChange={setStatsMonth} />
          </div>
          {monthWeighIns.length === 0 ? (
            <p className="py-1.5 text-[11px] text-[var(--muted)]">No weigh-ins this month.</p>
          ) : (
            <div className="hide-scrollbar overflow-y-auto" style={{ maxHeight: 92 }}>
              {monthWeighIns
                .slice()
                .reverse()
                .map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between border-b border-[var(--card-border)] py-2 last:border-b-0"
                  >
                    <p className="text-xs text-[var(--text)]">
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
                      className="flex h-7 w-7 items-center justify-center rounded-full text-red-500/70"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-site progress chart — week/month/year, above the measurements table */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.19s' }}>
        <MeasurementTrendChart group={measureGroup} onGroupChange={setMeasureGroup} />
      </div>

      {/* Per-site progress trends — group stays in sync with the chart above */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.2s' }}>
        <MeasurementProgressCard group={measureGroup} />
      </div>

      {/* Milestones — flags shown on the trend charts above */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.21s' }}>
        <MilestonesCard />
      </div>

      {/* Measurement history — month-paged (older also lives in the chart above) */}
      <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.22s' }}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">Measurements</p>
          <MonthPager anchor={statsMonth} onChange={setStatsMonth} />
        </div>
        {monthMeasurements.length === 0 ? (
          <p className="py-1 text-xs text-[var(--muted)]">No measurements this month.</p>
        ) : (
          monthMeasurements.map(entry => (
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
          ))
        )}
      </div>

      {/* Body fat — sits with the body-composition group */}
      <div
        className="glass-card anim-fade-rise mt-4 flex items-center gap-3 p-4"
        style={{
          animationDelay: '0.24s',
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

      {/* Adaptive maintenance from real data — last, it's the most advanced read */}
      {adaptiveTdee ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.26s' }}>
          <AdaptiveTdeeCard data={adaptiveTdee} formulaTdee={tdee} />
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
