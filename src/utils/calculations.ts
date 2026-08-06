export type Gender = 'male' | 'female';

const CM_TO_INCHES = 1 / 2.54;

/**
 * U.S. Navy Circumference Method. All linear inputs are in inches.
 * Hip is only required (and only used) for the female formula.
 */
export function computeNavyBodyFatPercent(params: {
  gender: Gender;
  neckIn: number;
  waistIn: number;
  heightIn: number;
  hipIn?: number;
}): number {
  const { gender, neckIn, waistIn, heightIn, hipIn } = params;

  if (gender === 'male') {
    return (
      86.01 * Math.log10(waistIn - neckIn) - 70.041 * Math.log10(heightIn) + 36.76
    );
  }

  return (
    163.205 * Math.log10(waistIn + (hipIn ?? 0) - neckIn) -
    97.684 * Math.log10(heightIn) -
    78.387
  );
}

export function cmToInches(cm: number): number {
  return cm * CM_TO_INCHES;
}

/** Mifflin-St Jeor BMR. Weight in kg, height in cm. */
export function computeBMR(params: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const { gender, weightKg, heightCm, ageYears } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'male' ? base + 5 : base - 161;
}

export function ageFromBirthDate(birthDate: string, today = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export type GoalType = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';

/** Standard Mifflin-St Jeor activity multipliers applied to BMR to get TDEE. */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Little or no exercise, desk job' },
  { value: 'light', label: 'Lightly active', hint: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderately active', hint: 'Exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very active', hint: 'Hard exercise 6-7 days/week' },
];

export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Build muscle' },
];

const KCAL_PER_KG = 7700;

export function activityMultiplier(level: ActivityLevel | null | undefined): number {
  return level ? ACTIVITY_MULTIPLIERS[level] : ACTIVITY_MULTIPLIERS.light;
}

/** Total Daily Energy Expenditure = BMR x activity multiplier. */
export function computeTDEE(bmr: number, level: ActivityLevel | null | undefined): number {
  return bmr * activityMultiplier(level);
}

/**
 * Daily calorie deficit (positive = eat below TDEE to lose, negative = surplus
 * to gain, 0 = maintain), derived from the goal and target weekly weight change.
 * 1 kg of body weight ~ 7700 kcal.
 */
export function deficitFromGoal(goalType: GoalType, weeklyRateKg: number): number {
  const perDay = (Math.abs(weeklyRateKg) * KCAL_PER_KG) / 7;
  if (goalType === 'lose') return Math.round(perDay);
  if (goalType === 'gain') return -Math.round(perDay);
  return 0;
}

/** Daily Calorie Target = TDEE - Deficit. */
export function computeDailyCalorieTarget(params: { tdee: number; deficitKcal: number }): number {
  return Math.round(params.tdee - params.deficitKcal);
}

export type BmiInfo = {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  /** Healthy weight range for this height (BMI 18.5–24.9), in kg. */
  healthyLowKg: number;
  healthyHighKg: number;
  /** kg to lose (positive) or gain (negative) to reach the nearest healthy edge; 0 if already healthy. */
  toHealthyKg: number;
};

export function computeBmi(weightKg: number, heightCm: number): BmiInfo {
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  const healthyLowKg = Math.round(18.5 * m * m * 10) / 10;
  const healthyHighKg = Math.round(24.9 * m * m * 10) / 10;

  const category: BmiInfo['category'] =
    bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';

  let toHealthyKg = 0;
  if (weightKg > healthyHighKg) toHealthyKg = Math.round((weightKg - healthyHighKg) * 10) / 10;
  else if (weightKg < healthyLowKg) toHealthyKg = Math.round((weightKg - healthyLowKg) * 10) / 10; // negative = gain

  return { bmi: Math.round(bmi * 10) / 10, category, healthyLowKg, healthyHighKg, toHealthyKg };
}

export type GoalProgress = {
  goalType: Exclude<GoalType, 'maintain'>;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  /** kg moved in the goal direction so far (never negative — 0 if going backwards). */
  achievedKg: number;
  /** Signed progress toward the goal: positive = right direction, negative = moved away. */
  netChangeKg: number;
  /** Raw scale movement since start: positive = weight went up, negative = down. */
  weightDeltaKg: number;
  /** kg still to go to reach target (0 once hit). */
  remainingKg: number;
  /** 0–100 share of the journey completed. */
  percent: number;
  reached: boolean;
  /** Projected date to hit target from the planned weekly rate, if computable. */
  etaDate: Date | null;
  weeksToGo: number | null;
};

/**
 * Turns a start/current/target weight into a motivational progress picture:
 * how far you've come, how far's left, and roughly when you'll get there at the
 * planned pace. Returns null when there isn't enough to say anything useful.
 */
