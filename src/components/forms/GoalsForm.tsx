import { useEffect, useState, type FormEvent } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function GoalsForm({ onSaved }: Props) {
  const { profile, saveProfile } = useProfile();
  const [deficit, setDeficit] = useState('500');
  const [protein, setProtein] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDeficit(String(profile.calorie_deficit_kcal));
    if (profile.protein_target_g != null) setProtein(String(profile.protein_target_g));
    if (profile.fiber_target_g != null) setFiber(String(profile.fiber_target_g));
    if (profile.sodium_target_mg != null) setSodium(String(profile.sodium_target_mg));
  }, [profile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { error: saveError } = await saveProfile({
      calorie_deficit_kcal: Number(deficit) || 0,
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

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="deficit-input">
          Daily calorie deficit (kcal)
        </label>
        <input
          id="deficit-input"
          className={inputClass}
          type="number"
          inputMode="numeric"
          value={deficit}
          onChange={e => setDeficit(e.target.value)}
          placeholder="e.g. 500"
        />
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          Subtracted from BMR + activity for weight loss. Use a negative number for a surplus
          (e.g. -300 to bulk).
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
