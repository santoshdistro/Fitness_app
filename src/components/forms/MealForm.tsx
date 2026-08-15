import { useState, type FormEvent } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { insertFoodLog } from '../../lib/foodLog';
import { useAuth } from '../../contexts/AuthContext';
import { searchFoods, type FoodSearchResult } from '../../lib/usdaFoodApi';
import { searchOpenFoodFacts } from '../../lib/openFoodFacts';
import { searchIndianFoods } from '../../data/indianFoods';
import { estimateFood } from '../../lib/aiClient';
import { useFoodSuggestions, searchMyFoods, suggestionToSearchResult, type FoodSuggestion } from '../../hooks/useFoodSuggestions';
import { useSettings } from '../../hooks/useSettings';
import { gToUnit, unitToG, parseServing } from '../../utils/units';
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
  sugar?: string;
  satFat?: string;
  monoFat?: string;
  polyFat?: string;
  transFat?: string;
  servingNote?: string;
  /** The macros above are per 100 g/ml (e.g. from a barcode label). */
  per100?: boolean;
  /** Grams or millilitres in one labelled serving, when known. */
  servingSize?: number;
  /** Unit of that serving. */
  servingUnit?: 'g' | 'ml';
};

/** Macros per one gram (or ml) — the canonical base everything scales from. */
type Base = { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };

type AmountUnit = 'g' | 'ml' | 'serving';

type FoodBase = {
  perGram: Base;
  /** Grams/ml in one serving, if known (enables the "serving" unit). */
  servingGrams: number | null;
  /** Liquid product — enables the "ml" unit. */
  isLiquid: boolean;
  /** We know a real gram relationship (enables g / ml entry). */
  weighable: boolean;
};

// Detailed sub-nutrients (sugar + fat breakdown) for the selected/base food,
// kept per base unit so we can scale them by the same ratio as the macros.
type DetailBase = {
  baseCalories: number;
  sugar: number;
  satFat: number;
  monoFat: number;
  polyFat: number;
  transFat: number;
};

function n(v?: string): number {
  return Number(v) || 0;
}

function divBase(b: Base, d: number): Base {
  const f = d || 1;
  return {
    calories: b.calories / f,
    protein: b.protein / f,
    carbs: b.carbs / f,
    fat: b.fat / f,
    fiber: b.fiber / f,
    sodium: b.sodium / f,
  };
}

function detailFromInitial(initial?: MealInitial): DetailBase | null {
  if (!initial?.calories) return null;
  if (!initial.sugar && !initial.satFat && !initial.monoFat && !initial.polyFat && !initial.transFat)
    return null;
  return {
    baseCalories: n(initial.calories),
    sugar: n(initial.sugar),
    satFat: n(initial.satFat),
    monoFat: n(initial.monoFat),
    polyFat: n(initial.polyFat),
    transFat: n(initial.transFat),
  };
}

function detailFromResult(result: FoodSearchResult): DetailBase {
  return {
    baseCalories: result.calories,
    sugar: result.sugar,
    satFat: result.satFat,
    monoFat: result.monoFat,
    polyFat: result.polyFat,
    transFat: result.transFat,
  };
}

// Build the canonical per-gram base from an initial payload (barcode, food scan,
// AI estimate). per100 payloads are divided by 100; otherwise the macros are one
// serving (grams unknown → treated per 100 for scaling, editable below).
function baseFromInitial(initial?: MealInitial): FoodBase | null {
  if (!initial?.calories) return null;
  const vals: Base = {
    calories: n(initial.calories),
    protein: n(initial.protein),
    carbs: n(initial.carbs),
    fat: n(initial.fat),
    fiber: n(initial.fiber),
    sodium: n(initial.sodium),
  };
  const isLiquid = initial.servingUnit === 'ml';
  if (initial.per100) {
    return {
      perGram: divBase(vals, 100),
      servingGrams: initial.servingSize ?? null,
      isLiquid,
      weighable: true,
    };
  }
  const sg = initial.servingSize ?? null;
  return {
    perGram: divBase(vals, sg ?? 100),
    servingGrams: sg,
    isLiquid,
    weighable: sg != null,
  };
}

