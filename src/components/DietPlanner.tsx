import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { PLAN_SPAN, useDietPlan, type PlanItem } from '../hooks/useDietPlan';
import { generateDietPlan, type DietPlanInput, type DietPlanItem } from '../lib/aiClient';
import { addDays, todayDateString } from '../utils/date';
import { Sheet } from './Sheet';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './forms/formStyles';

const STRIP_DAYS = 14;

function fmt(date: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, opts);
}
function longDate(date: string): string {
  return fmt(date, { weekday: 'long', day: 'numeric', month: 'short' });
}

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

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
const GOAL_OPTIONS = [
  { value: 'lose weight / fat loss', label: 'Lose weight' },
  { value: 'build muscle / gain', label: 'Build muscle' },
  { value: 'maintain / eat healthier', label: 'Maintain & eat well' },
];

function goalDefault(goalType?: string | null): string {
  if (goalType === 'lose') return GOAL_OPTIONS[0].value;
  if (goalType === 'gain') return GOAL_OPTIONS[1].value;
  return GOAL_OPTIONS[2].value;
}

export function DietPlanner() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const targets = useCalorieTargets();
  const { plan, hasPlan, itemsFor, addItem, removeItem, applyAiPlan, clearDate, clearAll } =
    useDietPlan();

  const today = todayDateString();
  const [viewDate, setViewDate] = useState(today);
  const [stripStart, setStripStart] = useState(today);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const items = itemsFor(viewDate);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => ({
          calories: acc.calories + (it.calories || 0),
          protein_g: acc.protein_g + (it.protein_g || 0),
          carbs_g: acc.carbs_g + (it.carbs_g || 0),
          fat_g: acc.fat_g + (it.fat_g || 0),
          fiber_g: acc.fiber_g + (it.fiber_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      ),
    [items],
  );

  const byMeal = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    for (const it of items) {
      const bucket = map.get(it.meal) ?? [];
      bucket.push(it);
      map.set(it.meal, bucket);
    }
    return map;
  }, [items]);

  const mealOrder = [...MEALS, ...[...byMeal.keys()].filter(m => !MEALS.includes(m as never))];

  function jumpTo(date: string) {
    setViewDate(date);
    setStripStart(date);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Build with AI */}
      <button
        type="button"
        onClick={() => setBuilderOpen(true)}
        className="flex w-full items-center gap-3 overflow-hidden p-4 text-left"
        style={{
          borderRadius: 'var(--radius-card)',
          background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
          boxShadow: '0 12px 28px -12px rgba(108,99,255,0.6)',
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Build a 2-week plan with AI</p>
          <p className="text-[11px] text-white/80">
            Fills {PLAN_SPAN} days from {fmt(stripStart, { day: 'numeric', month: 'short' })} around your
            goal & macros.
          </p>
        </div>
      </button>

      {plan.summary ? (
        <p className="rounded-2xl bg-[var(--bg)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
          {plan.summary}
        </p>
      ) : null}

      {/* Week navigator: jump to any date + shift the strip */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => jumpTo(addDays(stripStart, -STRIP_DAYS))}
          aria-label="Previous fortnight"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]"
        >
          <ChevronLeft size={16} />
        </button>
        <label className="relative flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
          <CalendarDays size={14} className="text-[var(--accent)]" />
          <span>{fmt(stripStart, { day: 'numeric', month: 'short' })}</span>
          <span className="text-[var(--muted)]">→ {fmt(addDays(stripStart, STRIP_DAYS - 1), { day: 'numeric', month: 'short' })}</span>
          <input
            type="date"
            value={viewDate}
            onChange={e => e.target.value && jumpTo(e.target.value)}
            aria-label="Jump to date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => jumpTo(addDays(stripStart, STRIP_DAYS))}
          aria-label="Next fortnight"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: STRIP_DAYS }, (_, i) => {
          const date = addDays(stripStart, i);
          const active = date === viewDate;
          const filled = (plan.byDate[date]?.length ?? 0) > 0;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setViewDate(date)}
              className="flex shrink-0 flex-col items-center rounded-2xl px-3 py-2"
              style={
                active
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              <span className="text-[9px] font-bold uppercase opacity-80">
                {isToday ? 'Today' : fmt(date, { weekday: 'short' })}
              </span>
              <span className="text-sm font-bold">{fmt(date, { day: 'numeric' })}</span>
              <span
                className="mt-0.5 h-1 w-1 rounded-full"
                style={{ background: filled ? (active ? 'white' : 'var(--accent)') : 'transparent' }}
              />
            </button>
          );
        })}
      </div>

      <p className="text-xs font-bold text-[var(--text)]">{longDate(viewDate)}</p>

      {/* Meals for the viewed day */}
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-1 p-6 text-center">
            <Utensils size={22} className="text-[var(--muted)]" />
            <p className="text-sm font-semibold text-[var(--text)]">Nothing planned yet</p>
            <p className="text-[11px] text-[var(--muted)]">
              Add foods below, or let AI draft two weeks from here.
            </p>
          </div>
        ) : (
          mealOrder
            .filter(meal => byMeal.get(meal)?.length)
            .map(meal => (
              <div key={meal} className="glass-card p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {meal}
                </p>
                <div className="flex flex-col gap-2">
                  {byMeal.get(meal)!.map(it => (
                    <div key={it.id} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text)]">{it.name}</p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {it.calories} kcal · {it.protein_g}P · {it.carbs_g}C · {it.fat_g}F
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(viewDate, it.id)}
                        aria-label="Remove"
                        className="shrink-0 text-[var(--muted)]"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="glass-card flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[var(--accent)]"
        >
          <Plus size={16} /> Add food
        </button>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => clearDate(viewDate)}
            className="text-center text-[11px] font-semibold text-[var(--muted)]"
          >
            Clear this day
          </button>
        ) : null}
      </div>

      {/* Macro totals for the day */}
      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--text)]">What you'll get this day</p>
        <MacroBar label="Calories" value={Math.round(totals.calories)} goal={targets.calorieTarget} unit="kcal" />
        <MacroBar label="Protein" value={Math.round(totals.protein_g)} goal={targets.proteinTarget} unit="g" />
        <MacroBar label="Carbs" value={Math.round(totals.carbs_g)} goal={targets.carbTarget} unit="g" />
        <MacroBar label="Fat" value={Math.round(totals.fat_g)} goal={targets.fatTarget} unit="g" />
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xs text-[var(--muted)]">Fibre</span>
          <span className="text-xs font-semibold text-[var(--text)]">{Math.round(totals.fiber_g)} g</span>
        </div>
      </div>

      {hasPlan ? (
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear every planned day?')) clearAll();
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500"
        >
          <Trash2 size={13} /> Clear entire plan
        </button>
      ) : null}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Add food · ${longDate(viewDate)}`}>
        <AddFoodForm
          onAdd={item => {
            addItem(viewDate, item);
            setAddOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={builderOpen} onClose={() => setBuilderOpen(false)} title="Build 2-week plan">
        <PlanBuilderForm
          userId={session?.user?.id}
          startDate={stripStart}
          defaultGoal={goalDefault(profile?.goal_type)}
          calorieTarget={targets.calorieTarget}
          proteinTarget={targets.proteinTarget}
          onBuilt={result => {
            applyAiPlan(result, stripStart);
            setViewDate(stripStart);
            setBuilderOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function MacroBar({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--text)]">
          {value}
          {goal ? <span className="text-[var(--muted)]"> / {goal}</span> : null} {unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct ?? 0}%`, background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
}

