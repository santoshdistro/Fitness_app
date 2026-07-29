import type { CoachPayload } from '../hooks/useCoachInsight';

// A deterministic, offline "coach" that reads the day's numbers and picks from
// a pool of templated fragments. Feels like the AI coach, costs no API credit.
// The seed shifts as the user logs, so the wording changes through the day.

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.round(seed)) % arr.length];
}

export function generateCoachInsight(p: CoachPayload): string {
  const target = p.calorieTarget ?? 2000;
  const logged = p.caloriesLogged ?? 0;
  const burned = Math.max(0, Math.round(p.caloriesBurned ?? 0));
  // Exercise earns back budget, MyFitnessPal-style: left = target + burned - eaten.
  const budget = target + burned;
  const left = Math.round(budget - logged);
  const proteinGap =
    p.proteinTarget != null ? Math.round(p.proteinTarget - (p.proteinLogged ?? 0)) : null;
  const seed = logged + (p.proteinLogged ?? 0) + (p.mealCount ?? 0) + new Date().getDate();

  const nothingLogged = (p.mealCount ?? 0) === 0 && p.steps == null && p.waterMl == null;
  if (nothingLogged) {
    return pick(
      [
        "Fresh start today. Log your first meal — aim for one that's high in protein to set the tone.",
        'Nothing logged yet. Kick things off with a solid, protein-rich meal and the rest gets easier.',
        "Clean slate. Start by logging what you eat next — small habit, big payoff over time.",
        "Let's get today going — log a meal or your weight to start building momentum.",
      ],
      seed,
    );
  }

  const goalWord = p.goal === 'surplus' ? 'bulk' : p.goal === 'deficit' ? 'cut' : 'goal';
  const parts: string[] = [];

  // Primary: calories
  if (logged === 0) {
    parts.push(
      pick(
        [
          `You've got ${budget} kcal to work with today${burned > 0 ? ` (incl. ${burned} burned)` : ''}.`,
          `${budget} kcal on the table today — make them count with quality food.`,
        ],
        seed,
      ),
    );
  } else if (left <= 0) {
    parts.push(
      pick(
        [
          `You're ${Math.abs(left)} kcal over target — not a big deal, ease off tomorrow.`,
          `Slightly over by ${Math.abs(left)} kcal today. One day won't derail you — reset tomorrow.`,
        ],
        seed,
      ),
    );
  } else if (left < target * 0.25) {
    parts.push(
      pick(
        [
          `Only ${left} kcal left — keep the next choices light.`,
          `${left} kcal to spare — a light snack is about all that fits now.`,
        ],
        seed,
      ),
    );
  } else {
    parts.push(
      pick(
        [
          `${left} kcal left — plenty of room for a good meal.`,
          `You've got ${left} kcal left today; spend them on something nourishing.`,
          `${left} kcal to go — right on pace for your ${goalWord}.`,
        ],
        seed,
      ),
    );
  }

  // Secondary: protein gap, else streak, else steps, else water
  if (proteinGap != null && proteinGap > 5) {
    parts.push(
      pick(
        [
          `${proteinGap}g protein to go — a chicken breast, shake, or Greek yogurt closes the gap.`,
          `You're ${proteinGap}g short on protein; lean meat, eggs, or a shake gets you there.`,
          `Still ${proteinGap}g of protein left — make it the priority in your next meal.`,
        ],
        seed + 1,
      ),
    );
  } else if (proteinGap != null && proteinGap <= 0 && (p.proteinLogged ?? 0) > 0) {
    parts.push('Protein target hit — nicely done. 💪');
  } else if ((p.streak ?? 0) >= 3) {
    parts.push(
      pick(
        [
          `And a ${p.streak}-day logging streak — consistency is what actually moves the needle.`,
          `${p.streak} days logged in a row. Keep the streak alive.`,
        ],
        seed + 2,
      ),
    );
  } else if (p.steps != null && p.steps < 6000) {
    parts.push(
      pick(
        [
          'Steps are a little low — a 10-minute walk tops up your daily burn.',
          `Only ${p.steps} steps so far; a short walk later would help.`,
        ],
        seed + 3,
      ),
    );
  } else if (p.waterMl != null && p.waterMl < 1500) {
    parts.push("Hydration's on the low side — grab a glass of water.");
  }

  return parts.join(' ');
}
