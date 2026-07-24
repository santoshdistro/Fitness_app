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
