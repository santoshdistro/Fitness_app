import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
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
          step="100"
          value={waterGoal}
          onChange={e => setWaterGoal(e.target.value)}
        />
      </div>

      <button type="button" onClick={handleSave} className={submitButtonClass}>
        Save settings
      </button>
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
