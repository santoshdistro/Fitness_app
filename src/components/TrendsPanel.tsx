import { useMemo } from 'react';
import { useTrends, type Series, type TrendRange } from '../hooks/useTrends';
import { useSettings } from '../hooks/useSettings';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { usePersistentState } from '../hooks/usePersistentState';
import { kgToUnit } from '../utils/units';
import { TrendChart } from './charts/TrendChart';
import { CardioPanel } from './CardioPanel';
import { InsightsPanel } from './InsightsPanel';
import { buildInsights } from '../utils/insights';
import { useProfile } from '../hooks/useProfile';
import { WellnessCard } from './WellnessCard';
import { SkeletonChart, SkeletonTiles } from './Skeleton';

const RANGE_OPTIONS = [
  { key: '7', label: '1W' },
  { key: '30', label: '1M' },
  { key: '90', label: '3M' },
  { key: 'all', label: 'All' },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

function rangeToDays(key: RangeKey): TrendRange {
  if (key === 'all') return null;
  return Number(key) as TrendRange;
}

// Which days in the last fortnight have food logged. A compact adherence read —
// consistency is the thing that actually moves the other charts.
function BodySignal({
  label,
  points,
  unit,
  color,
  note,
  decimals = 0,
}: {
  label: string;
  points: Series;
  unit: string;
  color: string;
  note: string;
  decimals?: number;
}) {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold text-[var(--text)]">{label}</p>
        <p className="text-xs font-bold tabular-nums text-[var(--text)]">
          {latest.value.toFixed(decimals)}
          {unit}
        </p>
      </div>
      {points.length > 1 ? (
        <TrendChart points={points} type="line" unit={unit} color={color} decimals={decimals} height={92} />
      ) : (
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          First reading in — the trend line appears once there are two.
        </p>
      )}
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">{note}</p>
    </div>
  );
}

