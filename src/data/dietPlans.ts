import type { DietPlanItem } from '../lib/aiClient';

// Curated, offline day-plans — the diet equivalent of predefined workout
// programs. Each is a full day (Breakfast / Lunch / Dinner / Snack) with
// per-item macros, so it can be dropped onto any date or cherry-picked by meal.

export type DietPlan = {
  id: string;
  name: string;
  emoji: string;
  focus: string;
  tags: string[];
  items: DietPlanItem[];
};

export const DIET_PLANS: DietPlan[] = [
  {
    id: 'high-protein',
    name: 'High-protein day',
    emoji: '🍗',
    focus: '~2000 kcal · ~180g protein',
    tags: ['Muscle', 'Cut'],
    items: [
      { meal: 'Breakfast', name: '3 eggs + oats with milk', calories: 480, protein_g: 34, carbs_g: 48, fat_g: 16, fiber_g: 6 },
      { meal: 'Lunch', name: 'Grilled chicken, rice & veg', calories: 620, protein_g: 55, carbs_g: 60, fat_g: 14, fiber_g: 7 },
      { meal: 'Snack', name: 'Greek yogurt + whey shake', calories: 300, protein_g: 45, carbs_g: 18, fat_g: 5, fiber_g: 1 },
      { meal: 'Dinner', name: 'Salmon, potatoes & salad', calories: 600, protein_g: 46, carbs_g: 45, fat_g: 24, fiber_g: 8 },
    ],
  },
  {
    id: 'lean-cut',
    name: 'Lean cut day',
    emoji: '🥗',
    focus: '~1600 kcal · high protein, lower carb',
    tags: ['Fat loss'],
    items: [
      { meal: 'Breakfast', name: 'Egg-white omelette + berries', calories: 320, protein_g: 30, carbs_g: 22, fat_g: 10, fiber_g: 5 },
      { meal: 'Lunch', name: 'Chicken & big salad, olive oil', calories: 480, protein_g: 45, carbs_g: 20, fat_g: 22, fiber_g: 8 },
      { meal: 'Snack', name: 'Cottage cheese + apple', calories: 220, protein_g: 24, carbs_g: 22, fat_g: 4, fiber_g: 4 },
      { meal: 'Dinner', name: 'Lean beef stir-fry, veg', calories: 560, protein_g: 44, carbs_g: 30, fat_g: 26, fiber_g: 7 },
    ],
  },
  {
    id: 'veg-indian',
    name: 'Indian veg day',
    emoji: '🍛',
    focus: '~1900 kcal · vegetarian, balanced',
    tags: ['Vegetarian'],
    items: [
      { meal: 'Breakfast', name: 'Paneer bhurji + 2 roti', calories: 470, protein_g: 26, carbs_g: 42, fat_g: 22, fiber_g: 7 },
      { meal: 'Lunch', name: 'Rajma, rice & curd', calories: 620, protein_g: 24, carbs_g: 92, fat_g: 14, fiber_g: 14 },
      { meal: 'Snack', name: 'Roasted chana + banana', calories: 250, protein_g: 12, carbs_g: 42, fat_g: 5, fiber_g: 9 },
      { meal: 'Dinner', name: 'Dal, sabzi & 2 roti', calories: 560, protein_g: 22, carbs_g: 74, fat_g: 16, fiber_g: 13 },
    ],
  },
  {
    id: 'low-carb',
    name: 'Low-carb day',
    emoji: '🥑',
    focus: '~1800 kcal · lower carb, higher fat',
    tags: ['Low carb', 'Keto-ish'],
    items: [
      { meal: 'Breakfast', name: 'Avocado + eggs, no toast', calories: 420, protein_g: 22, carbs_g: 10, fat_g: 34, fiber_g: 7 },
      { meal: 'Lunch', name: 'Tuna salad with olive oil', calories: 480, protein_g: 40, carbs_g: 8, fat_g: 32, fiber_g: 5 },
      { meal: 'Snack', name: 'Cheese & almonds', calories: 260, protein_g: 14, carbs_g: 8, fat_g: 20, fiber_g: 3 },
      { meal: 'Dinner', name: 'Chicken thighs & greens', calories: 620, protein_g: 46, carbs_g: 12, fat_g: 42, fiber_g: 6 },
    ],
  },
  {
    id: 'bulk',
    name: 'Clean bulk day',
    emoji: '💪',
    focus: '~2900 kcal · surplus for growth',
    tags: ['Bulk', 'Muscle'],
    items: [
      { meal: 'Breakfast', name: 'Oats, banana, peanut butter, whey', calories: 720, protein_g: 45, carbs_g: 80, fat_g: 24, fiber_g: 10 },
      { meal: 'Lunch', name: 'Chicken, rice, beans & avocado', calories: 850, protein_g: 55, carbs_g: 95, fat_g: 26, fiber_g: 12 },
      { meal: 'Snack', name: 'Trail mix + milk', calories: 480, protein_g: 20, carbs_g: 45, fat_g: 24, fiber_g: 6 },
      { meal: 'Dinner', name: 'Steak, sweet potato & veg', calories: 820, protein_g: 55, carbs_g: 70, fat_g: 34, fiber_g: 9 },
    ],
  },
];
