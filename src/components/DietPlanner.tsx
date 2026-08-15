import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bell, BookMarked, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Plus, Sparkles, Trash2, Utensils, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { MealCategory } from '../types/database';
import { useProfile } from '../hooks/useProfile';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { usePushReminders } from '../hooks/usePushReminders';
import { PLAN_SPAN, useDietPlan, type PlanItem } from '../hooks/useDietPlan';
import { useDietSplit, DIET_DAY_OPTIONS, DIET_WEEKDAYS, type DietDayType } from '../hooks/useDietSplit';
import { curatedDayItems } from '../data/dietDayTemplates';
import { DayScheduleCard } from './DayScheduleCard';
import { useDaySchedule } from '../hooks/useDaySchedule';
import { mealTimesFromSchedule } from '../lib/daySchedule';
import { generateDietPlan, generateRecipe, type DietPlanInput, type DietPlanItem, type DietPlanResult, type RecipeResult } from '../lib/aiClient';
import { getCachedRecipe, setCachedRecipe } from '../lib/recipeCache';
import { addDays, todayDateString } from '../utils/date';
import { DIET_PLANS, type DietPlan } from '../data/dietPlans';
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

// Sensible default clock times so AI / predefined plans show times too.
const MEAL_TIME_DEFAULTS: Record<string, string> = {
  Breakfast: '08:00',
  Lunch: '13:00',
  Dinner: '19:30',
  Snack: '16:30',
};
// Diet-plan meals that map onto a push-reminder slot.
const MEAL_REMINDER_KEYS = { Breakfast: 'breakfast', Lunch: 'lunch', Dinner: 'dinner' } as const;
// Diet-plan meal label → diary meal category.
const MEAL_CATEGORY: Record<string, MealCategory> = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
  Snack: 'snack',
};
function mealCategoryFor(meal: string): MealCategory {
  return MEAL_CATEGORY[meal] ?? 'other';
}

