import { useEffect, useState, type FormEvent } from 'react';
import { useProfile } from '../../hooks/useProfile';
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  deficitFromGoal,
  type ActivityLevel,
  type GoalType,
} from '../../utils/calculations';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

const LOSE_RATES = [0.25, 0.5, 0.75];
const GAIN_RATES = [0.15, 0.25, 0.5];

export function GoalsForm({ onSaved }: Props) {
  const { profile, saveProfile } = useProfile();
  const [goal, setGoal] = useState<GoalType>('lose');
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [rate, setRate] = useState(0.5);
  const [targetWeight, setTargetWeight] = useState('');
  const [calorieOverride, setCalorieOverride] = useState('');
  const [protein, setProtein] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.goal_type) setGoal(profile.goal_type);
    if (profile.activity_level) setActivity(profile.activity_level);
    if (profile.weekly_rate_kg != null && profile.weekly_rate_kg > 0) setRate(profile.weekly_rate_kg);
    if (profile.target_weight_kg != null) setTargetWeight(String(profile.target_weight_kg));
    if (profile.calorie_target_override != null) setCalorieOverride(String(profile.calorie_target_override));
    if (profile.protein_target_g != null) setProtein(String(profile.protein_target_g));
    if (profile.fiber_target_g != null) setFiber(String(profile.fiber_target_g));
    if (profile.sodium_target_mg != null) setSodium(String(profile.sodium_target_mg));
  }, [profile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const effectiveRate = goal === 'maintain' ? 0 : rate;
    const { error: saveError } = await saveProfile({
      goal_type: goal,
      activity_level: activity,
      weekly_rate_kg: effectiveRate,
      calorie_deficit_kcal: deficitFromGoal(goal, effectiveRate),
      target_weight_kg: goal === 'maintain' ? null : targetWeight ? Number(targetWeight) : null,
      calorie_target_override: calorieOverride ? Number(calorieOverride) : null,
      protein_target_g: protein ? Number(protein) : null,
      fiber_target_g: fiber ? Number(fiber) : null,
      sodium_target_mg: sodium ? Number(sodium) : null,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  const rateOptions = goal === 'gain' ? GAIN_RATES : LOSE_RATES;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className={labelClass}>Goal</label>
        <div className="flex gap-2">
          {GOAL_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setGoal(o.value)}
              className="flex-1 rounded-2xl border py-2.5 text-xs font-semibold"
              style={
                goal === o.value
                  ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff' }
                  : { borderColor: 'var(--card-border)', color: 'var(--text)' }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="goal-activity">
          Activity level
        </label>
        <select
          id="goal-activity"
          className={inputClass}
          value={activity}
          onChange={e => setActivity(e.target.value as ActivityLevel)}
        >
          {ACTIVITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label} — {o.hint}
            </option>
          ))}
        </select>
      </div>

      {goal !== 'maintain' ? (
        <div className="mb-3">
          <label className={labelClass}>{goal === 'gain' ? 'Weekly gain' : 'Weekly loss'}</label>
          <div className="flex gap-2">
            {rateOptions.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRate(r)}
                className="flex-1 rounded-2xl border py-2.5 text-xs font-semibold"
                style={
                  rate === r
                    ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff' }
                    : { borderColor: 'var(--card-border)', color: 'var(--text)' }
                }
              >
                {r} kg
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {goal !== 'maintain' ? (
        <div className="mb-3">
          <label className={labelClass} htmlFor="target-weight-input">
            {goal === 'gain' ? 'Goal weight (kg)' : 'Target weight (kg)'}
          </label>
          <input
            id="target-weight-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            min="0"
            value={targetWeight}
            onChange={e => setTargetWeight(e.target.value)}
            placeholder={goal === 'gain' ? '82' : '72'}
          />
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Powers your progress bar and projected finish date on Home.
          </p>
        </div>
      ) : null}

      <p className="mb-3 text-[11px] text-[var(--muted)]">
        Your calorie target and macros are calculated from this. The fields below are optional
        manual overrides.
      </p>

      <div className="mb-3">
        <label className={labelClass} htmlFor="calorie-override-input">
          Daily calorie goal (kcal) - optional override
        </label>
        <input
          id="calorie-override-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={calorieOverride}
          onChange={e => setCalorieOverride(e.target.value)}
          placeholder="Leave blank to use the calculated target"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Set your own number to override the calculated calorie target everywhere.
        </p>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="protein-target-input">
          Protein target (g) - optional
        </label>
        <input
          id="protein-target-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={protein}
          onChange={e => setProtein(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="fiber-target-input">
          Fiber target (g) - optional
        </label>
        <input
          id="fiber-target-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={fiber}
          onChange={e => setFiber(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="sodium-target-input">
          Sodium target (mg) - optional
        </label>
        <input
          id="sodium-target-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={sodium}
          onChange={e => setSodium(e.target.value)}
        />
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save goals'}
      </button>
    </form>
  );
}
