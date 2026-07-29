import { useMemo, useState } from 'react';
import { Plus, Search, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useProfile } from '../hooks/useProfile';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { searchFoods, type FoodSearchResult } from '../lib/usdaFoodApi';
import { searchOpenFoodFacts } from '../lib/openFoodFacts';
import { searchIndianFoods } from '../data/indianFoods';
import { estimateFood } from '../lib/aiClient';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../utils/mealCategory';
import type { NutritionTotals } from '../hooks/useTodayNutrition';
import { useSettings } from '../hooks/useSettings';
import { gToUnit, unitToG } from '../utils/units';
import { todayDateString } from '../utils/date';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
  computeTDEE,
} from '../utils/calculations';
import type { FoodLog, MealCategory } from '../types/database';
import { inputClass, labelClass } from '../components/forms/formStyles';

type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
  transFat: number;
  polyFat: number;
  monoFat: number;
};

type Item = Macros & {
  key: string;
  name: string;
  grams: number;
  per: Macros;
};

type Tab = 'add' | 'nutrition' | 'macros';

function scaled(per: Macros, grams: number): Macros {
  return {
    calories: Math.round(per.calories * grams),
    protein: Math.round(per.protein * grams),
    carbs: Math.round(per.carbs * grams),
    fat: Math.round(per.fat * grams),
    fiber: Math.round(per.fiber * grams),
    sodium: Math.round(per.sodium * grams),
    sugar: Math.round(per.sugar * grams),
    satFat: Math.round(per.satFat * grams),
    transFat: Math.round(per.transFat * grams),
    polyFat: Math.round(per.polyFat * grams),
    monoFat: Math.round(per.monoFat * grams),
  };
}

const REFERENCE_CALORIE_TARGET = 2000;

