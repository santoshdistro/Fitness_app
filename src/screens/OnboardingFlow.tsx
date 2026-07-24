import { useState } from 'react';
import { ArrowLeft, Check, Dumbbell, Minus, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabaseClient';
import { todayDateString } from '../utils/date';
import { inputClass } from '../components/forms/formStyles';
import {
  ACTIVITY_OPTIONS,
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
  computeTDEE,
  deficitFromGoal,
  type ActivityLevel,
  type Gender,
  type GoalType,
} from '../utils/calculations';

type Props = {
  onComplete: () => void;
};

type Draft = {
  gender: Gender | null;
  birthDate: string;
  height: string;
  weight: string;
  activity: ActivityLevel | null;
  goal: GoalType | null;
  rate: number;
  targetWeight: string;
};

const LOSE_RATES = [
  { value: 0.25, label: 'Relaxed', hint: '0.25 kg / week' },
  { value: 0.5, label: 'Steady', hint: '0.5 kg / week' },
  { value: 0.75, label: 'Aggressive', hint: '0.75 kg / week' },
];
const GAIN_RATES = [
  { value: 0.15, label: 'Lean', hint: '0.15 kg / week' },
  { value: 0.25, label: 'Steady', hint: '0.25 kg / week' },
  { value: 0.5, label: 'Fast', hint: '0.5 kg / week' },
];

const GOAL_META: Record<GoalType, { label: string; desc: string; icon: typeof Dumbbell }> = {
  lose: { label: 'Lose fat', desc: 'Eat below maintenance to get leaner', icon: TrendingDown },
  maintain: { label: 'Maintain', desc: 'Stay at your current weight', icon: Minus },
  gain: { label: 'Build muscle', desc: 'Eat in a surplus to grow', icon: Dumbbell },
};

export function OnboardingFlow({ onComplete }: Props) {
  const { session } = useAuth();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    gender: null,
    birthDate: '',
    height: '',
    weight: '',
    activity: null,
    goal: null,
    rate: 0.5,
    targetWeight: '',
  });

  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  // Build the ordered step list; skip the rate step when maintaining.
  const steps: ('welcome' | 'gender' | 'age' | 'height' | 'weight' | 'activity' | 'goal' | 'rate' | 'target' | 'review')[] = [
    'welcome',
    'gender',
    'age',
    'height',
    'weight',
    'activity',
    'goal',
    ...(draft.goal === 'maintain' ? [] : (['rate', 'target'] as const)),
    'review',
  ];
  const current = steps[step];

  const canNext = (() => {
    switch (current) {
      case 'gender':
        return draft.gender != null;
      case 'age':
        return Boolean(draft.birthDate);
      case 'height':
        return Number(draft.height) > 0;
      case 'weight':
        return Number(draft.weight) > 0;
      case 'activity':
        return draft.activity != null;
      case 'goal':
        return draft.goal != null;
      case 'target':
        return Number(draft.targetWeight) > 0;
      default:
        return true;
    }
  })();

  // Live preview of the plan on the review step.
  const preview = (() => {
    if (!draft.gender || !draft.birthDate || !draft.goal) return null;
    const weightKg = Number(draft.weight);
    const bmr = computeBMR({
      gender: draft.gender,
      weightKg,
      heightCm: Number(draft.height),
      ageYears: ageFromBirthDate(draft.birthDate),
    });
    const tdee = computeTDEE(bmr, draft.activity);
    const deficitKcal = deficitFromGoal(draft.goal, draft.rate);
    const calorieTarget = computeDailyCalorieTarget({ tdee, deficitKcal });
    const macros = computeSuggestedMacros({ weightKg, calorieTarget, deficitKcal });
    return { calorieTarget, macros, deficitKcal };
  })();

  function next() {
    setStep(s => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function finish() {
    if (!session?.user || !draft.gender || !draft.goal || !preview) return;
    setSaving(true);
    setError(null);

    const { error: profileError } = await saveProfile({
      gender: draft.gender,
      birth_date: draft.birthDate,
      height: Number(draft.height),
      activity_level: draft.activity,
      goal_type: draft.goal,
      weekly_rate_kg: draft.goal === 'maintain' ? 0 : draft.rate,
      calorie_deficit_kcal: preview.deficitKcal,
      target_weight_kg: draft.goal === 'maintain' ? null : Number(draft.targetWeight),
    });
    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }

    // Seed today's weight so calorie targets have data immediately.
    await supabase
      .from('daily_logs')
      .upsert(
        { user_id: session.user.id, log_date: todayDateString(), weight: Number(draft.weight) },
        { onConflict: 'user_id,log_date' },
      );

    setSaving(false);
    onComplete();
  }

  const rateOptions = draft.goal === 'gain' ? GAIN_RATES : LOSE_RATES;

  return (
    <div className="app-bg flex min-h-dvh flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Header: back + progress */}
      <div className="flex items-center gap-3 pt-2">
        {step > 0 ? (
          <button type="button" onClick={back} aria-label="Back" className="glass flex h-9 w-9 items-center justify-center rounded-full">
            <ArrowLeft size={16} className="text-[var(--text)]" />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        {current === 'welcome' && (
          <div className="anim-fade-rise text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent)] text-white">
              <Dumbbell size={30} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">Let's set up your plan</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              A few quick questions and we'll calculate the exact calories and macros to hit your goal.
            </p>
          </div>
        )}

        {current === 'gender' && (
          <Question title="What's your biological sex?" subtitle="Used to calculate your metabolism.">
            <div className="flex gap-3">
              {(['male', 'female'] as const).map(g => (
                <ChoiceCard key={g} active={draft.gender === g} onClick={() => set({ gender: g })}>
                  <span className="text-sm font-semibold capitalize">{g}</span>
                </ChoiceCard>
              ))}
            </div>
          </Question>
        )}

        {current === 'age' && (
          <Question title="When were you born?" subtitle="Age affects your calorie needs.">
            <input
              className={inputClass}
              type="date"
              value={draft.birthDate}
              onChange={e => set({ birthDate: e.target.value })}
            />
          </Question>
        )}

        {current === 'height' && (
          <Question title="How tall are you?" subtitle="In centimetres.">
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                autoFocus
                value={draft.height}
                onChange={e => set({ height: e.target.value })}
                placeholder="175"
              />
              <span className="text-sm font-semibold text-[var(--muted)]">cm</span>
            </div>
          </Question>
        )}

        {current === 'weight' && (
          <Question title="What's your current weight?" subtitle="In kilograms.">
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                autoFocus
                value={draft.weight}
                onChange={e => set({ weight: e.target.value })}
                placeholder="77"
              />
              <span className="text-sm font-semibold text-[var(--muted)]">kg</span>
            </div>
          </Question>
        )}

        {current === 'activity' && (
          <Question title="How active are you?" subtitle="Outside of workouts you log.">
            <div className="flex flex-col gap-2.5">
              {ACTIVITY_OPTIONS.map(o => (
                <ChoiceCard key={o.value} active={draft.activity === o.value} onClick={() => set({ activity: o.value })} full>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{o.label}</p>
                    <p className="text-[11px] text-[var(--muted)]">{o.hint}</p>
                  </div>
                </ChoiceCard>
              ))}
            </div>
          </Question>
        )}

        {current === 'goal' && (
          <Question title="What's your goal?" subtitle="We'll tune your calories to match.">
            <div className="flex flex-col gap-2.5">
              {(['lose', 'maintain', 'gain'] as const).map(g => {
                const Icon = GOAL_META[g].icon;
                return (
                  <ChoiceCard key={g} active={draft.goal === g} onClick={() => set({ goal: g })} full>
                    <div className="flex items-center gap-3 text-left">
                      <Icon size={20} />
                      <div>
                        <p className="text-sm font-semibold">{GOAL_META[g].label}</p>
                        <p className="text-[11px] text-[var(--muted)]">{GOAL_META[g].desc}</p>
                      </div>
                    </div>
                  </ChoiceCard>
                );
              })}
            </div>
          </Question>
        )}

        {current === 'rate' && (
          <Question
            title={draft.goal === 'gain' ? 'How fast do you want to gain?' : 'How fast do you want to lose?'}
            subtitle="Steady is the most sustainable."
          >
            <div className="flex flex-col gap-2.5">
              {rateOptions.map(r => (
                <ChoiceCard key={r.value} active={draft.rate === r.value} onClick={() => set({ rate: r.value })} full>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="text-[11px] text-[var(--muted)]">{r.hint}</p>
                  </div>
                </ChoiceCard>
              ))}
            </div>
          </Question>
        )}

        {current === 'target' && (
          <Question
            title={draft.goal === 'gain' ? "What's your goal weight?" : "What weight are you aiming for?"}
            subtitle="We'll track how far you've come and project when you'll get there."
          >
            <div className="flex items-center gap-2">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                autoFocus
                value={draft.targetWeight}
                onChange={e => set({ targetWeight: e.target.value })}
                placeholder={draft.goal === 'gain' ? '82' : '72'}
              />
              <span className="text-sm font-semibold text-[var(--muted)]">kg</span>
            </div>
            {draft.weight && draft.targetWeight ? (
              <p className="mt-3 text-xs text-[var(--muted)]">
                {(() => {
                  const diff = Number(draft.weight) - Number(draft.targetWeight);
                  const abs = Math.abs(diff).toFixed(1);
                  if (draft.goal === 'lose')
                    return diff > 0
                      ? `That's ${abs} kg to lose. Totally doable. 💪`
                      : 'Tip: your target should be below your current weight to lose.';
                  return diff < 0
                    ? `That's ${abs} kg to gain. Let's build. 💪`
                    : 'Tip: your target should be above your current weight to gain.';
                })()}
              </p>
            ) : null}
          </Question>
        )}

        {current === 'review' && preview && (
          <div className="anim-fade-rise">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <Check size={26} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="text-center text-xl font-black tracking-tight text-[var(--text)]">Your daily plan</h1>
            <p className="mt-1 text-center text-sm text-[var(--muted)]">
              {draft.goal === 'lose' ? 'To lose' : draft.goal === 'gain' ? 'To gain' : 'To maintain'}
              {draft.goal !== 'maintain' ? ` ${draft.rate} kg/week` : ' your weight'}.
            </p>

            <div className="glass-card mt-5 p-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Daily calories</p>
              <p className="text-4xl font-black tracking-tight text-[var(--text)]">{preview.calorieTarget}</p>
              <div className="mt-4 flex gap-2">
                <MacroPill label="Protein" value={`${preview.macros.proteinG}g`} />
                <MacroPill label="Carbs" value={`${preview.macros.carbsG}g`} />
                <MacroPill label="Fat" value={`${preview.macros.fatG}g`} />
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
              You can fine-tune these any time from Settings.
            </p>
            {error ? <p className="mt-3 text-center text-xs text-red-500">{error}</p> : null}
          </div>
        )}
      </div>

      {/* Footer button */}
      {current === 'review' ? (
        <button
          type="button"
          onClick={finish}
          disabled={saving}
          className="w-full rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
        >
          {saving ? 'Saving…' : 'Start tracking'}
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          disabled={!canNext}
          className="w-full rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-40 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
        >
          {current === 'welcome' ? "Let's go" : 'Continue'}
        </button>
      )}
    </div>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="anim-fade-rise">
      <h1 className="text-xl font-black tracking-tight text-[var(--text)]">{title}</h1>
      <p className="mt-1 mb-5 text-sm text-[var(--muted)]">{subtitle}</p>
      {children}
    </div>
  );
}

function ChoiceCard({
  active,
  onClick,
  children,
  full,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded-2xl border p-4 ${full ? 'w-full justify-start' : 'flex-1'}`}
      style={
        active
          ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff' }
          : { borderColor: 'var(--card-border)', background: 'var(--card)', color: 'var(--text)' }
      }
    >
      {children}
    </button>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-[var(--bg)] p-2.5">
      <p className="text-sm font-bold text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
    </div>
  );
}
