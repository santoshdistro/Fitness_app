// Flat, human-readable list of every exercise in the how-to database, used to
// suggest names while logging a workout so entries stay consistent (same
// spelling → they group correctly in charts and the muscle map). Optional — you
// can always type a custom name.
import { EXERCISE_DETAILS } from './exerciseDetails';

export const EXERCISE_NAMES: string[] = Object.keys(EXERCISE_DETAILS)
  .map(id => id.replace(/_/g, ' '))
  .sort((a, b) => a.localeCompare(b));

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Curated name → how-to id map for common moves whose plain names don't line up
// with the database's specific titles (e.g. "Chest fly" → "Dumbbell_Flyes"),
// so they get a demo photo and steps. Keys are already normalized.
const EXERCISE_ID_ALIASES: Record<string, string> = {
  'ab wheel': 'Ab_Roller',
  'arnold press': 'Arnold_Dumbbell_Press',
  'back extensions': 'Hyperextensions_Back_Extensions',
  'back squat': 'Barbell_Squat',
  // Without this, "barbell row" ties with Upright_Barbell_Row / Barbell_Rear_Delt_Row
  // — different movements. A bare "row" means the bent-over one.
  'barbell row': 'Bent_Over_Barbell_Row',
  'bent over row': 'Bent_Over_Barbell_Row',
  // A bare "bench press" means the barbell one; left to the matcher it lands on
  // the dumbbell entry. Same for the incline, which otherwise drops to flat.
  'bench press': 'Barbell_Bench_Press_-_Medium_Grip',
  'incline bench press': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'incline dumbbell bench press': 'Incline_Dumbbell_Press',
  'bicycle crunch': 'Air_Bike',
  // "Dumbbell Raise" is a real database entry, so it outscores the side raise on
  // word overlap — but a lateral raise is not a front raise.
  'dumbbell lateral raise': 'Side_Lateral_Raise',
  'calf raise': 'Standing_Dumbbell_Calf_Raise',
  'calf raises': 'Standing_Dumbbell_Calf_Raise',
  'cable crunch': 'Cable_Crunch',
  'cable crossover': 'Cable_Crossover',
  'cable curl': 'Cable_Preacher_Curl',
  'chest fly': 'Dumbbell_Flyes',
  'face pulls': 'Face_Pull',
  'lateral raise': 'Side_Lateral_Raise',
  'lateral raises': 'Side_Lateral_Raise',
  'leg extension': 'Leg_Extensions',
  'nordic curl': 'Natural_Glute_Ham_Raise',
  'overhead press': 'Standing_Military_Press',
  'overhead shoulder press': 'Standing_Military_Press',
  'overhead extension': 'Standing_Dumbbell_Triceps_Extension',
  'overhead triceps extension': 'Standing_Dumbbell_Triceps_Extension',
  'preacher curl': 'Preacher_Curl',
  'rear delt fly': 'Cable_Rear_Delt_Fly',
  'reverse curls': 'Reverse_Barbell_Curl',
  'russian twists': 'Russian_Twist',
  'single arm row': 'One-Arm_Dumbbell_Row',
  'skull crushers': 'EZ-Bar_Skullcrusher',
  'box jumps': 'Front_Box_Jump',
  'farmer s carry': 'Farmers_Walk',
  'neck curls': 'Lying_Face_Up_Plate_Neck_Resistance',
  'neck extension': 'Lying_Face_Down_Plate_Neck_Resistance',
  'neck side flexion': 'Isometric_Neck_Exercise_-_Sides',
  'weighted neck harness': 'Lying_Face_Up_Plate_Neck_Resistance',
  // Programme names whose movement is in the database under different kit. The
  // photo shows the same path with a dumbbell/cable swap, which reads fine; the
  // written cue names the actual equipment.
  'dumbbell box step up': 'Barbell_Step_Ups',
  'lean away dumbbell lateral raise': 'Side_Lateral_Raise',
  'single arm cable lateral raise': 'Side_Lateral_Raise',
  'overhead cable tricep extension': 'Standing_Dumbbell_Triceps_Extension',
  'reverse pec deck fly': 'Cable_Rear_Delt_Fly',
  // Deliberately absent: "close-grip lat pulldown". The only pulldown in the
  // database is wide-grip, i.e. the opposite grip — no photo beats a photo that
  // contradicts the instruction. The written form cue covers it.
};

