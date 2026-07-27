// Bundled, offline healthy-eating handbook: a curated food list plus recipes
// with full how-to steps. No network, no API cost — always available.

export type DietTag =
  | 'high_protein'
  | 'low_carb'
  | 'vegetarian'
  | 'vegan'
  | 'quick'
  | 'budget'
  | 'air_fryer';
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
  /** Optional stock photo (degrades to the emoji tile if it fails to load). */
  image?: string;
};

function foodImg(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`;
}

/** A YouTube search link for a recipe — always valid, opens relevant how-to videos. */
export function recipeYoutubeUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} recipe how to make`)}`;
}

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
    image: foodImg('1517673400267-0251440c45dc'),
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
    image: foodImg('1512058564366-18510be2db19'),
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
    image: foodImg('1482049016688-2d3e1b311543'),
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
    image: foodImg('1519708227418-c8fd9a32b7a2'),
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
    image: foodImg('1585937421612-70a008356fbe'),
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
    image: foodImg('1488477181946-6428a0291777'),
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
  {
    id: 'protein_pancakes',
    name: 'Protein pancakes',
    emoji: '🥞',
    blurb: 'Weekend-worthy but macro-friendly.',
    image: foodImg('1567620905732-2d1ec7ab7445'),
    minutes: 15,
    servings: 1,
    perServing: { calories: 380, protein_g: 32, carbs_g: 40, fat_g: 9 },
    dietTags: ['high_protein', 'vegetarian', 'quick'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '1 scoop vanilla protein powder',
      '1 ripe banana',
      '2 eggs',
      '40g oats',
      '1/2 tsp baking powder',
    ],
    steps: [
      'Blend all ingredients into a smooth batter.',
      'Heat a non-stick pan over medium and lightly grease it.',
      'Pour small pancakes and cook 1–2 min until bubbles form, then flip.',
      'Stack and top with berries or a little honey.',
    ],
  },
  {
    id: 'chicken_burrito_bowl',
    name: 'Chicken burrito bowl',
    emoji: '🌯',
    blurb: 'Big, satisfying, and high protein.',
    image: foodImg('1543339308-43e59d6b73a6'),
    minutes: 20,
    servings: 2,
    perServing: { calories: 560, protein_g: 46, carbs_g: 58, fat_g: 15 },
    dietTags: ['high_protein', 'budget'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '2 chicken breasts (~300g)',
      '150g rice (dry)',
      '1 can black beans, drained',
      '1 cup sweetcorn',
      'Salsa, lime, cumin, paprika',
    ],
    steps: [
      'Cook the rice; warm the beans and corn.',
      'Season diced chicken with cumin and paprika, then pan-fry until cooked.',
      'Build bowls with rice, beans, corn and chicken.',
      'Top with salsa and a squeeze of lime.',
    ],
  },
  {
    id: 'tuna_pasta',
    name: 'Tuna & sweetcorn pasta',
    emoji: '🍝',
    blurb: 'Store-cupboard dinner in 15 minutes.',
    image: foodImg('1473093295043-cdd812d0e601'),
    minutes: 15,
    servings: 2,
    perServing: { calories: 480, protein_g: 35, carbs_g: 62, fat_g: 9 },
    dietTags: ['high_protein', 'budget', 'quick'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '160g wholewheat pasta (dry)',
      '2 cans tuna in spring water, drained',
      '1 cup sweetcorn',
      '3 tbsp light mayo or Greek yogurt',
      'Black pepper, squeeze of lemon',
    ],
    steps: [
      'Cook the pasta per packet, then drain.',
      'Mix tuna, sweetcorn and mayo/yogurt in a bowl.',
      'Fold through the warm pasta.',
      'Season with pepper and lemon; eat warm or chilled.',
    ],
  },
  {
    id: 'beef_broccoli',
    name: 'Beef & broccoli stir-fry',
    emoji: '🥩',
    blurb: 'Takeaway flavour, lean and quick.',
    image: foodImg('1603133872878-684f208fb84b'),
    minutes: 20,
    servings: 2,
    perServing: { calories: 430, protein_g: 40, carbs_g: 22, fat_g: 20 },
    dietTags: ['high_protein', 'low_carb'],
    goalTags: ['muscle_gain', 'weight_loss'],
    ingredients: [
      '300g lean beef strips',
      '1 large head broccoli',
      '2 tbsp soy sauce',
      '1 tsp honey, 1 garlic clove, ginger',
      '1 tsp sesame oil',
    ],
    steps: [
      'Sear the beef in a hot pan for 2–3 min, then set aside.',
      'Stir-fry broccoli with garlic and ginger for 3–4 min.',
      'Return beef, add soy sauce and honey, toss 1 min.',
      'Finish with a drizzle of sesame oil.',
    ],
  },
  {
    id: 'berry_protein_smoothie',
    name: 'Berry protein smoothie',
    emoji: '🥤',
    blurb: 'Two-minute breakfast or post-workout hit.',
    image: foodImg('1553530666-ba11a7da3888'),
    minutes: 2,
    servings: 1,
    perServing: { calories: 300, protein_g: 30, carbs_g: 35, fat_g: 4 },
    dietTags: ['high_protein', 'vegetarian', 'quick'],
    goalTags: ['muscle_gain', 'maintenance', 'weight_loss'],
    ingredients: [
      '1 scoop protein powder',
      '1 cup frozen mixed berries',
      '1 banana',
      '250ml milk of choice',
      '1 tbsp oats (optional)',
    ],
    steps: [
      'Add everything to a blender.',
      'Blend 30–45 seconds until smooth.',
      'Add a splash more milk if it is too thick.',
    ],
  },
  {
    id: 'veggie_omelette',
    name: 'Loaded veggie omelette',
    emoji: '🧀',
    blurb: 'High protein, low carb, any time of day.',
    image: foodImg('1510693206972-df098062cb71'),
    minutes: 10,
    servings: 1,
    perServing: { calories: 320, protein_g: 26, carbs_g: 6, fat_g: 21 },
    dietTags: ['high_protein', 'low_carb', 'vegetarian', 'quick'],
    goalTags: ['weight_loss', 'maintenance'],
    ingredients: [
      '3 eggs',
      '30g grated cheese',
      '1/2 pepper, mushrooms, spinach',
      '1 tsp olive oil',
      'Salt & pepper',
    ],
    steps: [
      'Whisk the eggs with salt and pepper.',
      'Soften the chopped veg in olive oil for 2–3 min.',
      'Pour in the eggs, swirl, and cook until nearly set.',
      'Add cheese, fold over, and slide onto a plate.',
    ],
  },
  {
    id: 'af_paneer_tikka',
    name: 'Air-fryer paneer tikka',
    emoji: '🧀',
    blurb: 'High-protein, low-fat, veg — 12 minutes in the air fryer.',
    image: foodImg('1601050690597-df0568f70950'),
    minutes: 20,
    servings: 2,
    perServing: { calories: 320, protein_g: 24, carbs_g: 12, fat_g: 19 },
    dietTags: ['high_protein', 'vegetarian', 'low_carb', 'air_fryer', 'quick'],
    goalTags: ['muscle_gain', 'maintenance'],
    ingredients: [
      '250g paneer, cubed',
      '3 tbsp Greek yogurt',
      '1 tbsp tikka / tandoori masala',
      '1 pepper + 1 onion, chunked',
      '1 tsp oil, salt, lemon',
    ],
    steps: [
      'Mix yogurt, masala, salt and lemon into a marinade.',
      'Coat the paneer and veg; rest 10 min.',
      'Preheat air fryer to 200°C / 400°F.',
      'Air-fry 10–12 min, shaking halfway, until charred at the edges.',
    ],
  },
  {
    id: 'af_chicken_tikka',
    name: 'Air-fryer chicken tikka',
    emoji: '🍗',
    blurb: 'Lean, very high protein, minimal fat.',
    image: foodImg('1610057099431-d73a1c9d2f2f'),
    minutes: 25,
    servings: 2,
    perServing: { calories: 300, protein_g: 46, carbs_g: 6, fat_g: 9 },
    dietTags: ['high_protein', 'low_carb', 'air_fryer'],
    goalTags: ['muscle_gain', 'weight_loss'],
    ingredients: [
      '400g chicken breast, cubed',
      '4 tbsp Greek yogurt',
      '1 tbsp tandoori masala',
      '1 tsp ginger-garlic paste',
      'Salt, chilli, lemon',
    ],
    steps: [
      'Marinate chicken in yogurt, masala, ginger-garlic, salt and lemon for 15+ min.',
      'Preheat air fryer to 200°C / 400°F.',
      'Air-fry 12–15 min, shaking halfway, until cooked through (75°C inside).',
      'Rest 2 min and squeeze over fresh lemon.',
    ],
  },
  {
    id: 'af_egg_bites',
    name: 'Air-fryer egg & veg cups',
    emoji: '🥚',
    blurb: 'Protein-packed, low-fat breakfast in silicone cups.',
    image: foodImg('1482049016688-2d3e1b311543'),
    minutes: 15,
    servings: 2,
    perServing: { calories: 210, protein_g: 20, carbs_g: 4, fat_g: 12 },
    dietTags: ['high_protein', 'low_carb', 'vegetarian', 'air_fryer', 'quick'],
    goalTags: ['weight_loss', 'maintenance'],
    ingredients: [
      '4 eggs + 2 egg whites',
      '1 handful spinach, chopped',
      '1/2 pepper, diced',
      '2 tbsp grated cheese (optional)',
      'Salt & pepper',
    ],
    steps: [
      'Whisk eggs and whites with salt and pepper.',
      'Stir in the veg (and cheese) and pour into silicone cups.',
      'Air-fry at 160°C / 320°F for 8–10 min until set.',
      'Cool 1 min, then pop out.',
    ],
  },
  {
    id: 'af_veg',
    name: 'Air-fryer crispy vegetables',
    emoji: '🥦',
    blurb: 'High-volume, low-calorie side — great with any protein.',
    image: foodImg('1512621776951-a57141f2eefd'),
    minutes: 18,
    servings: 2,
    perServing: { calories: 120, protein_g: 5, carbs_g: 16, fat_g: 5 },
    dietTags: ['low_carb', 'vegetarian', 'vegan', 'air_fryer', 'quick'],
    goalTags: ['weight_loss', 'maintenance'],
    ingredients: [
      '1 head broccoli + 1 pepper + 1 courgette',
      '1 tsp olive oil',
      '1/2 tsp paprika, garlic powder',
      'Salt & pepper',
    ],
    steps: [
      'Chop the veg into even pieces.',
      'Toss with the oil and seasoning.',
      'Air-fry at 200°C / 400°F for 10–12 min, shaking halfway, until charred.',
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
  air_fryer: 'Air fryer',
};
