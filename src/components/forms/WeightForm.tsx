import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { unitToKg } from '../../utils/units';
import { todayDateString } from '../../utils/date';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function WeightForm({ onSaved }: Props) {
  const { session } = useAuth();
  const { settings } = useSettings();
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const weightKg = Math.round(unitToKg(Number(weight), settings.weightUnit) * 100) / 100;
    const { error: saveError } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: session.user.id, log_date: todayDateString(), weight: weightKg },
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
      <label className={labelClass} htmlFor="weight-input">
        Today's weight ({settings.weightUnit})
      </label>
      <input
        id="weight-input"
        className={inputClass}
        style={{ marginBottom: '1rem' }}
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        placeholder="e.g. 74.5"
        required
      />
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || !weight} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save weight'}
      </button>
    </form>
  );
}
