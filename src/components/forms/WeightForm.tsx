import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { useTodayLog } from '../../hooks/useTodayLog';
import { kgToUnit, unitToKg } from '../../utils/units';
import { todayDateString } from '../../utils/date';
import { rangeWarning, WEIGHT_RANGE } from '../../utils/sanity';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';
import { RangeHint } from './RangeHint';

type Props = {
  onSaved: () => void;
};

export function WeightForm({ onSaved }: Props) {
  const { session } = useAuth();
  const { settings } = useSettings();
  const [logDate, setLogDate] = useState(todayDateString());
  const { log: dayLog, loading: dayLogLoading } = useTodayLog(logDate);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show the weight already logged for the selected day (blank if none). Load it
  // once per date so a background refetch never wipes what you're typing.
  const populatedFor = useRef<string | null>(null);
  useEffect(() => {
    if (dayLogLoading) return;
    if (populatedFor.current === logDate) return;
    populatedFor.current = logDate;
    setWeight(
      dayLog?.weight != null
        ? String(Math.round(kgToUnit(dayLog.weight, settings.weightUnit) * 10) / 10)
        : '',
    );
  }, [dayLog, dayLogLoading, logDate, settings.weightUnit]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const weightKg = Math.round(unitToKg(Number(weight), settings.weightUnit) * 100) / 100;
    const { error: saveError } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: session.user.id, log_date: logDate, weight: weightKg },
        { onConflict: 'user_id,log_date' },
      );

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className={labelClass} htmlFor="weight-date-input">
        Day
      </label>
      <input
        id="weight-date-input"
        className={inputClass}
        style={{ marginBottom: logDate !== todayDateString() ? '0.25rem' : '1rem' }}
        type="date"
        value={logDate}
        max={todayDateString()}
        onChange={e => e.target.value && setLogDate(e.target.value)}
      />
      {logDate !== todayDateString() ? (
        <p className="mb-4 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
          Backfilling a past day.
        </p>
      ) : null}

      <label className={labelClass} htmlFor="weight-input">
        Weight ({settings.weightUnit})
      </label>
      <input
        id="weight-input"
        className={inputClass}
        style={{ marginBottom: '1rem' }}
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        placeholder="e.g. 74.5"
        required
      />
      <RangeHint
        message={rangeWarning(
          weight,
          WEIGHT_RANGE[settings.weightUnit].min,
          WEIGHT_RANGE[settings.weightUnit].max,
          `a body weight (${settings.weightUnit})`,
        )}
      />
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || !weight} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save weight'}
      </button>
    </form>
  );
}
