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

// Singularize a word so "raises" matches "raise", "twists" matches "twist".
function singular(word: string): string {
  return word.replace(/s$/, '');
}

// Best-effort match from a free-text exercise name to a how-to DB id: exact
// first, then a tolerant match where every word of a DB entry appears in the
// typed name (ignoring plurals), preferring the most specific entry.
export function resolveExerciseId(name: string): string | undefined {
  const norm = normalize(name);
  const direct = ID_BY_NORMALIZED.get(norm);
  if (direct) return direct;

  const queryWords = new Set(norm.split(' ').map(singular));
  let best: string | undefined;
  let bestLen = 0;
  for (const [key, id] of ID_BY_NORMALIZED) {
    const keyWords = key.split(' ').map(singular);
    if (keyWords.length > bestLen && keyWords.every(w => queryWords.has(w))) {
      best = id;
      bestLen = keyWords.length;
    }
  }
  return best;
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
