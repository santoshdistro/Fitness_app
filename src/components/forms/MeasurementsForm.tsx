import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { cmToInches, computeNavyBodyFatPercent } from '../../utils/calculations';
import { todayDateString } from '../../utils/date';
import { GIRTH_RANGE, rangeWarning } from '../../utils/sanity';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';
import { RangeHint } from './RangeHint';

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
  const [belly, setBelly] = useState('');
  const [calves, setCalves] = useState('');
  const [forearms, setForearms] = useState('');
  const [logDate, setLogDate] = useState(todayDateString());
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
      entry_timestamp: new Date(`${logDate}T12:00:00`).toISOString(),
      neck: Number(neck),
      waist: Number(waist),
      hips: hips ? Number(hips) : null,
      chest: chest ? Number(chest) : null,
      biceps: biceps ? Number(biceps) : null,
      thighs: thighs ? Number(thighs) : null,
      belly: belly ? Number(belly) : null,
      calves: calves ? Number(calves) : null,
      forearms: forearms ? Number(forearms) : null,
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

  // Flag the first clearly-off girth (in inches) so a typo doesn't skew charts.
  const offSite = [
    { label: 'Neck', v: neck },
    { label: 'Waist', v: waist },
    { label: 'Hips', v: hips },
    { label: 'Chest', v: chest },
    { label: 'Biceps', v: biceps },
    { label: 'Thighs', v: thighs },
    { label: 'Belly', v: belly },
    { label: 'Calves', v: calves },
    { label: 'Forearms', v: forearms },
  ].find(s => rangeWarning(s.v, GIRTH_RANGE.in.min, GIRTH_RANGE.in.max, '') !== null);
  const measureWarn = offSite
    ? `${offSite.label} ${offSite.v}" looks off for a body measurement — double-check.`
    : null;

  return (
    <form onSubmit={handleSubmit}>
      {!canComputeBodyFat ? (
        <p className="mb-4 text-xs" style={{ color: 'var(--accent)' }}>
          Add your height and gender in Profile to auto-calculate body fat %.
        </p>
      ) : null}

      <div className="mb-3">
        <label className={labelClass} htmlFor="measure-date-input">
          Day
        </label>
        <input
          id="measure-date-input"
          className={inputClass}
          type="date"
          value={logDate}
          max={todayDateString()}
          onChange={e => e.target.value && setLogDate(e.target.value)}
        />
        {logDate !== todayDateString() ? (
          <p className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
            Recording for a past day.
          </p>
        ) : null}
      </div>

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
            step="any"
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
            step="any"
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
            step="any"
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
            step="any"
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
            step="any"
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
            step="any"
            value={thighs}
            onChange={e => setThighs(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="belly-input">
            Belly (in) - optional
          </label>
          <input
            id="belly-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="any"
            value={belly}
            onChange={e => setBelly(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="calves-input">
            Calves (in) - optional
          </label>
          <input
            id="calves-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="any"
            value={calves}
            onChange={e => setCalves(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="forearms-input">
            Forearms (in) - optional
          </label>
          <input
            id="forearms-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="any"
            value={forearms}
            onChange={e => setForearms(e.target.value)}
          />
        </div>
      </div>

      <RangeHint message={measureWarn} />
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || !requiredFilled} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save measurements'}
      </button>
    </form>
  );
}
