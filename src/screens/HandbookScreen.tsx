import { useMemo, useState, type FormEvent } from 'react';
import { Boxes, Check, ChevronRight, Clock, Cookie, Play, Plus, Snowflake, Sparkles, Utensils } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../utils/mealCategory';
import type { MealCategory } from '../types/database';
import { useProfile } from '../hooks/useProfile';
import { useDietPlan } from '../hooks/useDietPlan';
import { todayDateString } from '../utils/date';
import { useNutritionCoach } from '../hooks/useNutritionCoach';
import { generateNutritionPlan, generateMealPrep, type NutritionPreferences, type MealPrepResult } from '../lib/aiClient';
import { MEAL_PREP_GUIDE, MEAL_PREP_TIPS } from '../data/mealPrep';
import { Sheet } from '../components/Sheet';
import { CravingsCorner } from '../components/CravingsCorner';
import { DietPlanner } from '../components/DietPlanner';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { usePersistentState } from '../hooks/usePersistentState';
import { PhotoBackdrop } from '../components/PhotoBackdrop';
import { NUTRITION_HERO_IMAGE } from '../data/gymImagery';
import {
  DIET_TAG_LABEL,
  HEALTHY_FOODS,
  RECIPES,
  recipeYoutubeUrl,
  type DietTag,
  type Recipe,
} from '../data/recipes';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from '../components/forms/formStyles';

const GOAL_OPTIONS = [
  { value: 'lose weight / fat loss', label: 'Lose weight' },
  { value: 'build muscle / gain', label: 'Build muscle' },
  { value: 'maintain / eat healthier', label: 'Maintain & eat well' },
];

const DIET_OPTIONS = [
  'No restrictions',
  'High protein',
  'Vegetarian',
  'Vegan',
  'Low carb',
  'Pescatarian',
  'Dairy-free',
  'Gluten-free',
];

const MEALS_OPTIONS = ['2', '3', '4', '5'];

function goalDefault(goalType?: string | null): string {
  if (goalType === 'lose') return GOAL_OPTIONS[0].value;
  if (goalType === 'gain') return GOAL_OPTIONS[1].value;
  return GOAL_OPTIONS[2].value;
}

