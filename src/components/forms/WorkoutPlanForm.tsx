import { useEffect, useState, type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { generateWorkoutPlan } from '../../lib/aiClient';
import { EQUIPMENT_OPTIONS } from '../../data/workoutPrograms';
import type { WorkoutPlanResult } from '../../lib/aiClient';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onGenerated: (plan: WorkoutPlanResult) => void;
};

const GOAL_OPTIONS = [
  { value: 'build muscle', label: 'Build muscle' },
  { value: 'lose fat / get lean', label: 'Lose fat / get lean' },
  { value: 'get a six-pack / core definition', label: 'Six-pack / core' },
  { value: 'gain strength', label: 'Gain strength' },
  { value: 'general fitness', label: 'General fitness' },
];

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const EQUIPMENT_LABEL: Record<string, string> = {
  full_gym: 'Full gym',
  dumbbells: 'Dumbbells only',
  bodyweight: 'Bodyweight only',
  minimal: 'Minimal equipment (bands / kettlebell)',
};

const PREFS_KEY = 'fb-ai-plan-prefs';

type PlanPrefs = {
  equipment?: string;
  goal?: string;
  experience?: string;
  daysPerWeek?: string;
  notes?: string;
};

function loadPrefs(): PlanPrefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as PlanPrefs;
  } catch {
    return {};
  }
}

// Map the user's calorie-goal direction to a sensible training goal default.
function goalFromDeficit(deficit: number | null | undefined): string {
  if (deficit == null || deficit === 0) return GOAL_OPTIONS[4].value; // general fitness
  return deficit > 0 ? GOAL_OPTIONS[1].value : GOAL_OPTIONS[0].value; // lose fat : build muscle
}

export function WorkoutPlanForm({ onGenerated }: Props) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const prefs = loadPrefs();

  const [equipment, setEquipment] = useState(prefs.equipment ?? 'full_gym');
  const [goal, setGoal] = useState(prefs.goal ?? GOAL_OPTIONS[0].value);
  const [experience, setExperience] = useState(prefs.experience ?? 'Beginner');
  const [daysPerWeek, setDaysPerWeek] = useState(prefs.daysPerWeek ?? '4');
  const [notes, setNotes] = useState(prefs.notes ?? '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the profile only when the user hasn't already made a choice.
  useEffect(() => {
    if (!prefs.equipment && profile?.equipment_preference && EQUIPMENT_LABEL[profile.equipment_preference]) {
      setEquipment(profile.equipment_preference);
    }
    if (!prefs.goal && profile?.calorie_deficit_kcal != null) {
      setGoal(goalFromDeficit(profile.calorie_deficit_kcal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.equipment_preference, profile?.calorie_deficit_kcal]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setGenerating(true);
    setError(null);
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ equipment, goal, experience, daysPerWeek, notes } satisfies PlanPrefs),
      );
      const plan = await generateWorkoutPlan(session.user.id, {
        equipment: EQUIPMENT_LABEL[equipment] ?? equipment,
        goal,
        experience,
        daysPerWeek: Number(daysPerWeek),
        notes: notes.trim() || undefined,
      });
      onGenerated(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a plan.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="plan-equipment">Equipment</label>
        <select
          id="plan-equipment"
          className={inputClass}
          value={equipment}
          onChange={e => setEquipment(e.target.value)}
        >
          {EQUIPMENT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="plan-goal">Goal</label>
        <select id="plan-goal" className={inputClass} value={goal} onChange={e => setGoal(e.target.value)}>
          {GOAL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="plan-exp">Experience</label>
          <select id="plan-exp" className={inputClass} value={experience} onChange={e => setExperience(e.target.value)}>
            {EXPERIENCE_OPTIONS.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="plan-days">Days / week</label>
          <select id="plan-days" className={inputClass} value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)}>
            {['2', '3', '4', '5', '6'].map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass} htmlFor="plan-notes">Anything else? — optional</label>
        <input
          id="plan-notes"
          className={inputClass}
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. bad knees, prefer supersets"
        />
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={generating} className={submitButtonClass}>
        {generating ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building your plan…
          </>
        ) : (
          <>
            <Sparkles size={15} className="mr-2" />
            Generate my plan
          </>
        )}
      </button>
    </form>
  );
}
