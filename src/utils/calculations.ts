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

const DEFAULT_DEFICIT_KCAL = 500;

/** Daily Calorie Target = BMR + Active Calories - Deficit. */
export function computeDailyCalorieTarget(params: {
  bmr: number;
  activeCalories: number;
  deficitKcal?: number;
}): number {
  const { bmr, activeCalories, deficitKcal = DEFAULT_DEFICIT_KCAL } = params;
  return Math.round(bmr + activeCalories - deficitKcal);
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
