// The physique a user is training toward. Shapes the rep scheme in the
// deterministic (no-AI) builder and the prompt in the AI builders.

export type PhysiqueGoal = 'balanced' | 'lean' | 'athletic' | 'hypertrophy' | 'strong' | 'aesthetic';

export const PHYSIQUE_GOALS: {
  value: PhysiqueGoal;
  label: string;
  blurb: string;
  reps: string; // rep range for the curated builder ('' = keep template/goal default)
  aiPrompt: string; // phrase fed to the AI builders
}[] = [
  { value: 'balanced', label: 'Balanced', blurb: 'Well-rounded', reps: '', aiPrompt: 'a balanced, well-rounded physique' },
  { value: 'lean', label: 'Lean & toned', blurb: 'Defined, lower body fat', reps: '12-15', aiPrompt: 'a lean, toned look — moderate weights, higher reps and some conditioning' },
  { value: 'athletic', label: 'Athletic', blurb: 'Fit & functional', reps: '8-12', aiPrompt: 'an athletic, functional build — big compound lifts plus explosive / conditioning work' },
  { value: 'hypertrophy', label: 'Muscular', blurb: 'Size & fullness', reps: '8-12', aiPrompt: 'maximum muscle size (bodybuilding hypertrophy) — higher volume in the 8-12 rep range' },
  { value: 'strong', label: 'Strong / powerful', blurb: 'Max strength', reps: '4-6', aiPrompt: 'raw strength (powerlifting focus) — heavy compound lifts in low rep ranges' },
  { value: 'aesthetic', label: 'Aesthetic V-taper', blurb: 'Wide shoulders, small waist', reps: '10-12', aiPrompt: 'an aesthetic V-taper — extra emphasis on shoulders, upper back / lats and arms with a tight waist' },
];

export function physiqueByValue(value: string | undefined): (typeof PHYSIQUE_GOALS)[number] | undefined {
  return PHYSIQUE_GOALS.find(p => p.value === value);
}
