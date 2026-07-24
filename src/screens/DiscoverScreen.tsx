import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useProfile } from '../hooks/useProfile';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { searchFoods, type FoodSearchResult } from '../lib/usdaFoodApi';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../utils/mealCategory';
import { todayDateString } from '../utils/date';
import {
  ageFromBirthDate,
  computeBMR,
  computeDailyCalorieTarget,
  computeSuggestedMacros,
  computeTDEE,
} from '../utils/calculations';
import type { MealCategory } from '../types/database';
import { inputClass, labelClass } from '../components/forms/formStyles';

type Item = {
  key: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  per: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };
};

type Tab = 'add' | 'nutrition' | 'macros';

function scaled(per: Item['per'], grams: number) {
  return {
    calories: Math.round(per.calories * grams),
    protein: Math.round(per.protein * grams),
    carbs: Math.round(per.carbs * grams),
    fat: Math.round(per.fat * grams),
    fiber: Math.round(per.fiber * grams),
    sodium: Math.round(per.sodium * grams),
  };
}

const REFERENCE_CALORIE_TARGET = 2000;

export function DiscoverScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('add');
  const today = todayDateString();
  const { totals: dayTotals, meals, refresh: refreshNutrition } = useTodayNutrition(today);
  const { profile } = useProfile();
  const { logs: recentLogs } = useRecentDailyLogs(14);

  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
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
  const calorieTarget = canComputeTarget
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
    : REFERENCE_CALORIE_TARGET;
  const suggestedMacros = canComputeTarget
    ? computeSuggestedMacros({ weightKg: latestWeight!, calorieTarget, deficitKcal })
    : null;
  const proteinTarget = profile?.protein_target_g ?? suggestedMacros?.proteinG ?? null;

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, i) => ({
          calories: acc.calories + i.calories,
          protein: acc.protein + i.protein,
          carbs: acc.carbs + i.carbs,
          fat: acc.fat + i.fat,
          fiber: acc.fiber + i.fiber,
          sodium: acc.sodium + i.sodium,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
      ),
    [items],
  );

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResults(await searchFoods(query.trim()));
    } catch {
      setSearchError("Couldn't reach the food database. Try again.");
    } finally {
      setSearching(false);
    }
  }

  function addResult(r: FoodSearchResult) {
    const grams = r.isPerServing && r.servingSize ? r.servingSize : 100;
    const base = r.isPerServing && r.servingSize ? r.servingSize : 100;
    const per = {
      calories: r.calories / base,
      protein: r.protein / base,
      carbs: r.carbs / base,
      fat: r.fat / base,
      fiber: r.fiber / base,
      sodium: r.sodium / base,
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
            onClick={() => setTab(t.key)}
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

      {tab === 'add' ? (
        <AddMealTab
          category={category}
          setCategory={setCategory}
          query={query}
          setQuery={setQuery}
          results={results}
          searching={searching}
          searchError={searchError}
          handleSearch={handleSearch}
          addResult={addResult}
          items={items}
          updateGrams={updateGrams}
          removeItem={removeItem}
          totals={totals}
          saving={saving}
          logMeal={logMeal}
        />
      ) : tab === 'nutrition' ? (
        <NutritionTab
          calories={Math.round(dayTotals.calories)}
          calorieTarget={calorieTarget}
          mealCount={dayTotals.mealCount}
          meals={meals}
        />
      ) : (
        <MacrosTab
          totals={dayTotals}
          proteinTarget={proteinTarget}
          suggestedMacros={suggestedMacros}
          fiberTarget={profile?.fiber_target_g ?? null}
          sodiumTarget={profile?.sodium_target_mg ?? null}
        />
      )}
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
  searchError: string | null;
  handleSearch: () => void;
  addResult: (r: FoodSearchResult) => void;
  items: Item[];
  updateGrams: (key: string, grams: number) => void;
  removeItem: (key: string) => void;
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };
  saving: boolean;
  logMeal: () => void;
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
            disabled={p.searching || !p.query.trim()}
            aria-label="Search"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            <Search size={18} />
          </button>
        </div>
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
                  inputMode="numeric"
                  min="0"
                  value={i.grams}
                  onChange={e => p.updateGrams(i.key, Number(e.target.value) || 0)}
                />
                <span className="text-[10px] text-[var(--muted)]">g</span>
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
    </>
  );
}

