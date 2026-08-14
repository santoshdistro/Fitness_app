// Cravings Corner — for the "I've eaten well all day but now I *need*
// something" moment (usually after dinner). Pick what you're craving and get
// goal-aware swaps that scratch the same itch for less damage, the likely
// reason behind it, and a guilt-free "just log it" fallback.

export type CravingKey =
  | 'sweet'
  | 'chocolate'
  | 'salty'
  | 'carby'
  | 'fried'
  | 'creamy'
  | 'fizzy'
  | 'alcohol';

export type CravingSwap = {
  name: string;
  emoji: string;
  kcal: number;
  // One line on why it scratches the same itch.
  why: string;
};

export type Craving = {
  key: CravingKey;
  label: string;
  emoji: string;
  tint: string;
  // What the craving usually really is, after food.
  reason: string;
  // A rough calorie figure for "the real thing" so the guilt-free path can
  // show the trade-off. Ballpark of a typical portion.
  realThing: { name: string; kcal: number };
  swaps: CravingSwap[];
};

export const CRAVINGS: Craving[] = [
  {
    key: 'sweet',
    label: 'Something sweet',
    emoji: '🍬',
    tint: '#ec4899',
    reason:
      'After-dinner sweet pulls are usually habit or a light-on-carbs meal — not real hunger. A small sweet + protein settles it without a sugar crash.',
    realThing: { name: 'Slice of cake / 4 biscuits', kcal: 350 },
    swaps: [
      { name: '2 dates + peanut butter', emoji: '🌴', kcal: 130, why: 'Caramel-sweet, chewy, with fibre & fat to slow the sugar' },
      { name: 'Greek yogurt + berries + honey', emoji: '🍯', kcal: 150, why: 'Creamy and sweet, 15g+ protein so it actually fills you' },
      { name: 'Frozen grapes / banana', emoji: '🍇', kcal: 90, why: 'Ice-cold makes them taste like sorbet — slows you down' },
      { name: 'Dark-chocolate rice cake', emoji: '🍫', kcal: 60, why: 'Crunch + sweet for barely any calories' },
      { name: 'Protein hot chocolate', emoji: '☕', kcal: 130, why: 'Warm, chocolatey, 20g protein — a proper night-time treat' },
    ],
  },
  {
    key: 'chocolate',
    label: 'Chocolate',
    emoji: '🍫',
    tint: '#92400e',
    reason:
      'Chocolate cravings can be genuine (magnesium, comfort) — you don’t have to fight it, just pick a version that stops at one portion.',
    realThing: { name: 'Chocolate bar (full)', kcal: 250 },
    swaps: [
      { name: '2 squares 85% dark', emoji: '🍫', kcal: 65, why: 'Intense enough that a little is plenty — plus magnesium' },
      { name: 'Protein hot chocolate', emoji: '☕', kcal: 130, why: 'Hits the chocolate note and keeps you full' },
      { name: 'Cocoa-dusted almonds (20g)', emoji: '🌰', kcal: 130, why: 'Chocolatey, crunchy, with fat + magnesium' },
      { name: 'Banana + cocoa + yogurt', emoji: '🍌', kcal: 160, why: 'Blended = chocolate mousse texture, real food' },
      { name: 'Chocolate protein bar', emoji: '🍫', kcal: 200, why: 'If you want the bar feel, get 20g protein with it' },
    ],
  },
  {
    key: 'salty',
    label: 'Salty / savoury',
    emoji: '🧂',
    tint: '#f59e0b',
    reason:
      'Salt cravings often mean you’re genuinely low on sodium — especially if you trained or sweat today. This ties straight into your hydration targets.',
    realThing: { name: 'Bag of crisps', kcal: 300 },
    swaps: [
      { name: 'Roasted chickpeas', emoji: '🫘', kcal: 120, why: 'Salty crunch with protein & fibre instead of empty carbs' },
      { name: 'Air-popped popcorn (salted)', emoji: '🍿', kcal: 100, why: 'Big salty bowl for very few calories' },
      { name: 'Pickles / olives', emoji: '🥒', kcal: 50, why: 'Sharp, salty, real sodium — barely any calories' },
      { name: 'Salted edamame', emoji: '🫛', kcal: 130, why: 'Salt hit + 12g protein, slow to eat' },
      { name: 'Rice cake + salt + cottage cheese', emoji: '🧀', kcal: 110, why: 'Crunch, salt and protein together' },
    ],
  },
  {
    key: 'carby',
    label: 'Carbs / starchy',
    emoji: '🍞',
    tint: '#d97706',
    reason:
      'Carb cravings at night usually mean the day was too low on carbs or too hard — your body wants quick fuel. A smart carb + protein stops the binge.',
    realThing: { name: 'Big bowl of pasta / bread', kcal: 500 },
    swaps: [
      { name: 'Air-popped popcorn', emoji: '🍿', kcal: 100, why: 'Huge volume, whole-grain, feels like a lot' },
      { name: 'Toast + eggs', emoji: '🍳', kcal: 220, why: 'The carb you want, anchored with protein so it satisfies' },
      { name: 'Oats + milk (small bowl)', emoji: '🥣', kcal: 200, why: 'Warm, comforting, slow carbs — great before bed' },
      { name: 'Rice cakes + hummus', emoji: '🫓', kcal: 150, why: 'Crunchy carb + fibre and a little protein' },
      { name: 'Smaller real portion + protein', emoji: '🍝', kcal: 300, why: 'Have the pasta — just half it and add chicken/veg' },
    ],
  },
  {
    key: 'fried',
    label: 'Fried / greasy',
    emoji: '🍟',
    tint: '#ea580c',
    reason:
      'Fried-food cravings are about fat, salt and crunch together. You can rebuild all three with far less oil — the air fryer is your friend.',
    realThing: { name: 'Fries / fried snack', kcal: 450 },
    swaps: [
      { name: 'Air-fryer potato wedges', emoji: '🍠', kcal: 180, why: 'Crispy outside, fluffy inside — a fraction of the oil' },
      { name: 'Air-fryer chicken bites', emoji: '🍗', kcal: 220, why: 'Crunchy + savoury with 25g protein' },
      { name: 'Roasted salted nuts (25g)', emoji: '🥜', kcal: 160, why: 'Rich, fatty, salty — scratches the grease itch fast' },
      { name: 'Baked papad / crackers', emoji: '🫓', kcal: 90, why: 'That crispy-salty snap without deep frying' },
      { name: 'Halloumi / paneer (grilled)', emoji: '🧀', kcal: 200, why: 'Salty, chewy, satisfying — grill not fry' },
    ],
  },
  {
    key: 'creamy',
    label: 'Creamy / ice cream',
    emoji: '🍦',
    tint: '#8b5cf6',
    reason:
      'Cold and creamy is a comfort/texture craving. Frozen protein or yogurt gives the same mouthfeel with protein instead of pure sugar and fat.',
    realThing: { name: 'Tub of ice cream', kcal: 400 },
    swaps: [
      { name: 'Frozen Greek yogurt bark', emoji: '🍦', kcal: 150, why: 'Freeze yogurt + berries — spoonable, creamy, protein-rich' },
      { name: 'Banana "nice cream"', emoji: '🍌', kcal: 120, why: 'Blend frozen banana = soft-serve texture, no added sugar' },
      { name: 'Protein ice cream (Halo-style)', emoji: '🥄', kcal: 180, why: 'A whole tub for the calories of two scoops' },
      { name: 'Cottage cheese + cocoa + honey', emoji: '🍮', kcal: 160, why: 'Whipped = mousse; 20g protein, very filling' },
      { name: 'Chilled protein pudding', emoji: '🍫', kcal: 150, why: 'Cold, thick, sweet — hits the dessert note' },
    ],
  },
  {
    key: 'fizzy',
    label: 'Fizzy / soft drink',
    emoji: '🥤',
    tint: '#0ea5e9',
    reason:
      'Often it’s the fizz and ritual you want, not the sugar. Swapping keeps the fun and can cut 150+ empty calories a glass.',
    realThing: { name: 'Can of regular soda', kcal: 140 },
    swaps: [
      { name: 'Soda water + lime', emoji: '🍋', kcal: 5, why: 'All the fizz and ritual, basically zero calories' },
      { name: 'Diet / zero soda', emoji: '🥤', kcal: 1, why: 'Same taste you crave without the sugar' },
      { name: 'Kombucha', emoji: '🍾', kcal: 40, why: 'Fizzy, tangy, gut-friendly — a grown-up swap' },
      { name: 'Sparkling water + fruit', emoji: '🫧', kcal: 15, why: 'Muddle berries or mint for a "mocktail" feel' },
      { name: 'Iced green/herbal tea', emoji: '🧊', kcal: 5, why: 'Cold, flavourful, hydrating ritual for the evening' },
    ],
  },
  {
    key: 'alcohol',
    label: 'Beer / a drink',
    emoji: '🍺',
    tint: '#ca8a04',
    reason:
      'The wind-down ritual matters as much as the drink. If you do want the real one, it fits — just know the cost so it’s a choice, not an accident.',
    realThing: { name: 'Pint of beer / glass of wine', kcal: 200 },
    swaps: [
      { name: 'Alcohol-free beer', emoji: '🍺', kcal: 60, why: 'Same taste and ritual for a third of the calories, no hangover' },
      { name: 'Soda water + lime + bitters', emoji: '🍸', kcal: 15, why: 'Feels like a real drink in the hand, near-zero calories' },
      { name: 'Kombucha (in a glass)', emoji: '🍾', kcal: 40, why: 'Fizzy, complex, sipping-friendly wind-down' },
      { name: 'Herbal / chamomile tea', emoji: '🍵', kcal: 5, why: 'If it’s really about relaxing, this does the wind-down job' },
      { name: 'The real one — fit it in', emoji: '🍻', kcal: 200, why: 'Have it. Log it, skip a snack elsewhere, enjoy it guilt-free' },
    ],
  },
];

export function cravingByKey(key: CravingKey): Craving | undefined {
  return CRAVINGS.find(c => c.key === key);
}
