// Rough potassium / magnesium / calcium content (mg) of common whole foods, so
// logging them in the diary can auto-fill the hydration card's mineral tiles
// without a per-food DB column. Values are per typical serving; matching is by
// keyword in the meal name. Estimates only — labelled as such in the UI.

export type FoodMinerals = { potassium: number; magnesium: number; calcium: number };

type Entry = { keywords: string[] } & Partial<FoodMinerals>;

// Ordered so more specific names win where it matters; every keyword that
// appears in the meal name contributes once.
const FOODS: Entry[] = [
  { keywords: ['banana'], potassium: 420, magnesium: 32 },
  { keywords: ['sweet potato'], potassium: 540, magnesium: 25 },
  { keywords: ['potato'], potassium: 620, magnesium: 30 },
  { keywords: ['avocado'], potassium: 490, magnesium: 29 },
  { keywords: ['spinach'], potassium: 840, magnesium: 155, calcium: 245 },
  { keywords: ['kale'], potassium: 300, magnesium: 30, calcium: 100 },
  { keywords: ['broccoli'], potassium: 290, magnesium: 20, calcium: 45 },
  { keywords: ['lentil', 'dal', 'daal'], potassium: 730, magnesium: 70, calcium: 40 },
  { keywords: ['bean', 'rajma', 'chickpea', 'chana', 'hummus'], potassium: 600, magnesium: 60, calcium: 45 },
  { keywords: ['coconut water'], potassium: 600, magnesium: 60 },
  { keywords: ['yogurt', 'yoghurt', 'curd', 'dahi'], potassium: 240, calcium: 190, magnesium: 20 },
  { keywords: ['milk'], potassium: 380, calcium: 300, magnesium: 25 },
  { keywords: ['paneer'], calcium: 200, magnesium: 20 },
  { keywords: ['cheese'], calcium: 200 },
  { keywords: ['tofu'], calcium: 350, magnesium: 60, potassium: 120 },
  { keywords: ['almond'], magnesium: 80, calcium: 75, potassium: 200 },
  { keywords: ['peanut', 'peanut butter'], magnesium: 50, potassium: 200 },
  { keywords: ['pumpkin seed'], magnesium: 150, potassium: 260 },
  { keywords: ['chia'], magnesium: 40, calcium: 180, potassium: 115 },
  { keywords: ['oat', 'oats', 'porridge', 'muesli'], magnesium: 60, potassium: 150 },
  { keywords: ['date', 'dates'], potassium: 250, magnesium: 30 },
  { keywords: ['orange'], potassium: 240, calcium: 50 },
  { keywords: ['raisin', 'sultana'], potassium: 320, magnesium: 20 },
  { keywords: ['salmon', 'mackerel', 'sardine'], potassium: 380, magnesium: 30, calcium: 40 },
  { keywords: ['fish', 'tuna'], potassium: 380, magnesium: 30 },
  { keywords: ['chicken'], potassium: 220, magnesium: 25 },
  { keywords: ['egg'], potassium: 70, calcium: 30 },
  { keywords: ['dark chocolate'], magnesium: 65, potassium: 200 },
  { keywords: ['tomato'], potassium: 290, magnesium: 15 },
  { keywords: ['mushroom'], potassium: 300, magnesium: 10 },
];

const EMPTY: FoodMinerals = { potassium: 0, magnesium: 0, calcium: 0 };

// Estimate minerals from a single food/meal name. Sums every food keyword that
// appears in the name (so "banana yogurt smoothie" counts both).
export function estimateMineralsFromName(name: string): FoodMinerals {
  const n = name.toLowerCase();
  const out: FoodMinerals = { ...EMPTY };
  for (const f of FOODS) {
    if (f.keywords.some(k => n.includes(k))) {
      out.potassium += f.potassium ?? 0;
      out.magnesium += f.magnesium ?? 0;
      out.calcium += f.calcium ?? 0;
    }
  }
  return out;
}

export type MealNamed = { meal_name?: string | null };

// Sum estimated minerals across today's logged meals, and return which foods
// were recognised for each mineral (for the "where it came from" breakdown).
export function estimateMineralsFromMeals(meals: MealNamed[]): {
  totals: FoodMinerals;
  byFood: { name: string; potassium: number; magnesium: number; calcium: number }[];
} {
  const totals: FoodMinerals = { ...EMPTY };
  const byFood: { name: string; potassium: number; magnesium: number; calcium: number }[] = [];
  for (const m of meals) {
    const name = m.meal_name?.trim();
    if (!name) continue;
    const est = estimateMineralsFromName(name);
    if (est.potassium || est.magnesium || est.calcium) {
      totals.potassium += est.potassium;
      totals.magnesium += est.magnesium;
      totals.calcium += est.calcium;
      byFood.push({ name, ...est });
    }
  }
  return { totals, byFood };
}
