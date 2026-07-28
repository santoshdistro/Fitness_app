import type { FoodSearchResult } from '../lib/usdaFoodApi';

// Curated Indian foods database — common home-cooked dishes, breads, snacks,
// South-Indian items, sweets and drinks with per-typical-serving macros. Values
// are approximate but realistic; users can tweak amounts after adding. This
// fills the gap left by the US-centric USDA set for everyday Indian eating.

// [name, serving label, grams, kcal, protein, carbs, fat, fibre, sodium(mg)]
type Row = [string, string, number, number, number, number, number, number, number];

const ROWS: Row[] = [
  // Breads
  ['Roti / Chapati', '1 medium', 40, 120, 3, 18, 3, 3, 120],
  ['Tandoori roti', '1', 60, 150, 5, 30, 1, 2, 200],
  ['Naan', '1', 90, 260, 9, 45, 5, 2, 420],
  ['Butter naan', '1', 100, 320, 9, 46, 11, 2, 480],
  ['Plain paratha', '1', 80, 260, 5, 36, 10, 3, 300],
  ['Aloo paratha', '1', 120, 300, 6, 40, 12, 4, 400],
  ['Puri', '1', 20, 85, 1, 10, 4, 1, 60],
  ['Bhatura', '1', 90, 300, 7, 45, 10, 2, 350],
  // Rice
  ['Plain rice', '1 cup', 150, 200, 4, 44, 1, 1, 5],
  ['Jeera rice', '1 cup', 150, 250, 4, 45, 6, 1, 300],
  ['Veg biryani', '1 plate', 250, 350, 8, 55, 10, 4, 600],
  ['Chicken biryani', '1 plate', 300, 500, 22, 60, 18, 4, 800],
  ['Pulao', '1 cup', 180, 280, 6, 48, 7, 3, 400],
  ['Curd rice', '1 bowl', 200, 250, 7, 40, 6, 1, 400],
  ['Lemon rice', '1 cup', 180, 290, 5, 45, 10, 2, 450],
  ['Khichdi', '1 bowl', 250, 300, 10, 45, 8, 5, 500],
  // Dals & legumes
  ['Dal tadka', '1 bowl', 150, 180, 9, 22, 6, 5, 500],
  ['Dal makhani', '1 bowl', 150, 280, 11, 25, 14, 6, 550],
  ['Rajma', '1 bowl', 200, 240, 12, 34, 6, 9, 600],
  ['Chana masala', '1 bowl', 200, 260, 11, 35, 8, 10, 650],
  ['Chole', '1 bowl', 200, 280, 12, 36, 9, 10, 700],
  ['Sambar', '1 bowl', 200, 140, 7, 20, 3, 5, 500],
  ['Rajma chawal', '1 plate', 350, 450, 15, 70, 10, 10, 700],
  // Veg curries / sabzi
  ['Aloo methi', '1 serving', 200, 200, 5, 25, 9, 5, 450],
  ['Aloo gobi', '1 bowl', 200, 190, 5, 24, 9, 6, 450],
  ['Bhindi masala', '1 bowl', 150, 170, 4, 15, 11, 5, 400],
  ['Baingan bharta', '1 bowl', 200, 180, 4, 18, 11, 6, 450],
  ['Mixed veg curry', '1 bowl', 200, 200, 5, 20, 11, 5, 450],
  ['Dum aloo', '1 bowl', 200, 260, 5, 30, 13, 4, 500],
  ['Palak paneer', '1 bowl', 200, 300, 14, 12, 22, 4, 550],
  ['Paneer butter masala', '1 bowl', 200, 380, 15, 16, 28, 3, 650],
  ['Matar paneer', '1 bowl', 200, 320, 14, 18, 20, 5, 600],
  ['Kadai paneer', '1 bowl', 200, 340, 15, 16, 23, 4, 620],
  ['Malai kofta', '1 bowl', 200, 400, 10, 28, 28, 3, 650],
  // Non-veg
  ['Butter chicken', '1 bowl', 200, 430, 27, 12, 30, 2, 800],
  ['Chicken curry', '1 bowl', 200, 300, 25, 8, 18, 2, 700],
  ['Chicken tikka', '4 pieces', 150, 250, 30, 5, 12, 1, 600],
  ['Tandoori chicken', '2 pieces', 200, 300, 35, 4, 16, 0, 700],
  ['Egg curry', '2 eggs', 200, 280, 16, 10, 20, 2, 600],
  ['Fish curry', '1 bowl', 200, 250, 22, 8, 14, 1, 650],
  ['Mutton curry', '1 bowl', 200, 380, 24, 8, 28, 1, 750],
  ['Keema', '1 bowl', 150, 320, 22, 6, 24, 2, 650],
  // South Indian
  ['Idli', '2 pieces', 80, 120, 4, 26, 1, 2, 300],
  ['Plain dosa', '1', 80, 170, 4, 28, 5, 2, 350],
  ['Masala dosa', '1', 150, 290, 6, 42, 11, 4, 500],
  ['Medu vada', '2 pieces', 90, 260, 6, 30, 13, 4, 400],
  ['Uttapam', '1', 130, 230, 6, 36, 7, 3, 450],
  ['Upma', '1 bowl', 180, 250, 6, 38, 8, 3, 450],
  ['Poha', '1 bowl', 180, 270, 5, 45, 8, 3, 400],
  // Snacks / street food
  ['Samosa', '1', 60, 260, 4, 28, 15, 3, 400],
  ['Pakora', '5 pieces', 80, 280, 6, 24, 18, 3, 400],
  ['Vada pav', '1', 150, 300, 7, 45, 11, 4, 600],
  ['Pav bhaji', '1 plate', 250, 400, 9, 50, 18, 6, 800],
  ['Dhokla', '3 pieces', 120, 160, 6, 26, 4, 3, 450],
  ['Chole bhature', '1 plate', 350, 650, 18, 80, 28, 8, 1000],
  ['Aloo tikki', '2 pieces', 120, 240, 4, 30, 12, 4, 450],
  ['Dahi vada', '2 pieces', 150, 230, 7, 30, 9, 3, 500],
  ['Chana chaat', '1 bowl', 150, 200, 9, 28, 5, 8, 500],
  // Sweets
  ['Gulab jamun', '2 pieces', 80, 300, 4, 45, 12, 0, 60],
  ['Rasgulla', '2 pieces', 100, 200, 4, 40, 3, 0, 40],
  ['Jalebi', '2 pieces', 60, 250, 2, 45, 8, 0, 30],
  ['Kheer', '1 bowl', 150, 250, 6, 40, 8, 1, 100],
  ['Halwa', '1 bowl', 100, 350, 4, 45, 18, 2, 80],
  ['Ladoo', '1', 40, 180, 3, 24, 9, 1, 30],
  // Dairy & drinks
  ['Masala chai', '1 cup', 150, 90, 3, 12, 3, 0, 40],
  ['Sweet lassi', '1 glass', 250, 220, 7, 34, 6, 0, 100],
  ['Buttermilk / Chaas', '1 glass', 250, 60, 4, 6, 2, 0, 300],
  ['Curd / Dahi', '1 bowl', 150, 100, 6, 8, 5, 0, 80],
  ['Paneer', '100 g', 100, 265, 18, 6, 20, 0, 20],
];

const INDIAN_FOODS: FoodSearchResult[] = ROWS.map(
  ([name, serving, grams, kcal, p, c, f, fiber, sodium], i) => ({
    fdcId: -100000 - i, // distinct from USDA (positive) and OFF (small negatives)
    description: `${name} (${serving})`,
    brandOwner: 'Indian dish',
    calories: kcal,
    protein: p,
    carbs: c,
    fat: f,
    fiber,
    sodium,
    sugar: 0,
    satFat: 0,
    transFat: 0,
    polyFat: 0,
    monoFat: 0,
    isPerServing: true,
    servingSize: grams,
    servingSizeUnit: 'g',
  }),
);

export function searchIndianFoods(query: string): FoodSearchResult[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return INDIAN_FOODS.filter(food => {
    const name = food.description.toLowerCase();
    return tokens.every(t => name.includes(t));
  }).slice(0, 12);
}
