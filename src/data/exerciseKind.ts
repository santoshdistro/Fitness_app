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

// True when a cardio "reps" value is really a prescription (e.g. "25-35 min",
// "5 min", "rounds") rather than a leftover rep count like "10-12".
function isCardioTarget(reps: string): boolean {
  const r = reps.trim();
  if (!r) return false;
  if (/^\d+(-\d+)?$/.test(r)) return false; // bare number(s) = rep count, not a target
  if (/^rounds?$/i.test(r)) return false; // handled as "N rounds"
  return true;
}

// One-line label for a planned exercise: reps × sets for lifts. Cardio surfaces
// its real prescription (minutes / rounds) from the reps field where present.
export function planLabel(name: string, sets: number, reps: string): string {
  if (isCardio(name)) {
    if (/^rounds?$/i.test(reps.trim())) return `${sets} rounds`;
    if (isCardioTarget(reps)) return sets > 1 ? `${sets} × ${reps}` : reps;
    return sets > 1 ? `${sets} rounds · time / distance` : 'time / distance';
  }
  return `${sets} × ${reps}`;
}

// The sub-heading shown while doing a cardio move in the guided flow: its
// target when the plan carries one, else a generic prompt.
export function cardioTargetLabel(reps: string): string {
  if (isCardioTarget(reps)) return `target ${reps.trim()}`;
  return 'log time & distance';
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
