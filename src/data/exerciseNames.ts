// Flat, human-readable list of every exercise in the how-to database, used to
// suggest names while logging a workout so entries stay consistent (same
// spelling → they group correctly in charts and the muscle map). Optional — you
// can always type a custom name.
import { EXERCISE_DETAILS } from './exerciseDetails';

export const EXERCISE_NAMES: string[] = Object.keys(EXERCISE_DETAILS)
  .map(id => id.replace(/_/g, ' '))
  .sort((a, b) => a.localeCompare(b));

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
