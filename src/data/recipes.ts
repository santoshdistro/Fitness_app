// Bundled, offline healthy-eating handbook: a curated food list plus recipes
// with full how-to steps. No network, no API cost — always available.

export type DietTag = 'high_protein' | 'low_carb' | 'vegetarian' | 'vegan' | 'quick' | 'budget';
export type GoalTag = 'weight_loss' | 'muscle_gain' | 'maintenance';

export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  minutes: number;
  servings: number;
  perServing: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  dietTags: DietTag[];
  goalTags: GoalTag[];
  ingredients: string[];
  steps: string[];
};

export type FoodGroup = {
  title: string;
  emoji: string;
  items: { name: string; note: string }[];
};

// A quick reference of nutrient-dense staples, grouped by macro role.
export const HEALTHY_FOODS: FoodGroup[] = [
  {
    title: 'Lean protein',
    emoji: '🍗',
    items: [
      { name: 'Chicken breast', note: '~31g protein / 100g' },
      { name: 'Eggs', note: '6g protein each, complete amino profile' },
      { name: 'Greek yogurt (0%)', note: '~10g protein / 100g, great for snacks' },
      { name: 'Whey / plant protein', note: 'Easy 20–25g protein per scoop' },
      { name: 'Tofu / tempeh', note: 'Plant protein, versatile' },
      { name: 'White fish & salmon', note: 'Lean protein + omega-3s' },
      { name: 'Lentils & chickpeas', note: 'Protein + fibre, budget-friendly' },
    ],
  },
  {
    title: 'Smart carbs',
    emoji: '🍠',
    items: [
      { name: 'Oats', note: 'Slow-release energy, high fibre' },
      { name: 'Sweet potato', note: 'Nutrient-dense, filling' },
      { name: 'Brown rice / quinoa', note: 'Whole-grain staples' },
      { name: 'Berries', note: 'Low-sugar fruit, antioxidants' },
      { name: 'Banana', note: 'Fast fuel around workouts' },
    ],
  },
  {
    title: 'Healthy fats',
    emoji: '🥑',
    items: [
      { name: 'Avocado', note: 'Monounsaturated fat + fibre' },
      { name: 'Nuts & nut butter', note: 'Calorie-dense, eat mindfully' },
      { name: 'Olive oil', note: 'Best everyday cooking fat' },
      { name: 'Chia / flax seeds', note: 'Omega-3 + fibre' },
    ],
  },
  {
    title: 'Veg & greens',
    emoji: '🥦',
    items: [
      { name: 'Broccoli & spinach', note: 'High volume, low calorie' },
      { name: 'Peppers & tomatoes', note: 'Vitamins + flavour' },
      { name: 'Leafy salad', note: 'Fills the plate for few calories' },
    ],
  },
];

