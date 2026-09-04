// Curated batch-cook reference: foods you can prep on the weekend that keep
// well through the week, with realistic shelf life and reuse ideas.

export type PrepFood = {
  name: string;
  keeps: string; // fridge / freezer life
  reuse: string; // how to use it across the week
};

export type PrepGroup = {
  title: string;
  emoji: string;
  foods: PrepFood[];
};

export const MEAL_PREP_GUIDE: PrepGroup[] = [
  {
    title: 'Proteins',
    emoji: '🍗',
    foods: [
      { name: 'Grilled / baked chicken breast', keeps: 'Fridge 4 days · freezer 3 months', reuse: 'Slice into bowls, wraps, salads, curries' },
      { name: 'Boiled eggs', keeps: 'Fridge 7 days (in shell)', reuse: 'Snack, breakfast, salad topper' },
      { name: 'Paneer / tofu cubes (cooked)', keeps: 'Fridge 4 days · freezer 2 months', reuse: 'Stir-fries, curries, scrambles' },
      { name: 'Cooked lentils / chickpeas / rajma', keeps: 'Fridge 5 days · freezer 3 months', reuse: 'Dal, salads, curry base' },
      { name: 'Kheema / minced meat cooked', keeps: 'Fridge 3 days · freezer 3 months', reuse: 'Wraps, rice bowls, pasta' },
      { name: 'Baked fish portions', keeps: 'Fridge 2 days · freezer 2 months', reuse: 'Best frozen in portions, reheat gently' },
    ],
  },
  {
    title: 'Carbs & grains',
    emoji: '🍚',
    foods: [
      { name: 'Cooked rice (cooled fast)', keeps: 'Fridge 3–4 days · freezer 1 month', reuse: 'Fried rice, bowls — cool within 1 hr, reheat piping hot' },
      { name: 'Boiled / roasted potatoes', keeps: 'Fridge 4 days', reuse: 'Curries, hash, quick side' },
      { name: 'Overnight oats', keeps: 'Fridge 4 days', reuse: 'Grab-and-go breakfast' },
      { name: 'Cooked quinoa / millets', keeps: 'Fridge 5 days · freezer 2 months', reuse: 'Bowls, salads, khichdi' },
      { name: 'Chapati / roti dough', keeps: 'Fridge 2 days · freezer 1 month', reuse: 'Fresh roti in minutes on busy days' },
    ],
  },
  {
    title: 'Vegetables',
    emoji: '🥦',
    foods: [
      { name: 'Roasted mixed veg', keeps: 'Fridge 4 days', reuse: 'Bowls, wraps, side dish' },
      { name: 'Chopped raw veg (airtight)', keeps: 'Fridge 4–5 days', reuse: 'Faster cooking all week, salads' },
      { name: 'Sautéed greens (palak/methi)', keeps: 'Fridge 3 days · freezer 2 months', reuse: 'Dal, sabzi, stuffing' },
      { name: 'Blanched & frozen veg', keeps: 'Freezer 6 months', reuse: 'Drop straight into curries/stir-fries' },
    ],
  },
  {
    title: 'Sauces, snacks & extras',
    emoji: '🥫',
    foods: [
      { name: 'Onion-tomato masala base', keeps: 'Fridge 5 days · freezer 3 months', reuse: 'Instant base for any curry' },
      { name: 'Hummus / yogurt dips', keeps: 'Fridge 5 days', reuse: 'Snack with veg, spread in wraps' },
      { name: 'Energy balls / protein bars', keeps: 'Fridge 2 weeks · freezer 3 months', reuse: 'Pre/post-workout snack' },
      { name: 'Cut fruit (firm only)', keeps: 'Fridge 2–3 days', reuse: 'Apple/melon keep; avoid banana' },
    ],
  },
];

export const MEAL_PREP_TIPS = [
  'Cool cooked food within an hour, then refrigerate — don’t leave it out.',
  'Store in portion-sized airtight boxes so a meal is grab-and-go.',
  'Label with the cook date; when in doubt, freeze it.',
  'Reheat until piping hot all the way through, especially rice and meat.',
];