// how-to DB key keyed by its normalized display name, for name → id lookups.
const ID_BY_NORMALIZED = new Map<string, string>(
  Object.keys(EXERCISE_DETAILS).map(id => [normalize(id.replace(/_/g, ' ')), id]),
);

// Same keys with spaces removed, so "pull ups" can match a DB "Pullups".
const ID_BY_SQUASHED = new Map<string, string>(
  Object.keys(EXERCISE_DETAILS).map(id => [normalize(id.replace(/_/g, ' ')).replace(/\s+/g, ''), id]),
);

// Singularize a word so "raises" matches "raise", "twists" matches "twist".
function singular(word: string): string {
  return word.replace(/s$/, '');
}

// Words that carry no matching signal — dropped before comparing names.
const STOP = new Set(['the', 'a', 'with', 'and', 'to', 'of', 'on', 'in', 'for']);

// Qualifiers that change how a move actually looks. Within a group the values
// are mutually exclusive, so a photo of one is a photo of the wrong thing: a
// close-grip pulldown asked for and a wide-grip photo returned is worse than no
// photo at all, because the image silently contradicts the instruction.
// Each group holds mutually exclusive alternatives; each alternative lists its
// synonyms, so "close" and "narrow" agree with each other but both disagree
// with "wide".
// `penalise` marks the groups where silently picking a variant misleads: an
// unasked-for decline or wide grip shows the wrong movement. Equipment is
// deliberately excluded — a bare "Squat" legitimately illustrates with a
// barbell squat, and penalising that pushed it to a bodyweight photo instead.
const CONFLICTING_QUALIFIERS: { alts: string[][]; penalise: boolean }[] = [
  { alts: [['close', 'narrow'], ['wide']], penalise: true },
  {
    alts: [['neutral', 'hammer'], ['reverse', 'underhand', 'supinated'], ['overhand', 'pronated']],
    penalise: true,
  },
  { alts: [['incline'], ['decline'], ['flat']], penalise: true },
  { alts: [['upright'], ['bent']], penalise: true },
  { alts: [['seated'], ['standing'], ['lying'], ['kneeling']], penalise: false },
  { alts: [['single', 'one'], ['two', 'both', 'double']], penalise: false },
  { alts: [['front'], ['rear', 'back']], penalise: false },
  {
    alts: [['barbell'], ['dumbbell'], ['cable'], ['machine'], ['kettlebell'], ['band'], ['smith']],
    penalise: false,
  },
];

// How much to dock a candidate for each variant it introduces that wasn't
// asked for. Big enough to beat the shorter-name tie-break — without it
// "Barbell bench press" picks "Decline Barbell Bench Press" over the plain
// "Barbell Bench Press - Medium Grip" purely because the name is shorter.
const UNASKED_QUALIFIER_PENALTY = 0.25;

/** Which alternative (by index) this word set picks in each group, if any. */
function qualifiersOf(words: Set<string>): (number | undefined)[] {
  return CONFLICTING_QUALIFIERS.map(group => {
    const idx = group.alts.findIndex(synonyms => synonyms.some(w => words.has(w)));
    return idx === -1 ? undefined : idx;
  });
}

// True when both names name a qualifier from the same group but disagree.
// Silence on one side is fine — a generic entry can illustrate a specific one.
function qualifiersConflict(a: Set<string>, b: Set<string>): boolean {
  const qa = qualifiersOf(a);
  const qb = qualifiersOf(b);
  return qa.some((q, i) => q != null && qb[i] != null && q !== qb[i]);
}

