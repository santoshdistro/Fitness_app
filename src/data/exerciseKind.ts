// Tells cardio/conditioning work apart from resistance work, so cardio is
// tracked and shown by time & distance instead of reps & weight.

// Loaded carries like a farmer's walk are strength, not cardio, despite "walk".
const NOT_CARDIO = /farmer|suitcase|waiter|walking lunge/i;

const CARDIO =
  /treadmill|elliptical|\brun\b|running|\bjog(ging)?\b|\bwalk\b|sprint|cycling|\bcycle\b|stationary bike|\bbike\b|spin(ning)?\b|rowing|row erg|\berg\b|stair ?master|stepmill|step mill|jump rope|skipping|\bhiit\b|interval|cool[- ]?down|cardio|\bswim/i;

export function isCardio(name: string): boolean {
  if (NOT_CARDIO.test(name)) return false;
  return CARDIO.test(name);
}

// One-line label for a planned exercise: reps × sets for lifts, or a
// time/distance hint for cardio (where a rep target is meaningless).
export function planLabel(name: string, sets: number, reps: string): string {
  if (isCardio(name)) return sets > 1 ? `${sets} rounds · time / distance` : 'time / distance';
  return `${sets} × ${reps}`;
}

// How a logged set reads back in history.
export function loggedSetLabel(set: {
  exercise: string;
  reps: number;
  weight: number;
  durationMin?: number;
  distanceKm?: number;
}): string {
  if (set.durationMin != null || (set.distanceKm != null && isCardio(set.exercise))) {
    const parts: string[] = [];
    if (set.durationMin) parts.push(`${set.durationMin} min`);
    if (set.distanceKm) parts.push(`${set.distanceKm} km`);
    return parts.length ? parts.join(' · ') : 'cardio';
  }
  return `${set.reps} reps · ${set.weight}kg`;
}