export function computeGoalProgress(params: {
  goalType: GoalType | null | undefined;
  startWeight: number | null | undefined;
  currentWeight: number | null | undefined;
  targetWeight: number | null | undefined;
  weeklyRateKg: number | null | undefined;
  today?: Date;
}): GoalProgress | null {
  const { goalType, startWeight, currentWeight, targetWeight, weeklyRateKg } = params;
  if (
    (goalType !== 'lose' && goalType !== 'gain') ||
    startWeight == null ||
    currentWeight == null ||
    targetWeight == null
  ) {
    return null;
  }

  const totalJourney = Math.abs(startWeight - targetWeight);
  if (totalJourney < 0.05) return null; // start already at target — nothing to chart

  const sign = goalType === 'lose' ? 1 : -1;
  const netChangeKg = sign * (startWeight - currentWeight);
  const achievedKg = Math.max(0, netChangeKg);
  const weightDeltaKg = currentWeight - startWeight;
  const remainingKg = Math.max(0, sign * (currentWeight - targetWeight));
  const reached = remainingKg < 0.05;
  const percent = Math.max(0, Math.min(100, (achievedKg / totalJourney) * 100));

  let weeksToGo: number | null = null;
  let etaDate: Date | null = null;
  if (!reached && weeklyRateKg && weeklyRateKg > 0) {
    weeksToGo = remainingKg / weeklyRateKg;
    const today = params.today ?? new Date();
    etaDate = new Date(today.getTime());
    etaDate.setDate(etaDate.getDate() + Math.round(weeksToGo * 7));
  }

  return {
    goalType,
    startWeight,
    currentWeight,
    targetWeight,
    achievedKg: Math.round(achievedKg * 10) / 10,
    netChangeKg: Math.round(netChangeKg * 10) / 10,
    weightDeltaKg: Math.round(weightDeltaKg * 10) / 10,
    remainingKg: Math.round(remainingKg * 10) / 10,
    percent,
    reached,
    etaDate,
    weeksToGo,
  };
}

const FAT_CALORIE_SHARE = 0.25;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

export type MacroTargets = {
  proteinG: number;
  fatG: number;
  carbsG: number;
};

/**
 * Suggested macro split from bodyweight, calorie target, and goal (deficit vs
 * surplus). Protein scales with the goal to protect muscle in a cut and
 * support growth in a bulk; fat is a fixed share of calories; carbs fill the
 * remainder. Not stored — recomputed whenever inputs change.
 */
/**
 * A rough, motivational "metabolic age" estimate (not medical). Starts from
 * real age and shifts it by body composition and activity: leaner + more
 * active reads younger, higher body fat / BMI + sedentary reads older. Uses
 * body-fat % when available, otherwise BMI.
 */
/**
 * Metabolic age the way body-composition scales (Tanita / InBody) and online
 * calculators frame it: your resting metabolism vs. a healthy reference for
 * your height. Resting metabolism is driven by lean (fat-free) mass, so when
 * body fat is known we compare your lean mass to a healthy reference and add a
 * small penalty for excess fat — more muscle / leaner reads younger, less
 * muscle / more fat reads older. Without body fat we fall back to BMI, which is
 * what most weight-only calculators use. Motivational, not a medical metric.
 */
export function computeMetabolicAge(params: {
  ageYears: number;
  gender: Gender;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPercent: number | null;
  activity: ActivityLevel | null;
}): number | null {
  const { ageYears, gender, weightKg, heightCm, bodyFatPercent, activity } = params;
  if (!ageYears || !weightKg || !heightCm) return null;

  const refWeight = 22 * (heightCm / 100) ** 2; // healthy-BMI weight for this height
  let adj = 0;

  if (bodyFatPercent != null) {
    const refBF = gender === 'female' ? 23 : 15; // healthy reference body fat %
    const yourLeanKg = weightKg * (1 - bodyFatPercent / 100);
    const refLeanKg = refWeight * (1 - refBF / 100);
    adj += (refLeanKg - yourLeanKg) * 1.5; // ~1.5 yrs per kg of lean mass below reference
    adj += (bodyFatPercent - refBF) * 0.4; // ~0.4 yrs per % body fat over reference
  } else {
    const bmi = weightKg / (heightCm / 100) ** 2;
    adj += (bmi - 22) * 0.7; // ~0.7 yrs per BMI point over 22
  }

  adj +=
    activity === 'very_active' ? -2 : activity === 'moderate' ? -1 : activity === 'sedentary' ? 2 : 0;

  // Keep it within a believable band rather than producing alarming extremes.
  const bounded = Math.max(ageYears - 12, Math.min(ageYears + 18, ageYears + adj));
  return Math.max(15, Math.round(bounded));
}

export function computeSuggestedMacros(params: {
  weightKg: number;
  calorieTarget: number;
  deficitKcal: number;
}): MacroTargets {
  const { weightKg, calorieTarget, deficitKcal } = params;

  const proteinPerKg = deficitKcal > 0 ? 2.0 : deficitKcal < 0 ? 1.6 : 1.8;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatG = Math.round((calorieTarget * FAT_CALORIE_SHARE) / KCAL_PER_G_FAT);
  const remainingKcal = Math.max(
    0,
    calorieTarget - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT,
  );
  const carbsG = Math.round(remainingKcal / KCAL_PER_G_CARB);

  return { proteinG, fatG, carbsG };
}
