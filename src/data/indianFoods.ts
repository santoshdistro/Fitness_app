import type { FoodSearchResult } from '../lib/usdaFoodApi';

// Curated Indian foods database — raw staples/flours/pulses plus common
// home-cooked dishes, breads, snacks, South-Indian items, sweets and drinks.
// Values are approximate but realistic (aligned to IFCT 2017 where possible);
// users can tweak amounts after adding. This fills the gap left by the
// US-centric USDA set for everyday Indian eating, and works fully offline.

// [name, serving label, grams, kcal, protein, carbs, fat, fibre, sodium(mg), aliases?]
// Raw staples use a 100 g basis; cooked dishes use a typical serving.
type Row = [string, string, number, number, number, number, number, number, number, string?];

const ROWS: Row[] = [
  // ── Raw staples / grains / flours (per 100 g, uncooked) ──
  ['Basmati rice', 'raw, 100 g', 100, 360, 7, 78, 1, 1, 5, 'chawal white raw uncooked'],
  ['Brown rice', 'raw, 100 g', 100, 362, 7, 76, 3, 4, 5, 'raw uncooked'],
  ['Wheat flour / Atta', '100 g', 100, 340, 12, 71, 2, 11, 2, 'gehu'],
  ['Maida (refined flour)', '100 g', 100, 350, 10, 76, 1, 3, 2, ''],
  ['Besan (gram flour)', '100 g', 100, 387, 22, 58, 7, 11, 60, 'chana flour'],
  ['Sooji / Rava (semolina)', '100 g', 100, 360, 12, 73, 1, 4, 2, 'suji'],
  ['Poha (flattened rice)', 'raw, 100 g', 100, 350, 7, 77, 1, 2, 5, 'chivda raw uncooked'],
  ['Ragi flour', '100 g', 100, 330, 7, 72, 2, 11, 11, 'finger millet nachni'],
  ['Jowar (sorghum)', '100 g', 100, 330, 10, 72, 3, 10, 5, ''],
  ['Bajra (pearl millet)', '100 g', 100, 348, 11, 67, 5, 11, 10, ''],
  ['Oats', 'raw, 100 g', 100, 380, 13, 67, 7, 10, 5, 'raw uncooked'],
  ['Sabudana (tapioca pearls)', 'raw, 100 g', 100, 350, 0, 87, 0, 1, 5, 'sago raw uncooked'],
  ['Toor / Arhar dal', 'raw, 100 g', 100, 340, 22, 57, 2, 15, 30, 'tuvar pigeon pea raw uncooked'],
  ['Moong dal', 'raw, 100 g', 100, 348, 24, 59, 1, 16, 30, 'green gram raw uncooked'],
  ['Masoor dal', 'raw, 100 g', 100, 350, 25, 60, 1, 11, 20, 'red lentil raw uncooked'],
  ['Chana dal', 'raw, 100 g', 100, 360, 20, 60, 5, 12, 40, 'split bengal gram raw uncooked'],
  ['Urad dal', 'raw, 100 g', 100, 341, 25, 59, 2, 18, 40, 'black gram raw uncooked'],
  ['Rajma (kidney beans)', 'raw, 100 g', 100, 333, 24, 60, 1, 15, 20, 'raw uncooked'],
  ['Kabuli chana (chickpeas)', 'raw, 100 g', 100, 364, 19, 61, 6, 17, 24, 'white chana garbanzo raw uncooked'],

  // ── Cooked staples (per 100 g, plain boiled — the same grains/pulses above,
  //    after cooking, for when you weigh the finished food on your plate) ──
  ['Basmati rice', 'cooked, 100 g', 100, 130, 3, 28, 0, 0, 2, 'chawal white cooked boiled steamed'],
  ['Brown rice', 'cooked, 100 g', 100, 123, 3, 26, 1, 2, 2, 'cooked boiled'],
  ['Poha (flattened rice)', 'cooked, 100 g', 100, 130, 2, 28, 0, 1, 5, 'cooked'],
  ['Oats', 'cooked, 100 g', 100, 71, 3, 12, 1, 2, 3, 'porridge cooked boiled'],
  ['Toor / Arhar dal', 'cooked, 100 g', 100, 120, 7, 22, 0, 5, 5, 'tuvar pigeon pea cooked boiled plain'],
  ['Moong dal', 'cooked, 100 g', 100, 105, 7, 19, 0, 4, 5, 'green gram cooked boiled plain'],
  ['Masoor dal', 'cooked, 100 g', 100, 115, 9, 20, 0, 4, 5, 'red lentil cooked boiled plain'],
  ['Chana dal', 'cooked, 100 g', 100, 120, 7, 20, 2, 5, 8, 'split bengal gram cooked boiled plain'],
  ['Urad dal', 'cooked, 100 g', 100, 110, 8, 18, 0, 6, 8, 'black gram cooked boiled plain'],
  ['Rajma (kidney beans)', 'cooked, 100 g', 100, 127, 9, 23, 0, 6, 5, 'cooked boiled plain'],
  ['Kabuli chana (chickpeas)', 'cooked, 100 g', 100, 164, 9, 27, 3, 8, 6, 'white chana garbanzo chickpeas cooked boiled plain'],

  // ── Breads ──
  ['Roti / Chapati', '1 medium', 40, 120, 3, 18, 3, 3, 120, 'chapathi phulka'],
  ['Missi roti', '1', 60, 190, 7, 28, 5, 4, 300, ''],
  ['Tandoori roti', '1', 60, 150, 5, 30, 1, 2, 200, ''],
  ['Makki di roti', '1', 70, 200, 5, 32, 6, 4, 250, 'corn roti'],
  ['Naan', '1', 90, 260, 9, 45, 5, 2, 420, ''],
  ['Butter naan', '1', 100, 320, 9, 46, 11, 2, 480, ''],
  ['Kulcha', '1', 90, 280, 8, 46, 7, 2, 450, ''],
  ['Plain paratha', '1', 80, 260, 5, 36, 10, 3, 300, 'parantha'],
  ['Lachha paratha', '1', 90, 330, 6, 42, 15, 3, 350, ''],
  ['Aloo paratha', '1', 120, 300, 6, 40, 12, 4, 400, ''],
  ['Gobi paratha', '1', 120, 290, 7, 38, 12, 4, 400, ''],
  ['Paneer paratha', '1', 130, 340, 12, 38, 15, 4, 430, ''],
  ['Methi thepla', '2', 80, 250, 6, 34, 10, 4, 400, ''],
  ['Puri', '1', 20, 85, 1, 10, 4, 1, 60, 'poori'],
  ['Bhatura', '1', 90, 300, 7, 45, 10, 2, 350, ''],
  ['Appam', '1', 90, 120, 2, 24, 1, 1, 150, ''],

  // ── Rice dishes ──
  ['Plain rice', '1 cup cooked', 150, 200, 4, 44, 1, 1, 5, 'boiled steamed chawal'],
  ['Jeera rice', '1 cup', 150, 250, 4, 45, 6, 1, 300, ''],
  ['Ghee rice', '1 cup', 150, 300, 5, 46, 11, 1, 350, ''],
  ['Veg biryani', '1 plate', 250, 350, 8, 55, 10, 4, 600, ''],
  ['Chicken biryani', '1 plate', 300, 500, 22, 60, 18, 4, 800, ''],
  ['Mutton biryani', '1 plate', 300, 560, 24, 60, 24, 4, 850, ''],
  ['Egg biryani', '1 plate', 280, 430, 15, 58, 15, 4, 750, ''],
  ['Pulao', '1 cup', 180, 280, 6, 48, 7, 3, 400, 'pilaf'],
  ['Curd rice', '1 bowl', 200, 250, 7, 40, 6, 1, 400, 'thayir sadam'],
  ['Lemon rice', '1 cup', 180, 290, 5, 45, 10, 2, 450, ''],
  ['Tamarind rice', '1 cup', 180, 300, 5, 46, 10, 2, 500, 'puliyogare'],
  ['Tomato rice', '1 cup', 180, 280, 5, 45, 9, 2, 450, ''],
  ['Fried rice (veg)', '1 plate', 220, 330, 7, 52, 10, 3, 700, ''],
  ['Khichdi', '1 bowl', 250, 300, 10, 45, 8, 5, 500, 'khichri'],
  ['Bisi bele bath', '1 bowl', 250, 350, 10, 52, 10, 6, 600, ''],

  // ── Dals & legumes ──
  ['Dal tadka', '1 bowl', 150, 180, 9, 22, 6, 5, 500, 'dal fry yellow dal'],
  ['Dal makhani', '1 bowl', 150, 280, 11, 25, 14, 6, 550, ''],
  ['Rajma', '1 bowl', 200, 240, 12, 34, 6, 9, 600, 'kidney bean curry'],
  ['Chana masala', '1 bowl', 200, 260, 11, 35, 8, 10, 650, ''],
  ['Chole', '1 bowl', 200, 280, 12, 36, 9, 10, 700, 'chickpea curry'],
  ['Sambar', '1 bowl', 200, 140, 7, 20, 3, 5, 500, ''],
  ['Rasam', '1 bowl', 200, 80, 3, 12, 2, 2, 500, ''],
  ['Kadhi', '1 bowl', 200, 180, 7, 18, 9, 2, 550, 'kadhi pakora'],
  ['Rajma chawal', '1 plate', 350, 450, 15, 70, 10, 10, 700, ''],

  // ── Veg curries / sabzi ──
  ['Aloo methi', '1 serving', 200, 200, 5, 25, 9, 5, 450, 'sabji sabzi'],
  ['Aloo gobi', '1 bowl', 200, 190, 5, 24, 9, 6, 450, ''],
  ['Aloo jeera', '1 bowl', 180, 210, 4, 28, 10, 4, 400, ''],
  ['Bhindi masala', '1 bowl', 150, 170, 4, 15, 11, 5, 400, 'okra ladyfinger'],
  ['Baingan bharta', '1 bowl', 200, 180, 4, 18, 11, 6, 450, 'brinjal eggplant'],
  ['Mixed veg curry', '1 bowl', 200, 200, 5, 20, 11, 5, 450, ''],
  ['Lauki sabzi', '1 bowl', 200, 130, 3, 16, 6, 4, 400, 'bottle gourd'],
  ['Karela sabzi', '1 bowl', 150, 150, 4, 16, 8, 5, 400, 'bitter gourd'],
  ['Cabbage sabzi', '1 bowl', 150, 130, 4, 14, 7, 5, 400, 'patta gobi'],
  ['Beans poriyal', '1 bowl', 150, 140, 4, 14, 7, 6, 350, ''],
  ['Avial', '1 bowl', 180, 200, 5, 18, 12, 6, 450, ''],
  ['Sarson ka saag', '1 bowl', 200, 220, 7, 16, 14, 6, 500, 'mustard greens'],
  ['Dum aloo', '1 bowl', 200, 260, 5, 30, 13, 4, 500, ''],
  ['Egg bhurji', '2 eggs', 120, 220, 14, 4, 16, 1, 400, 'anda bhurji scrambled'],

  // ── Paneer ──
  ['Palak paneer', '1 bowl', 200, 300, 14, 12, 22, 4, 550, 'spinach paneer'],
  ['Paneer butter masala', '1 bowl', 200, 380, 15, 16, 28, 3, 650, ''],
  ['Shahi paneer', '1 bowl', 200, 400, 15, 18, 30, 3, 650, ''],
  ['Matar paneer', '1 bowl', 200, 320, 14, 18, 20, 5, 600, ''],
  ['Kadai paneer', '1 bowl', 200, 340, 15, 16, 23, 4, 620, ''],
  ['Paneer bhurji', '1 bowl', 150, 300, 16, 8, 22, 2, 500, ''],
  ['Chilli paneer', '1 plate', 200, 350, 16, 20, 22, 3, 800, ''],
  ['Paneer tikka', '6 pieces', 150, 300, 18, 10, 20, 2, 550, ''],
  ['Malai kofta', '1 bowl', 200, 400, 10, 28, 28, 3, 650, ''],

  // ── Non-veg ──
  ['Butter chicken', '1 bowl', 200, 430, 27, 12, 30, 2, 800, 'murgh makhani'],
  ['Chicken curry', '1 bowl', 200, 300, 25, 8, 18, 2, 700, 'chicken masala'],
  ['Chicken tikka', '4 pieces', 150, 250, 30, 5, 12, 1, 600, ''],
  ['Tandoori chicken', '2 pieces', 200, 300, 35, 4, 16, 0, 700, ''],
  ['Chilli chicken', '1 plate', 200, 360, 26, 18, 20, 2, 900, ''],
  ['Chicken 65', '1 plate', 180, 340, 27, 14, 20, 1, 850, ''],
  ['Egg curry', '2 eggs', 200, 280, 16, 10, 20, 2, 600, 'anda curry'],
  ['Boiled egg', '1', 50, 78, 6, 1, 5, 0, 62, 'anda'],
  ['Omelette', '2 eggs', 120, 220, 14, 3, 17, 0, 350, ''],
  ['Fish curry', '1 bowl', 200, 250, 22, 8, 14, 1, 650, 'machli'],
  ['Fish fry', '2 pieces', 150, 280, 24, 8, 17, 1, 600, ''],
  ['Prawn curry', '1 bowl', 200, 240, 22, 9, 12, 1, 700, 'jhinga'],
  ['Mutton curry', '1 bowl', 200, 380, 24, 8, 28, 1, 750, 'gosht lamb'],
  ['Keema', '1 bowl', 150, 320, 22, 6, 24, 2, 650, 'kheema mince'],

  // ── South Indian ──
  ['Idli', '2 pieces', 80, 120, 4, 26, 1, 2, 300, ''],
  ['Plain dosa', '1', 80, 170, 4, 28, 5, 2, 350, 'dosai'],
  ['Masala dosa', '1', 150, 290, 6, 42, 11, 4, 500, ''],
  ['Rava dosa', '1', 120, 250, 5, 38, 9, 2, 450, ''],
  ['Medu vada', '2 pieces', 90, 260, 6, 30, 13, 4, 400, 'vada'],
  ['Uttapam', '1', 130, 230, 6, 36, 7, 3, 450, ''],
  ['Upma', '1 bowl', 180, 250, 6, 38, 8, 3, 450, ''],
  ['Poha', '1 bowl', 180, 270, 5, 45, 8, 3, 400, 'pohe'],
  ['Pongal', '1 bowl', 200, 300, 8, 45, 9, 3, 500, ''],
  ['Coconut chutney', '2 tbsp', 40, 90, 2, 4, 8, 2, 150, ''],

  // ── Snacks / street food ──
  ['Samosa', '1', 60, 260, 4, 28, 15, 3, 400, ''],
  ['Pakora', '5 pieces', 80, 280, 6, 24, 18, 3, 400, 'bhaji fritter'],
  ['Vada pav', '1', 150, 300, 7, 45, 11, 4, 600, ''],
  ['Pav bhaji', '1 plate', 250, 400, 9, 50, 18, 6, 800, ''],
  ['Dhokla', '3 pieces', 120, 160, 6, 26, 4, 3, 450, ''],
  ['Chole bhature', '1 plate', 350, 650, 18, 80, 28, 8, 1000, ''],
  ['Aloo tikki', '2 pieces', 120, 240, 4, 30, 12, 4, 450, ''],
  ['Dahi vada', '2 pieces', 150, 230, 7, 30, 9, 3, 500, 'dahi bhalla'],
  ['Chana chaat', '1 bowl', 150, 200, 9, 28, 5, 8, 500, ''],
  ['Bhel puri', '1 plate', 120, 250, 6, 40, 8, 4, 600, ''],
  ['Sev puri', '1 plate', 120, 300, 6, 42, 12, 4, 650, ''],
  ['Pani puri', '6 pieces', 120, 200, 4, 34, 6, 3, 500, 'golgappa puchka gol gappe'],
  ['Kachori', '1', 60, 270, 5, 30, 14, 3, 400, ''],
  ['Bread pakora', '1', 90, 260, 6, 30, 13, 2, 450, ''],
  ['Papdi chaat', '1 plate', 130, 280, 6, 38, 12, 4, 600, ''],
  ['Momos (veg)', '6 pieces', 150, 250, 7, 42, 6, 3, 500, ''],
  ['Maggi noodles', '1 pack cooked', 150, 350, 7, 50, 13, 2, 900, 'instant noodles'],
  ['Sabudana khichdi', '1 bowl', 180, 300, 4, 48, 11, 2, 400, ''],
  ['Khakhra', '2', 40, 160, 5, 26, 4, 3, 250, ''],

  // ── Maharashtrian ──
  ['Misal pav', '1 plate', 300, 450, 15, 55, 18, 10, 900, 'usal misal'],
  ['Puran poli', '1', 120, 350, 8, 58, 10, 4, 200, 'puran poli holige'],
  ['Thalipeeth', '1', 100, 250, 7, 34, 10, 5, 400, ''],
  ['Pithla', '1 bowl', 200, 250, 11, 22, 13, 5, 500, 'zunka besan curry'],
  ['Jowar bhakri', '1', 70, 200, 5, 40, 2, 6, 150, 'bhakri'],
  ['Bajra bhakri', '1', 70, 210, 6, 38, 4, 6, 150, 'bhakri'],
  ['Kanda poha', '1 bowl', 180, 270, 5, 45, 8, 3, 400, 'onion poha'],
  ['Sabudana vada', '2 pieces', 100, 300, 4, 40, 14, 2, 450, 'sago vada'],
  ['Batata vada', '2 pieces', 120, 280, 5, 34, 14, 3, 450, 'aloo vada'],
  ['Matki usal', '1 bowl', 200, 220, 12, 30, 6, 9, 500, 'moth bean sprout usal'],
  ['Varan bhaat', '1 plate', 300, 350, 11, 58, 8, 6, 500, 'dal rice'],
  ['Masale bhat', '1 bowl', 200, 320, 7, 50, 10, 4, 550, 'spiced rice'],
  ['Bharli vangi', '1 bowl', 200, 260, 6, 22, 17, 6, 500, 'stuffed brinjal eggplant'],
  ['Aluchi patal bhaji', '1 bowl', 200, 180, 5, 20, 9, 5, 450, 'colocasia alu bhaji'],
  ['Amti', '1 bowl', 200, 190, 9, 24, 6, 5, 550, 'maharashtrian dal'],
  ['Sol kadhi', '1 glass', 200, 120, 2, 12, 7, 1, 300, 'kokum coconut'],
  ['Kothimbir vadi', '3 pieces', 90, 220, 6, 26, 10, 3, 400, 'coriander vadi'],
  ['Ukadiche modak', '2 pieces', 80, 200, 3, 34, 6, 1, 40, 'modak steamed'],
  ['Basundi', '1 bowl', 150, 300, 8, 36, 14, 0, 90, ''],
  ['Shankarpali', '5 pieces', 50, 240, 3, 30, 12, 1, 60, 'shakarpara'],
  ['Thecha', '1 tbsp', 20, 30, 1, 3, 2, 1, 200, 'green chilli chutney'],

  // ── Sweets ──
  ['Gulab jamun', '2 pieces', 80, 300, 4, 45, 12, 0, 60, ''],
  ['Rasgulla', '2 pieces', 100, 200, 4, 40, 3, 0, 40, ''],
  ['Rasmalai', '2 pieces', 120, 320, 8, 40, 14, 0, 80, ''],
  ['Jalebi', '2 pieces', 60, 250, 2, 45, 8, 0, 30, ''],
  ['Kheer', '1 bowl', 150, 250, 6, 40, 8, 1, 100, 'payasam'],
  ['Gajar halwa', '1 bowl', 120, 350, 5, 42, 18, 3, 90, 'carrot halwa'],
  ['Halwa (sooji)', '1 bowl', 100, 350, 4, 45, 18, 2, 80, ''],
  ['Ladoo', '1', 40, 180, 3, 24, 9, 1, 30, 'laddu boondi besan'],
  ['Barfi', '1 piece', 40, 170, 3, 22, 8, 0, 30, ''],
  ['Kaju katli', '2 pieces', 30, 150, 3, 16, 8, 1, 20, ''],
  ['Soan papdi', '1 piece', 30, 130, 1, 20, 6, 0, 25, ''],
  ['Mysore pak', '1 piece', 40, 220, 2, 24, 13, 0, 20, ''],
  ['Shrikhand', '1 bowl', 150, 280, 8, 38, 11, 0, 90, ''],

  // ── Dairy & drinks ──
  ['Full cream milk', '1 glass', 250, 160, 8, 12, 9, 0, 100, 'doodh'],
  ['Toned milk', '1 glass', 250, 120, 8, 12, 4, 0, 100, ''],
  ['Masala chai', '1 cup', 150, 90, 3, 12, 3, 0, 40, 'tea'],
  ['Filter coffee', '1 cup', 150, 90, 3, 12, 3, 0, 40, ''],
  ['Sweet lassi', '1 glass', 250, 220, 7, 34, 6, 0, 100, ''],
  ['Mango lassi', '1 glass', 250, 260, 7, 42, 6, 0, 100, ''],
  ['Buttermilk / Chaas', '1 glass', 250, 60, 4, 6, 2, 0, 300, 'chhaas'],
  ['Nimbu paani', '1 glass', 250, 90, 0, 23, 0, 0, 80, 'lemonade shikanji'],
  ['Coconut water', '1 glass', 250, 45, 2, 9, 0, 0, 60, 'nariyal pani'],
  ['Curd / Dahi', '1 bowl', 150, 100, 6, 8, 5, 0, 80, 'yogurt'],
  ['Paneer', '100 g', 100, 265, 18, 6, 20, 0, 20, 'cottage cheese'],
  ['Ghee', '1 tsp', 5, 45, 0, 0, 5, 0, 0, 'clarified butter'],
];

type Entry = { food: FoodSearchResult; haystack: string };

const INDIAN_FOODS: Entry[] = ROWS.map(
  ([name, serving, grams, kcal, p, c, f, fiber, sodium, aliases], i) => ({
    food: {
      fdcId: -100000 - i, // distinct from USDA (positive) and OFF (small negatives)
      description: `${name} (${serving})`,
      brandOwner: 'Indian foods',
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
    },
    haystack: `${name} ${aliases ?? ''}`.toLowerCase(),
  }),
);

export function searchIndianFoods(query: string): FoodSearchResult[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return INDIAN_FOODS.filter(entry => tokens.every(t => entry.haystack.includes(t)))
    .slice(0, 12)
    .map(entry => entry.food);
}
