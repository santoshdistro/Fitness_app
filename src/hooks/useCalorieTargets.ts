import { useProfile } from './useProfile';
import { useRecentDailyLogs } from './useRecentDailyLogs';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
  computeTDEE,
} from '../utils/calculations';

const REFERENCE_CALORIE_TARGET = 2000;

// Resolves the user's daily calorie and protein targets the same way the Home
// screen does: manual override if set, otherwise Mifflin-St Jeor → TDEE → goal.
export function useCalorieTargets() {
  const { profile } = useProfile();
  const { logs } = useRecentDailyLogs(30);

  const weightEntries = logs.filter((l): l is typeof l & { weight: number } => l.weight != null);
  const latestWeight = weightEntries[weightEntries.length - 1]?.weight ?? null;

  const deficitKcal = profile?.calorie_deficit_kcal ?? 500;
  const canComputeTarget = Boolean(
    profile?.gender && profile?.height && profile?.birth_date && latestWeight,
  );
  const calorieTarget =
    profile?.calorie_target_override ??
    (canComputeTarget
      ? computeDailyCalorieTarget({
          tdee: computeTDEE(
            computeBMR({
              gender: profile!.gender!,
              weightKg: latestWeight!,
              heightCm: profile!.height!,
              ageYears: ageFromBirthDate(profile!.birth_date!),
            }),
            profile!.activity_level,
          ),
          deficitKcal,
        })
      : REFERENCE_CALORIE_TARGET);
  const suggestedMacros = canComputeTarget
    ? computeSuggestedMacros({ weightKg: latestWeight!, calorieTarget, deficitKcal })
    : null;
  const proteinTarget =
    profile?.protein_target_g ?? suggestedMacros?.proteinG ?? Math.round((calorieTarget * 0.3) / 4);
  const carbTarget = suggestedMacros?.carbsG ?? null;
  const fatTarget = suggestedMacros?.fatG ?? null;

  return { calorieTarget, proteinTarget, carbTarget, fatTarget, hasProfileTarget: canComputeTarget };
}
