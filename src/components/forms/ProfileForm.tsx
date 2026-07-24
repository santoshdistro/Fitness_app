import { useEffect, useState, type FormEvent } from 'react';
import { useProfile } from '../../hooks/useProfile';
import type { Gender } from '../../utils/calculations';
import { EQUIPMENT_OPTIONS } from '../../data/workoutPrograms';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
  onOpenGoals: () => void;
};

export function ProfileForm({ onSaved, onOpenGoals }: Props) {
  const { profile, saveProfile } = useProfile();
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [equipment, setEquipment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.height != null) setHeight(String(profile.height));
    if (profile.birth_date) setBirthDate(profile.birth_date);
    if (profile.gender) setGender(profile.gender);
    if (profile.equipment_preference) setEquipment(profile.equipment_preference);
  }, [profile]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!gender) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await saveProfile({
      height: height ? Number(height) : null,
      birth_date: birthDate || null,
      gender,
      equipment_preference: equipment || null,
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
        <label className={labelClass} htmlFor="height-input">
          Height (cm)
        </label>
        <input
          id="height-input"
          className={inputClass}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={height}
          onChange={e => setHeight(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="birth-date-input">
          Birth date
        </label>
        <input
          id="birth-date-input"
          className={inputClass}
          type="date"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="gender-input">
          Gender
        </label>
        <select
          id="gender-input"
          className={inputClass}
          value={gender}
          onChange={e => setGender(e.target.value as Gender)}
          required
        >
          <option value="" disabled>
            Select...
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="equipment-input">
          Equipment preference - optional
        </label>
        <select
          id="equipment-input"
          className={inputClass}
          value={equipment}
          onChange={e => setEquipment(e.target.value)}
        >
          <option value="">Not set</option>
          {EQUIPMENT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button
        type="submit"
        disabled={saving || !height || !birthDate || !gender}
        className={submitButtonClass}
      >
        {saving ? 'Saving...' : 'Save profile'}
      </button>

      <button
        type="button"
        onClick={onOpenGoals}
        className="mt-4 w-full text-center text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        Edit calorie & macro goals
      </button>
    </form>
  );
}