function defaultMealTime(meal: string): string {
  return MEAL_TIME_DEFAULTS[meal] ?? '12:00';
}
function mealTimeOf(meal: string, list: PlanItem[]): string {
  return list.find(it => it.time)?.time ?? defaultMealTime(meal);
}
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

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
const BREAKFAST_OPTIONS = [
  { value: '', label: 'No preference' },
  { value: 'Overnight oats', label: 'Overnight oats' },
  { value: 'Eggs (omelette / boiled)', label: 'Eggs' },
  { value: 'Smoothie / protein shake', label: 'Smoothie / shake' },
  { value: 'Poha / upma', label: 'Poha / upma' },
  { value: 'Paneer / tofu scramble', label: 'Paneer / tofu scramble' },
  { value: 'Greek yogurt + fruit', label: 'Yogurt + fruit' },
  { value: 'Light paratha', label: 'Light paratha' },
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
  const { plan, hasPlan, itemsFor, addItem, addItems, removeItem, setMealTime, applyAiPlan, applyWeeklyPlan, repeatDay, clearDate, clearAll } =
    useDietPlan();
  const { split, setDay } = useDietSplit();
  const { inputs: scheduleInputs, update: updateSchedule } = useDaySchedule();
  const { status: pushStatus, prefs, enable, savePrefs } = usePushReminders();

  const today = todayDateString();
  const [viewDate, setViewDate] = useState(today);
  const [stripStart, setStripStart] = useState(today);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [predefinedOpen, setPredefinedOpen] = useState(false);
  const [curatedSplitOpen, setCuratedSplitOpen] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [remindering, setRemindering] = useState(false);
  // Planned items already logged to the diary this session (by id), so the
  // button flips to "Logged" and we don't double-add on a second tap.
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [diaryMsg, setDiaryMsg] = useState<string | null>(null);
  // Recipe sheet for a tapped planned meal.
  const [recipeItem, setRecipeItem] = useState<PlanItem | null>(null);

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

  // Non-AI build: assemble the fortnight instantly from curated day-templates
  // that match each weekday's style, tailored to home/office and breakfast.
  function quickFillFromSplit(locations: string[], breakfast: string) {
    // Line meal times up with your day schedule (breakfast soon after waking,
    // dinner = last meal). IF / OMAD days keep their own eating-window times.
    const times = mealTimesFromSchedule(scheduleInputs);
    const days = split.map((type, i) => {
      const keepTimes = type === 'IF 16:8' || type === 'Fasting (OMAD)';
      const items = curatedDayItems(type, { location: locations[i], breakfast }).map(it =>
        !keepTimes && times[it.meal] ? { ...it, time: times[it.meal] } : it,
      );
      return { items };
    });
    applyWeeklyPlan(
      {
        summary: 'Predefined week from your split — tailored to home/office days & breakfast. Every meal stays editable.',
        days,
      },
      stripStart,
    );
    setViewDate(stripStart);
    setCuratedSplitOpen(false);
  }

  // Push this day's breakfast/lunch/dinner times into the reminder prefs so the
  // existing notification system nudges you to eat on schedule.
  async function syncReminders() {
    setReminderMsg(null);
    if (pushStatus === 'unsupported') {
      setReminderMsg('Add the app to your Home Screen first, then reminders can turn on.');
      return;
    }
    if (pushStatus === 'unconfigured') {
      setReminderMsg('Reminders aren’t configured on this build yet.');
      return;
    }
    const next = { ...prefs, items: { ...prefs.items } };
    let synced = 0;
    for (const [meal, key] of Object.entries(MEAL_REMINDER_KEYS)) {
      const list = byMeal.get(meal);
      if (list?.length) {
        next.items[key] = { enabled: true, time: mealTimeOf(meal, list) };
        synced += 1;
      }
    }
    if (synced === 0) {
      setReminderMsg('Add breakfast, lunch or dinner to set meal reminders.');
      return;
    }
    setRemindering(true);
    try {
      if (pushStatus !== 'on') await enable();
      await savePrefs(next);
      setReminderMsg(`Reminders set for ${synced} meal time${synced > 1 ? 's' : ''}.`);
    } catch {
      setReminderMsg('Could not turn on reminders — try from Settings › Reminders.');
    } finally {
      setRemindering(false);
    }
  }

  // Log a planned meal straight into the diary (food_logs) with its macros —
  // no searching or re-entering. Stamped at the plan day + the meal's time.
  async function logItemToDiary(item: PlanItem, date: string) {
    if (!session?.user || loggedIds.has(item.id)) return;
    const meal_timestamp = new Date(`${date}T${item.time ?? '12:00'}:00`).toISOString();
    const { error } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: item.name,
      meal_category: mealCategoryFor(item.meal),
      meal_timestamp,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g,
    });
    if (!error) {
      setLoggedIds(prev => new Set(prev).add(item.id));
      setDiaryMsg('Added to your diary.');
    } else {
      setDiaryMsg('Could not add — try again.');
    }
  }

  async function logDayToDiary(date: string) {
    const list = itemsFor(date).filter(it => !loggedIds.has(it.id));
    for (const it of list) await logItemToDiary(it, date);
    if (list.length) setDiaryMsg(`Added ${list.length} meal${list.length > 1 ? 's' : ''} to your diary.`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Daily eating & wellness schedule */}
      <DayScheduleCard
        userId={session?.user?.id}
        goal={goalDefault(profile?.goal_type)}
        inputs={scheduleInputs}
        onUpdate={updateSchedule}
      />

      {/* Two ways to plan: predefined day-plans or AI */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPredefinedOpen(true)}
          className="glass-card flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold text-[var(--text)]"
        >
          <Utensils size={15} className="text-[var(--accent)]" /> Predefined plans
        </button>
        <button
          type="button"
          onClick={() => setBuilderOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          <Sparkles size={15} /> Build with AI
        </button>
      </div>
      <p className="-mt-2 text-[10px] text-[var(--muted)]">
        Predefined = drop a ready-made day (or single meals) onto any date. AI = fills {PLAN_SPAN} days
        from {fmt(stripStart, { day: 'numeric', month: 'short' })} around your goal & macros.
      </p>

      {/* Weekly diet split — pick a style per weekday, AI plans around it */}
      <div className="glass-card flex flex-col gap-2 p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Weekly diet split</p>
          <p className="text-[10px] text-[var(--muted)]">A style per day — like your workout split.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {DIET_WEEKDAYS.map((wd, i) => (
            <div key={wd} className="flex items-center gap-2">
              <span className="w-9 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{wd}</span>
              <select
                value={split[i]}
                onChange={e => setDay(i, e.target.value as DietDayType)}
                className="flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] outline-none"
              >
                {DIET_DAY_OPTIONS.map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setCuratedSplitOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--card-border)] bg-[var(--bg)] py-2.5 text-[11px] font-bold text-[var(--text)]"
          >
            <Utensils size={13} className="text-[var(--accent)]" /> Predefined meals
          </button>
          <button
            type="button"
            onClick={() => setSplitOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
          >
            <Sparkles size={13} /> Build with AI
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)]">
          Predefined meals = curated templates, instant &amp; offline (asks the same home/office &amp;
          breakfast options). AI = tailored to your goal &amp; macros.
        </p>
      </div>

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
              <span className="text-[10px] font-bold uppercase opacity-80">
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
            // Show meals in the order you actually eat them, by clock time.
            .sort((a, b) => mealTimeOf(a, byMeal.get(a)!).localeCompare(mealTimeOf(b, byMeal.get(b)!)))
            .map(meal => {
              const groupItems = byMeal.get(meal)!;
              const time = mealTimeOf(meal, groupItems);
              return (
              <div key={meal} className="glass-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    {meal}
                  </p>
                  <label className="relative flex items-center gap-1 rounded-full bg-[var(--bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)]">
                    <Clock size={12} className="text-[var(--accent)]" />
                    <span>{to12h(time)}</span>
                    <input
                      type="time"
                      value={time}
                      onChange={e => e.target.value && setMealTime(viewDate, meal, e.target.value)}
                      aria-label={`${meal} time`}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-2">
                  {byMeal.get(meal)!.map(it => {
                    const logged = loggedIds.has(it.id);
                    return (
                    <div key={it.id} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipeItem(it)}
                        className="min-w-0 flex-1 text-left"
                        aria-label={`Recipe for ${it.name}`}
                      >
                        <p className="text-sm font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-2">
                          {it.name}
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">
                          {it.calories} kcal · {it.protein_g}P · {it.carbs_g}C · {it.fat_g}F · ✨ tap for recipe
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => logItemToDiary(it, viewDate)}
                        disabled={logged}
                        aria-label={logged ? 'Logged to diary' : 'Log to diary'}
                        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold disabled:opacity-80"
                        style={
                          logged
                            ? { background: 'color-mix(in srgb, #22c55e 15%, transparent)', color: '#16a34a' }
                            : { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }
                        }
                      >
                        {logged ? <><Check size={11} /> Logged</> : <><Plus size={11} /> Log</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(viewDate, it.id)}
                        aria-label="Remove"
                        className="shrink-0 pt-1 text-[var(--muted)]"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
              );
            })
        )}

        {items.length > 0 ? (
          <button
            type="button"
            onClick={() => logDayToDiary(viewDate)}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}
          >
            <BookMarked size={16} /> Log this day’s meals to diary
          </button>
        ) : null}
        {diaryMsg ? (
          <p className="text-center text-[11px] font-semibold" style={{ color: '#16a34a' }}>{diaryMsg}</p>
        ) : null}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="glass-card flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[var(--accent)]"
        >
          <Plus size={16} /> Add food
        </button>
        {items.length > 0 ? (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => repeatDay(viewDate, stripStart)}
              className="text-center text-[11px] font-semibold text-[var(--accent)]"
            >
              Repeat this day all fortnight
            </button>
            <button
              type="button"
              onClick={() => clearDate(viewDate)}
              className="text-center text-[11px] font-semibold text-[var(--muted)]"
            >
              Clear this day
            </button>
          </div>
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

      {/* Meal-time reminders */}
      {items.length > 0 ? (
        <div className="glass-card flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-[var(--accent)]" />
            <p className="text-sm font-semibold text-[var(--text)]">Meal reminders</p>
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Get a nudge at each meal time so you never skip or forget to log. Uses your
            breakfast / lunch / dinner times from this day.
          </p>
          <button
            type="button"
            onClick={syncReminders}
            disabled={remindering}
            className="mt-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
          >
            <Bell size={14} /> {remindering ? 'Setting…' : 'Remind me at these meal times'}
          </button>
          {reminderMsg ? (
            <p className="text-center text-[11px] font-semibold text-[var(--accent)]">{reminderMsg}</p>
          ) : null}
        </div>
      ) : null}

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

      <Sheet open={predefinedOpen} onClose={() => setPredefinedOpen(false)} title="Predefined plans">
        <PredefinedPlanPicker
          defaultDate={viewDate}
          onAddDay={(date, planItems) => {
            addItems(date, planItems);
            setViewDate(date);
            setStripStart(date);
            setPredefinedOpen(false);
          }}
          onAddItem={(date, item) => {
            addItem(date, item);
            setViewDate(date);
            setStripStart(date);
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

      <Sheet open={splitOpen} onClose={() => setSplitOpen(false)} title="Build from weekly split">
        <PlanBuilderForm
          userId={session?.user?.id}
          startDate={stripStart}
          defaultGoal={goalDefault(profile?.goal_type)}
          calorieTarget={targets.calorieTarget}
          proteinTarget={targets.proteinTarget}
          dayTypes={split}
          onBuilt={result => {
            applyWeeklyPlan(result, stripStart);
            setViewDate(stripStart);
            setSplitOpen(false);
          }}
        />
      </Sheet>

      <Sheet open={curatedSplitOpen} onClose={() => setCuratedSplitOpen(false)} title="Predefined meals from split">
        <CuratedSplitForm dayTypes={split} startDate={stripStart} onBuild={quickFillFromSplit} />
      </Sheet>

      <Sheet open={recipeItem != null} onClose={() => setRecipeItem(null)} title="Recipe">
        {recipeItem ? (
          <RecipeSheet
            userId={session?.user?.id}
            item={recipeItem}
            onLog={() => {
              logItemToDiary(recipeItem, viewDate);
              setRecipeItem(null);
            }}
            alreadyLogged={loggedIds.has(recipeItem.id)}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

function RecipeSheet({
  userId,
  item,
  onLog,
  alreadyLogged,
}: {
  userId?: string;
  item: PlanItem;
  onLog: () => void;
  alreadyLogged: boolean;
}) {
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    // Reuse a previously generated recipe for this exact meal (no AI spend).
    const cached = getCachedRecipe(item.name, item.calories, item.protein_g, item.carbs_g, item.fat_g);
    if (cached) {
      setRecipe(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    if (!userId) {
      setError('Sign in to generate a recipe.');
      setLoading(false);
      return;
    }
    generateRecipe(userId, {
      mealName: item.name,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
    })
      .then(r => {
        if (cancelled) return;
        setRecipe(r);
        setCachedRecipe(item.name, item.calories, item.protein_g, item.carbs_g, item.fat_g, r);
      })
      .catch(() => {
        if (!cancelled) setError('Could not fetch a recipe. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text)]">{item.name}</p>
        <p className="text-[11px] text-[var(--muted)]">
          {item.meal} · {item.calories} kcal · {item.protein_g}P / {item.carbs_g}C / {item.fat_g}F
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[var(--muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
          Writing your recipe…
        </div>
      ) : error ? (
        <p className={errorTextClass}>{error}</p>
      ) : recipe ? (
        <>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Ingredients · {recipe.servings === 1 ? '1 serving' : `${recipe.servings} servings`}
            </p>
            <div className="glass-card flex flex-col gap-1 p-3">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text)]">{ing.item}</span>
                  <span className="font-semibold text-[var(--muted)]">{ing.grams} g</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Method</p>
            <ol className="flex flex-col gap-2">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text)]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[10px] font-black text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {recipe.tip ? (
            <p className="rounded-2xl bg-[var(--bg)] px-3 py-2 text-[11px] text-[var(--muted)]">💡 {recipe.tip}</p>
          ) : null}

          <button
            type="button"
            onClick={onLog}
            disabled={alreadyLogged}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-70"
            style={{ background: alreadyLogged ? '#16a34a' : 'linear-gradient(135deg, #22c55e, #15803d)' }}
          >
            {alreadyLogged ? <><Check size={16} /> Already logged</> : <><Plus size={16} /> I ate this — log to diary</>}
          </button>
        </>
      ) : null}
    </div>
  );
}

function CuratedSplitForm({
  dayTypes,
  startDate,
  onBuild,
}: {
  dayTypes: DietDayType[];
  startDate: string;
  onBuild: (locations: string[], breakfast: string) => void;
}) {
  const [locations, setLocations] = useState<string[]>(() => dayTypes.map(() => 'Home'));
  const [breakfast, setBreakfast] = useState('');

  function toggleLoc(i: number) {
    setLocations(prev => prev.map((l, idx) => (idx === i ? (l === 'Home' ? 'Office' : 'Home') : l)));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--muted)]">
        Assembles a curated week from your split ({dayTypes.join(', ')}) — instant &amp; offline,
        no AI credit. It still tailors each day to home vs office and your breakfast. Repeats across
        the fortnight from {fmt(startDate, { weekday: 'long', day: 'numeric', month: 'short' })};
        every meal stays editable.
      </p>

      <div>
        <label className={labelClass}>Your week — tap a day to flip Home ⇄ Office</label>
        <div className="flex gap-1">
          {dayTypes.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleLoc(i)}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5"
              style={
                locations[i] === 'Office'
                  ? { background: 'color-mix(in srgb, #f59e0b 16%, transparent)', color: '#b45309' }
                  : { background: 'var(--bg)', color: 'var(--muted)' }
              }
            >
              <span className="text-[10px] font-bold uppercase">{DIET_WEEKDAYS[i]}</span>
              <span className="text-[10px] font-semibold">{locations[i] === 'Office' ? 'Office' : 'Home'}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          Office days get a portable prep-box lunch instead of a cooked one.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="cs-breakfast">Breakfast style</label>
        <select
          id="cs-breakfast"
          className={inputClass}
          value={breakfast}
          onChange={e => setBreakfast(e.target.value)}
        >
          {BREAKFAST_OPTIONS.map(o => (
            <option key={o.label} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <button type="button" onClick={() => onBuild(locations, breakfast)} className={submitButtonClass}>
        <Utensils size={15} className="mr-2" /> Build predefined week
      </button>
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

function PredefinedPlanPicker({
  defaultDate,
  onAddDay,
  onAddItem,
}: {
  defaultDate: string;
  onAddDay: (date: string, items: DietPlanItem[]) => void;
  onAddItem: (date: string, item: DietPlanItem) => void;
}) {
  const [selected, setSelected] = useState<DietPlan | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [section, setSection] = useState<string>(MEALS[0]);
  const [addedDay, setAddedDay] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  if (!selected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[var(--muted)]">
          Pick a ready-made day — add the whole thing to a date, or just the meals you want.
        </p>
        {DIET_PLANS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setSelected(p);
              setAddedDay(false);
              setAddedItems(new Set());
            }}
            className="glass-card flex items-center gap-3 p-3 text-left"
          >
            <span className="text-2xl">{p.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text)]">{p.name}</p>
              <p className="text-[11px] text-[var(--muted)]">{p.focus}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--muted)]" />
          </button>
        ))}
      </div>
    );
  }

  const t = selected.items.reduce(
    (acc, it) => ({
      kcal: acc.kcal + it.calories,
      p: acc.p + it.protein_g,
      c: acc.c + it.carbs_g,
      f: acc.f + it.fat_g,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
  const dateLabel = fmt(date, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="flex items-center gap-1 self-start text-xs font-semibold text-[var(--accent)]"
      >
        <ChevronLeft size={14} /> All plans
      </button>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{selected.emoji}</span>
        <div>
          <p className="text-sm font-bold text-[var(--text)]">{selected.name}</p>
          <p className="text-[11px] text-[var(--muted)]">{selected.focus}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'kcal', value: Math.round(t.kcal) },
          { label: 'P', value: `${Math.round(t.p)}g` },
          { label: 'C', value: `${Math.round(t.c)}g` },
          { label: 'F', value: `${Math.round(t.f)}g` },
        ].map(m => (
          <div key={m.label} className="rounded-xl bg-[var(--bg)] p-2">
            <p className="text-sm font-black text-[var(--text)]">{m.value}</p>
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{m.label}</p>
          </div>
        ))}
      </div>

      <div>
        <label className={labelClass}>Date</label>
        <input
          className={inputClass}
          type="date"
          value={date}
          onChange={e => e.target.value && setDate(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          onAddDay(date, selected.items);
          setAddedDay(true);
        }}
        className={submitButtonClass}
      >
        {addedDay ? (
          <>
            <Check size={15} className="mr-2" /> Added to {dateLabel}
          </>
        ) : (
          `Add whole day to ${dateLabel}`
        )}
      </button>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--text)]">Or add single meals as</span>
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          className="rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] outline-none"
        >
          {MEALS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {selected.items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text)]">{it.name}</p>
              <p className="text-[10px] text-[var(--muted)]">
                {it.meal} · {it.calories} kcal · {it.protein_g}P/{it.carbs_g}C/{it.fat_g}F
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onAddItem(date, { ...it, meal: section });
                setAddedItems(prev => new Set(prev).add(i));
              }}
              disabled={addedItems.has(i)}
              className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-70"
              style={
                addedItems.has(i)
                  ? { background: 'color-mix(in srgb, #22c55e 15%, transparent)', color: '#16a34a' }
                  : { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }
              }
            >
              {addedItems.has(i) ? (
                <>
                  <Check size={12} /> Added
                </>
              ) : (
                <>
                  <Plus size={12} /> Add
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddFoodForm({ onAdd }: { onAdd: (item: DietPlanItem) => void }) {
  const [meal, setMeal] = useState<string>(MEALS[0]);
  const [time, setTime] = useState<string>(defaultMealTime(MEALS[0]));
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
      time,
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
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="pf-meal">Meal</label>
          <select
            id="pf-meal"
            className={inputClass}
            value={meal}
            onChange={e => {
              setMeal(e.target.value);
              setTime(defaultMealTime(e.target.value));
            }}
          >
            {MEALS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-time">Time</label>
          <input id="pf-time" className={inputClass} type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
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
  dayTypes,
  onBuilt,
}: {
  userId?: string;
  startDate: string;
  defaultGoal: string;
  calorieTarget: number;
  proteinTarget: number;
  dayTypes?: DietDayType[];
  onBuilt: (result: DietPlanResult) => void;
}) {
  const hasSplit = Boolean(dayTypes && dayTypes.length);
  const [goal, setGoal] = useState(defaultGoal);
  const [diet, setDiet] = useState(DIET_OPTIONS[0]);
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState('3');
  const [kcal, setKcal] = useState(String(calorieTarget));
  const [protein, setProtein] = useState(String(proteinTarget));
  // Dietitian context.
  const [locations, setLocations] = useState<string[]>(() => dayTypes?.map(() => 'Home') ?? []);
  const [ingredients, setIngredients] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [prepStyle, setPrepStyle] = useState('Cook fresh daily');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleLoc(i: number) {
    setLocations(prev => prev.map((l, idx) => (idx === i ? (l === 'Home' ? 'Office' : 'Home') : l)));
  }

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
      dayTypes: hasSplit ? dayTypes : undefined,
      dayLocations: hasSplit ? locations : undefined,
      ingredients: ingredients.trim() || undefined,
      breakfast: breakfast || undefined,
      prepStyle,
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
        {hasSplit
          ? `Like a dietitian: plans each day around your split (${dayTypes!.join(', ')}), your week (home vs office), and what you have — then repeats it across the fortnight from `
          : 'AI drafts a varied week of meals and lays it across the 2 weeks starting '}
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

      {/* Dietitian context — where each day is spent, what you have, breakfast, prep */}
      {hasSplit ? (
        <div className="mb-3">
          <label className={labelClass}>Your week — tap a day to flip Home ⇄ Office</label>
          <div className="flex gap-1">
            {dayTypes!.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleLoc(i)}
                className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5"
                style={
                  locations[i] === 'Office'
                    ? { background: 'color-mix(in srgb, #f59e0b 16%, transparent)', color: '#b45309' }
                    : { background: 'var(--bg)', color: 'var(--muted)' }
                }
              >
                <span className="text-[10px] font-bold uppercase">{DIET_WEEKDAYS[i]}</span>
                <span className="text-[10px] font-semibold">{locations[i] === 'Office' ? 'Office' : 'Home'}</span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            Office days get easy prep-ahead meals — salads, wraps, overnight oats, pre-cooked boxes.
          </p>
        </div>
      ) : null}

      <div className="mb-3">
        <label className={labelClass} htmlFor="db-ingredients">What do you have at home? — optional</label>
        <input
          id="db-ingredients"
          className={inputClass}
          type="text"
          value={ingredients}
          onChange={e => setIngredients(e.target.value)}
          placeholder="e.g. oats, eggs, paneer, rice, spinach, chicken"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="db-breakfast">Breakfast style</label>
          <select id="db-breakfast" className={inputClass} value={breakfast} onChange={e => setBreakfast(e.target.value)}>
            {BREAKFAST_OPTIONS.map(o => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="db-prep">Cooking style</label>
          <select id="db-prep" className={inputClass} value={prepStyle} onChange={e => setPrepStyle(e.target.value)}>
            <option value="Cook fresh daily">Cook fresh daily</option>
            <option value="Batch-prep on the weekend">Batch-prep weekend</option>
          </select>
        </div>
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