function AddFoodForm({ onAdd }: { onAdd: (item: DietPlanItem) => void }) {
  const [meal, setMeal] = useState<string>(MEALS[0]);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      meal,
      name: name.trim(),
      calories: Math.round(Number(calories) || 0),
      protein_g: Math.round(Number(protein) || 0),
      carbs_g: Math.round(Number(carbs) || 0),
      fat_g: Math.round(Number(fat) || 0),
      fiber_g: Math.round(Number(fiber) || 0),
    });
  }

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="pf-meal">Meal</label>
        <select id="pf-meal" className={inputClass} value={meal} onChange={e => setMeal(e.target.value)}>
          {MEALS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="pf-name">Food & portion</label>
        <input
          id="pf-name"
          className={inputClass}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Greek yogurt 200g + berries"
        />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <NumField id="pf-cal" label="Calories" value={calories} setValue={setCalories} placeholder="kcal" />
        <NumField id="pf-pro" label="Protein (g)" value={protein} setValue={setProtein} placeholder="g" />
        <NumField id="pf-carb" label="Carbs (g)" value={carbs} setValue={setCarbs} placeholder="g" />
        <NumField id="pf-fat" label="Fat (g)" value={fat} setValue={setFat} placeholder="g" />
        <NumField id="pf-fib" label="Fibre (g)" value={fiber} setValue={setFiber} placeholder="g" />
      </div>
      <button type="submit" disabled={!name.trim()} className={submitButtonClass}>
        Add to plan
      </button>
    </form>
  );
}

