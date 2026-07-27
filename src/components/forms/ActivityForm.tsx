import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTodayLog } from '../../hooks/useTodayLog';
import { todayDateString } from '../../utils/date';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function ActivityForm({ onSaved }: Props) {
  const { session } = useAuth();
  const { log: todayLog } = useTodayLog();
  const [steps, setSteps] = useState('');
  const [water, setWater] = useState('');
  const [sleep, setSleep] = useState('');
  const [activeKcal, setActiveKcal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!todayLog) return;
    if (todayLog.steps != null) setSteps(String(todayLog.steps));
    if (todayLog.water_ml != null) setWater(String(todayLog.water_ml));
    if (todayLog.sleep_hours != null) setSleep(String(todayLog.sleep_hours));
    if (todayLog.active_calories_burned != null) setActiveKcal(String(todayLog.active_calories_burned));
  }, [todayLog]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      user_id: session.user.id,
      log_date: todayDateString(),
    };
    if (steps) payload.steps = Number(steps);
    if (water) payload.water_ml = Math.round(Number(water));
    if (sleep) payload.sleep_hours = Number(sleep);
    if (activeKcal) payload.active_calories_burned = Number(activeKcal);

    const { error: saveError } = await supabase
      .from('daily_logs')
      .upsert(payload, { onConflict: 'user_id,log_date' });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="steps-input">
          Steps
        </label>
        <input
          id="steps-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={steps}
          onChange={e => setSteps(e.target.value)}
          placeholder="e.g. 8000"
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="water-input">
          Water (ml) — total today
        </label>
        <input
          id="water-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          step="any"
          min="0"
          value={water}
          onChange={e => setWater(e.target.value)}
          placeholder="e.g. 250"
        />
        <div className="mt-2 flex gap-2">
          {[250, 500, 750].map(ml => (
            <button
              key={ml}
              type="button"
              onClick={() => setWater(String((Number(water) || 0) + ml))}
              className="flex-1 rounded-xl bg-[var(--bg)] py-2 text-xs font-semibold text-[var(--text)]"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="sleep-input">
          Sleep (hours)
        </label>
        <input
          id="sleep-input"
          className={inputClass}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="24"
          value={sleep}
          onChange={e => setSleep(e.target.value)}
          placeholder="e.g. 7.5"
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="active-kcal-input">
          Active calories burned (kcal)
        </label>
        <input
          id="active-kcal-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={activeKcal}
          onChange={e => setActiveKcal(e.target.value)}
          placeholder="e.g. 450 — from your watch / phone"
        />
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button
        type="submit"
        disabled={saving || (!steps && !water && !sleep && !activeKcal)}
        className={submitButtonClass}
      >
        {saving ? 'Saving...' : 'Save activity'}
      </button>
    </form>
  );
}
