import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { cmToInches, computeNavyBodyFatPercent } from '../../utils/calculations';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function MeasurementsForm({ onSaved }: Props) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [chest, setChest] = useState('');
  const [biceps, setBiceps] = useState('');
  const [thighs, setThighs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canComputeBodyFat = Boolean(profile?.gender && profile?.height);
  const needsHips = profile?.gender === 'female';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    let calculatedBodyFat: number | null = null;
    if (canComputeBodyFat && profile?.gender && profile?.height) {
      calculatedBodyFat = computeNavyBodyFatPercent({
        gender: profile.gender,
        neckIn: Number(neck),
        waistIn: Number(waist),
        heightIn: cmToInches(profile.height),
        hipIn: hips ? Number(hips) : undefined,
      });
    }

    const { error: saveError } = await supabase.from('measurements').insert({
      user_id: session.user.id,
      neck: Number(neck),
      waist: Number(waist),
      hips: hips ? Number(hips) : null,
      chest: chest ? Number(chest) : null,
      biceps: biceps ? Number(biceps) : null,
      thighs: thighs ? Number(thighs) : null,
      calculated_body_fat: calculatedBodyFat,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  const requiredFilled = neck && waist && (!needsHips || hips);

  return (
    <form onSubmit={handleSubmit}>
      {!canComputeBodyFat ? (
        <p className="mb-4 text-xs text-amber-600">
          Add your height and gender in Profile to auto-calculate body fat %.
        </p>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="neck-input">
            Neck (in)
          </label>
          <input
            id="neck-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={neck}
            onChange={e => setNeck(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="waist-input">
            Waist (in)
          </label>
          <input
            id="waist-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={waist}
            onChange={e => setWaist(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="hips-input">
            Hips (in){needsHips ? '' : ' - optional'}
          </label>
          <input
            id="hips-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={hips}
            onChange={e => setHips(e.target.value)}
            required={needsHips}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="chest-input">
            Chest (in) - optional
          </label>
          <input
            id="chest-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={chest}
            onChange={e => setChest(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="biceps-input">
            Biceps (in) - optional
          </label>
          <input
            id="biceps-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={biceps}
            onChange={e => setBiceps(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="thighs-input">
            Thighs (in) - optional
          </label>
          <input
            id="thighs-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={thighs}
            onChange={e => setThighs(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || !requiredFilled} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save measurements'}
      </button>
    </form>
  );
}
