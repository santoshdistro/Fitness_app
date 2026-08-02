// Curated one-day meal templates for each weekly-split style, so a week can be
// assembled instantly without an AI call. Macros are honest approximations for
// cooked, ready-to-eat portions; every meal stays editable after it's applied.
import type { DietPlanItem } from '../lib/aiClient';
import type { DietDayType } from '../hooks/useDietSplit';

export const DIET_DAY_TEMPLATES: Record<DietDayType, DietPlanItem[]> = {
  Any: [
    { meal: 'Breakfast', name: 'Oats with milk, fruit & 2 eggs', calories: 400, protein_g: 24, carbs_g: 45, fat_g: 14, fiber_g: 6 },
    { meal: 'Lunch', name: 'Dal + rice + mixed veg + curd', calories: 600, protein_g: 24, carbs_g: 90, fat_g: 14, fiber_g: 12 },
    { meal: 'Snack', name: 'Fruit + handful of nuts', calories: 220, protein_g: 6, carbs_g: 30, fat_g: 10, fiber_g: 5 },
    { meal: 'Dinner', name: 'Chicken or paneer + 2 roti + salad', calories: 580, protein_g: 34, carbs_g: 45, fat_g: 24, fiber_g: 8 },
  ],
  Veg: [
    { meal: 'Breakfast', name: 'Veg poha + bowl of curd', calories: 350, protein_g: 12, carbs_g: 55, fat_g: 8, fiber_g: 5 },
    { meal: 'Lunch', name: 'Rajma + brown rice + salad', calories: 600, protein_g: 22, carbs_g: 90, fat_g: 12, fiber_g: 14 },
    { meal: 'Snack', name: 'Greek yogurt + fruit', calories: 200, protein_g: 15, carbs_g: 25, fat_g: 4, fiber_g: 3 },
    { meal: 'Dinner', name: 'Paneer bhurji + 2 roti', calories: 550, protein_g: 28, carbs_g: 45, fat_g: 24, fiber_g: 8 },
  ],
  'Non-veg': [
    { meal: 'Breakfast', name: '3-egg omelette + 2 toast', calories: 400, protein_g: 26, carbs_g: 30, fat_g: 18, fiber_g: 3 },
    { meal: 'Lunch', name: 'Grilled chicken + rice + veg', calories: 650, protein_g: 45, carbs_g: 70, fat_g: 15, fiber_g: 8 },
    { meal: 'Snack', name: 'Greek yogurt + nuts', calories: 220, protein_g: 16, carbs_g: 12, fat_g: 10, fiber_g: 2 },
    { meal: 'Dinner', name: 'Fish curry + 2 roti + salad', calories: 600, protein_g: 40, carbs_g: 45, fat_g: 22, fiber_g: 7 },
  ],
  Egg: [
    { meal: 'Breakfast', name: '3 boiled eggs + 2 toast', calories: 350, protein_g: 24, carbs_g: 24, fat_g: 16, fiber_g: 2 },
    { meal: 'Lunch', name: 'Egg curry + rice + salad', calories: 620, protein_g: 26, carbs_g: 80, fat_g: 20, fiber_g: 8 },
    { meal: 'Snack', name: 'Paneer tikka', calories: 200, protein_g: 16, carbs_g: 6, fat_g: 12, fiber_g: 1 },
    { meal: 'Dinner', name: 'Veg pulao + curd + boiled egg', calories: 550, protein_g: 22, carbs_g: 70, fat_g: 16, fiber_g: 6 },
  ],
  Vegan: [
    { meal: 'Breakfast', name: 'Oats + soy milk + banana + peanut butter', calories: 420, protein_g: 15, carbs_g: 60, fat_g: 14, fiber_g: 8 },
    { meal: 'Lunch', name: 'Chana masala + brown rice', calories: 620, protein_g: 22, carbs_g: 95, fat_g: 12, fiber_g: 16 },
    { meal: 'Snack', name: 'Roasted chickpeas + fruit', calories: 220, protein_g: 10, carbs_g: 35, fat_g: 5, fiber_g: 8 },
    { meal: 'Dinner', name: 'Tofu stir-fry + quinoa', calories: 560, protein_g: 28, carbs_g: 55, fat_g: 22, fiber_g: 9 },
  ],
  'Low-carb': [
    { meal: 'Breakfast', name: '3-egg veg omelette + avocado', calories: 400, protein_g: 24, carbs_g: 8, fat_g: 30, fiber_g: 5 },
    { meal: 'Lunch', name: 'Grilled chicken salad + olive oil', calories: 520, protein_g: 42, carbs_g: 15, fat_g: 32, fiber_g: 6 },
    { meal: 'Snack', name: 'Greek yogurt + almonds', calories: 240, protein_g: 18, carbs_g: 10, fat_g: 14, fiber_g: 2 },
    { meal: 'Dinner', name: 'Paneer or fish + sautéed greens', calories: 500, protein_g: 35, carbs_g: 12, fat_g: 34, fiber_g: 6 },
  ],
  'High-protein': [
    { meal: 'Breakfast', name: '2 whole eggs + 4 whites + oats', calories: 420, protein_g: 38, carbs_g: 35, fat_g: 14, fiber_g: 4 },
    { meal: 'Lunch', name: 'Chicken breast 200g + rice + veg', calories: 680, protein_g: 55, carbs_g: 70, fat_g: 12, fiber_g: 7 },
    { meal: 'Snack', name: 'Whey shake + banana', calories: 300, protein_g: 30, carbs_g: 35, fat_g: 4, fiber_g: 3 },
    { meal: 'Dinner', name: 'Fish 200g + quinoa + salad', calories: 600, protein_g: 48, carbs_g: 45, fat_g: 20, fiber_g: 7 },
  ],
  Keto: [
    { meal: 'Breakfast', name: 'Eggs + cheese + avocado', calories: 480, protein_g: 26, carbs_g: 6, fat_g: 40, fiber_g: 4 },
    { meal: 'Lunch', name: 'Chicken thigh + buttered greens', calories: 600, protein_g: 40, carbs_g: 8, fat_g: 46, fiber_g: 5 },
    { meal: 'Snack', name: 'Cheese + mixed nuts', calories: 280, protein_g: 12, carbs_g: 6, fat_g: 24, fiber_g: 2 },
    { meal: 'Dinner', name: 'Salmon or paneer + salad + olive oil', calories: 560, protein_g: 34, carbs_g: 8, fat_g: 44, fiber_g: 5 },
  ],
  'IF 16:8': [
    { meal: 'Lunch', name: 'Chicken + rice + veg (break fast)', calories: 700, protein_g: 48, carbs_g: 75, fat_g: 18, fiber_g: 8, time: '12:00' },
    { meal: 'Snack', name: 'Greek yogurt + nuts + fruit', calories: 350, protein_g: 22, carbs_g: 30, fat_g: 14, fiber_g: 4, time: '16:00' },
    { meal: 'Dinner', name: 'Fish or paneer + roti + salad', calories: 700, protein_g: 42, carbs_g: 55, fat_g: 28, fiber_g: 9, time: '19:30' },
  ],
  'Fasting (OMAD)': [
    { meal: 'Dinner', name: 'OMAD plate: chicken 200g + rice + dal + veg + curd', calories: 1700, protein_g: 90, carbs_g: 150, fat_g: 55, fiber_g: 20, time: '18:00' },
  ],
};

export function dayTemplateItems(type: DietDayType): DietPlanItem[] {
  return DIET_DAY_TEMPLATES[type] ?? DIET_DAY_TEMPLATES.Any;
}
