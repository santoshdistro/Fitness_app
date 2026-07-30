const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT_ID = {
  ENERGY_KCAL: 1008,
  PROTEIN_G: 1003,
  FAT_G: 1004,
  CARBS_G: 1005,
  FIBER_G: 1079,
  SODIUM_MG: 1093,
  SUGAR_G: 2000,
  SAT_FAT_G: 1258,
  TRANS_FAT_G: 1257,
  POLY_FAT_G: 1293,
  MONO_FAT_G: 1292,
};

type UsdaFoodNutrient = {
  nutrientId: number;
  value: number;
};

type UsdaLabelNutrients = {
  calories?: { value: number };
  protein?: { value: number };
  fat?: { value: number };
  carbohydrates?: { value: number };
  fiber?: { value: number };
  sodium?: { value: number };
  sugars?: { value: number };
  saturatedFat?: { value: number };
  transFat?: { value: number };
  polyunsaturatedFat?: { value: number };
  monounsaturatedFat?: { value: number };
};

type UsdaFood = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaFoodNutrient[];
  labelNutrients?: UsdaLabelNutrients;
};

export type FoodSearchResult = {
  fdcId: number;
  description: string;
  brandOwner?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  satFat: number;
  transFat: number;
  polyFat: number;
  monoFat: number;
  /** true: values are for one serving (servingSize/servingSizeUnit). false: values are per 100g. */
  isPerServing: boolean;
  servingSize?: number;
  servingSizeUnit?: string;
};

function extractNutrient(foodNutrients: UsdaFoodNutrient[] | undefined, id: number): number {
  return foodNutrients?.find(n => n.nutrientId === id)?.value ?? 0;
}

function toSearchResult(food: UsdaFood): FoodSearchResult {
  if (food.labelNutrients) {
    return {
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner,
      calories: Math.round(food.labelNutrients.calories?.value ?? 0),
      protein: Math.round(food.labelNutrients.protein?.value ?? 0),
      carbs: Math.round(food.labelNutrients.carbohydrates?.value ?? 0),
      fat: Math.round(food.labelNutrients.fat?.value ?? 0),
      fiber: Math.round(food.labelNutrients.fiber?.value ?? 0),
      sodium: Math.round(food.labelNutrients.sodium?.value ?? 0),
      sugar: Math.round(food.labelNutrients.sugars?.value ?? 0),
      satFat: Math.round(food.labelNutrients.saturatedFat?.value ?? 0),
      transFat: Math.round(food.labelNutrients.transFat?.value ?? 0),
      polyFat: Math.round(food.labelNutrients.polyunsaturatedFat?.value ?? 0),
      monoFat: Math.round(food.labelNutrients.monounsaturatedFat?.value ?? 0),
      isPerServing: true,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
    };
  }

  return {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner,
    calories: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.ENERGY_KCAL)),
    protein: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.PROTEIN_G)),
    carbs: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.CARBS_G)),
    fat: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.FAT_G)),
    fiber: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.FIBER_G)),
    sodium: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.SODIUM_MG)),
    sugar: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.SUGAR_G)),
    satFat: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.SAT_FAT_G)),
    transFat: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.TRANS_FAT_G)),
    polyFat: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.POLY_FAT_G)),
    monoFat: Math.round(extractNutrient(food.foodNutrients, NUTRIENT_ID.MONO_FAT_G)),
    isPerServing: false,
  };
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const apiKey = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
  const url = `${BASE_URL}/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&pageSize=15`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USDA FoodData Central search failed (${response.status})`);
  }
  const data = (await response.json()) as { foods?: UsdaFood[] };
  return (data.foods ?? []).map(toSearchResult);
}
