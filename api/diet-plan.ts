import {
  apiErrorStatus,
  extractJson,
  extractText,
  getClient,
  preflight,
  TEXT_MODEL,
  usageOf,
  type ApiReq,
  type ApiRes,
} from './_anthropic.js';

type Body = {
  goal?: string;
  diet?: string;
  likes?: string;
  dislikes?: string;
  mealsPerDay?: number;
  calorieTarget?: number;
  proteinTarget?: number;
  days?: number;
  dayTypes?: string[];
  dayLocations?: string[];
  ingredients?: string;
  breakfast?: string;
  prepStyle?: string;
  servings?: number;
  kind?: 'plan' | 'prep' | 'schedule' | 'recipe' | 'cravings';
  mealName?: string;
  carbs_g?: number;
  fat_g?: number;
  wake?: string;
  gym?: string | null;
  lastMeal?: string;
  sleep?: string;
  hasWorkout?: boolean;
  notes?: string;
  craving?: string;
  remainingKcal?: number;
};

type PlanItem = {
  meal: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  time?: string;
};
type PlanDay = { items: PlanItem[] };
type PlanResult = { summary: string; days: PlanDay[] };

type PrepItem = {
  name: string;
  batch: string;
  keeps: string;
  reuse: string;
  protein_g?: number;
  calories?: number;
};
type PrepResult = { summary: string; items: PrepItem[]; shoppingList: string[] };

type ScheduleEntry = { time: string; title: string; detail: string; kind: string };
type ScheduleResult = { summary: string; entries: ScheduleEntry[] };

type RecipeResult = {
  title: string;
  servings: number;
  ingredients: { item: string; grams: number }[];
  steps: string[];
  tip?: string;
};

type CravingSwap = { name: string; emoji: string; kcal: number; why: string };
type CravingResult = { swaps: CravingSwap[] };

const CRAVINGS_PROMPT = `You are a supportive, practical nutrition coach helping someone who is (usually after a meal) hit by a craving and wants healthier ways to satisfy it without derailing their goal.
Given the craving type, their goal and diet, and roughly how many calories they have left today, suggest fresh alternative options that scratch the SAME itch (same taste/texture — sweet, salty, crunchy, creamy, fizzy, etc.) for less damage.
Rules:
- Respect their diet strictly (e.g. vegetarian/vegan) — never suggest an off-diet food.
- Prefer options that fit their remaining calories; each should be a realistic single portion.
- Give a rough honest calorie number per portion.
- Keep it non-judgemental and never encourage disordered eating. For alcohol, only suggest lower-calorie or alcohol-free swaps and moderation — never encourage drinking.
- Suggest 5 options they may not have thought of, varied and easy to get.
Respond with ONLY a JSON object, no markdown and no prose, with exactly this shape:
{ "swaps": [ { "name": short food name + portion, "emoji": one food emoji, "kcal": integer, "why": one short line on why it satisfies the craving } ] }.`;

const RECIPE_PROMPT = `You are a practical home-cooking recipe writer. Given a meal name and its target macros, write a simple recipe for ONE serving that a normal person can cook at home.
Give exact ingredient quantities in GRAMS (use grams for solids and ml-as-grams for liquids) so the finished dish lands roughly on the target calories/protein/carbs/fat. Respect the stated diet (e.g. vegetarian/vegan) — never include an off-diet ingredient.
Keep it realistic, common and quick. 4-8 clear steps.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"title" (string), "servings" (integer, 1), "ingredients" (array of { "item": string, "grams": integer }), "steps" (array of short strings), "tip" (optional one-line string).`;