export function DiscoverScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('add');
  const { handlers, change, animClass } = useTabSwipe(
    ['add', 'nutrition', 'macros'] as const,
    tab,
    setTab,
  );
  const today = todayDateString();
  const { totals: dayTotals, meals, refresh: refreshNutrition } = useTodayNutrition(today);
  const { profile } = useProfile();
  const { logs: recentLogs } = useRecentDailyLogs(14);
  const { settings } = useSettings();
  const foodUnit = settings.foodUnit;

  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  // Personalised targets (mirrors the Stats screen).
  const weightEntries = recentLogs.filter((l): l is typeof l & { weight: number } => l.weight != null);
  const latestWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].weight : null;
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
  const proteinTarget = profile?.protein_target_g ?? suggestedMacros?.proteinG ?? null;

  const totals = useMemo(
    () =>
      items.reduce<Macros>(
        (acc, i) => ({
          calories: acc.calories + i.calories,
          protein: acc.protein + i.protein,
          carbs: acc.carbs + i.carbs,
          fat: acc.fat + i.fat,
          fiber: acc.fiber + i.fiber,
          sodium: acc.sodium + i.sodium,
          sugar: acc.sugar + i.sugar,
          satFat: acc.satFat + i.satFat,
          transFat: acc.transFat + i.transFat,
          polyFat: acc.polyFat + i.polyFat,
          monoFat: acc.monoFat + i.monoFat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, satFat: 0, transFat: 0, polyFat: 0, monoFat: 0 },
      ),
    [items],
  );

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
      addResult({
        fdcId: -Date.now(),
        description: r.name,
        calories: r.calories,
        protein: r.protein_g,
        carbs: r.carbs_g,
        fat: r.fat_g,
        fiber: r.fiber_g,
        sodium: r.sodium_mg,
        sugar: 0,
        satFat: 0,
        transFat: 0,
        polyFat: 0,
        monoFat: 0,
        isPerServing: true,
        servingSize: 100,
        servingSizeUnit: 'g',
      });
    } catch {
      setSearchError('Could not estimate that — add a portion, e.g. "aloo methi 1 bowl".');
    } finally {
      setEstimating(false);
    }
  }

  function addResult(r: FoodSearchResult) {
    const grams = r.isPerServing && r.servingSize ? r.servingSize : 100;
    const base = r.isPerServing && r.servingSize ? r.servingSize : 100;
    const per: Macros = {
      calories: r.calories / base,
      protein: r.protein / base,
      carbs: r.carbs / base,
      fat: r.fat / base,
      fiber: r.fiber / base,
      sodium: r.sodium / base,
      sugar: r.sugar / base,
      satFat: r.satFat / base,
      transFat: r.transFat / base,
      polyFat: r.polyFat / base,
      monoFat: r.monoFat / base,
    };
    setItems(prev => [
      ...prev,
      { key: `${r.fdcId}-${Date.now()}`, name: r.description, grams, per, ...scaled(per, grams) },
    ]);
    setResults([]);
    setQuery('');
  }

  function updateGrams(key: string, grams: number) {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, grams, ...scaled(i.per, grams) } : i)));
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i.key !== key));
  }

  async function logMeal() {
    if (!session?.user || items.length === 0) return;
    setSaving(true);
    await supabase.from('food_logs').insert(
      items.map(i => ({
        user_id: session.user!.id,
        meal_name: i.name,
        meal_category: category,
        calories: i.calories,
        protein_g: i.protein,
        carbs_g: i.carbs,
        fat_g: i.fat,
        fiber_g: i.fiber,
        sodium_mg: i.sodium,
        sugar_g: i.sugar,
        saturated_fat_g: i.satFat,
        trans_fat_g: i.transFat,
        poly_fat_g: i.polyFat,
        mono_fat_g: i.monoFat,
      })),
    );
    setSaving(false);
    setItems([]);
    await refreshNutrition();
    setTab('nutrition'); // show the result right away
  }

  return (
    <div className="min-h-full px-6 pt-4 pb-28">
      <div className="anim-drop-in mt-2 flex items-center justify-center">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Discover</h1>
      </div>

      {/* Tabs */}
      <div className="anim-fade-rise mt-4 flex gap-1 rounded-2xl bg-[var(--bg)] p-1" style={{ animationDelay: '0.04s' }}>
        {([
          { key: 'add', label: 'Add meal' },
          { key: 'nutrition', label: 'Nutrition' },
          { key: 'macros', label: 'Macros' },
        ] as const).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => change(t.key)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
            style={
              tab === t.key
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--muted)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} {...handlers} className={animClass}>
      {tab === 'add' ? (
        <AddMealTab
          category={category}
          setCategory={setCategory}
          query={query}
          setQuery={setQuery}
          results={results}
          searching={searching}
          estimating={estimating}
          searchError={searchError}
          handleSearch={handleSearch}
          handleAiEstimate={handleAiEstimate}
          addResult={addResult}
          items={items}
          updateGrams={updateGrams}
          removeItem={removeItem}
          totals={totals}
          saving={saving}
          logMeal={logMeal}
          loggedMeals={meals}
          foodUnit={foodUnit}
        />
      ) : tab === 'nutrition' ? (
        <NutritionTab
          totals={dayTotals}
          meals={meals}
          calorieTarget={calorieTarget}
          proteinTarget={proteinTarget}
          suggestedMacros={suggestedMacros}
          fiberTarget={profile?.fiber_target_g ?? null}
          sodiumTarget={profile?.sodium_target_mg ?? null}
        />
      ) : (
        <MacrosTab totals={dayTotals} meals={meals} />
      )}
      </div>
    </div>
  );
}

type AddMealProps = {
  category: MealCategory;
  setCategory: (c: MealCategory) => void;
  query: string;
  setQuery: (q: string) => void;
  results: FoodSearchResult[];
  searching: boolean;
  estimating: boolean;
  searchError: string | null;
  handleSearch: () => void;
  handleAiEstimate: () => void;
  addResult: (r: FoodSearchResult) => void;
  items: Item[];
  updateGrams: (key: string, grams: number) => void;
  removeItem: (key: string) => void;
  totals: Macros;
  saving: boolean;
  logMeal: () => void;
  loggedMeals: FoodLog[];
  foodUnit: 'g' | 'oz';
};

