import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { searchFoods, type FoodSearchResult } from '../../lib/usdaFoodApi';
import { useFoodSuggestions, type FoodSuggestion } from '../../hooks/useFoodSuggestions';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../../utils/mealCategory';
import type { MealCategory } from '../../types/database';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

type PerGramMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
};

export function MealForm({ onSaved }: Props) {
  const { session } = useAuth();
  const { recent, frequent } = useFoodSuggestions();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [servingNote, setServingNote] = useState<string | null>(null);
  const [perGram, setPerGram] = useState<PerGramMacros | null>(null);
  const [grams, setGrams] = useState('100');

  const [mealName, setMealName] = useState('');
  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResults(await searchFoods(query.trim()));
    } catch {
      setSearchError("Couldn't reach the food database. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(result: FoodSearchResult) {
    setMealName(result.description);
    setResults([]);
    setQuery('');

    if (result.isPerServing) {
      setPerGram(null);
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

    setPerGram({
      calories: result.calories / 100,
      protein: result.protein / 100,
      carbs: result.carbs / 100,
      fat: result.fat / 100,
      fiber: result.fiber / 100,
      sodium: result.sodium / 100,
    });
    setGrams('100');
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
    const gramsNum = Number(value) || 0;
    setCalories(String(Math.round(perGram.calories * gramsNum)));
    setProtein(String(Math.round(perGram.protein * gramsNum)));
    setCarbs(String(Math.round(perGram.carbs * gramsNum)));
    setFat(String(Math.round(perGram.fat * gramsNum)));
    setFiber(String(Math.round(perGram.fiber * gramsNum)));
    setSodium(String(Math.round(perGram.sodium * gramsNum)));
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
          Search food database
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
            placeholder="e.g. chicken breast"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            aria-label="Search"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            <Search size={18} />
          </button>
        </div>

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
              Amount (g)
            </label>
            <input
              id="grams-input"
              className={inputClass}
              type="number"
              inputMode="numeric"
              min="0"
              value={grams}
              onChange={e => handleGramsChange(e.target.value)}
            />
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