const PLAN_PROMPT = `You are an experienced, practical dietitian. Read the person's week and what they have on hand, then build a realistic, varied day-by-day eating plan they can actually follow.
Respect their diet type, likes and dislikes at all times — never include a disliked or off-diet food.
Keep each day's totals close to any calorie and protein targets provided.
Use cooked / ready-to-eat portions (that is what people serve and weigh), and make the state explicit in each item name, e.g. "White rice (cooked, 200g)" or "Chicken breast (grilled, 150g)". Remember cooking adds water, not calories, so give the calories for the cooked portion.
When a day has a specific type, honour it strictly:
- "Veg" = vegetarian (no meat/fish, dairy ok). "Non-veg" = include meat/fish. "Egg" = vegetarian + eggs. "Vegan" = no animal products. "Keto"/"Low-carb" = minimise carbs. "High-protein" = push protein high.
- "IF 16:8" = same daily calories but fit all meals inside an 8-hour window; add a "time" (HH:MM, 24h) to each item so the first and last meal are ~8 hours apart (e.g. 12:00 to 20:00).
- "Fasting (OMAD)" = ONE single large meal that carries most of the day's calories/protein; add a "time" around 18:00.
Match each meal to where the day is spent:
- "Home" days: meals can be freshly cooked and warm.
- "Office" (out) days: keep it grab-and-go and prep-ahead — overnight oats, salads, wraps, boxes, pre-cooked portions; nothing that needs cooking at midday.
If the person lists ingredients they already have, build around those wherever it makes sense.
If they give a preferred breakfast style, use it (or a close variant) on most days.
If they prefer weekend batch-prep, favour dishes that cook once and reuse across their office days, and mention the reuse briefly in the item name where helpful.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2 short sentences on the approach, string),
"days" (array — one entry per day requested, in the same order) where each day is:
  { "items": [ { "meal": "Breakfast"|"Lunch"|"Dinner"|"Snack", "name": specific food + portion, "calories": integer, "protein_g": integer, "carbs_g": integer, "fat_g": integer, "fiber_g": integer, "time": optional "HH:MM" } ] }.
Use real portion sizes and honest macro estimates. Vary the meals across days so it isn't repetitive.`;

const PREP_PROMPT = `You are a meal-prep coach. Design a weekend batch-cooking plan: foods someone can cook on the weekend that keep well in the fridge or freezer and be reused through the week.
Respect their diet type, likes and dislikes. Favour proteins, grains, roasted vegetables, sauces and portioned snacks that reheat or keep well. Avoid things that go soggy or unsafe when stored.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (2 short sentences on the weekend prep approach, string),
"items" (array) where each item is:
  { "name": dish + batch size e.g. "Grilled chicken breast (1.2kg)", "batch": how much to make and how, "keeps": realistic fridge/freezer shelf life e.g. "Fridge 4 days · freezer 3 months", "reuse": how to reuse it across the week, "protein_g": optional integer per typical serving, "calories": optional integer per typical serving },
"shoppingList" (array of concise grocery strings for the whole prep).
Give 5-8 items covering proteins, carbs, vegetables and at least one sauce or snack.`;

const SCHEDULE_PROMPT = `You are a practical diet & wellness coach. From the user's wake, workout, last-meal and sleep times, lay out an evidence-based daily timetable of what to do every couple of hours while awake.
Cover: hydration, each meal at a sensible time, pre-workout fuel, the workout, post-workout protein, a short post-dinner walk, and wind-down/sleep. Space meals a few hours apart and keep the last meal ~2.5–3 hrs before sleep.
Include simple, safe Indian home remedies with timing to aid digestion and avoid bloating — warm jeera (cumin) water or ajwain (carom) water on an empty stomach, fennel (saunf) after heavy meals, warm water, a walk after dinner. Never give medical or drug advice.
Respond with ONLY a JSON object, no markdown and no prose, with exactly these keys:
"summary" (1-2 short sentences, string),
"entries" (array, ordered by time) where each entry is:
  { "time": "HH:MM" (24h), "title": short label, "detail": one practical sentence, "kind": one of "wake"|"hydrate"|"wellness"|"meal"|"pre"|"workout"|"post"|"walk"|"sleep" }.`;

