import { useRef, useState } from 'react';
import { Download, ImagePlus, Layers, Moon, Sparkles, Sun } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../contexts/AuthContext';
import { BACKDROP_PRESETS, downscaleImage } from '../../data/backdrops';
import { exportJson, exportTableCsv, type ExportTable } from '../../lib/exportData';
import { RemindersForm } from './RemindersForm';
import { inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function SettingsForm({ onSaved }: Props) {
  const { settings, save } = useSettings();
  const [stepGoal, setStepGoal] = useState(String(settings.stepGoal));
  const [waterGoal, setWaterGoal] = useState(String(settings.waterGoalMl));
  const [burnGoal, setBurnGoal] = useState(String(settings.activeCalorieGoal));

  function handleSave() {
    save({
      stepGoal: Math.max(0, Number(stepGoal) || 0),
      waterGoalMl: Math.max(0, Number(waterGoal) || 0),
      activeCalorieGoal: Math.max(0, Number(burnGoal) || 0),
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
        <p className={labelClass}>Surface</p>
        <div className="flex gap-2">
          <ThemeButton
            active={settings.surface === 'normal'}
            icon={<Layers size={16} />}
            label="Normal"
            onClick={() => save({ surface: 'normal' })}
          />
          <ThemeButton
            active={settings.surface === 'glass'}
            icon={<Sparkles size={16} />}
            label="Liquid glass"
            onClick={() => save({ surface: 'glass' })}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">
          Liquid glass turns every card, the nav and sheets into frosted glass over a colourful
          backdrop. Normal is the classic clean look.
        </p>
      </div>

      {settings.surface === 'glass' ? (
        <div className="mb-4">
          <BackdropPicker current={settings.backdrop} onPick={backdrop => save({ backdrop })} />
        </div>
      ) : null}

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

      <div className="mb-4">
        <label className={labelClass} htmlFor="setting-burn">
          Daily active-calorie burn goal (kcal)
        </label>
        <input
          id="setting-burn"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={burnGoal}
          onChange={e => setBurnGoal(e.target.value)}
        />
      </div>

      <button type="button" onClick={handleSave} className={submitButtonClass}>
        Save settings
      </button>

      <div className="mt-6">
        <p className={labelClass}>Reminders</p>
        <RemindersForm />
      </div>

      <div className="mt-6">
        <p className={labelClass}>Export &amp; backup</p>
        <ExportSection />
      </div>
    </div>
  );
}

const CSV_TABLES: { table: ExportTable; label: string }[] = [
  { table: 'daily_logs', label: 'Weight & daily' },
  { table: 'measurements', label: 'Measurements' },
  { table: 'food_logs', label: 'Food log' },
  { table: 'workout_logs', label: 'Workouts' },
  { table: 'cardio_logs', label: 'Cardio' },
];

function ExportSection() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    if (!userId || busy) return;
    setBusy(key);
    setNote(null);
    try {
      await fn();
      setNote('Saved to your device.');
    } catch {
      setNote('Could not export — please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <p className="text-[11px] text-[var(--muted)]">
        Download a copy of your data. The full backup (JSON) captures everything and can be kept
        safe or re-imported later; CSVs open in any spreadsheet.
      </p>

      <button
        type="button"
        onClick={() => run('json', () => exportJson(userId!))}
        disabled={!!busy || !userId}
        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
      >
        <Download size={16} />
        {busy === 'json' ? 'Preparing…' : 'Download full backup (JSON)'}
      </button>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
          Or export a single table (CSV)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CSV_TABLES.map(({ table, label }) => (
            <button
              key={table}
              type="button"
              onClick={() => run(table, async () => { await exportTableCsv(userId!, table); })}
              disabled={!!busy || !userId}
              className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] disabled:opacity-50"
            >
              {busy === table ? '…' : label}
            </button>
          ))}
        </div>
      </div>

      {note ? <p className="text-[11px] text-[var(--muted)]">{note}</p> : null}
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

function BackdropPicker({ current, onPick }: { current: string; onPick: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const isCustom = current !== '' && !BACKDROP_PRESETS.some(p => p.url === current);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    try {
      onPick(await downscaleImage(file));
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Upload failed.');
    }
  }

  const tile = 'relative h-20 overflow-hidden rounded-2xl border-2';
  const caption =
    'absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[9px] font-bold text-white';

  return (
    <div>
      <p className={labelClass}>Glass backdrop</p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onPick('')}
          className={tile}
          style={{
            borderColor: current === '' ? 'var(--accent)' : 'transparent',
            background: 'linear-gradient(135deg,#6c63ff,#0ea5e9,#a855f7)',
          }}
        >
          <span className={caption}>Aurora</span>
        </button>

        {BACKDROP_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.url)}
            className={tile}
            style={{ borderColor: current === p.url ? 'var(--accent)' : 'transparent' }}
          >
            <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
            <span className={caption}>{p.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`${tile} bg-[var(--bg)]`}
          style={{ borderColor: isCustom ? 'var(--accent)' : 'var(--card-border)' }}
        >
          {isCustom ? <img src={current} alt="Custom backdrop" className="h-full w-full object-cover" /> : null}
          <span
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
              isCustom ? 'bg-black/40 text-white' : 'text-[var(--muted)]'
            }`}
          >
            <ImagePlus size={16} /> {isCustom ? 'Change' : 'Upload'}
          </span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      {err ? <p className="mt-1 text-[11px] text-red-500">{err}</p> : null}
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
        Pick a photo for the glass to refract over, or upload your own — it looks best with a moody,
        high-contrast image.
      </p>
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
