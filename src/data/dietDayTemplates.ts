// Curated one-day meal templates for each weekly-split style, so a week can be
// assembled instantly without an AI call. Every meal has a clock time (spread
// through the day) and is protein-forward so protein targets are met, not just
// calories. Macros are honest approximations for cooked, ready-to-eat portions;
// every meal stays editable after it's applied.
import type { DietPlanItem } from '../lib/aiClient';
import type { DietDayType } from '../hooks/useDietSplit';

export const DIET_DAY_TEMPLATES: Record<DietDayType, DietPlanItem[]> = {
  Any: [
    { meal: 'Breakfast', name: 'Oats + milk + 2 eggs + fruit', calories: 430, protein_g: 28, carbs_g: 48, fat_g: 14, fiber_g: 6, time: '08:00' },
    { meal: 'Lunch', name: 'Dal + rice + grilled chicken/paneer + curd', calories: 640, protein_g: 40, carbs_g: 85, fat_g: 16, fiber_g: 12, time: '13:00' },
    { meal: 'Snack', name: 'Greek yogurt + whey + nuts', calories: 300, protein_g: 32, carbs_g: 18, fat_g: 10, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Chicken or paneer + 2 roti + salad', calories: 600, protein_g: 38, carbs_g: 46, fat_g: 24, fiber_g: 8, time: '20:00' },
  ],
  Veg: [
    { meal: 'Breakfast', name: 'Paneer paratha + bowl of curd', calories: 420, protein_g: 22, carbs_g: 45, fat_g: 18, fiber_g: 5, time: '08:00' },
    { meal: 'Lunch', name: 'Rajma + brown rice + curd + salad', calories: 620, protein_g: 26, carbs_g: 92, fat_g: 12, fiber_g: 15, time: '13:00' },
    { meal: 'Snack', name: 'Greek yogurt + whey + fruit', calories: 300, protein_g: 32, carbs_g: 30, fat_g: 5, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Paneer bhurji (150g) + 2 roti', calories: 560, protein_g: 32, carbs_g: 46, fat_g: 26, fiber_g: 8, time: '20:00' },
  ],
  'Non-veg': [
    { meal: 'Breakfast', name: '3-egg omelette + 2 toast + Greek yogurt', calories: 450, protein_g: 34, carbs_g: 32, fat_g: 20, fiber_g: 3, time: '08:00' },
    { meal: 'Lunch', name: 'Grilled chicken 200g + rice + veg', calories: 680, protein_g: 55, carbs_g: 72, fat_g: 15, fiber_g: 8, time: '13:00' },
    { meal: 'Snack', name: 'Whey shake + banana', calories: 300, protein_g: 30, carbs_g: 35, fat_g: 4, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Fish curry 180g + 2 roti + salad', calories: 620, protein_g: 42, carbs_g: 48, fat_g: 24, fiber_g: 7, time: '20:00' },
  ],
  Egg: [
    { meal: 'Breakfast', name: '4 boiled eggs + 2 toast', calories: 380, protein_g: 30, carbs_g: 26, fat_g: 18, fiber_g: 2, time: '08:00' },
    { meal: 'Lunch', name: 'Egg bhurji (4 egg) + rice + salad', calories: 600, protein_g: 30, carbs_g: 70, fat_g: 22, fiber_g: 8, time: '13:00' },
    { meal: 'Snack', name: 'Greek yogurt + whey', calories: 280, protein_g: 35, carbs_g: 18, fat_g: 5, fiber_g: 1, time: '16:30' },
    { meal: 'Dinner', name: 'Veg pulao + curd + 2 boiled eggs', calories: 560, protein_g: 30, carbs_g: 62, fat_g: 20, fiber_g: 6, time: '20:00' },
  ],
  Vegan: [
    { meal: 'Breakfast', name: 'Tofu scramble + 2 toast + soy milk', calories: 420, protein_g: 28, carbs_g: 40, fat_g: 16, fiber_g: 6, time: '08:00' },
    { meal: 'Lunch', name: 'Chana masala + brown rice', calories: 620, protein_g: 24, carbs_g: 95, fat_g: 12, fiber_g: 16, time: '13:00' },
    { meal: 'Snack', name: 'Soy protein shake + banana', calories: 260, protein_g: 26, carbs_g: 30, fat_g: 4, fiber_g: 3, time: '16:30' },
    { meal: 'Dinner', name: 'Tofu stir-fry (200g) + quinoa', calories: 560, protein_g: 30, carbs_g: 55, fat_g: 20, fiber_g: 9, time: '20:00' },
  ],
  'Low-carb': [
    { meal: 'Breakfast', name: '3-egg veg omelette + avocado + cheese', calories: 430, protein_g: 28, carbs_g: 8, fat_g: 32, fiber_g: 5, time: '08:00' },
    { meal: 'Lunch', name: 'Grilled chicken salad 200g + olive oil', calories: 540, protein_g: 46, carbs_g: 14, fat_g: 32, fiber_g: 6, time: '13:00' },
    { meal: 'Snack', name: 'Greek yogurt + almonds', calories: 250, protein_g: 22, carbs_g: 10, fat_g: 14, fiber_g: 2, time: '16:30' },
    { meal: 'Dinner', name: 'Fish or paneer 180g + sautéed greens', calories: 520, protein_g: 40, carbs_g: 12, fat_g: 34, fiber_g: 6, time: '20:00' },
  ],
  'High-protein': [
    { meal: 'Breakfast', name: '2 whole eggs + 5 whites + oats', calories: 440, protein_g: 42, carbs_g: 35, fat_g: 14, fiber_g: 4, time: '08:00' },
    { meal: 'Lunch', name: 'Chicken breast 220g + rice + veg', calories: 720, protein_g: 60, carbs_g: 72, fat_g: 12, fiber_g: 7, time: '13:00' },
    { meal: 'Snack', name: 'Whey + Greek yogurt', calories: 320, protein_g: 45, carbs_g: 20, fat_g: 6, fiber_g: 1, time: '16:30' },
    { meal: 'Dinner', name: 'Fish 200g + quinoa + salad', calories: 640, protein_g: 50, carbs_g: 45, fat_g: 22, fiber_g: 7, time: '20:00' },
  ],
  Keto: [
    { meal: 'Breakfast', name: 'Eggs + cheese + avocado', calories: 480, protein_g: 28, carbs_g: 6, fat_g: 40, fiber_g: 4, time: '08:00' },
    { meal: 'Lunch', name: 'Chicken thigh 200g + buttered greens', calories: 620, protein_g: 44, carbs_g: 8, fat_g: 46, fiber_g: 5, time: '13:00' },
    { meal: 'Snack', name: 'Cheese + mixed nuts', calories: 280, protein_g: 14, carbs_g: 6, fat_g: 24, fiber_g: 2, time: '16:30' },
    { meal: 'Dinner', name: 'Salmon or paneer 180g + salad + olive oil', calories: 560, protein_g: 38, carbs_g: 8, fat_g: 44, fiber_g: 5, time: '20:00' },
  ],
  'IF 16:8': [
    { meal: 'Lunch', name: 'Chicken 200g + rice + veg (break the fast)', calories: 720, protein_g: 52, carbs_g: 75, fat_g: 18, fiber_g: 8, time: '12:00' },
    { meal: 'Snack', name: 'Greek yogurt + whey + fruit', calories: 340, protein_g: 40, carbs_g: 30, fat_g: 6, fiber_g: 4, time: '16:00' },
    { meal: 'Dinner', name: 'Fish or paneer 180g + roti + salad', calories: 700, protein_g: 45, carbs_g: 55, fat_g: 28, fiber_g: 9, time: '19:30' },
  ],
  'Fasting (OMAD)': [
    { meal: 'Dinner', name: 'OMAD plate: chicken 220g + rice + dal + veg + curd', calories: 1750, protein_g: 120, carbs_g: 150, fat_g: 50, fiber_g: 20, time: '18:00' },
  ],
};

export function dayTemplateItems(type: DietDayType): DietPlanItem[] {
  return DIET_DAY_TEMPLATES[type] ?? DIET_DAY_TEMPLATES.Any;
}