function AddMealTab(p: AddMealProps) {
  return (
    <>
      <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.08s' }}>
        <label className={labelClass} htmlFor="discover-category">
          Meal
        </label>
        <select
          id="discover-category"
          className={inputClass}
          value={p.category}
          onChange={e => p.setCategory(e.target.value as MealCategory)}
        >
          {MEAL_CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label className={`${labelClass} mt-3`} htmlFor="discover-search">
          Add foods
        </label>
        <div className="flex gap-2">
          <input
            id="discover-search"
            className={inputClass}
            type="text"
            value={p.query}
            onChange={e => p.setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') p.handleSearch();
            }}
            placeholder="e.g. banana, chicken breast"
          />
          <button
            type="button"
            onClick={p.handleSearch}
            disabled={p.searching || p.estimating || !p.query.trim()}
            aria-label="Search databases"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)] text-[var(--text)] disabled:opacity-40"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={p.handleAiEstimate}
            disabled={p.searching || p.estimating || !p.query.trim()}
            aria-label="Estimate with AI"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            {p.estimating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Sparkles size={18} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">
          🔍 global + Indian + US databases · ✨ AI estimates any home-cooked dish
        </p>
        {p.searchError ? <p className="mt-2 text-xs text-red-500">{p.searchError}</p> : null}

        {p.results.length > 0 ? (
          <ul className="glass-card mt-2 max-h-56 overflow-y-auto !rounded-2xl">
            {p.results.map(r => (
              <li key={r.fdcId}>
                <button
                  type="button"
                  onClick={() => p.addResult(r)}
                  className="flex w-full items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-2.5 text-left last:border-b-0"
                >
                  <span>
                    <span className="block text-sm text-[var(--text)]">{r.description}</span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {r.brandOwner ? `${r.brandOwner} · ` : ''}
                      {r.calories} kcal {r.isPerServing ? 'per serving' : 'per 100g'}
                    </span>
                  </span>
                  <Plus size={16} style={{ color: 'var(--accent)' }} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {p.items.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.1s' }}>
          <p className="mb-1 text-sm font-semibold text-[var(--text)]">Items</p>
          {p.items.map(i => (
            <div key={i.key} className="flex items-center gap-2 border-b border-[var(--card-border)] py-2.5 last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{i.name}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {i.calories} kcal · {i.protein}p / {i.carbs}c / {i.fat}f
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  className="w-16 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1.5 text-right text-xs text-[var(--text)] outline-none"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={p.foodUnit === 'oz' ? Math.round(gToUnit(i.grams, 'oz') * 10) / 10 : i.grams}
                  onChange={e =>
                    p.updateGrams(i.key, Math.round(unitToG(Number(e.target.value) || 0, p.foodUnit)))
                  }
                />
                <span className="text-[10px] text-[var(--muted)]">{p.foodUnit}</span>
              </div>
              <button
                type="button"
                onClick={() => p.removeItem(i.key)}
                aria-label="Remove"
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card anim-fade-rise mt-4 p-6 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <UtensilsCrossed size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--text)]">Compose your meal</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Search and add foods above — you'll see the full breakdown, then log it to your diary.
          </p>
        </div>
      )}

      {p.items.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Meal total</p>
            <p className="text-2xl font-black tracking-tight text-[var(--text)]">
              {p.totals.calories} <span className="text-xs font-semibold text-[var(--muted)]">kcal</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            <Stat label="Protein" value={`${p.totals.protein}g`} />
            <Stat label="Carbs" value={`${p.totals.carbs}g`} />
            <Stat label="Fat" value={`${p.totals.fat}g`} />
            <Stat label="Fiber" value={`${p.totals.fiber}g`} />
            <Stat label="Sodium" value={`${p.totals.sodium}`} />
          </div>
          <button
            type="button"
            onClick={p.logMeal}
            disabled={p.saving}
            className="mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            {p.saving ? 'Logging…' : `Log ${p.items.length} item${p.items.length > 1 ? 's' : ''} to diary`}
          </button>
        </div>
      ) : null}

      {/* Today's log, grouped by meal */}
      {p.loggedMeals.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.14s' }}>
          <p className="mb-2 text-sm font-semibold text-[var(--text)]">Today's log</p>
          {MEAL_CATEGORY_OPTIONS.map(o => o.value)
            .map(cat => ({ cat, list: p.loggedMeals.filter(m => m.meal_category === cat) }))
            .filter(g => g.list.length > 0)
            .map(g => (
              <div key={g.cat} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    {MEAL_LABELS[g.cat]}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--muted)]">
                    {Math.round(g.list.reduce((s, m) => s + (m.calories ?? 0), 0))} kcal
                  </p>
                </div>
                {g.list.map(m => (
                  <div key={m.id} className="py-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-xs text-[var(--text)]">{m.meal_name}</p>
                      <p className="shrink-0 text-[10px] font-semibold text-[var(--muted)]">
                        {m.calories ?? 0} kcal
                      </p>
                    </div>
                    <MacroSplitBar
                      protein={m.protein_g ?? 0}
                      carbs={m.carbs_g ?? 0}
                      fat={m.fat_g ?? 0}
                    />
                  </div>
                ))}
              </div>
            ))}
        </div>
      ) : null}
    </>
  );
}

