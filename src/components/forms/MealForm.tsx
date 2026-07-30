import { useState, type FormEvent } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { searchFoods, type FoodSearchResult } from '../../lib/usdaFoodApi';
import { searchOpenFoodFacts } from '../../lib/openFoodFacts';
import { searchIndianFoods } from '../../data/indianFoods';
import { estimateFood } from '../../lib/aiClient';
import { useFoodSuggestions, type FoodSuggestion } from '../../hooks/useFoodSuggestions';
import { useSettings } from '../../hooks/useSettings';
import { gToUnit, unitToG } from '../../utils/units';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../../utils/mealCategory';
import type { MealCategory } from '../../types/database';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

export type MealInitial = {
  mealName?: string;
  category?: MealCategory;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  sodium?: string;
  servingNote?: string;
};

type Props = {
  onSaved: () => void;
  initial?: MealInitial;
};

type PerGramMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
};

/** The per-single-portion macros, used to scale by a quantity multiplier. */
function baseFromInitial(initial?: MealInitial): PerGramMacros | null {
  if (!initial?.calories) return null;
  return {
    calories: Number(initial.calories) || 0,
    protein: Number(initial.protein) || 0,
    carbs: Number(initial.carbs) || 0,
    fat: Number(initial.fat) || 0,
    fiber: Number(initial.fiber) || 0,
    sodium: Number(initial.sodium) || 0,
  };
}

