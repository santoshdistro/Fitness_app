// Curated one-day meal templates for each weekly-split style, so a week can be
// assembled instantly without an AI call. Tuned to be protein-DENSE and lean —
// lean meats, egg whites, whey and non-fat dairy — so protein lands high
// without the calorie total ballooning. Times are sensible defaults; the diet
// planner re-times standard meals to your day schedule. Every meal stays
// editable after it's applied.
import type { DietPlanItem } from '../lib/aiClient';
import type { DietDayType } from '../hooks/useDietSplit';

export const DIET_DAY_TEMPLATES: Record<DietDayType, DietPlanItem[]> = {
  Any: [
    { meal: 'Breakfast', name: 'Oats (40g) + whey + 2 eggs', calories: 380, protein_g: 34, carbs_g: 40, fat_g: 12, fiber_g: 5, time: '08:00' },
    { meal: 'Lunch', name: 'Dal + rice + grilled chicken 120g + low-fat curd', calories: 560, protein_g: 42, carbs_g: 70, fat_g: 10, fiber_g: 11, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + almonds, cashews & 2 dates', calories: 350, protein_g: 35, carbs_g: 26, fat_g: 12, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Chicken/paneer 150g + 2 roti + salad', calories: 540, protein_g: 40, carbs_g: 45, fat_g: 16, fiber_g: 8, time: '20:00' },
  ],
  Veg: [
    { meal: 'Breakfast', name: '2 besan chilla + low-fat curd', calories: 340, protein_g: 22, carbs_g: 35, fat_g: 12, fiber_g: 5, time: '08:00' },
    { meal: 'Lunch', name: 'Rajma + rice + low-fat curd + salad', calories: 560, protein_g: 26, carbs_g: 85, fat_g: 8, fiber_g: 14, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + almonds, cashews & 2 dates', calories: 350, protein_g: 35, carbs_g: 26, fat_g: 12, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Low-fat paneer 150g tikka + 2 roti', calories: 520, protein_g: 34, carbs_g: 46, fat_g: 18, fiber_g: 8, time: '20:00' },
  ],
  'Non-veg': [
    { meal: 'Breakfast', name: '2 whole eggs + 6 whites scramble + 1 toast', calories: 320, protein_g: 34, carbs_g: 20, fat_g: 12, fiber_g: 2, time: '08:00' },
    { meal: 'Lunch', name: 'Grilled chicken breast 200g + rice + veg', calories: 600, protein_g: 52, carbs_g: 62, fat_g: 10, fiber_g: 7, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + almonds, cashews & 2 dates', calories: 350, protein_g: 35, carbs_g: 26, fat_g: 12, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'White fish 200g + 2 roti + salad', calories: 560, protein_g: 44, carbs_g: 45, fat_g: 16, fiber_g: 7, time: '20:00' },
  ],
  Egg: [
    { meal: 'Breakfast', name: '2 whole + 6 white eggs + 1 toast', calories: 320, protein_g: 34, carbs_g: 16, fat_g: 14, fiber_g: 1, time: '08:00' },
    { meal: 'Lunch', name: 'Egg curry (3 egg) + rice + salad', calories: 520, protein_g: 26, carbs_g: 68, fat_g: 16, fiber_g: 8, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + almonds, cashews & 2 dates', calories: 350, protein_g: 38, carbs_g: 26, fat_g: 12, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Veg pulao + curd + 2 boiled eggs', calories: 520, protein_g: 28, carbs_g: 60, fat_g: 16, fiber_g: 6, time: '20:00' },
  ],
  Vegan: [
    { meal: 'Breakfast', name: 'Tofu scramble (150g) + 1 toast + soy milk', calories: 360, protein_g: 28, carbs_g: 30, fat_g: 14, fiber_g: 6, time: '08:00' },
    { meal: 'Lunch', name: 'Chana masala + rice', calories: 560, protein_g: 24, carbs_g: 88, fat_g: 10, fiber_g: 15, time: '13:00' },
    { meal: 'Snack', name: 'Pea/soy protein in soy milk + almonds, cashews & 2 dates', calories: 320, protein_g: 30, carbs_g: 28, fat_g: 12, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Tofu (200g) stir-fry + quinoa', calories: 520, protein_g: 30, carbs_g: 50, fat_g: 16, fiber_g: 9, time: '20:00' },
  ],
  'Low-carb': [
    { meal: 'Breakfast', name: '3-egg omelette + cheese', calories: 340, protein_g: 26, carbs_g: 4, fat_g: 26, fiber_g: 1, time: '08:00' },
    { meal: 'Lunch', name: 'Grilled chicken salad 200g + olive oil', calories: 500, protein_g: 46, carbs_g: 12, fat_g: 28, fiber_g: 6, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + almonds (skip dates)', calories: 300, protein_g: 33, carbs_g: 12, fat_g: 16, fiber_g: 2, time: '16:30' },
    { meal: 'Dinner', name: 'Fish or paneer 180g + sautéed greens', calories: 480, protein_g: 40, carbs_g: 10, fat_g: 30, fiber_g: 6, time: '20:00' },
  ],
  'High-protein': [
    { meal: 'Breakfast', name: '2 whole + 6 whites + oats (40g)', calories: 380, protein_g: 42, carbs_g: 32, fat_g: 10, fiber_g: 4, time: '08:00' },
    { meal: 'Lunch', name: 'Chicken breast 220g + rice + veg', calories: 640, protein_g: 60, carbs_g: 62, fat_g: 10, fiber_g: 7, time: '13:00' },
    { meal: 'Snack', name: '1 scoop whey in low-fat milk + Greek yogurt + almonds', calories: 360, protein_g: 48, carbs_g: 24, fat_g: 12, fiber_g: 2, time: '16:30' },
    { meal: 'Dinner', name: 'White fish 200g + quinoa + salad', calories: 560, protein_g: 46, carbs_g: 42, fat_g: 14, fiber_g: 7, time: '20:00' },
  ],
  Keto: [
    { meal: 'Breakfast', name: 'Eggs + cheese + avocado', calories: 460, protein_g: 28, carbs_g: 6, fat_g: 38, fiber_g: 4, time: '08:00' },
    { meal: 'Lunch', name: 'Chicken thigh 200g + buttered greens', calories: 560, protein_g: 44, carbs_g: 8, fat_g: 40, fiber_g: 5, time: '13:00' },
    { meal: 'Snack', name: 'Cheese + few nuts', calories: 240, protein_g: 14, carbs_g: 6, fat_g: 20, fiber_g: 2, time: '16:30' },
    { meal: 'Dinner', name: 'Salmon or paneer 180g + salad + olive oil', calories: 520, protein_g: 38, carbs_g: 8, fat_g: 38, fiber_g: 5, time: '20:00' },
  ],
  'IF 16:8': [
    { meal: 'Lunch', name: 'Chicken 200g + rice + veg (break the fast)', calories: 680, protein_g: 55, carbs_g: 65, fat_g: 14, fiber_g: 8, time: '12:00' },
    { meal: 'Snack', name: 'Whey + Greek yogurt + fruit', calories: 320, protein_g: 42, carbs_g: 28, fat_g: 4, fiber_g: 4, time: '16:00' },
    { meal: 'Dinner', name: 'White fish 180g + roti + salad', calories: 600, protein_g: 45, carbs_g: 45, fat_g: 18, fiber_g: 9, time: '19:30' },
  ],
  'Fasting (OMAD)': [
    { meal: 'Dinner', name: 'OMAD plate: chicken 220g + rice + dal + veg + curd', calories: 1600, protein_g: 120, carbs_g: 140, fat_g: 45, fiber_g: 18, time: '18:00' },
  ],
};

export function dayTemplateItems(type: DietDayType): DietPlanItem[] {
  return DIET_DAY_TEMPLATES[type] ?? DIET_DAY_TEMPLATES.Any;
}

// Breakfast presets — used to swap a day's breakfast to the chosen style.
export const BREAKFAST_PRESETS: Record<string, DietPlanItem> = {
  'Overnight oats': { meal: 'Breakfast', name: 'Overnight oats (50g) + whey + berries', calories: 380, protein_g: 32, carbs_g: 48, fat_g: 8, fiber_g: 7, time: '08:00' },
  'Eggs (omelette / boiled)': { meal: 'Breakfast', name: '3-egg omelette + 1 toast', calories: 320, protein_g: 26, carbs_g: 18, fat_g: 16, fiber_g: 2, time: '08:00' },
  'Smoothie / protein shake': { meal: 'Breakfast', name: 'Whey + banana + oats smoothie', calories: 350, protein_g: 34, carbs_g: 45, fat_g: 6, fiber_g: 5, time: '08:00' },
  'Poha / upma': { meal: 'Breakfast', name: 'Veg poha / upma + peanuts + curd', calories: 360, protein_g: 16, carbs_g: 52, fat_g: 10, fiber_g: 5, time: '08:00' },
  'Paneer / tofu scramble': { meal: 'Breakfast', name: 'Paneer / tofu scramble (150g) + 1 toast', calories: 360, protein_g: 28, carbs_g: 22, fat_g: 16, fiber_g: 3, time: '08:00' },
  'Greek yogurt + fruit': { meal: 'Breakfast', name: 'Greek yogurt (200g) + fruit + almonds', calories: 320, protein_g: 28, carbs_g: 28, fat_g: 10, fiber_g: 3, time: '08:00' },
  'Light paratha': { meal: 'Breakfast', name: '1 stuffed paratha (light oil) + curd', calories: 340, protein_g: 16, carbs_g: 40, fat_g: 14, fiber_g: 4, time: '08:00' },
};

// Portable "prep box" lunches for office days — no midday cooking.
const OFFICE_LUNCH: Record<'veg' | 'vegan' | 'nonveg', DietPlanItem> = {
  nonveg: { meal: 'Lunch', name: 'Prep box: grilled chicken 180g + rice + veg (packed)', calories: 560, protein_g: 48, carbs_g: 60, fat_g: 10, fiber_g: 7, time: '13:00' },
  veg: { meal: 'Lunch', name: 'Prep box: paneer + chickpea salad + roti (packed)', calories: 540, protein_g: 30, carbs_g: 55, fat_g: 16, fiber_g: 10, time: '13:00' },
  vegan: { meal: 'Lunch', name: 'Prep box: tofu + quinoa + chickpea salad (packed)', calories: 540, protein_g: 28, carbs_g: 58, fat_g: 14, fiber_g: 11, time: '13:00' },
};

// Office lunch only where the normal lunch needs cooking; low-carb/keto lunches
// are already salads, and IF/OMAD have special eating windows, so leave those.
function officeBoxFor(type: DietDayType): DietPlanItem | null {
  if (type === 'Vegan') return OFFICE_LUNCH.vegan;
  if (type === 'Veg' || type === 'Egg') return OFFICE_LUNCH.veg;
  if (type === 'Any' || type === 'Non-veg' || type === 'High-protein') return OFFICE_LUNCH.nonveg;
  return null;
}

// A curated day tailored to context: swap the breakfast to the chosen style and,
// on office days, swap the lunch for a portable prep box.
export function curatedDayItems(
  type: DietDayType,
  opts: { location?: string; breakfast?: string },
): DietPlanItem[] {
  let items = dayTemplateItems(type).map(x => ({ ...x }));
  if (opts.breakfast && BREAKFAST_PRESETS[opts.breakfast]) {
    const b = BREAKFAST_PRESETS[opts.breakfast];
    items = items.map(i => (i.meal === 'Breakfast' ? { ...b, time: i.time } : i));
  }
  if (opts.location === 'Office') {
    const box = officeBoxFor(type);
    if (box) items = items.map(i => (i.meal === 'Lunch' ? { ...box, time: i.time } : i));
  }
  return items;
}
