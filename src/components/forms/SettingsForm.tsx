import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { RemindersForm } from './RemindersForm';
import { inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function SettingsForm({ onSaved }: Props) {
  const { settings, save } = useSettings();
  const [stepGoal, setStepGoal] = useState(String(settings.stepGoal));
  const [waterGoal, setWaterGoal] = useState(String(settings.waterGoalMl));

  function handleSave() {
    save({
      stepGoal: Math.max(0, Number(stepGoal) || 0),
      waterGoalMl: Math.max(0, Number(waterGoal) || 0),
    });
    onSaved();
  }

  return (
    <div>
      <div className="mb-4">
        <p className={labelClass}>Appearance</p>
        <div className="flex gap-2">
          <ThemeButton
            active={settings.theme === 'light'}
            icon={<Sun size={16} />}
            label="Light"
            onClick={() => save({ theme: 'light' })}
          />
          <ThemeButton
            active={settings.theme === 'dark'}
            icon={<Moon size={16} />}
            label="Dark"
            onClick={() => save({ theme: 'dark' })}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className={labelClass}>Units</p>
        <div className="flex flex-col gap-2">
          <UnitRow
            label="Body weight"
            options={[
              { value: 'kg', label: 'kg' },
              { value: 'lb', label: 'lb' },
            ]}
            value={settings.weightUnit}
            onChange={v => save({ weightUnit: v as 'kg' | 'lb' })}
          />
          <UnitRow
            label="Height"
            options={[
              { value: 'cm', label: 'cm' },
              { value: 'ft', label: 'ft/in' },
            ]}
            value={settings.heightUnit}
            onChange={v => save({ heightUnit: v as 'cm' | 'ft' })}
          />
          <UnitRow
            label="Water"
            options={[
              { value: 'ml', label: 'ml' },
              { value: 'l', label: 'L' },
            ]}
            value={settings.volumeUnit}
            onChange={v => save({ volumeUnit: v as 'ml' | 'l' })}
          />
          <UnitRow
            label="Food amount"
            options={[
              { value: 'g', label: 'g' },
              { value: 'oz', label: 'oz' },
            ]}
            value={settings.foodUnit}
            onChange={v => save({ foodUnit: v as 'g' | 'oz' })}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="setting-steps">
          Daily step goal
        </label>
        <input
          id="setting-steps"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={stepGoal}
          onChange={e => setStepGoal(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className={labelClass} htmlFor="setting-water">
          Daily water goal (ml)
        </label>
        <input
          id="setting-water"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          step="any"
          value={waterGoal}
          onChange={e => setWaterGoal(e.target.value)}
        />
      </div>

      <button type="button" onClick={handleSave} className={submitButtonClass}>
        Save settings
      </button>

      <div className="mt-6">
        <p className={labelClass}>Reminders</p>
        <RemindersForm />
      </div>
    </div>
  );
}

function UnitRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text)]">{label}</span>
      <div className="flex gap-1 rounded-full bg-[var(--bg)] p-1">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={
              value === o.value
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--muted)' }
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThemeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold"
      style={
        active
          ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff' }
          : { borderColor: 'var(--card-border)', color: 'var(--text)' }
      }
    >
      {icon}
      {label}
    </button>
  );
}
