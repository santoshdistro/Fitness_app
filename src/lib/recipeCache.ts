// Caches AI-generated recipes locally so re-opening the same planned meal
// doesn't spend AI credit again. Keyed by the meal name + its macros, so a
// meaningfully different meal still generates fresh.
import type { RecipeResult } from './aiClient';

const PREFIX = 'recipe_cache:';

function keyFor(mealName: string, cal: number, p: number, c: number, f: number): string {
  return (
    PREFIX +
    [mealName.toLowerCase().trim(), Math.round(cal), Math.round(p), Math.round(c), Math.round(f)].join('|')
  );
}

export function getCachedRecipe(
  mealName: string,
  cal: number,
  p: number,
  c: number,
  f: number,
): RecipeResult | null {
  try {
    const raw = localStorage.getItem(keyFor(mealName, cal, p, c, f));
    return raw ? (JSON.parse(raw) as RecipeResult) : null;
  } catch {
    return null;
  }
}

export function setCachedRecipe(
  mealName: string,
  cal: number,
  p: number,
  c: number,
  f: number,
  recipe: RecipeResult,
): void {
  try {
    localStorage.setItem(keyFor(mealName, cal, p, c, f), JSON.stringify(recipe));
  } catch {
    /* ignore quota / private mode */
  }
}