function NutritionTab({
  calories,
  calorieTarget,
  mealCount,
  meals,
}: {
  calories: number;
  calorieTarget: number;
  mealCount: number;
  meals: { id: string; meal_name: string; calories: number | null; protein_g: number | null }[];
}) {
  const remaining = Math.max(0, calorieTarget - calories);
  const percent = Math.min(100, calorieTarget > 0 ? (calories / calorieTarget) * 100 : 0);

  return (
    <div className="anim-fade-rise mt-4 flex flex-col gap-4" style={{ animationDelay: '0.06s' }}>
      <div className="glass-card p-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
          Eaten today
        </p>
        <p className="text-4xl font-black tracking-tight text-[var(--text)]">
          {calories} <span className="text-base font-semibold text-[var(--muted)]">kcal</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${percent}%`, background: 'var(--accent)' }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {remaining} kcal left of {calorieTarget} · {mealCount} item{mealCount === 1 ? '' : 's'} logged
        </p>
      </div>

      <div className="glass-card p-5">
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Today's food</p>
        {meals.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">Nothing logged yet. Add a meal to see it here.</p>
        ) : (
          meals.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-[var(--card-border)] py-2.5 last:border-b-0"
            >
              <p className="text-sm text-[var(--text)]">{m.meal_name}</p>
              <p className="text-[11px] text-[var(--muted)]">
                {m.calories ?? 0} kcal · {m.protein_g ?? 0}g P
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MacrosTab({
  totals,
  proteinTarget,
  suggestedMacros,
  fiberTarget,
  sodiumTarget,
}: {
  totals: { protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; sodium_mg: number };
  proteinTarget: number | null;
  suggestedMacros: { proteinG: number; carbsG: number; fatG: number } | null;
  fiberTarget: number | null;
  sodiumTarget: number | null;
}) {
  const rows = [
    { label: 'Protein', value: Math.round(totals.protein_g), target: proteinTarget, unit: 'g', color: '#22c55e' },
    { label: 'Carbs', value: Math.round(totals.carbs_g), target: suggestedMacros?.carbsG ?? null, unit: 'g', color: '#6c63ff' },
    { label: 'Fat', value: Math.round(totals.fat_g), target: suggestedMacros?.fatG ?? null, unit: 'g', color: '#f59e0b' },
    { label: 'Fiber', value: Math.round(totals.fiber_g), target: fiberTarget, unit: 'g', color: '#14b8a6' },
    { label: 'Sodium', value: Math.round(totals.sodium_mg), target: sodiumTarget, unit: 'mg', color: '#ef4444' },
  ];

  return (
    <div className="anim-fade-rise mt-4 flex flex-col gap-4" style={{ animationDelay: '0.06s' }}>
      <div className="glass-card flex flex-col gap-3 p-5">
        <p className="text-sm font-semibold text-[var(--text)]">Today's macros</p>
        {rows.map(r => {
          const percent = r.target ? Math.min(100, (r.value / r.target) * 100) : 0;
          return (
            <div key={r.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[var(--text)]">{r.label}</span>
                <span className="text-[var(--muted)]">
                  {r.value}
                  {r.target ? ` / ${r.target}` : ''}
                  {r.unit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.target ? percent : 0}%`, background: r.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {!proteinTarget ? (
        <p className="text-[11px] text-[var(--muted)]">
          Complete your profile and log your weight for personalised macro targets.
        </p>
      ) : null}
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