/** How many variants the candidate pins down that the query left open. */
function unaskedQualifiers(query: Set<string>, candidate: Set<string>): number {
  const qq = qualifiersOf(query);
  const qc = qualifiersOf(candidate);
  return qc.reduce<number>(
    (n, q, i) => (CONFLICTING_QUALIFIERS[i].penalise && q != null && qq[i] == null ? n + 1 : n),
    0,
  );
}

// Best-effort match from a free-text exercise name to a how-to DB id. Exact
// first, then the best word-overlap: every typed word appearing in a DB entry
// wins even if that entry has extra qualifiers (e.g. "Barbell Bench Press"
// matches "Barbell Bench Press - Medium Grip"). Falls back to strong partial
// overlap, and rejects weak matches so unrelated moves don't borrow a photo.
export function resolveExerciseId(name: string): string | undefined {
  const norm = normalize(name);
  const direct = ID_BY_NORMALIZED.get(norm);
  if (direct) return direct;
  const aliased = EXERCISE_ID_ALIASES[norm];
  if (aliased) return aliased;

  const q = norm.split(' ').map(singular).filter(w => w.length > 1 && !STOP.has(w));
  if (q.length === 0) return undefined;
  const qSet = new Set(q);

  let best: string | undefined;
  let bestScore = 0;
  let bestLen = Infinity;
  for (const [key, id] of ID_BY_NORMALIZED) {
    const kWords = key.split(' ').map(singular).filter(w => w.length > 1 && !STOP.has(w));
    const kSet = new Set(kWords);
    let inter = 0;
    for (const w of qSet) if (kSet.has(w)) inter++;
    if (inter === 0) continue;
    const union = new Set([...qSet, ...kSet]).size;
    const jaccard = inter / union;
    const allQueryMatched = inter === qSet.size;
    if (!allQueryMatched && jaccard < 0.5) continue; // too weak — skip
    if (qualifiersConflict(qSet, kSet)) continue; // right move, wrong variant
    const score =
      (allQueryMatched ? 1 : 0) +
      jaccard -
      UNASKED_QUALIFIER_PENALTY * unaskedQualifiers(qSet, kSet);
    // Prefer a higher score; tie-break toward the closest-length entry.
    if (score > bestScore || (score === bestScore && kWords.length < bestLen)) {
      best = id;
      bestScore = score;
      bestLen = kWords.length;
    }
  }
  if (best) return best;

  // Squashed fallback: "pull ups" ↔ "pullups", "push ups" ↔ "pushups".
  const squashed = norm.replace(/\s+/g, '');
  const exactSquash = ID_BY_SQUASHED.get(squashed);
  if (exactSquash) return exactSquash;
  for (const [key, id] of ID_BY_SQUASHED) {
    if (squashed.length >= 5 && (key.includes(squashed) || squashed.includes(key))) return id;
  }
  return undefined;
}

// Demonstration image paths for an exercise, resolved by id or by name.
export function exerciseImagesFor(nameOrId: string): string[] {
  const id = EXERCISE_DETAILS[nameOrId] ? nameOrId : resolveExerciseId(nameOrId);
  return id ? EXERCISE_DETAILS[id].images : [];
}

// Up to `limit` names matching a query — matches from the start of any word
// first (so "curl" surfaces "Barbell Curl" before "…Preacher Curl"), then any
// substring. Case-insensitive. Returns [] until the query is long enough.
export function suggestExercises(query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const starts: string[] = [];
  const wordStarts: string[] = [];
  const contains: string[] = [];
  for (const name of EXERCISE_NAMES) {
    const lower = name.toLowerCase();
    if (lower === q) continue; // already an exact match — nothing to suggest
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.split(/\s+/).some(w => w.startsWith(q))) wordStarts.push(name);
    else if (lower.includes(q)) contains.push(name);
  }
  return [...starts, ...wordStarts, ...contains].slice(0, limit);
}