export function HandbookScreen() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { prefs, plan, save, clear } = useNutritionCoach();

  const [tab, setTab] = usePersistentState<'handbook' | 'plan'>('ui:handbookTab', 'handbook');
  const { handlers, change, animClass } = useTabSwipe(['handbook', 'plan'] as const, tab, setTab);
  const [coachOpen, setCoachOpen] = useState(false);
  const [cravingsOpen, setCravingsOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [dietFilter, setDietFilter] = useState<DietTag | 'all'>('all');

  const filteredRecipes = useMemo(
    () => (dietFilter === 'all' ? RECIPES : RECIPES.filter(r => r.dietTags.includes(dietFilter))),
    [dietFilter],
  );

  const filterTags: (DietTag | 'all')[] = [
    'all',
    'air_fryer',
    'high_protein',
    'low_carb',
    'vegetarian',
    'vegan',
    'quick',
    'budget',
  ];

  return (
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-wide text-[var(--text)]">Handbook</h1>
      </div>

      {/* Hero */}
      <div
        className="anim-fade-rise relative mt-4 flex h-32 flex-col justify-end overflow-hidden p-4"
        style={{ borderRadius: 'var(--radius-card)', animationDelay: '0.02s' }}
      >
        <PhotoBackdrop
          src={NUTRITION_HERO_IMAGE}
          gradient="linear-gradient(135deg, #10b981, #047857)"
          photoOpacity={0.7}
        />
        <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-white/80">
          Eat for your goal
        </p>
        <p className="relative z-10 text-lg font-black leading-tight text-white drop-shadow">
          Recipes, foods & your diet coach
        </p>
      </div>

      {/* Tabs: Diet Handbook / Diet Plan */}
      <div className="anim-fade-rise mt-4 flex rounded-2xl bg-[var(--bg)] p-1" style={{ animationDelay: '0.04s' }}>
        {([
          { key: 'handbook', label: 'Diet Handbook' },
          { key: 'plan', label: 'Diet Plan' },
        ] as const).map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => change(t.key)}
              className="flex-1 rounded-xl py-2 text-xs font-bold"
              style={
                active
                  ? { background: 'var(--card)', color: 'var(--text)', boxShadow: '0 2px 8px -3px rgba(0,0,0,0.25)' }
                  : { color: 'var(--muted)' }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} {...handlers} className={animClass}>
      {tab === 'plan' ? (
        <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.05s' }}>
          <DietPlanner />
        </div>
      ) : (
        <>
      {/* AI nutrition coach */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.05s' }}>
        {plan ? (
          <div
            className="overflow-hidden p-5"
            style={{
              borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              boxShadow: '0 12px 28px -10px rgba(16,185,129,0.55)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-white" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Your diet coach
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-semibold text-white"
              >
                Update
              </button>
            </div>
            <p className="mt-2 text-sm font-medium leading-snug text-white">{plan.summary}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/12 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
                  Prioritise
                </p>
                <ul className="flex flex-col gap-0.5">
                  {plan.foods.slice(0, 6).map(f => (
                    <li key={f} className="text-[11px] text-white/95">
                      • {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/12 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
                  Limit
                </p>
                <ul className="flex flex-col gap-0.5">
                  {plan.avoid.map(f => (
                    <li key={f} className="text-[11px] text-white/95">
                      • {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {plan.dayPlan.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                  A day on plan
                </p>
                {plan.dayPlan.map(meal => (
                  <div key={meal.meal} className="rounded-2xl bg-white/12 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{meal.meal}</p>
                      <p className="text-[10px] text-white/75">
                        {meal.approxCalories} kcal · {meal.protein_g}g P
                      </p>
                    </div>
                    <p className="text-[11px] text-white/90">{meal.idea}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {plan.recipes.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                  Coach recipes
                </p>
                {plan.recipes.map(r => (
                  <div key={r.name} className="rounded-2xl bg-white/12 p-3">
                    <p className="text-xs font-bold text-white">{r.name}</p>
                    <p className="mb-1 text-[10px] italic text-white/75">{r.why}</p>
                    <p className="text-[10px] text-white/85">{r.ingredients.join(' · ')}</p>
                    <ol className="mt-1 list-decimal pl-4 text-[11px] text-white/90">
                      {r.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full rounded-2xl border border-white/25 py-2 text-[11px] font-semibold text-white/90"
            >
              Clear plan
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            className="glass-card flex w-full items-center gap-3 p-4 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/12">
              <Sparkles size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Meet your AI diet coach</p>
              <p className="text-[11px] text-[var(--muted)]">
                Tell it your goal & food preferences — it drafts foods, meals & recipes for you.
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Cravings corner */}
      <div className="anim-fade-rise mt-4" style={{ animationDelay: '0.06s' }}>
        <button
          type="button"
          onClick={() => setCravingsOpen(true)}
          className="flex w-full items-center gap-3 overflow-hidden p-4 text-left"
          style={{
            borderRadius: 'var(--radius-card)',
            background: 'linear-gradient(135deg, #ec4899, #d97706)',
            boxShadow: '0 12px 28px -12px rgba(236,72,153,0.55)',
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Cookie size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Cravings corner</p>
            <p className="text-[11px] leading-snug text-white/85">
              Craving sweets, a beer, something fried? Get healthier swaps that fit your day — or log
              it guilt-free.
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-white/80" />
        </button>
      </div>

      {/* Recipe book */}
      <div className="anim-fade-rise mt-6" style={{ animationDelay: '0.08s' }}>
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Recipe book</p>
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {filterTags.map(tag => {
            const active = dietFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setDietFilter(tag)}
                className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold"
                style={
                  active
                    ? { background: 'var(--accent)', color: 'white' }
                    : { background: 'var(--bg)', color: 'var(--muted)' }
                }
              >
                {tag === 'all' ? 'All' : DIET_TAG_LABEL[tag]}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {filteredRecipes.map(recipe => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setSelectedRecipe(recipe)}
              className="glass-card flex items-center gap-3 p-4 text-left"
            >
              <RecipeImage recipe={recipe} className="h-12 w-12 shrink-0 rounded-2xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text)]">{recipe.name}</p>
                <p className="text-[11px] text-[var(--muted)]">{recipe.blurb}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} /> {recipe.minutes}m
                  </span>
                  <span>· {recipe.perServing.calories} kcal</span>
                  <span>· {recipe.perServing.protein_g}g protein</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--muted)]" />
            </button>
          ))}
        </div>
      </div>

      {/* Meal prep & batch cooking */}
      <div className="anim-fade-rise mt-6" style={{ animationDelay: '0.09s' }}>
        <MealPrepSection
          userId={session?.user?.id}
          defaultGoal={goalDefault(profile?.goal_type)}
          defaultDiet={prefs?.diet ?? DIET_OPTIONS[0]}
          defaultLikes={prefs?.likes ?? ''}
          defaultDislikes={prefs?.dislikes ?? ''}
        />
      </div>

      {/* Healthy food reference */}
      <div className="anim-fade-rise mt-6" style={{ animationDelay: '0.1s' }}>
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Healthy food list</p>
        <div className="flex flex-col gap-3">
          {HEALTHY_FOODS.map(group => (
            <div key={group.title} className="glass-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{group.emoji}</span>
                <p className="text-sm font-semibold text-[var(--text)]">{group.title}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {group.items.map(item => (
                  <div key={item.name} className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-[var(--text)]">{item.name}</p>
                    <p className="text-right text-[10px] text-[var(--muted)]">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
      </div>

      {/* Recipe detail */}
      <Sheet
        open={selectedRecipe != null}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.name ?? 'Recipe'}
      >
        {selectedRecipe ? <RecipeDetail recipe={selectedRecipe} /> : null}
      </Sheet>

      {/* Cravings corner */}
      <Sheet open={cravingsOpen} onClose={() => setCravingsOpen(false)} title="Cravings corner">
        <CravingsCorner />
      </Sheet>

      {/* Coach preferences form */}
      <Sheet open={coachOpen} onClose={() => setCoachOpen(false)} title="Your diet coach">
        <NutritionCoachForm
          userId={session?.user?.id}
          defaultGoal={goalDefault(profile?.goal_type)}
          defaultPrefs={prefs}
          proteinTarget={profile?.protein_target_g ?? undefined}
          onDone={(nextPrefs, nextPlan) => {
            save(nextPrefs, nextPlan);
            setCoachOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function RecipeImage({ recipe, className }: { recipe: Recipe; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!recipe.image || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--bg)] text-3xl ${className ?? ''}`}
      >
        {recipe.emoji}
      </div>
    );
  }
  return (
    <img
      src={recipe.image}
      alt={recipe.name}
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ''}`}
    />
  );
}

const PLAN_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const { session } = useAuth();
  const { addItem } = useDietPlan();
  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [servings, setServings] = useState('1');
  const [logState, setLogState] = useState<'idle' | 'saving' | 'saved'>('idle');
  // "Add to daily plan" (the Diet Plan), separate from logging to the diary.
  const [planMeal, setPlanMeal] = useState<(typeof PLAN_MEALS)[number]>('Breakfast');
  const [planDate, setPlanDate] = useState(todayDateString());
  const [planned, setPlanned] = useState(false);

  function addToPlan() {
    const n = Math.max(0.25, Number(servings) || 1);
    const s = (v: number) => Math.round(v * n);
    addItem(planDate, {
      meal: planMeal,
      name: n === 1 ? recipe.name : `${recipe.name} (${n}×)`,
      calories: s(recipe.perServing.calories),
      protein_g: s(recipe.perServing.protein_g),
      carbs_g: s(recipe.perServing.carbs_g),
      fat_g: s(recipe.perServing.fat_g),
      fiber_g: 0,
    });
    setPlanned(true);
  }

  // Add this recipe straight into today's diary, scaled by how many servings you
  // ate — no re-searching the food databases.
  async function logToDiary() {
    if (!session?.user || logState !== 'idle') return;
    const n = Math.max(0.25, Number(servings) || 1);
    const s = (v: number) => Math.round(v * n);
    setLogState('saving');
    const { error } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: n === 1 ? recipe.name : `${recipe.name} (${n}×)`,
      meal_category: category,
      calories: s(recipe.perServing.calories),
      protein_g: s(recipe.perServing.protein_g),
      carbs_g: s(recipe.perServing.carbs_g),
      fat_g: s(recipe.perServing.fat_g),
    });
    setLogState(error ? 'idle' : 'saved');
  }

  return (
    <div className="flex flex-col gap-3">
      <RecipeImage recipe={recipe} className="h-40 w-full rounded-2xl" />
      <div>
        <p className="text-[11px] text-[var(--muted)]">{recipe.blurb}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {recipe.dietTags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[9px] font-semibold text-[var(--accent)]"
            >
              {DIET_TAG_LABEL[tag]}
            </span>
          ))}
        </div>
      </div>

      <a
        href={recipeYoutubeUrl(recipe.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
      >
        <Play size={15} fill="currentColor" />
        Watch how-to on YouTube
      </a>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Kcal', value: recipe.perServing.calories },
          { label: 'Protein', value: `${recipe.perServing.protein_g}g` },
          { label: 'Carbs', value: `${recipe.perServing.carbs_g}g` },
          { label: 'Fat', value: `${recipe.perServing.fat_g}g` },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center rounded-2xl bg-[var(--bg)] p-2">
            <p className="text-sm font-bold text-[var(--text)]">{stat.value}</p>
            <p className="text-[8px] font-bold uppercase text-[var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--muted)]">
        Per serving · makes {recipe.servings} · {recipe.minutes} min
      </p>

      {/* Log this recipe straight into today's diary */}
      <div className="glass-card flex flex-col gap-2 p-3">
        <p className="text-xs font-semibold text-[var(--text)]">Add to today's diary</p>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => {
              setCategory(e.target.value as MealCategory);
              setLogState('idle');
            }}
            className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] outline-none"
          >
            {MEAL_CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-2.5 text-xs font-semibold text-[var(--text)]">
            <input
              type="number"
              inputMode="decimal"
              min="0.25"
              step="any"
              value={servings}
              onChange={e => {
                setServings(e.target.value);
                setLogState('idle');
              }}
              className="w-10 bg-transparent py-2 text-right outline-none"
            />
            <span className="text-[10px] text-[var(--muted)]">serv</span>
          </label>
        </div>
        <button
          type="button"
          onClick={logToDiary}
          disabled={logState !== 'idle'}
          className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-80"
          style={{ background: logState === 'saved' ? '#16a34a' : 'linear-gradient(135deg, #22c55e, #15803d)' }}
        >
          {logState === 'saved' ? (
            <><Check size={15} /> Added to diary</>
          ) : logState === 'saving' ? (
            'Adding…'
          ) : (
            <><Plus size={15} /> Log to diary</>
          )}
        </button>
      </div>

      {/* Add this recipe to the Diet Plan (a planned meal on a chosen day) */}
      <div className="glass-card flex flex-col gap-2 p-3">
        <p className="text-xs font-semibold text-[var(--text)]">Add to daily plan</p>
        <div className="flex gap-2">
          <select
            value={planMeal}
            onChange={e => {
              setPlanMeal(e.target.value as (typeof PLAN_MEALS)[number]);
              setPlanned(false);
            }}
            className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] outline-none"
          >
            {PLAN_MEALS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="date"
            value={planDate}
            onChange={e => {
              if (e.target.value) {
                setPlanDate(e.target.value);
                setPlanned(false);
              }
            }}
            className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] outline-none"
          />
        </div>
        <button
          type="button"
          onClick={addToPlan}
          disabled={planned}
          className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-80"
          style={{ background: planned ? '#4b3fe0' : 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          {planned ? (
            <><Check size={15} /> Added to plan</>
          ) : (
            <><Plus size={15} /> Add to daily plan</>
          )}
        </button>
      </div>

      <div>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--text)]">
          <Utensils size={13} /> Ingredients
        </p>
        <ul className="flex flex-col gap-1">
          {recipe.ingredients.map(ing => (
            <li key={ing} className="text-xs text-[var(--text)]">
              • {ing}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-[var(--text)]">Method</p>
        <ol className="flex flex-col gap-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--text)]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function NutritionCoachForm({
  userId,
  defaultGoal,
  defaultPrefs,
  proteinTarget,
  onDone,
}: {
  userId?: string;
  defaultGoal: string;
  defaultPrefs: NutritionPreferences | null;
  proteinTarget?: number;
  onDone: (prefs: NutritionPreferences, plan: import('../lib/aiClient').NutritionPlanResult) => void;
}) {
  const [goal, setGoal] = useState(defaultPrefs?.goal ?? defaultGoal);
  const [diet, setDiet] = useState(defaultPrefs?.diet ?? DIET_OPTIONS[0]);
  const [likes, setLikes] = useState(defaultPrefs?.likes ?? '');
  const [dislikes, setDislikes] = useState(defaultPrefs?.dislikes ?? '');
  const [mealsPerDay, setMealsPerDay] = useState(String(defaultPrefs?.mealsPerDay ?? 3));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    const nextPrefs: NutritionPreferences = {
      goal,
      diet,
      likes: likes.trim() || undefined,
      dislikes: dislikes.trim() || undefined,
      mealsPerDay: Number(mealsPerDay),
      proteinTarget,
    };
    setGenerating(true);
    setError(null);
    try {
      const nextPlan = await generateNutritionPlan(userId, nextPrefs);
      onDone(nextPrefs, nextPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not draft a plan.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Tell the coach what you're after and how you like to eat — it drafts foods, a day of meals,
        and recipes just for you.
      </p>

      <div className="mb-3">
        <label className={labelClass} htmlFor="nc-goal">
          Your goal
        </label>
        <select id="nc-goal" className={inputClass} value={goal} onChange={e => setGoal(e.target.value)}>
          {GOAL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="nc-diet">
          Diet preference
        </label>
        <select id="nc-diet" className={inputClass} value={diet} onChange={e => setDiet(e.target.value)}>
          {DIET_OPTIONS.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="nc-likes">
          Foods you love — optional
        </label>
        <input
          id="nc-likes"
          className={inputClass}
          type="text"
          value={likes}
          onChange={e => setLikes(e.target.value)}
          placeholder="e.g. chicken, oats, spicy food"
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="nc-dislikes">
          Foods to avoid — optional
        </label>
        <input
          id="nc-dislikes"
          className={inputClass}
          type="text"
          value={dislikes}
          onChange={e => setDislikes(e.target.value)}
          placeholder="e.g. mushrooms, seafood"
        />
      </div>

      <div className="mb-4">
        <label className={labelClass} htmlFor="nc-meals">
          Meals per day
        </label>
        <select
          id="nc-meals"
          className={inputClass}
          value={mealsPerDay}
          onChange={e => setMealsPerDay(e.target.value)}
        >
          {MEALS_OPTIONS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={generating} className={submitButtonClass}>
        {generating ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Drafting your plan…
          </>
        ) : (
          <>
            <Sparkles size={15} className="mr-2" />
            Draft my nutrition plan
          </>
        )}
      </button>
    </form>
  );
}

function MealPrepSection({
  userId,
  defaultGoal,
  defaultDiet,
  defaultLikes,
  defaultDislikes,
}: {
  userId?: string;
  defaultGoal: string;
  defaultDiet: string;
  defaultLikes: string;
  defaultDislikes: string;
}) {
  const storageKey = userId ? `meal_prep:${userId}` : null;
  const [result, setResult] = useState<MealPrepResult | null>(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as MealPrepResult) : null;
    } catch {
      return null;
    }
  });
  const [open, setOpen] = useState(false);

  function save(r: MealPrepResult | null) {
    setResult(r);
    if (!storageKey) return;
    if (r) localStorage.setItem(storageKey, JSON.stringify(r));
    else localStorage.removeItem(storageKey);
  }

  return (
    <>
      <p className="mb-2 text-sm font-semibold text-[var(--text)]">Meal prep &amp; batch cooking</p>

      {result ? (
        <div className="glass-card mb-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Boxes size={14} className="text-[var(--accent)]" />
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Your weekend prep
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-1 text-[10px] font-semibold text-[var(--accent)]"
            >
              Redo
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text)]">{result.summary}</p>
          <div className="mt-2 flex flex-col gap-2">
            {result.items.map(it => (
              <div key={it.name} className="rounded-2xl bg-[var(--bg)] p-3">
                <p className="text-xs font-bold text-[var(--text)]">{it.name}</p>
                <p className="text-[11px] text-[var(--muted)]">{it.batch}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
                  <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                    <Snowflake size={10} /> {it.keeps}
                  </span>
                  {it.protein_g != null ? <span className="text-[var(--muted)]">{it.protein_g}g P/serv</span> : null}
                  {it.calories != null ? <span className="text-[var(--muted)]">{it.calories} kcal/serv</span> : null}
                </div>
                <p className="mt-1 text-[11px] text-[var(--text)]">↻ {it.reuse}</p>
              </div>
            ))}
          </div>
          {result.shoppingList.length ? (
            <div className="mt-2 rounded-2xl bg-[var(--bg)] p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Shopping list
              </p>
              <p className="text-[11px] text-[var(--text)]">{result.shoppingList.join(' · ')}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => save(null)}
            className="mt-2 w-full text-center text-[10px] font-semibold text-[var(--muted)]"
          >
            Clear prep plan
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="glass-card mb-3 flex w-full items-center gap-3 p-4 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/12">
            <Boxes size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Plan my weekend prep (AI)</p>
            <p className="text-[11px] text-[var(--muted)]">
              Cook once on the weekend, eat all week — AI picks batch-friendly dishes that keep.
            </p>
          </div>
        </button>
      )}

      <div className="flex flex-col gap-3">
        {MEAL_PREP_GUIDE.map(group => (
          <div key={group.title} className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">{group.emoji}</span>
              <p className="text-sm font-semibold text-[var(--text)]">{group.title}</p>
            </div>
            <div className="flex flex-col gap-2">
              {group.foods.map(f => (
                <div key={f.name} className="border-b border-[var(--card-border)] pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--text)]">{f.name}</p>
                    <p className="shrink-0 text-[9px] font-semibold text-[var(--accent)]">{f.keeps}</p>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">↻ {f.reuse}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="glass-card p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Safe storage tips
          </p>
          <ul className="flex flex-col gap-1">
            {MEAL_PREP_TIPS.map(t => (
              <li key={t} className="text-[11px] text-[var(--text)]">
                • {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Plan weekend meal prep">
        <MealPrepForm
          userId={userId}
          defaultGoal={defaultGoal}
          defaultDiet={defaultDiet}
          defaultLikes={defaultLikes}
          defaultDislikes={defaultDislikes}
          onDone={r => {
            save(r);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

function MealPrepForm({
  userId,
  defaultGoal,
  defaultDiet,
  defaultLikes,
  defaultDislikes,
  onDone,
}: {
  userId?: string;
  defaultGoal: string;
  defaultDiet: string;
  defaultLikes: string;
  defaultDislikes: string;
  onDone: (result: MealPrepResult) => void;
}) {
  const [goal, setGoal] = useState(defaultGoal);
  const [diet, setDiet] = useState(defaultDiet);
  const [likes, setLikes] = useState(defaultLikes);
  const [dislikes, setDislikes] = useState(defaultDislikes);
  const [days, setDays] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const r = await generateMealPrep(userId, {
        goal,
        diet,
        likes: likes.trim() || undefined,
        dislikes: dislikes.trim() || undefined,
        servings: Number(days) || 5,
      });
      onDone(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not plan your prep.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="mb-3 text-xs text-[var(--muted)]">
        AI picks batch-cook dishes that keep well, tells you how long they last, and builds a
        shopping list — cook on the weekend, reuse all week.
      </p>
      <div className="mb-3">
        <label className={labelClass} htmlFor="mp-goal">Goal</label>
        <select id="mp-goal" className={inputClass} value={goal} onChange={e => setGoal(e.target.value)}>
          {GOAL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="mp-diet">Diet preference</label>
        <select id="mp-diet" className={inputClass} value={diet} onChange={e => setDiet(e.target.value)}>
          {DIET_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="mp-days">Days to cover</label>
        <select id="mp-days" className={inputClass} value={days} onChange={e => setDays(e.target.value)}>
          {['3', '4', '5', '6', '7'].map(d => (
            <option key={d} value={d}>{d} days</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="mp-likes">Foods you love — optional</label>
        <input
          id="mp-likes"
          className={inputClass}
          type="text"
          value={likes}
          onChange={e => setLikes(e.target.value)}
          placeholder="e.g. chicken, paneer, rice"
        />
      </div>
      <div className="mb-4">
        <label className={labelClass} htmlFor="mp-dislikes">Foods to avoid — optional</label>
        <input
          id="mp-dislikes"
          className={inputClass}
          type="text"
          value={dislikes}
          onChange={e => setDislikes(e.target.value)}
          placeholder="e.g. mushrooms, seafood"
        />
      </div>
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={busy} className={submitButtonClass}>
        {busy ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Planning your prep…
          </>
        ) : (
          <>
            <Sparkles size={15} className="mr-2" />
            Plan my weekend prep
          </>
        )}
      </button>
    </form>
  );
}
