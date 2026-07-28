import { useTrends } from '../hooks/useTrends';
import { useSettings } from '../hooks/useSettings';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { kgToUnit } from '../utils/units';
import { TrendChart } from './charts/TrendChart';
import { WellnessCard } from './WellnessCard';

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

export function TrendsPanel() {
  const { trends, loading } = useTrends();
  const { settings } = useSettings();
  const targets = useCalorieTargets();
  const wUnit = settings.weightUnit;

  if (loading) return <p className="text-xs text-[var(--muted)]">Loading…</p>;
  if (!trends) return null;

  const weightPoints = trends.weight.map(p => ({ ...p, value: Math.round(kgToUnit(p.value, wUnit) * 10) / 10 }));
  const weightOverlay = trends.weightMovingAvg.map(v => Math.round(kgToUnit(v, wUnit) * 10) / 10);

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Weight"
        subtitle={weightPoints.length >= 2 ? `${weightPoints.length} weigh-ins` : undefined}
      >
        <TrendChart points={weightPoints} type="line" overlay={weightOverlay} unit={wUnit} color="#6c63ff" />
        <p className="text-[10px] text-[var(--muted)]">
          Dashed line = 5-point average (smooths daily water-weight swings).
        </p>
      </Section>

      <Section title="Calories" subtitle={trends.avgCalories != null ? `avg ${trends.avgCalories}/day` : undefined}>
        <TrendChart points={trends.calories} type="bar" unit="" color="#6c63ff" goal={targets.calorieTarget} />
      </Section>

      <Section title="Protein" subtitle={trends.avgProtein != null ? `avg ${trends.avgProtein}g/day` : undefined}>
        <TrendChart points={trends.protein} type="bar" unit="g" color="#22c55e" goal={targets.proteinTarget} />
      </Section>

      <Section title="Steps" subtitle={trends.avgSteps != null ? `avg ${trends.avgSteps.toLocaleString()}/day` : undefined}>
        <TrendChart points={trends.steps} type="bar" color="#f97316" goal={settings.stepGoal} />
      </Section>

      <Section
        title="Training volume"
        subtitle={trends.volume.length ? `${trends.volume.length} sessions` : undefined}
      >
        <TrendChart points={trends.volume} type="bar" unit="kg" color="#8b5cf6" />
        <p className="text-[10px] text-[var(--muted)]">Total kg lifted per session (weight × reps).</p>
      </Section>

      {trends.cardioDistance.length > 0 ? (
        <Section title="Cardio distance" subtitle={`${trends.totalKm} km total`}>
          <TrendChart points={trends.cardioDistance} type="bar" unit="km" color="#0ea5e9" />
          <p className="text-[10px] text-[var(--muted)]">Distance per cardio session.</p>
        </Section>
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
