import type { MealCategory } from '../types/database';

export const MEAL_CATEGORY_OPTIONS: { value: MealCategory; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'evening_snack', label: 'Evening snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'other', label: 'Other' },
];

/** Best-guess meal category from the current time of day, as a sensible form default. */
export function defaultMealCategoryForNow(now = new Date()): MealCategory {
  const hour = now.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'evening_snack';
  if (hour < 22) return 'dinner';
  return 'snack';
}