type Props = {
  onSaved: () => void;
  initial?: MealInitial;
};

// Which amount units are offered for a food, and the sensible default.
function unitsFor(food: FoodBase): { units: AmountUnit[]; defaultUnit: AmountUnit } {
  const units: AmountUnit[] = [];
  if (food.weighable && food.isLiquid) units.push('ml');
  if (food.weighable) units.push('g');
  if (food.servingGrams != null) units.push('serving');
  if (units.length === 0) units.push('serving');
  const defaultUnit: AmountUnit = food.servingGrams != null ? 'serving' : units[0];
  return { units, defaultUnit };
}

// Grams represented by an amount in a unit (pure — no component state).
function gramsOfBase(amountVal: string, u: AmountUnit, f: FoodBase, foodUnit: 'g' | 'oz'): number {
  const a = Number(amountVal) || 0;
  if (u === 'serving') return a * (f.servingGrams ?? 100);
  if (u === 'ml') return a; // density ~1 g/ml
  return unitToG(a, foodUnit);
}

function macroStrings(f: FoodBase, grams: number) {
  return {
    calories: String(Math.round(f.perGram.calories * grams)),
    protein: String(Math.round(f.perGram.protein * grams)),
    carbs: String(Math.round(f.perGram.carbs * grams)),
    fat: String(Math.round(f.perGram.fat * grams)),
    fiber: String(Math.round(f.perGram.fiber * grams)),
    sodium: String(Math.round(f.perGram.sodium * grams)),
  };
}

function defaultAmountFor(f: FoodBase, u: AmountUnit, foodUnit: 'g' | 'oz'): string {
  if (u === 'serving') return '1';
  if (u === 'ml') return String(f.servingGrams ?? 100);
  return String(Math.round(gToUnit(100, foodUnit) * 10) / 10);
}