function NumField({
  id,
  label,
  value,
  setValue,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={inputClass}
        type="number"
        inputMode="numeric"
        min="0"
        step="any"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function PlanBuilderForm({
  userId,
  startDate,
  defaultGoal,
  calorieTarget,
  proteinTarget,
  onBuilt,
}: {
  userId?: string;
  startDate: string;
  defaultGoal: string;
  calorieTarget: number;
  proteinTarget: number;
  onBuilt: (result: import('../lib/aiClient').DietPlanResult) => void;
}) {
  const [goal, setGoal] = useState(defaultGoal);
  const [diet, setDiet] = useState(DIET_OPTIONS[0]);
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('3');
  const [kcal, setKcal] = useState(String(calorieTarget));
  const [protein, setProtein] = useState(String(proteinTarget));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const input: DietPlanInput = {
      goal,
      diet,
      likes: likes.trim() || undefined,
      dislikes: dislikes.trim() || undefined,
      mealsPerDay: Number(mealsPerDay),
      calorieTarget: Number(kcal) || undefined,
      proteinTarget: Number(protein) || undefined,
      days: 7,
    };
    setGenerating(true);
    setError(null);
    try {
      const result = await generateDietPlan(userId, input);
      onBuilt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build a plan.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="mb-3 text-xs text-[var(--muted)]">
        AI drafts a varied week of meals and lays it across the 2 weeks starting{' '}
        {fmt(startDate, { weekday: 'long', day: 'numeric', month: 'short' })}. Every day stays
        editable — tweak anything before you follow it.
      </p>
      <div className="mb-3">
        <label className={labelClass} htmlFor="db-goal">Goal</label>
        <select id="db-goal" className={inputClass} value={goal} onChange={e => setGoal(e.target.value)}>
          {GOAL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="db-diet">Diet preference</label>
        <select id="db-diet" className={inputClass} value={diet} onChange={e => setDiet(e.target.value)}>
          {DIET_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <NumField id="db-kcal" label="Calorie target" value={kcal} setValue={setKcal} placeholder="kcal" />
        <NumField id="db-pro" label="Protein target" value={protein} setValue={setProtein} placeholder="g" />
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="db-meals">Meals per day</label>
        <select id="db-meals" className={inputClass} value={mealsPerDay} onChange={e => setMealsPerDay(e.target.value)}>
          {['2', '3', '4', '5'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className={labelClass} htmlFor="db-likes">Foods you love — optional</label>
        <input
          id="db-likes"
          className={inputClass}
          type="text"
          value={likes}
          onChange={e => setLikes(e.target.value)}
          placeholder="e.g. chicken, paneer, oats"
        />
      </div>
      <div className="mb-4">
        <label className={labelClass} htmlFor="db-dislikes">Foods to avoid — optional</label>
        <input
          id="db-dislikes"
          className={inputClass}
          type="text"
          value={dislikes}
          onChange={e => setDislikes(e.target.value)}
          placeholder="e.g. mushrooms, seafood"
        />
      </div>
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={generating} className={submitButtonClass}>
        {generating ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building your fortnight…
          </>
        ) : (
          <>
            <Sparkles size={15} className="mr-2" />
            Build my plan
          </>
        )}
      </button>
    </form>
  );
}
