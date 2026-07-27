import { useEffect, useState, type FormEvent } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useSettings } from '../../hooks/useSettings';
import { cmToFtIn, ftInToCm } from '../../utils/units';
import type { Gender } from '../../utils/calculations';
import { EQUIPMENT_OPTIONS } from '../../data/workoutPrograms';
import { DataResetSection } from './DataResetSection';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
  onOpenGoals: () => void;
  onOpenSpend: () => void;
  onOpenCalculators: () => void;
  onOpenAchievements: () => void;
  onOpenHealthSync: () => void;
};

export function ProfileForm({
  onSaved,
  onOpenGoals,
  onOpenSpend,
  onOpenCalculators,
  onOpenAchievements,
  onOpenHealthSync,
}: Props) {
  const { profile, saveProfile } = useProfile();
  const { settings } = useSettings();
  const heightUnit = settings.heightUnit;
  const [name, setName] = useState('');
  const [height, setHeight] = useState(''); // canonical cm
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [equipment, setEquipment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.name) setName(profile.name);
    if (profile.height != null) {
      setHeight(String(profile.height));
      const { ft, inches: inch } = cmToFtIn(profile.height);
      setFeet(String(ft));
      setInches(String(inch));
    }
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
      name: name.trim() || null,
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
        <label className={labelClass} htmlFor="name-input">
          Name
        </label>
        <input
          id="name-input"
          className={inputClass}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="mb-3">
        <label className={labelClass}>Height</label>
        {heightUnit === 'ft' ? (
          <div className="flex items-center gap-2">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={feet}
              onChange={e => {
                setFeet(e.target.value);
                setHeight(String(ftInToCm(Number(e.target.value) || 0, Number(inches) || 0)));
              }}
              placeholder="5"
            />
            <span className="text-sm font-semibold text-[var(--muted)]">ft</span>
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              max="11"
              value={inches}
              onChange={e => {
                setInches(e.target.value);
                setHeight(String(ftInToCm(Number(feet) || 0, Number(e.target.value) || 0)));
              }}
              placeholder="10"
            />
            <span className="text-sm font-semibold text-[var(--muted)]">in</span>
          </div>
        ) : (
          <input
            id="height-input"
            className={inputClass}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={height}
            onChange={e => setHeight(e.target.value)}
            placeholder="175"
            required
          />
        )}
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

      <button
        type="button"
        onClick={onOpenAchievements}
        className="mt-4 w-full text-center text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        🏅 Achievements
      </button>

      <button
        type="button"
        onClick={onOpenCalculators}
        className="mt-3 w-full text-center text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        Calculators
      </button>

      <button
        type="button"
        onClick={onOpenHealthSync}
        className="mt-3 w-full text-center text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        📱 Apple Health sync
      </button>

      <button
        type="button"
        onClick={onOpenSpend}
        className="mt-3 w-full text-center text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        AI usage & spending
      </button>

      <DataResetSection />
    </form>
  );
}
