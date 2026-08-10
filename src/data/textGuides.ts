// Plain-language how-to for strength/misc moves that aren't in the image
// database (band work, dead hangs, superset labels, warm-ups). Used as a text
// fallback in ExerciseDetail so every move has at least steps, even without a
// demo photo.

export type TextGuide = { summary: string; steps: string[] };

const RULES: { test: RegExp; guide: TextGuide }[] = [
  {
    test: /band.*chest|band.*bench|chest.*band/i,
    guide: {
      summary: 'A chest press using a resistance band anchored behind you.',
      steps: [
        'Anchor the band at chest height behind you (door anchor or post).',
        'Face away, a handle in each hand at chest level, elbows bent.',
        'Press the handles forward until your arms are almost straight, squeezing your chest.',
        'Return slowly to the start under control. Keep your core tight throughout.',
      ],
    },
  },
  {
    test: /band.*(overhead|shoulder|press)|(overhead|shoulder).*band/i,
    guide: {
      summary: 'An overhead shoulder press using a resistance band under your feet.',
      steps: [
        'Stand on the middle of the band, a handle in each hand at shoulder height.',
        'Brace your core and press both handles straight overhead until your arms lock out.',
        'Lower under control back to shoulder height.',
        'Keep your ribs down — don’t arch your lower back to finish the press.',
      ],
    },
  },
  {
    test: /band.*row|row.*band/i,
    guide: {
      summary: 'A back row using an anchored resistance band.',
      steps: [
        'Anchor the band in front of you at chest height and hold a handle in each hand.',
        'Step back so there’s tension, arms extended, chest up.',
        'Pull your elbows back past your ribs, squeezing your shoulder blades together.',
        'Straighten your arms slowly to return. Avoid shrugging your shoulders up.',
      ],
    },
  },
  {
    test: /dead hang|\bhang\b/i,
    guide: {
      summary: 'Hanging from a bar to build grip strength and decompress the shoulders and spine.',
      steps: [
        'Grip a pull-up bar about shoulder-width, palms facing away.',
        'Hang with arms straight but shoulders active — gently pull them down away from your ears.',
        'Relax your lower body, breathe steadily, and hold for the target time.',
        'Build up gradually; drop off before your grip fully fails.',
      ],
    },
  },
  {
    test: /superset/i,
    guide: {
      summary: 'Two exercises done back-to-back with no rest in between.',
      steps: [
        'Do a set of the first exercise.',
        'Immediately do a set of the second exercise, no rest.',
        'Rest only after finishing both — that pair is one superset.',
        'Repeat for the number of rounds shown.',
      ],
    },
  },
  {
    test: /warm[- ]?up|mobility/i,
    guide: {
      summary: 'A short warm-up to raise your heart rate and loosen the joints before lifting.',
      steps: [
        'Easy cardio for 3-5 minutes (row, bike, or brisk walk) to break a light sweat.',
        'Arm circles, leg swings, and 10-15 bodyweight squats.',
        'A few reps of your first exercise with a very light weight.',
        'You’re ready once you feel warm and your joints move freely.',
      ],
    },
  },
];

export function textGuide(name: string): TextGuide | null {
  for (const rule of RULES) {
    if (rule.test.test(name)) return rule.guide;
  }
  return null;
}
