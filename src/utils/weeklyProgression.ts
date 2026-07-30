// Deterministic 4-week progressive-overload cycle applied to a plan's base
// prescription. Week 1 establishes form, volume/intensity climb through week 3,
// week 4 deloads, then the cycle repeats one notch higher in effort.

export type WeekProgress = {
  week: number; // 1-based, absolute
  label: string; // e.g. "Week 3" or "Deload"
  note: string;
  deload: boolean;
  /** Adjusted set count for an exercise given its base sets. */
  setsFor: (baseSets: number) => number;
};

const NOTES = [
  'Establish form and control — leave 2-3 reps in the tank.',
  'Add a rep to each set or a small load bump vs. last week.',
  'Peak week — add a set to the compounds and push to RPE 8-9.',
];

export function weeklyProgress(week: number): WeekProgress {
  const inCycle = (week - 1) % 4; // 0..3
  if (inCycle === 3) {
    return {
      week,
      label: 'Deload',
      note: 'Back off — lighter loads and fewer sets so you recover and rebound.',
      deload: true,
      setsFor: base => Math.max(2, base - 1),
    };
  }
  const addSet = inCycle === 2 ? 1 : 0;
  return {
    week,
    label: `Week ${week}`,
    note: NOTES[inCycle],
    deload: false,
    setsFor: base => Math.min(6, base + addSet),
  };
}
