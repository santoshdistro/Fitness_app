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
  const [sleepH, setSleepH] = useState('');
  const [sleepM, setSleepM] = useState('');
  const [activeKcal, setActiveKcal] = useState('');
  const [caffeine, setCaffeine] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!todayLog) return;
    if (todayLog.steps != null) setSteps(String(todayLog.steps));
    if (todayLog.water_ml != null) setWater(String(todayLog.water_ml));
    if (todayLog.sleep_hours != null) {
      const h = Math.floor(todayLog.sleep_hours);
      const m = Math.round((todayLog.sleep_hours - h) * 60);
      setSleepH(String(h));
      setSleepM(m ? String(m) : '');
    }
    if (todayLog.active_calories_burned != null) setActiveKcal(String(todayLog.active_calories_burned));
    if (todayLog.caffeine_mg != null) setCaffeine(String(todayLog.caffeine_mg));
    if (todayLog.mood != null) setMood(todayLog.mood);
    if (todayLog.energy != null) setEnergy(todayLog.energy);
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
    if (sleepH || sleepM) {
      payload.sleep_hours = Math.round(((Number(sleepH) || 0) + (Number(sleepM) || 0) / 60) * 100) / 100;
    }
    if (activeKcal) payload.active_calories_burned = Number(activeKcal);
    if (caffeine) payload.caffeine_mg = Number(caffeine);
    if (mood != null) payload.mood = mood;
    if (energy != null) payload.energy = energy;

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
        <label className={labelClass}>Sleep</label>
        <div className="flex items-center gap-2">
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            max="24"
            value={sleepH}
            onChange={e => setSleepH(e.target.value)}
            placeholder="hrs"
            aria-label="Sleep hours"
          />
          <span className="text-sm font-semibold text-[var(--muted)]">h</span>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            max="59"
            value={sleepM}
            onChange={e => setSleepM(e.target.value)}
            placeholder="min"
            aria-label="Sleep minutes"
          />
          <span className="text-sm font-semibold text-[var(--muted)]">m</span>
        </div>
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

      <div className="mb-3">
        <label className={labelClass} htmlFor="caffeine-input">
          Caffeine (mg) — optional
        </label>
        <input
          id="caffeine-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={caffeine}
          onChange={e => setCaffeine(e.target.value)}
          placeholder="e.g. 95 per coffee"
        />
      </div>

      <div className="mb-3">
        <label className={labelClass}>Mood</label>
        <div className="flex justify-between gap-1">
          {['😣', '😕', '😐', '🙂', '😄'].map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMood(mood === i + 1 ? null : i + 1)}
              className="flex-1 rounded-2xl border py-2 text-xl"
              style={
                mood === i + 1
                  ? { borderColor: 'var(--accent)', background: 'var(--accent)' }
                  : { borderColor: 'var(--card-border)' }
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass}>Energy</label>
        <div className="flex justify-between gap-1">
          {['😴', '🥱', '😐', '💪', '⚡'].map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setEnergy(energy === i + 1 ? null : i + 1)}
              className="flex-1 rounded-2xl border py-2 text-xl"
              style={
                energy === i + 1
                  ? { borderColor: 'var(--accent)', background: 'var(--accent)' }
                  : { borderColor: 'var(--card-border)' }
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button
        type="submit"
        disabled={
          saving ||
          (!steps &&
            !water &&
            !sleepH &&
            !sleepM &&
            !activeKcal &&
            !caffeine &&
            mood == null &&
            energy == null)
        }
        className={submitButtonClass}
      >
        {saving ? 'Saving...' : 'Save activity'}
      </button>
    </form>
  );
}
