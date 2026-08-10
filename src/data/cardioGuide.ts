// Plain-language how-to for cardio moves that aren't in the exercise how-to
// database (which is weights-focused). Used as a fallback in ExerciseDetail so
// tapping "Intervals" or "Cool-down walk" still explains what to do.

export type CardioGuide = { summary: string; steps: string[] };

const RULES: { test: RegExp; guide: CardioGuide }[] = [
  {
    test: /interval|hiit|tabata|circuit/i,
    guide: {
      summary:
        'Interval training: alternate short bursts of hard effort with easy recovery. It builds fitness and burns more in less time than a steady pace.',
      steps: [
        'Warm up for 3-5 minutes at an easy pace.',
        'Go hard for the work period (e.g. 30 seconds) — fast run, sprint, or high resistance.',
        'Ease right down for the recovery period (e.g. 90 seconds) — slow walk or light pedalling.',
        'That hard + easy is one round. Repeat for the number of rounds shown.',
        'Finish with a few minutes of easy movement to cool down.',
      ],
    },
  },
  {
    test: /sprint/i,
    guide: {
      summary: 'Short, near-maximal efforts with full recovery between them.',
      steps: [
        'Warm up thoroughly — sprints are hard on cold muscles.',
        'Sprint at ~90-95% effort for the set time or distance.',
        'Walk or stand until you feel recovered before the next one.',
        'Repeat for the number of rounds shown.',
      ],
    },
  },
  {
    test: /treadmill|\brun\b|running|\bjog/i,
    guide: {
      summary: 'Steady-state walking/running — one continuous effort at a pace you can sustain.',
      steps: [
        'Suggested: brisk incline walk at 5-6 km/h with 6-10% incline, or an easy run at 8-10 km/h with 1-2% incline.',
        'Hold a pace you could sustain for the whole target time (able to talk in short sentences).',
        'Keep an upright posture and relaxed shoulders; land midfoot; avoid holding the rails.',
        'Log the minutes, distance, and the speed & incline you used.',
      ],
    },
  },
  {
    test: /cool[- ]?down|\bwalk\b/i,
    guide: {
      summary: 'Easy walking — used to warm up or to cool down and bring your heart rate back down.',
      steps: [
        'Walk at a relaxed, comfortable pace.',
        'Breathe easily; let your heart rate settle over the minutes shown.',
        'Log the time (and distance if shown).',
      ],
    },
  },
  {
    test: /cycl|\bbike\b|spin/i,
    guide: {
      summary: 'Steady cycling at a resistance you can hold for the target time.',
      steps: [
        'Set a resistance that keeps you at a moderate, sustainable effort.',
        'Keep a smooth, even pedal cadence (~80-90 rpm).',
        'Log the minutes and distance.',
      ],
    },
  },
  {
    test: /rowing|row erg|\berg\b/i,
    guide: {
      summary: 'Rowing machine — drive with the legs, then back, then arms; reverse to return.',
      steps: [
        'Push through your legs first, then lean back slightly, then pull the handle to your ribs.',
        'Return in reverse: arms out, hinge forward, then bend the knees.',
        'Keep a steady rhythm for the target time.',
        'Log the minutes and distance.',
      ],
    },
  },
];

export function cardioGuide(name: string): CardioGuide | null {
  for (const rule of RULES) {
    if (rule.test.test(name)) return rule.guide;
  }
  return null;
}