export const RECIPES: Recipe[] = [
  {
    id: 'protein_oats',
    name: 'Protein overnight oats',
    emoji: '🥣',
    blurb: 'Prep tonight, grab-and-go high-protein breakfast.',
    minutes: 5,
    servings: 1,
    perServing: { calories: 420, protein_g: 34, carbs_g: 48, fat_g: 10 },
    dietTags: ['high_protein', 'vegetarian', 'quick', 'budget'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '50g rolled oats',
      '1 scoop (30g) whey or plant protein',
      '150g Greek yogurt',
      '120ml milk of choice',
      '1 handful berries',
    ],
    steps: [
      'Add oats, protein powder, yogurt and milk to a jar.',
      'Stir well until there are no dry pockets of powder.',
      'Top with berries, seal, and refrigerate overnight (6+ hours).',
      'Eat cold in the morning, or add a splash more milk to loosen.',
    ],
  },
  {
    id: 'chicken_rice_bowl',
    name: 'Chicken & rice power bowl',
    emoji: '🍚',
    blurb: 'The classic muscle-building meal-prep bowl.',
    minutes: 25,
    servings: 2,
    perServing: { calories: 540, protein_g: 45, carbs_g: 55, fat_g: 14 },
    dietTags: ['high_protein', 'budget'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '2 chicken breasts (~300g)',
      '150g brown rice (dry)',
      '1 head broccoli',
      '1 tbsp olive oil',
      'Salt, pepper, paprika, garlic powder',
    ],
    steps: [
      'Cook the rice per packet instructions.',
      'Season diced chicken with the spices.',
      'Heat olive oil in a pan and cook chicken 6–8 min until done through.',
      'Steam or microwave the broccoli until tender.',
      'Divide rice, chicken and broccoli between 2 containers.',
    ],
  },
  {
    id: 'egg_veg_scramble',
    name: 'Veggie egg scramble',
    emoji: '🍳',
    blurb: 'Fast, filling, low-carb start to the day.',
    minutes: 10,
    servings: 1,
    perServing: { calories: 300, protein_g: 22, carbs_g: 8, fat_g: 20 },
    dietTags: ['high_protein', 'low_carb', 'vegetarian', 'quick'],
    goalTags: ['weight_loss', 'maintenance'],
    ingredients: [
      '3 eggs',
      '1 handful spinach',
      '1/2 pepper, diced',
      '1 tsp olive oil',
      'Salt & pepper',
    ],
    steps: [
      'Whisk the eggs with a pinch of salt and pepper.',
      'Soften the pepper in olive oil for 2 minutes.',
      'Add spinach and let it wilt.',
      'Pour in the eggs and gently stir until just set.',
    ],
  },
  {
    id: 'salmon_sweet_potato',
    name: 'Salmon & sweet potato',
    emoji: '🐟',
    blurb: 'Omega-3s, quality carbs, restaurant-easy.',
    minutes: 30,
    servings: 1,
    perServing: { calories: 520, protein_g: 38, carbs_g: 40, fat_g: 22 },
    dietTags: ['high_protein'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '1 salmon fillet (~150g)',
      '1 medium sweet potato',
      '1 handful green beans',
      '1 tbsp olive oil',
      'Lemon, salt, pepper',
    ],
    steps: [
      'Heat oven to 200°C / 400°F.',
      'Cube the sweet potato, toss in half the oil and roast 25 min.',
      'Rub salmon with remaining oil, salt, pepper and a squeeze of lemon.',
      'Add salmon to the oven for the final 12–14 min.',
      'Steam the green beans and plate everything together.',
    ],
  },
  {
    id: 'lentil_curry',
    name: 'Red lentil curry',
    emoji: '🍛',
    blurb: 'Plant-based, high-fibre, big-batch friendly.',
    minutes: 30,
    servings: 4,
    perServing: { calories: 380, protein_g: 18, carbs_g: 52, fat_g: 10 },
    dietTags: ['vegan', 'vegetarian', 'budget'],
    goalTags: ['weight_loss', 'maintenance'],
    ingredients: [
      '250g red lentils',
      '1 onion, 2 garlic cloves',
      '1 can chopped tomatoes',
      '1 can light coconut milk',
      '2 tbsp curry powder',
      'Spinach to finish',
    ],
    steps: [
      'Soften diced onion and garlic in a large pot.',
      'Stir in the curry powder for 30 seconds until fragrant.',
      'Add lentils, tomatoes, coconut milk and 300ml water.',
      'Simmer 20–25 min, stirring, until lentils are soft.',
      'Stir through spinach until wilted; season to taste.',
    ],
  },
  {
    id: 'greek_yogurt_bowl',
    name: 'High-protein yogurt bowl',
    emoji: '🍧',
    blurb: 'Dessert that hits your protein target.',
    minutes: 3,
    servings: 1,
    perServing: { calories: 260, protein_g: 24, carbs_g: 24, fat_g: 6 },
    dietTags: ['high_protein', 'vegetarian', 'quick'],
    goalTags: ['weight_loss', 'maintenance', 'muscle_gain'],
    ingredients: [
      '200g Greek yogurt (0–2%)',
      '1 handful berries',
      '1 tbsp chia seeds',
      'Drizzle of honey (optional)',
    ],
    steps: [
      'Spoon the yogurt into a bowl.',
      'Top with berries and chia seeds.',
      'Add a small drizzle of honey if you want it sweeter.',
    ],
  },
];

export const DIET_TAG_LABEL: Record<DietTag, string> = {
  high_protein: 'High protein',
  low_carb: 'Low carb',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  quick: 'Quick',
  budget: 'Budget',
};