const MEAL_COLORS: Record<MealCategory, string> = {
  breakfast: '#6c63ff',
  lunch: '#22c55e',
  dinner: '#f59e0b',
  snack: '#0ea5e9',
  supplement: '#a855f7',
  other: '#94a3b8',
};

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
  supplement: 'Supplements',
  other: 'Other',
};

// Shared macro palette, consistent with the nutrition breakdown tab.
const MACRO_COLORS = { protein: '#22c55e', carbs: '#6c63ff', fat: '#f59e0b' } as const;

// A thin stacked bar showing where a dish's calories come from. Segments are
// sized by calorie contribution (protein/carb ×4, fat ×9 kcal per gram) so a
// carb- or fat-heavy dish visibly dominates the bar even when its protein
// number looks fine.
function MacroSplitBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const pCal = protein * 4;
  const cCal = carbs * 4;
  const fCal = fat * 9;
  const total = pCal + cCal + fCal;
  const pW = total > 0 ? (pCal / total) * 100 : 100 / 3;
  const cW = total > 0 ? (cCal / total) * 100 : 100 / 3;
  const fW = total > 0 ? (fCal / total) * 100 : 100 / 3;

  // Center each label under its own segment; anchor the ends so they don't clip.
  const pos = (center: number): React.CSSProperties => {
    if (center <= 12) return { left: 0 };
    if (center >= 88) return { right: 0 };
    return { left: `${center}%`, transform: 'translateX(-50%)' };
  };

  return (
    <div className="mt-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
        {total > 0 ? (
          <>
            <span style={{ width: `${pW}%`, background: MACRO_COLORS.protein }} />
            <span style={{ width: `${cW}%`, background: MACRO_COLORS.carbs }} />
            <span style={{ width: `${fW}%`, background: MACRO_COLORS.fat }} />
          </>
        ) : null}
      </div>
      <div className="relative mt-1 h-3 text-[9px] font-semibold">
        <span className="absolute whitespace-nowrap" style={{ ...pos(pW / 2), color: MACRO_COLORS.protein }}>
          {Math.round(protein)}g P
        </span>
        <span className="absolute whitespace-nowrap" style={{ ...pos(pW + cW / 2), color: MACRO_COLORS.carbs }}>
          {Math.round(carbs)}g C
        </span>
        <span className="absolute whitespace-nowrap" style={{ ...pos(pW + cW + fW / 2), color: MACRO_COLORS.fat }}>
          {Math.round(fat)}g F
        </span>
      </div>
    </div>
  );
}

