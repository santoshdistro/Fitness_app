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

// Best-effort match from a free-text exercise name to a how-to DB id. Exact
// first, then the best word-overlap: every typed word appearing in a DB entry
// wins even if that entry has extra qualifiers (e.g. "Barbell Bench Press"
// matches "Barbell Bench Press - Medium Grip"). Falls back to strong partial
// overlap, and rejects weak matches so unrelated moves don't borrow a photo.
export function resolveExerciseId(name: string): string | undefined {
  const norm = normalize(name);
  const direct = ID_BY_NORMALIZED.get(norm);
  if (direct) return direct;

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
    const score = (allQueryMatched ? 1 : 0) + jaccard;
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
