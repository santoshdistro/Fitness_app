/**
 * Turns the logged history into a short list of things worth CHANGING.
 *
 * The rule that shapes all of it: a finding has to be actionable and it has to
 * be measured against the goal. "Your average protein is 110g" is a number the
 * Trends tab already shows; "protein is 42g/day under the target that protects
 * muscle while you are in a deficit, on 6 of the last 7 days" is a thing to do
 * something about. Anything that cannot be turned into an instruction is left
 * out rather than padded in.
 *
 * On honesty with a month of self-logged data: correlations here are computed
 * over one person, n≈30, with a lot of unmeasured confounds. They are labelled
 * by strength and suppressed entirely below a minimum sample, and the wording
 * says "goes with", never "causes".
 */

export type InsightTone = 'good' | 'watch' | 'act';

export type Insight = {
  id: string;
  /** Sorts the list — higher is more worth acting on. */
  priority: number;
  tone: InsightTone;
  title: string;
  /** The number that makes the case. */
  detail: string;
  /** What to do about it. Omitted when a finding is purely positive. */
  action?: string;
  /** Shown when the finding rests on a relationship rather than a total. */
  strength?: 'weak' | 'moderate' | 'strong';
  sample?: number;
};

export type DayRow = {
  date: string;
  kcal: number | null;
  protein: number | null;
  steps: number | null;
  sleep: number | null;
  caffeine: number | null;
  weight: number | null;
  restingHr: number | null;
  hrv: number | null;
  trained: boolean;
  volume: number;
};

const MIN_PAIRS = 10;

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Pearson r over paired samples. Returns null when there isn't enough spread. */
export function correlate(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < MIN_PAIRS) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  // A flat series has no correlation to report, and dividing by it would be NaN.
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}

function strengthOf(r: number): 'weak' | 'moderate' | 'strong' | null {
  const a = Math.abs(r);
  if (a >= 0.6) return 'strong';
  if (a >= 0.4) return 'moderate';
  if (a >= 0.25) return 'weak';
  return null;
}

/**
 * Least-squares slope in units per day. Used for the weight trend, where the
 * question is "how fast, in which direction" rather than "what is it today".
 */
export function slopePerDay(points: { x: number; y: number }[]): number | null {
  if (points.length < 4) return null;
  const mx = mean(points.map(p => p.x));
  const my = mean(points.map(p => p.y));
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

/** Pairs x and y on the SAME day, for values that already describe one day. */
function samePairs(
  rows: DayRow[],
  pick: (r: DayRow) => number | null,
  other: (r: DayRow) => number | null,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const r of rows) {
    const x = pick(r);
    const y = other(r);
    if (x != null && y != null) {
      xs.push(x);
      ys.push(y);
    }
  }
  return { xs, ys };
}

/** Pairs today's x with TOMORROW's y. */
function laggedPairs(
  rows: DayRow[],
  pick: (r: DayRow) => number | null,
  next: (r: DayRow) => number | null,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const x = pick(rows[i]);
    const y = next(rows[i + 1]);
    // Consecutive days only — a gap in logging is not a lag of one day.
    const gapOk =
      (new Date(`${rows[i + 1].date}T00:00:00`).getTime() -
        new Date(`${rows[i].date}T00:00:00`).getTime()) /
        86400000 ===
      1;
    if (x != null && y != null && gapOk) {
      xs.push(x);
      ys.push(y);
    }
  }
  return { xs, ys };
}

export type InsightInput = {
  /** Oldest first. */
  rows: DayRow[];
  calorieTarget: number | null;
  proteinTarget: number | null;
  targetWeightKg: number | null;
  weeklyRateKg: number | null;
  goalType: string | null;
};