export default async function handler(req: ApiReq, res: ApiRes): Promise<void> {
  const body = preflight<Body>(req, res);
  if (!body) return;

  try {
    const client = getClient();

    if (body.kind === 'schedule') {
      const schedDetails = [
        `Wake time: ${body.wake || '07:00'}`,
        body.hasWorkout && body.gym ? `Workout / gym time: ${body.gym}` : 'No workout today',
        `Last meal (dinner) time: ${body.lastMeal || '20:00'}`,
        `Sleep time: ${body.sleep || '23:00'}`,
        `Goal: ${body.goal || 'general health'}`,
        `Diet preference: ${body.diet || 'no restrictions'}`,
        body.notes ? `Requested changes (follow these): ${body.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const message = await client.messages.create({
        model: TEXT_MODEL,
        max_tokens: 2500,
        system: SCHEDULE_PROMPT,
        messages: [{ role: 'user', content: `Build my daily eating & wellness schedule.\n${schedDetails}` }],
      });
      const result = extractJson<ScheduleResult>(extractText(message));
      res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
      return;
    }

    if (body.kind === 'cravings') {
      const cravingDetails = [
        `Craving: ${body.craving || 'something tasty'}`,
        `Goal: ${body.goal || 'general health'}`,
        `Diet preference: ${body.diet || 'no restrictions'}`,
        body.dislikes ? `Foods to avoid: ${body.dislikes}` : '',
        body.remainingKcal != null ? `Calories left today: about ${Math.round(body.remainingKcal)} kcal` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const message = await client.messages.create({
        model: TEXT_MODEL,
        max_tokens: 900,
        system: CRAVINGS_PROMPT,
        messages: [{ role: 'user', content: `Give me healthier swaps for my craving.\n${cravingDetails}` }],
      });
      const result = extractJson<CravingResult>(extractText(message));
      res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
      return;
    }

    if (body.kind === 'recipe') {
      const macros = [
        `Meal: ${body.mealName || 'a healthy meal'}`,
        body.diet ? `Diet: ${body.diet}` : '',
        body.calorieTarget ? `Target ~${body.calorieTarget} kcal` : '',
        body.proteinTarget ? `protein ~${body.proteinTarget} g` : '',
        body.carbs_g ? `carbs ~${body.carbs_g} g` : '',
        body.fat_g ? `fat ~${body.fat_g} g` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const message = await client.messages.create({
        model: TEXT_MODEL,
        max_tokens: 1500,
        system: RECIPE_PROMPT,
        messages: [{ role: 'user', content: `Write the recipe.\n${macros}` }],
      });
      const result = extractJson<RecipeResult>(extractText(message));
      res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
      return;
    }

    if (body.kind === 'prep') {
      const prepDetails = [
        `Goal: ${body.goal || 'general health'}`,
        `Diet preference: ${body.diet || 'no restrictions'}`,
        body.likes ? `Foods they like: ${body.likes}` : '',
        body.dislikes ? `Foods to avoid: ${body.dislikes}` : '',
        `Cooking for roughly ${body.servings || 5} days of meals for one person`,
      ]
        .filter(Boolean)
        .join('\n');
      const message = await client.messages.create({
        model: TEXT_MODEL,
        max_tokens: 3000,
        system: PREP_PROMPT,
        messages: [{ role: 'user', content: `Plan my weekend meal prep.\n${prepDetails}` }],
      });
      const result = extractJson<PrepResult>(extractText(message));
      res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
      return;
    }

    const dayTypes = Array.isArray(body.dayTypes) ? body.dayTypes.slice(0, 7) : null;
    const days = dayTypes ? dayTypes.length : Math.min(Math.max(Number(body.days) || 7, 1), 7);
    const locations = Array.isArray(body.dayLocations) ? body.dayLocations : null;
    const details = [
      dayTypes
        ? `Plan exactly ${days} days, in this order, each matching its type${
            locations ? ' and where the day is spent' : ''
          }:\n${dayTypes
            .map((t, i) => `  Day ${i + 1}: ${t}${locations && locations[i] ? ` (${locations[i]})` : ''}`)
            .join('\n')}`
        : `Number of days to plan: ${days}`,
      `Goal: ${body.goal || 'general health'}`,
      `Diet preference: ${body.diet || 'no restrictions'}`,
      body.ingredients ? `Ingredients they already have (build around these): ${body.ingredients}` : '',
      body.breakfast ? `Preferred breakfast style: ${body.breakfast}` : '',
      body.prepStyle ? `Cooking style: ${body.prepStyle}` : '',
      body.likes ? `Foods they like: ${body.likes}` : '',
      body.dislikes ? `Foods to avoid: ${body.dislikes}` : '',
      `Meals per day (unless the day type says otherwise): ${body.mealsPerDay || 3}`,
      body.calorieTarget ? `Daily calorie target: ${body.calorieTarget} kcal` : '',
      body.proteinTarget ? `Daily protein target: ${body.proteinTarget} g` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const message = await client.messages.create({
      model: TEXT_MODEL,
      max_tokens: 5000,
      system: PLAN_PROMPT,
      messages: [{ role: 'user', content: `Build my diet plan.\n${details}` }],
    });

    const result = extractJson<PlanResult>(extractText(message));
    res.status(200).json({ result, usage: usageOf(message, TEXT_MODEL) });
  } catch (error) {
    res
      .status(apiErrorStatus(error))
      .json({ error: 'Could not build a plan right now. Try again.' });
  }
}