export function MealForm({ onSaved, initial }: Props) {
  const { session } = useAuth();
  const { recent, frequent, all: myFoods } = useFoodSuggestions();
  const { settings } = useSettings();
  const foodUnit = settings.foodUnit;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [servingNote, setServingNote] = useState<string | null>(initial?.servingNote ?? null);
  const [detailBase, setDetailBase] = useState<DetailBase | null>(() => detailFromInitial(initial));

  // Canonical per-gram base + the chosen amount and unit, seeded from `initial`
  // so the macros shown match the default amount (e.g. one 200ml serving), not
  // the raw per-100 values.
  const initialFood = baseFromInitial(initial);
  const initialUnits = initialFood ? unitsFor(initialFood) : null;
  const initialAmount =
    initialFood && initialUnits ? defaultAmountFor(initialFood, initialUnits.defaultUnit, foodUnit) : '1';
  const initialMacros =
    initialFood && initialUnits
      ? macroStrings(initialFood, gramsOfBase(initialAmount, initialUnits.defaultUnit, initialFood, foodUnit))
      : null;

  const [food, setFood] = useState<FoodBase | null>(initialFood);
  const [units, setUnits] = useState<AmountUnit[]>(initialUnits?.units ?? ['serving']);
  const [unit, setUnit] = useState<AmountUnit>(initialUnits?.defaultUnit ?? 'serving');
  const [amount, setAmount] = useState(initialAmount);

  const [mealName, setMealName] = useState(initial?.mealName ?? '');
  const [category, setCategory] = useState<MealCategory>(initial?.category ?? defaultMealCategoryForNow());
  const [calories, setCalories] = useState(initialMacros?.calories ?? initial?.calories ?? '');
  const [protein, setProtein] = useState(initialMacros?.protein ?? initial?.protein ?? '');
  const [carbs, setCarbs] = useState(initialMacros?.carbs ?? initial?.carbs ?? '');
  const [fat, setFat] = useState(initialMacros?.fat ?? initial?.fat ?? '');
  const [fiber, setFiber] = useState(initialMacros?.fiber ?? initial?.fiber ?? '');
  const [sodium, setSodium] = useState(initialMacros?.sodium ?? initial?.sodium ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myMatches = query.trim() ? searchMyFoods(myFoods, query.trim()).map(suggestionToSearchResult) : [];

  // Push the macro inputs from a per-gram base × grams.
  function writeMacros(f: FoodBase, grams: number) {
    const m = macroStrings(f, grams);
    setCalories(m.calories);
    setProtein(m.protein);
    setCarbs(m.carbs);
    setFat(m.fat);
    setFiber(m.fiber);
    setSodium(m.sodium);
  }

  // Adopt a food base: set units, default unit/amount, and initial macros.
  function applyFood(f: FoodBase, note: string | null) {
    const { units: u, defaultUnit } = unitsFor(f);
    const startAmount = defaultAmountFor(f, defaultUnit, foodUnit);
    setFood(f);
    setUnits(u);
    setUnit(defaultUnit);
    setAmount(startAmount);
    writeMacros(f, gramsOfBase(startAmount, defaultUnit, f, foodUnit));
    setServingNote(note);
  }

  function onAmountChange(value: string) {
    setAmount(value);
    if (food) writeMacros(food, gramsOfBase(value, unit, food, foodUnit));
  }

  function onUnitChange(nextUnit: AmountUnit) {
    if (!food) return;
    // Keep the same real portion when switching units.
    const grams = gramsOfBase(amount, unit, food, foodUnit);
    let nextAmount: string;
    if (nextUnit === 'serving') nextAmount = String(Math.round((grams / (food.servingGrams ?? 100)) * 100) / 100);
    else if (nextUnit === 'ml') nextAmount = String(Math.round(grams * 10) / 10);
    else nextAmount = String(Math.round(gToUnit(grams, foodUnit) * 10) / 10);
    setUnit(nextUnit);
    setAmount(nextAmount);
    writeMacros(food, grams);
  }

  function onServingGramsChange(value: string) {
    if (!food) return;
    const sg = Number(value) || null;
    const next = { ...food, servingGrams: sg, weighable: food.weighable || sg != null };
    setFood(next);
    if (unit === 'serving') writeMacros(next, gramsOfBase(amount, 'serving', next, foodUnit));
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
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
      setDetailBase(null);
      applyFood(
        {
          perGram: divBase(
            { calories: r.calories, protein: r.protein_g, carbs: r.carbs_g, fat: r.fat_g, fiber: r.fiber_g, sodium: r.sodium_mg },
            100,
          ),
          servingGrams: null,
          isLiquid: false,
          weighable: false,
        },
        `AI estimate (${r.confidence} confidence) · set how many portions below`,
      );
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
    setDetailBase(detailFromResult(result));

    const vals: Base = {
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      sodium: result.sodium,
    };
    const parsed = parseServing(
      result.servingSizeUnit === 'serving' ? undefined : result.servingSize,
    );
    const unitLiquid = result.servingSizeUnit
      ? /ml|l/i.test(result.servingSizeUnit)
      : parsed?.unit === 'ml';

    if (result.isPerServing) {
      if (parsed) {
        applyFood(
          { perGram: divBase(vals, parsed.size), servingGrams: parsed.size, isLiquid: unitLiquid, weighable: true },
          `Per serving (${parsed.size}${parsed.unit})`,
        );
      } else {
        // Serving of unknown weight — treat the values as one portion.
        applyFood(
          { perGram: divBase(vals, 100), servingGrams: null, isLiquid: false, weighable: false },
          'Per serving · set how many portions',
        );
      }
      return;
    }

    // Values are per 100 g/ml.
    applyFood(
      {
        perGram: divBase(vals, 100),
        servingGrams: parsed?.size ?? null,
        isLiquid: parsed?.unit === 'ml',
        weighable: true,
      },
      parsed ? `Per 100${parsed.unit === 'ml' ? 'ml' : 'g'} · 1 serving = ${parsed.size}${parsed.unit}` : 'Per 100g',
    );
  }

  function selectSuggestion(suggestion: FoodSuggestion) {
    setMealName(suggestion.mealName);
    setCategory(suggestion.category);
    setDetailBase(null);
    setResults([]);
    setQuery('');
    applyFood(
      {
        perGram: divBase(
          {
            calories: suggestion.calories ?? 0,
            protein: suggestion.protein_g ?? 0,
            carbs: suggestion.carbs_g ?? 0,
            fat: suggestion.fat_g ?? 0,
            fiber: suggestion.fiber_g ?? 0,
            sodium: suggestion.sodium_mg ?? 0,
          },
          100,
        ),
        servingGrams: null,
        isLiquid: false,
        weighable: false,
      },
      'Saved food · set how many portions you had',
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const finalCalories = calories ? Number(calories) : 0;
    const ratio =
      detailBase && detailBase.baseCalories > 0 ? finalCalories / detailBase.baseCalories : null;
    const scale = (v: number) => (ratio != null ? Math.round(v * ratio * 10) / 10 : null);

    const { error: saveError } = await insertFoodLog({
      user_id: session.user.id,
      meal_name: mealName,
      meal_category: category,
      calories: calories ? Number(calories) : null,
      protein_g: protein ? Number(protein) : null,
      carbs_g: carbs ? Number(carbs) : null,
      fat_g: fat ? Number(fat) : null,
      fiber_g: fiber ? Number(fiber) : null,
      sodium_mg: sodium ? Number(sodium) : null,
      sugar_g: detailBase ? scale(detailBase.sugar) : null,
      saturated_fat_g: detailBase ? scale(detailBase.satFat) : null,
      mono_fat_g: detailBase ? scale(detailBase.monoFat) : null,
      poly_fat_g: detailBase ? scale(detailBase.polyFat) : null,
      trans_fat_g: detailBase ? scale(detailBase.transFat) : null,
      amount: amount ? Number(amount) : null,
      unit,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  const unitLabel = (u: AmountUnit) => (u === 'serving' ? 'serving' : u);

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

        {myMatches.length > 0 ? (
          <div className="mt-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Your foods
            </p>
            <ul className="glass-card max-h-40 overflow-y-auto !rounded-2xl">
              {myMatches.map(result => (
                <li key={result.fdcId}>
                  <button
                    type="button"
                    onClick={() => selectResult(result)}
                    className="flex w-full flex-col items-start border-b border-[var(--card-border)] px-4 py-2.5 text-left last:border-b-0"
                  >
                    <span className="text-sm text-[var(--text)]">{result.description}</span>
                    <span className="text-[10px] text-[var(--muted)]">
                      Saved · {result.calories} kcal per serving
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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

        {servingNote ? <p className="mb-2 text-xs text-[var(--muted)]">{servingNote}</p> : null}

        {/* Amount + unit — macros below update automatically */}
        {food ? (
          <div className="mb-3">
            <label className={labelClass} htmlFor="amount-input">
              Amount
            </label>
            <div className="flex gap-2">
              <input
                id="amount-input"
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={e => onAmountChange(e.target.value)}
              />
              {units.length > 1 ? (
                <div className="flex shrink-0 rounded-2xl bg-[var(--bg)] p-1">
                  {units.map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => onUnitChange(u)}
                      className="rounded-xl px-3 text-xs font-bold"
                      style={
                        unit === u
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { color: 'var(--muted)' }
                      }
                    >
                      {u === 'g' ? foodUnit : unitLabel(u)}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="flex shrink-0 items-center px-2 text-xs font-semibold text-[var(--muted)]">
                  {unit === 'g' ? foodUnit : `${unitLabel(unit)}${Number(amount) === 1 ? '' : 's'}`}
                </span>
              )}
            </div>
            {unit === 'serving' ? (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <span>1 serving =</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="any"
                  value={food.servingGrams ?? ''}
                  onChange={e => onServingGramsChange(e.target.value)}
                  className="w-16 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1 text-xs text-[var(--text)]"
                />
                <span>{food.isLiquid ? 'ml' : 'g'} · use 2 for two, 0.5 for half.</span>
              </div>
            ) : null}
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
              inputMode="decimal"
              min="0"
              step="any"
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
              inputMode="decimal"
              min="0"
              step="any"
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
              inputMode="decimal"
              min="0"
              step="any"
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
              inputMode="decimal"
              min="0"
              step="any"
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
              inputMode="decimal"
              min="0"
              step="any"
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
              inputMode="decimal"
              min="0"
              step="any"
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