export function MealForm({ onSaved, initial }: Props) {
  const { session } = useAuth();
  const { recent, frequent } = useFoodSuggestions();
  const { settings } = useSettings();
  const foodUnit = settings.foodUnit;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [servingNote, setServingNote] = useState<string | null>(initial?.servingNote ?? null);
  const [perGram, setPerGram] = useState<PerGramMacros | null>(null);
  const [grams, setGrams] = useState('100');
  // Per-portion base (a single serving / scanned plate) + a quantity multiplier.
  const [perServing, setPerServing] = useState<PerGramMacros | null>(() => baseFromInitial(initial));
  const [servings, setServings] = useState('1');

  const [mealName, setMealName] = useState(initial?.mealName ?? '');
  const [category, setCategory] = useState<MealCategory>(initial?.category ?? defaultMealCategoryForNow());
  const [calories, setCalories] = useState(initial?.calories ?? '');
  const [protein, setProtein] = useState(initial?.protein ?? '');
  const [carbs, setCarbs] = useState(initial?.carbs ?? '');
  const [fat, setFat] = useState(initial?.fat ?? '');
  const [fiber, setFiber] = useState(initial?.fiber ?? '');
  const [sodium, setSodium] = useState(initial?.sodium ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    // Query the global (Open Food Facts) and US (USDA) databases together, so
    // one failing or being sparse doesn't block the other.
    const indian = searchIndianFoods(query.trim());
    const [off, usda] = await Promise.allSettled([
      searchOpenFoodFacts(query.trim()),
      searchFoods(query.trim()),
    ]);
    const merged = [
      ...indian,
      ...(off.status === 'fulfilled' ? off.value : []),
      ...(usda.status === 'fulfilled' ? usda.value : []),
    ];
    setResults(merged);
    if (merged.length === 0) {
      setSearchError('No match in the databases — tap ✨ to estimate it with AI instead.');
    }
    setSearching(false);
  }

  async function handleAiEstimate() {
    if (!query.trim() || !session?.user) return;
    setEstimating(true);
    setSearchError(null);
    try {
      const r = await estimateFood(session.user.id, query.trim());
      setMealName(r.name);
      setResults([]);
      setQuery('');
      setPerGram(null);
      setPerServing({
        calories: r.calories,
        protein: r.protein_g,
        carbs: r.carbs_g,
        fat: r.fat_g,
        fiber: r.fiber_g,
        sodium: r.sodium_mg,
      });
      setServings('1');
      setCalories(String(r.calories));
      setProtein(String(r.protein_g));
      setCarbs(String(r.carbs_g));
      setFat(String(r.fat_g));
      setFiber(String(r.fiber_g));
      setSodium(String(r.sodium_mg));
      setServingNote(`AI estimate (${r.confidence} confidence) · adjust quantity below`);
    } catch {
      setSearchError('Could not estimate that. Try adding a portion, e.g. "aloo methi 1 bowl".');
    } finally {
      setEstimating(false);
    }
  }

  function selectResult(result: FoodSearchResult) {
    setMealName(result.description);
    setResults([]);
    setQuery('');

    if (result.isPerServing) {
      setPerGram(null);
      setPerServing({
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        sodium: result.sodium,
      });
      setServings('1');
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(String(result.carbs));
      setFat(String(result.fat));
      setFiber(String(result.fiber));
      setSodium(String(result.sodium));
      setServingNote(
        result.servingSize ? `Per serving (${result.servingSize}${result.servingSizeUnit ?? ''})` : 'Per serving',
      );
      return;
    }

    setPerServing(null);
    setPerGram({
      calories: result.calories / 100,
      protein: result.protein / 100,
      carbs: result.carbs / 100,
      fat: result.fat / 100,
      fiber: result.fiber / 100,
      sodium: result.sodium / 100,
    });
    setGrams(String(Math.round(gToUnit(100, foodUnit) * 10) / 10));
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    setCarbs(String(result.carbs));
    setFat(String(result.fat));
    setFiber(String(result.fiber));
    setSodium(String(result.sodium));
    setServingNote('Per 100g');
  }

  function selectSuggestion(suggestion: FoodSuggestion) {
    setMealName(suggestion.mealName);
    setCategory(suggestion.category);
    setPerGram(null);
    setPerServing(null);
    setServingNote(null);
    setResults([]);
    setQuery('');
    setCalories(suggestion.calories != null ? String(suggestion.calories) : '');
    setProtein(suggestion.protein_g != null ? String(suggestion.protein_g) : '');
    setCarbs(suggestion.carbs_g != null ? String(suggestion.carbs_g) : '');
    setFat(suggestion.fat_g != null ? String(suggestion.fat_g) : '');
    setFiber(suggestion.fiber_g != null ? String(suggestion.fiber_g) : '');
    setSodium(suggestion.sodium_mg != null ? String(suggestion.sodium_mg) : '');
  }

  function handleGramsChange(value: string) {
    setGrams(value);
    if (!perGram) return;
    const gramsNum = unitToG(Number(value) || 0, foodUnit);
    setCalories(String(Math.round(perGram.calories * gramsNum)));
    setProtein(String(Math.round(perGram.protein * gramsNum)));
    setCarbs(String(Math.round(perGram.carbs * gramsNum)));
    setFat(String(Math.round(perGram.fat * gramsNum)));
    setFiber(String(Math.round(perGram.fiber * gramsNum)));
    setSodium(String(Math.round(perGram.sodium * gramsNum)));
  }

  function handleServingsChange(value: string) {
    setServings(value);
    if (!perServing) return;
    const q = Number(value) || 0;
    setCalories(String(Math.round(perServing.calories * q)));
    setProtein(String(Math.round(perServing.protein * q)));
    setCarbs(String(Math.round(perServing.carbs * q)));
    setFat(String(Math.round(perServing.fat * q)));
    setFiber(String(Math.round(perServing.fiber * q)));
    setSodium(String(Math.round(perServing.sodium * q)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: mealName,
      meal_category: category,
      calories: calories ? Number(calories) : null,
      protein_g: protein ? Number(protein) : null,
      carbs_g: carbs ? Number(carbs) : null,
      fat_g: fat ? Number(fat) : null,
      fiber_g: fiber ? Number(fiber) : null,
      sodium_mg: sodium ? Number(sodium) : null,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <div>
      {frequent.length > 0 ? (
        <div className="mb-3">
          <p className={labelClass}>Frequent</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {frequent.map(suggestion => (
              <button
                key={suggestion.key}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-[var(--text)]"
              >
                {suggestion.mealName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="mb-4">
          <p className={labelClass}>Recent</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {recent.map(suggestion => (
              <button
                key={suggestion.key}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-[var(--text)]"
              >
                {suggestion.mealName}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <label className={labelClass} htmlFor="food-search-input">
          Search or estimate a food
        </label>
        <div className="flex gap-2">
          <input
            id="food-search-input"
            className={inputClass}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="e.g. aloo methi 1 bowl"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || estimating || !query.trim()}
            aria-label="Search database"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)] disabled:opacity-40"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={handleAiEstimate}
            disabled={searching || estimating || !query.trim()}
            aria-label="Estimate with AI"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            {estimating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Sparkles size={18} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">
          🔍 searches the food database · ✨ estimates any dish with AI (great for home-cooked &
          regional foods).
        </p>

        {searchError ? <p className={`mt-2 ${errorTextClass}`}>{searchError}</p> : null}

        {results.length > 0 ? (
          <ul className="glass-card mt-2 max-h-48 overflow-y-auto !rounded-2xl">
            {results.map(result => (
              <li key={result.fdcId}>
                <button
                  type="button"
                  onClick={() => selectResult(result)}
                  className="flex w-full flex-col items-start border-b border-[var(--card-border)] px-4 py-2.5 text-left last:border-b-0"
                >
                  <span className="text-sm text-[var(--text)]">{result.description}</span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {result.brandOwner ? `${result.brandOwner} · ` : ''}
                    {result.calories} kcal {result.isPerServing ? 'per serving' : 'per 100g'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form onSubmit={handleSubmit}>
        <label className={labelClass} htmlFor="meal-name-input">
          Meal name
        </label>
        <input
          id="meal-name-input"
          className={inputClass}
          style={{ marginBottom: '0.75rem' }}
          type="text"
          value={mealName}
          onChange={e => setMealName(e.target.value)}
          placeholder="e.g. Chicken & rice"
          required
        />

        <div className="mb-3">
          <label className={labelClass} htmlFor="meal-category-input">
            Meal
          </label>
          <select
            id="meal-category-input"
            className={inputClass}
            value={category}
            onChange={e => setCategory(e.target.value as MealCategory)}
          >
            {MEAL_CATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {servingNote ? (
          <p className="mb-3 text-xs text-[var(--muted)]">{servingNote}</p>
        ) : null}

        {perGram ? (
          <div className="mb-3">
            <label className={labelClass} htmlFor="grams-input">
              Amount ({foodUnit})
            </label>
            <input
              id="grams-input"
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={grams}
              onChange={e => handleGramsChange(e.target.value)}
            />
          </div>
        ) : perServing ? (
          <div className="mb-3">
            <label className={labelClass} htmlFor="servings-input">
              Quantity / portions
            </label>
            <input
              id="servings-input"
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={servings}
              onChange={e => handleServingsChange(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              e.g. 2 for two scoops / pieces, 0.5 for half. For a per-100g food, use
              0.3 for 30g.
            </p>
          </div>
        ) : null}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="calories-input">
              Calories
            </label>
            <input
              id="calories-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="protein-input">
              Protein (g)
            </label>
            <input
              id="protein-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={protein}
              onChange={e => setProtein(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="carbs-input">
              Carbs (g) - optional
            </label>
            <input
              id="carbs-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="fat-input">
              Fat (g) - optional
            </label>
            <input
              id="fat-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={fat}
              onChange={e => setFat(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="fiber-input">
              Fiber (g) - optional
            </label>
            <input
              id="fiber-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={fiber}
              onChange={e => setFiber(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sodium-input">
              Sodium (mg) - optional
            </label>
            <input
              id="sodium-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={sodium}
              onChange={e => setSodium(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className={errorTextClass}>{error}</p> : null}
        <button
          type="submit"
          disabled={saving || !mealName || !calories || !protein}
          className={submitButtonClass}
        >
          {saving ? 'Saving...' : 'Add meal'}
        </button>
      </form>
    </div>
  );
}