function AdherenceStrip({ days }: { days: { date: string; logged: boolean }[] }) {
  const hit = days.filter(d => d.logged).length;
  return (
    <div className="glass-card flex flex-col gap-2 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">Logging</p>
        <p className="text-[11px] text-[var(--muted)]">
          {hit} of {days.length} days
        </p>
      </div>
      <div className="flex gap-1">
        {days.map(d => (
          <div
            key={d.date}
            title={`${d.date}: ${d.logged ? 'logged' : 'nothing logged'}`}
            className="h-6 flex-1 rounded"
            style={{ background: d.logged ? 'var(--accent)' : 'var(--card-border)' }}
          />
        ))}
      </div>
      <p className="text-[10px] text-[var(--muted)]">Last {days.length} days — filled means food logged.</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col gap-2 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {subtitle ? <p className="text-[11px] text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

// Change between the first and last point of a series (null if <2 points).
function seriesDelta(s: Series): number | null {
  if (s.length < 2) return null;
  return Math.round((s[s.length - 1].value - s[0].value) * 10) / 10;
}

function StatTile({
  label,
  value,
  unit,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-[var(--bg)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-lg font-bold leading-none text-[var(--text)]">
        {value}
        {unit ? <span className="ml-0.5 text-xs font-semibold text-[var(--muted)]">{unit}</span> : null}
      </p>
      {sub ? (
        <p className="text-[10px] font-semibold" style={{ color: subColor ?? 'var(--muted)' }}>
          {sub}
        </p>
      ) : (
        <p className="text-[10px] text-[var(--muted)]">—</p>
      )}
    </div>
  );
}

export function TrendsPanel() {
  const [rangeKey, setRangeKey] = usePersistentState<RangeKey>('ui:trendRange', '30');
  const { trends, loading } = useTrends(rangeToDays(rangeKey));
  const { settings } = useSettings();
  const targets = useCalorieTargets();
  const { profile } = useProfile();
  const wUnit = settings.weightUnit;

  // Recomputed only when the data or the goal moves, not on every render — the
  // engine walks the whole window several times.
  const insights = useMemo(
    () =>
      trends
        ? buildInsights({
            rows: trends.dayRows,
            calorieTarget: targets.calorieTarget,
            proteinTarget: targets.proteinTarget,
            targetWeightKg: profile?.target_weight_kg ?? null,
            weeklyRateKg: profile?.weekly_rate_kg ?? null,
            goalType: profile?.goal_type ?? null,
          })
        : [],
    [trends, targets.calorieTarget, targets.proteinTarget, profile],
  );

  const rangePicker = (
    <div className="glass-card flex gap-1 p-1">
      {RANGE_OPTIONS.map(o => {
        const active = rangeKey === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setRangeKey(o.key)}
            aria-pressed={active}
            className="tap-44 flex-1 rounded-xl py-2 text-xs font-bold"
            style={
              active
                ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                : { color: 'var(--muted)' }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  if (loading)
    return (
      <div className="flex flex-col gap-4">
        {rangePicker}
        <SkeletonTiles />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  if (!trends) return null;

  // Once the window is long enough that a bar per day would be unreadable, the
  // intake charts switch to weekly averages — say so rather than letting the
  // bars quietly change meaning. (The tiles stay a per-day average either way.)
  const bucketNote =
    trends.intakeBucket === 'week' ? 'Each bar is one week, averaged over the days you logged.' : null;
  const spanLabel = trends.spanDays >= 365 ? 'all time' : `last ${trends.spanDays} days`;

  const weightPoints = trends.weight.map(p => ({ ...p, value: Math.round(kgToUnit(p.value, wUnit) * 10) / 10 }));
  const weightOverlay = trends.weightMovingAvg.map(v => Math.round(kgToUnit(v, wUnit) * 10) / 10);

  // Hero summary tiles.
  const weightNow = weightPoints.length ? weightPoints[weightPoints.length - 1].value : null;
  const weightChange = seriesDelta(weightPoints);
  const calPct =
    trends.avgCalories != null && targets.calorieTarget
      ? Math.round((trends.avgCalories / targets.calorieTarget) * 100)
      : null;
  const proPct =
    trends.avgProtein != null && targets.proteinTarget
      ? Math.round((trends.avgProtein / targets.proteinTarget) * 100)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {rangePicker}
      {/* The hero tiles get the nested tray treatment — the one place in the
          app where the extra material read is worth the visual weight. */}
      <div className="bezel">
      <div className="glass-card grid grid-cols-2 gap-2 p-3">
        <StatTile
          label="Weight"
          value={weightNow != null ? String(weightNow) : '—'}
          unit={weightNow != null ? wUnit : undefined}
          sub={
            weightChange != null
              ? `${weightChange > 0 ? '▲' : weightChange < 0 ? '▼' : ''} ${Math.abs(weightChange)} ${wUnit} · period`
              : undefined
          }
        />
        <StatTile
          label="Calories"
          value={trends.avgCalories != null ? trends.avgCalories.toLocaleString() : '—'}
          sub={calPct != null ? `${calPct}% of target · avg/day` : 'avg/day'}
          subColor={calPct != null && Math.abs(calPct - 100) <= 10 ? '#22c55e' : undefined}
        />
        <StatTile
          label="Protein"
          value={trends.avgProtein != null ? String(trends.avgProtein) : '—'}
          unit={trends.avgProtein != null ? 'g' : undefined}
          sub={proPct != null ? `${proPct}% of target · avg/day` : 'avg/day'}
          subColor={proPct != null && proPct >= 90 ? '#22c55e' : undefined}
        />
        <StatTile
          label="Training"
          value={String(trends.totalWorkouts)}
          unit="sessions"
          sub={trends.totalWorkouts ? spanLabel : 'log a workout'}
        />
      </div>
      </div>

      <Section
        title="Weight"
        subtitle={weightPoints.length >= 2 ? `${weightPoints.length} weigh-ins` : undefined}
      >
        <TrendChart points={weightPoints} type="line" overlay={weightOverlay} unit={wUnit} color="#6c63ff" decimals={1} />
        <p className="text-[10px] text-[var(--muted)]">
          Dashed line = 5-point average (smooths daily water-weight swings).
        </p>
      </Section>

      {trends.bodyFat.length > 0 ? (
        <Section
          title="Body fat"
          subtitle={(() => {
            const d = seriesDelta(trends.bodyFat);
            return d != null ? `${d > 0 ? '+' : ''}${d}% over period` : `${trends.bodyFat.length} readings`;
          })()}
        >
          <TrendChart points={trends.bodyFat} type="line" unit="%" color="#f59e0b" decimals={1} />
          <p className="text-[10px] text-[var(--muted)]">Estimated from your logged measurements.</p>
        </Section>
      ) : null}

      <InsightsPanel insights={insights} days={trends.spanDays} />

      <AdherenceStrip days={trends.loggedDays} />

      <Section title="Calories" subtitle={trends.avgCalories != null ? `avg ${trends.avgCalories}/day` : undefined}>
        <TrendChart points={trends.calories} type="bar" unit="" color="#6c63ff" goal={targets.calorieTarget} />
        {bucketNote ? <p className="text-[10px] text-[var(--muted)]">{bucketNote}</p> : null}
      </Section>

      <Section title="Protein" subtitle={trends.avgProtein != null ? `avg ${trends.avgProtein}g/day` : undefined}>
        <TrendChart points={trends.protein} type="bar" unit="g" color="#22c55e" goal={targets.proteinTarget} />
        {bucketNote ? <p className="text-[10px] text-[var(--muted)]">{bucketNote}</p> : null}
      </Section>

      <Section title="Steps" subtitle={trends.avgSteps != null ? `avg ${trends.avgSteps.toLocaleString()}/day` : undefined}>
        <TrendChart points={trends.steps} type="bar" color="#f97316" goal={settings.stepGoal} />
        {bucketNote ? <p className="text-[10px] text-[var(--muted)]">{bucketNote}</p> : null}
      </Section>

      {trends.workoutsPerWeek.length > 0 ? (
        <Section
          title="Workout frequency"
          subtitle={`${trends.totalWorkouts} sessions · ${trends.workoutsPerWeek.length} wks`}
        >
          <TrendChart points={trends.workoutsPerWeek} type="bar" unit="" color="#ec4899" goal={4} />
          <p className="text-[10px] text-[var(--muted)]">Sessions per week — consistency beats intensity.</p>
        </Section>
      ) : null}

      <Section
        title="Training volume"
        subtitle={trends.volume.length ? `${trends.volume.length} sessions` : undefined}
      >
        <TrendChart points={trends.volume} type="bar" unit="kg" color="#8b5cf6" />
        <p className="text-[10px] text-[var(--muted)]">Total kg lifted per session (weight × reps).</p>
      </Section>

      {/* Body signals. A signal appears as soon as ONE reading lands — the
          value first, the chart once there are two. The section used to gate
          every chart on >1 reading while the section itself gated on >=1, so a
          first sync produced a heading with nothing under it and no way to tell
          whether the Shortcut had worked. */}
      {trends.hasBodySignals ? (
        <div className="glass-card flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Body signals</p>
            <p className="text-[11px] text-[var(--muted)]">from your watch</p>
          </div>
          <BodySignal
            label="Resting heart rate"
            points={trends.restingHr}
            unit=" bpm"
            color="#ef4444"
            note="Drifts down as fitness improves. A sustained rise is usually under-recovery, illness or alcohol — lower is better."
          />
          <BodySignal
            label="HRV"
            points={trends.hrv}
            unit=" ms"
            color="#0ea5e9"
            note="Day-to-day readiness, and the noisiest of the three — read the direction over a week, not any one night. Higher is better."
          />
          <BodySignal
            label="Cardio fitness (VO₂ max)"
            points={trends.vo2Max}
            unit=""
            decimals={1}
            color="#22c55e"
            note="The headline running number. Moves over 6–8 weeks, not day to day, so a flat month here is normal."
          />
          {/* The watch does not sample these every day — HRV especially, which
              it mostly takes during sleep — so gaps are the norm, not a fault. */}
          <p className="text-[10px] leading-relaxed text-[var(--muted)]">
            The watch samples these when it can rather than every day, so gaps are normal.
          </p>
        </div>
      ) : null}

      {trends.cardioSummary ? (
        <CardioPanel
          sessions={trends.cardioSessions}
          summary={trends.cardioSummary}
          distance={trends.cardioDistance}
        />
      ) : null}

      {trends.hasCaffeine ? (
        <Section
          title="Caffeine"
          subtitle={trends.avgCaffeine != null ? `avg ${trends.avgCaffeine} mg/day` : undefined}
        >
          <TrendChart points={trends.caffeine} type="bar" unit="mg" color="#a16207" />
        </Section>
      ) : null}

      <WellnessCard />
    </div>
  );
}
