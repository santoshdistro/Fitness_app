// Per-mineral "learn & top-up" content for the hydration card. When you tap a
// mineral we show (a) what it does and how it ties into the protein → fibre →
// water flow, and (b) the best everyday foods to top it up, richest first.

export type MineralKey = 'sodium' | 'potassium' | 'magnesium' | 'calcium';

export type MineralFood = { name: string; emoji: string; mg: number; per: string };

export type MineralGuide = {
  key: MineralKey;
  label: string;
  tint: string;
  role: string;
  // Why it matters specifically in the protein / fibre / water chain.
  flowNote: string;
  foods: MineralFood[];
};

export const MINERAL_GUIDES: Record<MineralKey, MineralGuide> = {
  sodium: {
    key: 'sodium',
    label: 'Sodium',
    tint: '#f59e0b',
    role: 'Holds water in your body and carries it into cells. First electrolyte you sweat out.',
    flowNote:
      'The more water you drink for protein and fibre, the more sodium you need alongside it — plain water without sodium just gets peed out and can leave you foggy and cramp-prone.',
    foods: [
      { name: 'Pinch of salt', emoji: '🧂', mg: 580, per: '¼ tsp' },
      { name: 'Electrolyte sachet / ORS', emoji: '💧', mg: 500, per: '1 sachet' },
      { name: 'Pickles', emoji: '🥒', mg: 450, per: '2 spears' },
      { name: 'Olives', emoji: '🫒', mg: 330, per: '5 olives' },
      { name: 'Coconut water', emoji: '🥥', mg: 250, per: '250 ml' },
      { name: 'Feta / cheese', emoji: '🧀', mg: 320, per: '30 g' },
    ],
  },
  potassium: {
    key: 'potassium',
    label: 'Potassium',
    tint: '#22c55e',
    role: 'Sodium’s partner — pulls water into cells and relaxes muscles. Guards against cramps and high blood pressure.',
    flowNote:
      'Aim for at least as much potassium as sodium. On a cut you eat fewer carbs and lose potassium fast, which is a big cause of cramps and low-energy training days.',
    foods: [
      { name: 'Cooked spinach', emoji: '🥬', mg: 840, per: '1 cup' },
      { name: 'Sweet potato', emoji: '🍠', mg: 540, per: '1 medium' },
      { name: 'Banana', emoji: '🍌', mg: 420, per: '1 medium' },
      { name: 'Avocado', emoji: '🥑', mg: 490, per: '½ fruit' },
      { name: 'Beans / lentils', emoji: '🫘', mg: 600, per: '1 cup' },
      { name: 'Coconut water', emoji: '🥥', mg: 600, per: '250 ml' },
    ],
  },
  magnesium: {
    key: 'magnesium',
    label: 'Magnesium',
    tint: '#a855f7',
    role: 'Runs 300+ reactions — muscle relaxation, energy, sleep quality. Quietly depleted by hard training and stress.',
    flowNote:
      'Digesting more protein and fibre uses magnesium, and you lose it in sweat. Low magnesium shows up as night cramps, twitchy muscles and poor sleep — easy to miss.',
    foods: [
      { name: 'Pumpkin seeds', emoji: '🎃', mg: 150, per: '30 g' },
      { name: 'Dark chocolate 85%', emoji: '🍫', mg: 65, per: '30 g' },
      { name: 'Almonds', emoji: '🌰', mg: 80, per: '30 g' },
      { name: 'Cooked spinach', emoji: '🥬', mg: 155, per: '1 cup' },
      { name: 'Black beans', emoji: '🫘', mg: 120, per: '1 cup' },
      { name: 'Oats', emoji: '🌾', mg: 60, per: '40 g dry' },
    ],
  },
  calcium: {
    key: 'calcium',
    label: 'Calcium',
    tint: '#f59e0b',
    role: 'Builds and holds bone, and lets muscles contract — including your heart. Steadily lost and needs daily topping up.',
    flowNote:
      'High protein can raise how much calcium you pass, and hard training stresses bone — so on a cut or heavy block, keeping calcium up protects bone density while you lose fat or build muscle.',
    foods: [
      { name: 'Milk', emoji: '🥛', mg: 300, per: '250 ml' },
      { name: 'Greek yogurt', emoji: '🍶', mg: 200, per: '150 g' },
      { name: 'Cheese', emoji: '🧀', mg: 200, per: '30 g' },
      { name: 'Tofu (set with calcium)', emoji: '🧊', mg: 350, per: '100 g' },
      { name: 'Cooked spinach / greens', emoji: '🥬', mg: 245, per: '1 cup' },
      { name: 'Fortified plant milk', emoji: '🥛', mg: 300, per: '250 ml' },
    ],
  },
};