function NutritionTab({
  totals,
  meals,
  calorieTarget,
  proteinTarget,
  suggestedMacros,
  fiberTarget,
  sodiumTarget,
}: {
  totals: NutritionTotals;
  meals: FoodLog[];
  calorieTarget: number;
  proteinTarget: number | null;
  suggestedMacros: { proteinG: number; carbsG: number; fatG: number } | null;
  fiberTarget: number | null;
  sodiumTarget: number | null;
}) {
  const calories = Math.round(totals.calories);
  const remaining = Math.max(0, calorieTarget - calories);
  const percent = Math.min(100, calorieTarget > 0 ? (calories / calorieTarget) * 100 : 0);

  // Calorie share by meal category (for the donut + legend).
  const byCategory = MEAL_CATEGORY_OPTIONS.map(o => o.value)
    .map(cat => ({
      cat,
      calories: meals.filter(m => m.meal_category === cat).reduce((s, m) => s + (m.calories ?? 0), 0),
    }))
    .filter(c => c.calories > 0);
  const catTotal = byCategory.reduce((s, c) => s + c.calories, 0) || 1;

  // Build the conic-gradient donut.
  let acc = 0;
  const stops = byCategory
    .map(c => {
      const start = (acc / catTotal) * 100;
      acc += c.calories;
      const end = (acc / catTotal) * 100;
      return `${MEAL_COLORS[c.cat]} ${start}% ${end}%`;
    })
    .join(', ');

  const nutrientRows = [
    { label: 'Protein', value: totals.protein_g, target: proteinTarget, unit: 'g' },
    { label: 'Carbohydrates', value: totals.carbs_g, target: suggestedMacros?.carbsG ?? null, unit: 'g' },
    { label: '  Sugar', value: totals.sugar_g, target: null, unit: 'g' },
    { label: 'Fiber', value: totals.fiber_g, target: fiberTarget, unit: 'g' },
    { label: 'Fat', value: totals.fat_g, target: suggestedMacros?.fatG ?? null, unit: 'g' },
    { label: '  Saturated', value: totals.saturated_fat_g, target: null, unit: 'g' },
    { label: '  Monounsaturated', value: totals.mono_fat_g, target: null, unit: 'g' },
    { label: '  Polyunsaturated', value: totals.poly_fat_g, target: null, unit: 'g' },
    { label: '  Trans', value: totals.trans_fat_g, target: null, unit: 'g' },
    { label: 'Sodium', value: totals.sodium_mg, target: sodiumTarget, unit: 'mg' },
  ];

  return (
    <div className="anim-fade-rise mt-4 flex flex-col gap-4" style={{ animationDelay: '0.06s' }}>
      {/* Calories + meal donut */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div
            className="relative h-24 w-24 shrink-0 rounded-full"
            style={{ background: byCategory.length ? `conic-gradient(${stops})` : 'var(--bg)' }}
          >
            <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[var(--card)]">
              <span className="text-lg font-black leading-none text-[var(--text)]">{calories}</span>
              <span className="text-[8px] font-bold uppercase text-[var(--muted)]">kcal</span>
            </div>
          </div>
          <div className="flex-1">
            {byCategory.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">Log a meal to see the breakdown.</p>
            ) : (
              byCategory.map(c => (
                <div key={c.cat} className="mb-1 flex items-center gap-2 text-xs last:mb-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: MEAL_COLORS[c.cat] }} />
                  <span className="flex-1 text-[var(--text)]">{MEAL_LABELS[c.cat]}</span>
                  <span className="text-[var(--muted)]">
                    {Math.round((c.calories / catTotal) * 100)}% · {c.calories}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
          <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'var(--accent)' }} />
        </div>
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          {remaining} kcal left of {calorieTarget}
        </p>
      </div>

      {/* Goal / Left nutrient table */}
      <div className="glass-card p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Nutrients</p>
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
          <span>Nutrient</span>
          <span className="flex gap-4">
            <span className="w-12 text-right">Total</span>
            <span className="w-12 text-right">Goal</span>
            <span className="w-12 text-right">Left</span>
          </span>
        </div>
        {nutrientRows.map(r => {
          const value = Math.round(r.value);
          const left = r.target != null ? Math.round(r.target - value) : null;
          const indented = r.label.startsWith('  ');
          return (
            <div
              key={r.label}
              className="flex items-center justify-between border-b border-[var(--card-border)] py-2 text-xs last:border-b-0"
            >
              <span className={indented ? 'pl-3 text-[var(--muted)]' : 'text-[var(--text)]'}>
                {r.label.trim()}
              </span>
              <span className="flex gap-4 tabular-nums">
                <span className="w-12 text-right font-semibold text-[var(--text)]">
                  {value}
                  {r.unit}
                </span>
                <span className="w-12 text-right text-[var(--muted)]">{r.target != null ? r.target + r.unit : '—'}</span>
                <span className="w-12 text-right text-[var(--muted)]">{left != null ? left + r.unit : '—'}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Foods sorted by calories */}
      <div className="glass-card p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Foods by calories</p>
        {meals.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">Nothing logged yet.</p>
        ) : (
          meals
            .slice()
            .sort((a, b) => (b.calories ?? 0) - (a.calories ?? 0))
            .map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
              >
                <p className="flex-1 text-sm text-[var(--text)]">
                  {idx === 0 ? '🔥 ' : ''}
                  {m.meal_name}
                  <span className="text-[10px] text-[var(--muted)]"> · {MEAL_LABELS[m.meal_category]}</span>
                </p>
                <p className="text-[11px] font-semibold text-[var(--text)]">{m.calories ?? 0} kcal</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function MacrosTab({ totals, meals }: { totals: NutritionTotals; meals: FoodLog[] }) {
  const macroTotal = totals.protein_g + totals.carbs_g + totals.fat_g || 1;
  const split = [
    { label: 'Protein', grams: Math.round(totals.protein_g), color: '#22c55e', key: 'protein_g' as const },
    { label: 'Carbs', grams: Math.round(totals.carbs_g), color: '#6c63ff', key: 'carbs_g' as const },
    { label: 'Fat', grams: Math.round(totals.fat_g), color: '#f59e0b', key: 'fat_g' as const },
  ];

  // Top contributing food for each macro.
  function topFor(key: 'protein_g' | 'carbs_g' | 'fat_g'): FoodLog | null {
    let best: FoodLog | null = null;
    for (const m of meals) {
      if ((m[key] ?? 0) > (best?.[key] ?? 0)) best = m;
    }
    return best && (best[key] ?? 0) > 0 ? best : null;
  }

  return (
    <div className="anim-fade-rise mt-4 flex flex-col gap-4" style={{ animationDelay: '0.06s' }}>
      {/* Macro split bar */}
      <div className="glass-card p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--text)]">Macro split (by grams)</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-[var(--bg)]">
          {split.map(s => (
            <div key={s.label} style={{ width: `${(s.grams / macroTotal) * 100}%`, background: s.color }} />
          ))}
        </div>
        <div className="mt-3 flex justify-between">
          {split.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-[var(--text)]">
                {s.label} <span className="text-[var(--muted)]">{s.grams}g</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top sources */}
      <div className="glass-card p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Top sources today</p>
        {meals.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">Log a meal to see which foods drive each macro.</p>
        ) : (
          split.map(s => {
            const top = topFor(s.key);
            return (
              <div
                key={s.label}
                className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
              >
                <span className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[var(--muted)]">Most {s.label.toLowerCase()}</span>
                </span>
                <span className="text-right text-xs text-[var(--text)]">
                  {top ? (
                    <>
                      {top.meal_name}{' '}
                      <span className="font-semibold">{Math.round(top[s.key] ?? 0)}g</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-[var(--bg)] p-2">
      <p className="text-xs font-bold text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[8px] font-bold uppercase text-[var(--muted)]">{label}</p>
    </div>
  );
}
