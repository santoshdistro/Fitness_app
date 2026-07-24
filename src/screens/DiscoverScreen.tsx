import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { searchFoods, type FoodSearchResult } from '../lib/usdaFoodApi';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../utils/mealCategory';
import type { MealCategory } from '../types/database';
import { inputClass, labelClass } from '../components/forms/formStyles';

type Item = {
  key: string;
  name: string;
  grams: number;
  // macros already scaled to `grams`
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  // per-gram, to rescale when grams change
  per: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sodium: number };
};

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

export function DiscoverScreen() {
  const { session } = useAuth();
  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
  }

  function updateGrams(key: string, grams: number) {
    setItems(prev =>
      prev.map(i => (i.key === key ? { ...i, grams, ...scaled(i.per, grams) } : i)),
    );
    setSaved(false);
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
    setSaved(true);
  }

  return (
    <div className="min-h-full px-6 pt-4 pb-28">
      <div className="anim-drop-in mt-2 flex items-center justify-center">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Build a meal</h1>
      </div>

      <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.08s' }}>
        <label className={labelClass} htmlFor="discover-category">
          Meal
        </label>
        <select
          id="discover-category"
          className={inputClass}
          value={category}
          onChange={e => setCategory(e.target.value as MealCategory)}
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
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="e.g. banana, chicken breast"
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
        {searchError ? <p className="mt-2 text-xs text-red-500">{searchError}</p> : null}

        {results.length > 0 ? (
          <ul className="glass-card mt-2 max-h-56 overflow-y-auto !rounded-2xl">
            {results.map(r => (
              <li key={r.fdcId}>
                <button
                  type="button"
                  onClick={() => addResult(r)}
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

      {/* Items */}
      {items.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 flex flex-col gap-1 p-5" style={{ animationDelay: '0.1s' }}>
          <p className="mb-1 text-sm font-semibold text-[var(--text)]">Items</p>
          {items.map(i => (
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
                  onChange={e => updateGrams(i.key, Number(e.target.value) || 0)}
                />
                <span className="text-[10px] text-[var(--muted)]">g</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(i.key)}
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
            Search and add foods above — you'll see the full calorie & macro breakdown here.
          </p>
        </div>
      )}

      {/* Totals + log */}
      {items.length > 0 ? (
        <div className="glass-card anim-fade-rise mt-4 p-5" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-[var(--text)]">Meal total</p>
            <p className="text-2xl font-black tracking-tight text-[var(--text)]">
              {totals.calories} <span className="text-xs font-semibold text-[var(--muted)]">kcal</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            <Stat label="Protein" value={`${totals.protein}g`} />
            <Stat label="Carbs" value={`${totals.carbs}g`} />
            <Stat label="Fat" value={`${totals.fat}g`} />
            <Stat label="Fiber" value={`${totals.fiber}g`} />
            <Stat label="Sodium" value={`${totals.sodium}`} />
          </div>
          <button
            type="button"
            onClick={logMeal}
            disabled={saving}
            className="mt-4 w-full rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-50 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            {saving ? 'Logging…' : `Log ${items.length} item${items.length > 1 ? 's' : ''} to diary`}
          </button>
        </div>
      ) : null}

      {saved ? (
        <p className="anim-fade-in mt-4 text-center text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          Logged to your diary ✓
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
