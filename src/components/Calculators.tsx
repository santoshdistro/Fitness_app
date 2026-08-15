import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useSettings } from '../hooks/useSettings';
import {
  ACTIVITY_OPTIONS,
  ageFromBirthDate,
  activityMultiplier,
  computeBMR,
  type ActivityLevel,
  type Gender,
} from '../utils/calculations';
import { kgToUnit, unitToKg } from '../utils/units';

const inputCls =
  'w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none';
const labelCls = 'mb-1 block text-xs font-semibold text-[var(--muted)]';

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {subtitle ? <p className="text-[11px] text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full bg-[var(--bg)] p-1">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className="flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold whitespace-nowrap"
          style={value === o.value ? { background: 'var(--accent)', color: '#fff' } : { color: 'var(--muted)' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--card-border)] py-1.5 text-xs last:border-b-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-bold text-[var(--text)]">{value}</span>
    </div>
  );
}

export function Calculators() {
  const { profile } = useProfile();
  const { logs } = useRecentDailyLogs(14);
  const { settings } = useSettings();
  const wUnit = settings.weightUnit;

  const latestKg =
    logs.filter(l => l.weight != null).map(l => l.weight as number).slice(-1)[0] ?? 75;
  const defaultWeight = String(Math.round(kgToUnit(latestKg, wUnit) * 10) / 10);
  const defaultAge = profile?.birth_date ? String(ageFromBirthDate(profile.birth_date)) : '30';

  return (
    <div className="flex flex-col gap-4">
      <CalorieCalc
        wUnit={wUnit}
        defaultWeight={defaultWeight}
        defaultHeight={profile?.height ? String(profile.height) : '175'}
        defaultAge={defaultAge}
        defaultGender={profile?.gender ?? 'male'}
        defaultActivity={profile?.activity_level ?? 'moderate'}
      />
      <MacroCalc wUnit={wUnit} defaultWeight={defaultWeight} />
      <OneRepMax />
      <IdealWeight wUnit={wUnit} defaultHeight={profile?.height ? String(profile.height) : '175'} />
    </div>
  );
}

