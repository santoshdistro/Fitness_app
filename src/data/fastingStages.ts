// The stages a fast is commonly described as moving through, with the hour each
// one is usually said to begin. These are broad guides, not measurements: the
// real timings shift with your last meal, activity, sleep and individual
// metabolism, which is why the UI presents them as a rough journey rather than
// as anything diagnostic.

export type FastingStage = {
  /** Hours since the fast started at which this stage typically begins. */
  fromHour: number;
  label: string;
  /** What is broadly happening in this window. */
  detail: string;
};

export const FASTING_STAGES: FastingStage[] = [
  {
    fromHour: 0,
    label: 'Digesting',
    detail: 'Your body is digesting your last meal and storing the energy from it.',
  },
  {
    fromHour: 4,
    label: 'Settling',
    detail: 'Absorption finishes, blood sugar settles back down and insulin starts to fall.',
  },
  {
    fromHour: 12,
    label: 'Fuel switch',
    detail: 'Stored carbohydrate is running low, so your body leans more on fat for fuel.',
  },
  {
    fromHour: 14,
    label: 'Fat burn',
    detail: 'Fat is a main fuel source now, and ketone production gradually picks up.',
  },
  {
    fromHour: 24,
    label: 'Extended',
    detail: 'Ketones are higher and cellular housekeeping steps up. Long fasts suit some people and not others.',
  },
];

/** Index of the stage a fast of `hours` is currently in. */
export function stageIndexAt(hours: number): number {
  let idx = 0;
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (hours >= FASTING_STAGES[i].fromHour) idx = i;
  }
  return idx;
}