export function buildInsights(input: InsightInput): Insight[] {
  const { rows, calorieTarget, proteinTarget, targetWeightKg, weeklyRateKg } = input;
  const out: Insight[] = [];
  if (rows.length < 7) return out;

  const logged = rows.filter(r => r.kcal != null && r.kcal > 0);
  const weights = rows.filter(r => r.weight != null);

  // ---- Are you moving at the pace the goal needs? -------------------------
  const weightPoints = weights.map(r => ({
    x: new Date(`${r.date}T00:00:00`).getTime() / 86400000,
    y: r.weight as number,
  }));
  const perDay = slopePerDay(weightPoints);
  if (perDay != null && weights.length >= 6) {
    const perWeek = perDay * 7;
    const goalPerWeek = weeklyRateKg ?? null;
    const latest = weights[weights.length - 1].weight as number;
    const toGo = targetWeightKg != null ? latest - targetWeightKg : null;

    if (goalPerWeek != null && goalPerWeek !== 0 && toGo != null && toGo > 0) {
      // Both are magnitudes toward the target; sign is handled by direction.
      const actual = -perWeek; // positive = losing
      const ratio = actual / goalPerWeek;
      if (ratio < 0.5) {
        const weeksAtPace = actual > 0.02 ? Math.ceil(toGo / actual) : null;
        out.push({
          id: 'pace',
          priority: 100,
          tone: 'act',
          title: actual <= 0 ? 'Weight is not moving toward the goal' : 'Losing slower than the plan',
          detail:
            actual <= 0
              ? `Trend over ${weights.length} weigh-ins is ${perWeek >= 0 ? '+' : ''}${perWeek.toFixed(2)} kg/week against a target of −${goalPerWeek.toFixed(2)}.`
              : `Trend is −${actual.toFixed(2)} kg/week against a target of −${goalPerWeek.toFixed(2)}${weeksAtPace ? `, which reaches ${targetWeightKg} kg in about ${weeksAtPace} weeks` : ''}.`,
          action:
            'The deficit is smaller than intended. Tighten intake or add activity — the calorie insight below says which is easier from here.',
        });
      } else if (ratio > 1.6) {
        out.push({
          id: 'pace-fast',
          priority: 80,
          tone: 'watch',
          title: 'Losing faster than planned',
          detail: `Trend is −${actual.toFixed(2)} kg/week against a target of −${goalPerWeek.toFixed(2)}.`,
          action: 'Fast loss costs muscle and adherence. Consider eating back 150–200 kcal/day.',
        });
      } else {
        out.push({
          id: 'pace-ok',
          priority: 30,
          tone: 'good',
          title: 'On pace',
          detail: `Trend is −${actual.toFixed(2)} kg/week, target −${goalPerWeek.toFixed(2)}.`,
        });
      }
    }
  }

  // ---- Protein: the lever that decides what the weight loss is made of ----
  if (proteinTarget && logged.length >= 7) {
    const withProtein = logged.filter(r => r.protein != null);
    if (withProtein.length >= 7) {
      const avg = mean(withProtein.map(r => r.protein as number));
      const gap = proteinTarget - avg;
      const missDays = withProtein.filter(r => (r.protein as number) < proteinTarget * 0.9).length;
      if (gap > proteinTarget * 0.12) {
        out.push({
          id: 'protein',
          priority: 95,
          tone: 'act',
          title: 'Protein is the biggest gap',
          detail: `Averaging ${Math.round(avg)}g against a ${proteinTarget}g target — short on ${missDays} of ${withProtein.length} logged days.`,
          action: `About ${Math.round(gap)}g/day short. In a deficit this is what decides whether the weight comes off fat or muscle: one more protein-led meal or a shake closes it.`,
        });
      } else {
        out.push({
          id: 'protein-ok',
          priority: 25,
          tone: 'good',
          title: 'Protein is where it should be',
          detail: `Averaging ${Math.round(avg)}g against a ${proteinTarget}g target.`,
        });
      }
    }
  }

  // ---- Calories: the average matters less than the consistency ------------
  if (calorieTarget && logged.length >= 7) {
    const kcals = logged.map(r => r.kcal as number);
    const avg = mean(kcals);
    const over = kcals.filter(k => k > calorieTarget * 1.1).length;
    const spread = Math.sqrt(mean(kcals.map(k => (k - avg) ** 2)));
    if (spread > calorieTarget * 0.28) {
      out.push({
        id: 'kcal-swing',
        priority: 70,
        tone: 'watch',
        title: 'Intake swings a lot day to day',
        detail: `Averaging ${Math.round(avg)} kcal but varying by ±${Math.round(spread)}, with ${over} day${over === 1 ? '' : 's'} more than 10% over target.`,
        action:
          'The weekly average is what moves weight, so this is not fatal — but big days are usually unplanned ones. A repeatable default breakfast and lunch takes most of the variance out.',
      });
    }
  }

  // ---- Logging gaps make everything above less trustworthy ----------------
  const last14 = rows.slice(-14);
  const loggedDays = last14.filter(r => r.kcal != null && r.kcal > 0).length;
  if (last14.length >= 14 && loggedDays < 11) {
    const byWeekend = last14.filter(r => {
      const d = new Date(`${r.date}T00:00:00`).getDay();
      return d === 0 || d === 6;
    });
    const weekendLogged = byWeekend.filter(r => r.kcal != null && r.kcal > 0).length;
    const weekendGap = byWeekend.length > 0 && weekendLogged / byWeekend.length < 0.5;
    out.push({
      id: 'logging',
      priority: 90,
      tone: 'act',
      title: 'Logging has gaps',
      detail: `${loggedDays} of the last 14 days have food logged${weekendGap ? ', and weekends are the weak spot' : ''}.`,
      action: weekendGap
        ? 'Unlogged weekend days are usually the highest ones, so the real average is above what the app shows. Copy a past day in two taps rather than skipping.'
        : 'Every gap makes the weight-vs-intake picture less reliable. Copying a past day is quicker than logging from scratch.',
    });
  }

  // ---- Relationships. Reported as association, never as cause. ------------
  // sleep_hours on a date is the night BEFORE that date — that is what the sync
  // Shortcut writes — so the day it shows up in is the same row. Lagging it by a
  // day compares last night's sleep against the day after, which is a
  // relationship no one claimed exists.
  const sleepNextSteps = samePairs(rows, r => r.sleep, r => r.steps);
  const rSleepSteps = correlate(sleepNextSteps.xs, sleepNextSteps.ys);
  if (rSleepSteps != null) {
    const s = strengthOf(rSleepSteps);
    if (s && rSleepSteps > 0) {
      out.push({
        id: 'sleep-steps',
        priority: 60,
        tone: 'watch',
        strength: s,
        sample: sleepNextSteps.xs.length,
        title: 'Sleep shows up in how much you move',
        detail: 'Days after a longer night go with more steps.',
        action: 'Protecting sleep is the cheapest way to move more, and it costs nothing at the table.',
      });
    }
  }

  // Caffeine IS lagged: today's coffee costs tonight's sleep, and tonight's
  // sleep is written against tomorrow's date.
  const caffeineThenSleep = laggedPairs(rows, r => r.caffeine, r => r.sleep);
  const rCaffeine = correlate(caffeineThenSleep.xs, caffeineThenSleep.ys);
  if (rCaffeine != null && rCaffeine < 0) {
    const s = strengthOf(rCaffeine);
    if (s) {
      out.push({
        id: 'caffeine-sleep',
        priority: 55,
        tone: 'watch',
        strength: s,
        sample: caffeineThenSleep.xs.length,
        title: 'Higher caffeine days sleep worse',
        detail: 'Days with more caffeine go with less sleep that night.',
        action: 'Worth testing a cut-off time for a week and watching the sleep line.',
      });
    }
  }

  // ---- Body signals, once the watch is feeding them ------------------------
  const withRhr = rows.filter(r => r.restingHr != null);
  if (withRhr.length >= 14) {
    const half = Math.floor(withRhr.length / 2);
    const older = mean(withRhr.slice(0, half).map(r => r.restingHr as number));
    const recent = mean(withRhr.slice(half).map(r => r.restingHr as number));
    const delta = recent - older;
    if (delta <= -1.5) {
      out.push({
        id: 'rhr-down',
        priority: 40,
        tone: 'good',
        title: 'Resting heart rate is trending down',
        detail: `Down ${Math.abs(delta).toFixed(1)} bpm across the period — usually fitness improving.`,
      });
    } else if (delta >= 3) {
      out.push({
        id: 'rhr-up',
        priority: 85,
        tone: 'act',
        title: 'Resting heart rate is climbing',
        detail: `Up ${delta.toFixed(1)} bpm across the period.`,
        action:
          'A sustained rise usually means under-recovery, illness or alcohol rather than training. Worth an easy week before pushing again.',
      });
    }
  }

  const withHrv = rows.filter(r => r.hrv != null);
  if (withHrv.length >= 14) {
    const half = Math.floor(withHrv.length / 2);
    const older = mean(withHrv.slice(0, half).map(r => r.hrv as number));
    const recent = mean(withHrv.slice(half).map(r => r.hrv as number));
    if (older > 0 && (recent - older) / older <= -0.12) {
      out.push({
        id: 'hrv-down',
        priority: 75,
        tone: 'watch',
        title: 'HRV has dropped',
        detail: `Down ${Math.round(((older - recent) / older) * 100)}% on the first half of the period.`,
        action: 'Paired with a rising resting heart rate this is the classic overreaching signal.',
      });
    }
  }

  return out.sort((a, b) => b.priority - a.priority);
}