function CalorieCalc({
  wUnit,
  defaultWeight,
  defaultHeight,
  defaultAge,
  defaultGender,
  defaultActivity,
}: {
  wUnit: 'kg' | 'lb';
  defaultWeight: string;
  defaultHeight: string;
  defaultAge: string;
  defaultGender: Gender;
  defaultActivity: ActivityLevel | null;
}) {
  const [weight, setWeight] = useState(defaultWeight);
  const [height, setHeight] = useState(defaultHeight);
  const [age, setAge] = useState(defaultAge);
  const [gender, setGender] = useState<Gender>(defaultGender);
  const [activity, setActivity] = useState<ActivityLevel>(defaultActivity ?? 'moderate');
  const [method, setMethod] = useState<'mifflin' | 'bodyweight'>('mifflin');

  const weightKg = unitToKg(Number(weight) || 0, wUnit);
  const lb = weightKg * 2.2046226218;

  // Bodyweight-rule factor (kcal per lb) by activity.
  const bwFactor: Record<ActivityLevel, number> = {
    sedentary: 13,
    light: 14,
    moderate: 15,
    very_active: 16,
  };

  const tdee =
    method === 'mifflin'
      ? Math.round(
          computeBMR({ gender, weightKg, heightCm: Number(height) || 0, ageYears: Number(age) || 0 }) *
            activityMultiplier(activity),
        )
      : Math.round(lb * bwFactor[activity]);

  return (
    <Card title="Calorie needs" subtitle="Your daily calories to maintain, lose or gain.">
      <Toggle
        value={method}
        onChange={setMethod}
        options={[
          { value: 'mifflin', label: 'Mifflin-St Jeor' },
          { value: 'bodyweight', label: 'Bodyweight ×/lb' },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Weight ({wUnit})</label>
          <input className={inputCls} type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
        {method === 'mifflin' ? (
          <div>
            <label className={labelCls}>Height (cm)</label>
            <input className={inputCls} type="number" value={height} onChange={e => setHeight(e.target.value)} />
          </div>
        ) : (
          <div>
            <label className={labelCls}>Age</label>
            <input className={inputCls} type="number" value={age} onChange={e => setAge(e.target.value)} />
          </div>
        )}
      </div>
      {method === 'mifflin' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Age</label>
            <input className={inputCls} type="number" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sex</label>
            <select className={inputCls} value={gender} onChange={e => setGender(e.target.value as Gender)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      ) : null}
      <div>
        <label className={labelCls}>Activity</label>
        <select className={inputCls} value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)}>
          {ACTIVITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-1">
        <ResultRow label="Maintain weight" value={`${tdee} kcal`} />
        <ResultRow label="Lose 0.5 kg / week" value={`${Math.max(0, tdee - 550)} kcal`} />
        <ResultRow label="Lose 1 kg / week" value={`${Math.max(0, tdee - 1100)} kcal`} />
        <ResultRow label="Gain 0.5 kg / week" value={`${tdee + 550} kcal`} />
      </div>
    </Card>
  );
}

type MacroMethod = 'protein_2g' | 'cut_40_30_30' | 'balanced_30_40_30' | 'lowcarb_40_20_40';

function MacroCalc({ wUnit, defaultWeight }: { wUnit: 'kg' | 'lb'; defaultWeight: string }) {
  const [calories, setCalories] = useState('2000');
  const [weight, setWeight] = useState(defaultWeight);
  const [method, setMethod] = useState<MacroMethod>('protein_2g');

  const cals = Number(calories) || 0;
  const weightKg = unitToKg(Number(weight) || 0, wUnit);

  let proteinG: number;
  let fatG: number;
  let carbsG: number;
  if (method === 'protein_2g') {
    proteinG = Math.round(weightKg * 2);
    fatG = Math.round((cals * 0.25) / 9);
    carbsG = Math.max(0, Math.round((cals - proteinG * 4 - fatG * 9) / 4));
  } else {
    const split =
      method === 'cut_40_30_30'
        ? { p: 0.4, c: 0.3, f: 0.3 }
        : method === 'balanced_30_40_30'
          ? { p: 0.3, c: 0.4, f: 0.3 }
          : { p: 0.4, c: 0.2, f: 0.4 };
    proteinG = Math.round((cals * split.p) / 4);
    carbsG = Math.round((cals * split.c) / 4);
    fatG = Math.round((cals * split.f) / 9);
  }

  return (
    <Card title="Macro calculator" subtitle="Split your calories into protein, carbs and fat.">
      <Toggle
        value={method}
        onChange={setMethod}
        options={[
          { value: 'protein_2g', label: '2g/kg protein' },
          { value: 'cut_40_30_30', label: 'Cut 40/30/30' },
          { value: 'balanced_30_40_30', label: 'Balanced' },
          { value: 'lowcarb_40_20_40', label: 'Low-carb' },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Calories</label>
          <input className={inputCls} type="number" inputMode="numeric" value={calories} onChange={e => setCalories(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Weight ({wUnit})</label>
          <input className={inputCls} type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Protein', g: proteinG, color: '#22c55e' },
          { label: 'Carbs', g: carbsG, color: '#6c63ff' },
          { label: 'Fat', g: fatG, color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="flex flex-col items-center rounded-2xl bg-[var(--bg)] p-3">
            <p className="text-lg font-black" style={{ color: m.color }}>
              {m.g}g
            </p>
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--muted)]">
        {method === 'protein_2g'
          ? 'Protein at 2 g/kg, fat 25% of calories, carbs fill the rest.'
          : 'Percent-of-calories split (protein/carbs/fat).'}
      </p>
    </Card>
  );
}

function OneRepMax() {
  const [weight, setWeight] = useState('60');
  const [reps, setReps] = useState('5');

  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  const oneRm = r > 0 ? Math.round(w * (1 + r / 30)) : 0; // Epley

  const percents = [
    { pct: 100, reps: '1' },
    { pct: 90, reps: '3–4' },
    { pct: 80, reps: '6–8' },
    { pct: 70, reps: '10–12' },
  ];

  return (
    <Card title="One-rep max" subtitle="Estimate your 1RM and training weights (Epley).">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Weight lifted (kg)</label>
          <input className={inputCls} type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Reps done</label>
          <input className={inputCls} type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} />
        </div>
      </div>
      <div className="rounded-2xl bg-[var(--bg)] p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Estimated 1RM</p>
        <p className="text-3xl font-black text-[var(--text)]">{oneRm} kg</p>
      </div>
      <div>
        {percents.map(p => (
          <ResultRow
            key={p.pct}
            label={`${p.pct}% · ~${p.reps} reps`}
            value={`${Math.round((oneRm * p.pct) / 100)} kg`}
          />
        ))}
      </div>
    </Card>
  );
}

function IdealWeight({ wUnit, defaultHeight }: { wUnit: 'kg' | 'lb'; defaultHeight: string }) {
  const [height, setHeight] = useState(defaultHeight);
  const m = (Number(height) || 0) / 100;
  const low = kgToUnit(18.5 * m * m, wUnit);
  const high = kgToUnit(24.9 * m * m, wUnit);

  return (
    <Card title="Healthy weight range" subtitle="Based on a BMI of 18.5–24.9 for your height.">
      <div>
        <label className={labelCls}>Height (cm)</label>
        <input className={inputCls} type="number" value={height} onChange={e => setHeight(e.target.value)} />
      </div>
      <div className="rounded-2xl bg-[var(--bg)] p-3 text-center">
        <p className="text-2xl font-black text-[var(--text)]">
          {m > 0 ? `${Math.round(low * 10) / 10}–${Math.round(high * 10) / 10} ${wUnit}` : '--'}
        </p>
        <p className="text-[10px] text-[var(--muted)]">Healthy range · BMI ignores muscle mass</p>
      </div>
    </Card>
  );
}
