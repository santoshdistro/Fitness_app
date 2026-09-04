// Open Food Facts: free, open, no API key. Barcode -> product and free-text
// search. Routed through our /api/food-db proxy so OFF gets a proper User-Agent
// (it rate-limits / blocks anonymous browser requests). Nutriments are per 100g.

import type { FoodSearchResult } from './usdaFoodApi';

export type BarcodeProduct = {
  name: string;
  brand: string | null;
  per100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sodium_mg: number;
    sugar_g: number;
    sat_fat_g: number;
    mono_fat_g: number;
    poly_fat_g: number;
    trans_fat_g: number;
  };
  servingSize: string | null;
};

type OffNutriments = Record<string, number | string | undefined>;
type OffResponse = {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: OffNutriments;
  };
};

function num(value: number | string | undefined): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? Math.max(0, Math.round(n as number)) : 0;
}

type OffSearchProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OffNutriments;
};

// Free-text search of the global Open Food Facts catalogue (great for branded &
// regional products the US-only USDA set misses). Values are per 100g.
export async function searchOpenFoodFacts(query: string): Promise<FoodSearchResult[]> {
  const res = await fetch('/api/food-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: query }),
  });
  if (!res.ok) throw new Error('Open Food Facts search failed.');
  const data = (await res.json()) as { products?: OffSearchProduct[] };

  return (data.products ?? [])
    .filter(p => p.product_name?.trim() && p.nutriments?.['energy-kcal_100g'] != null)
    .map((p, i) => {
      const n = p.nutriments ?? {};
      const sodiumG =
        n['sodium_100g'] != null
          ? Number(n['sodium_100g'])
          : n['salt_100g'] != null
            ? Number(n['salt_100g']) / 2.5
            : 0;
      return {
        // Negative ids keep OFF results distinct from USDA's positive fdcIds.
        fdcId: -1 - i,
        description: p.product_name!.trim(),
        brandOwner: p.brands?.split(',')[0]?.trim() || undefined,
        calories: num(n['energy-kcal_100g']),
        protein: num(n['proteins_100g']),
        carbs: num(n['carbohydrates_100g']),
        fat: num(n['fat_100g']),
        fiber: num(n['fiber_100g']),
        sodium: Number.isFinite(sodiumG) ? Math.round(sodiumG * 1000) : 0,
        sugar: num(n['sugars_100g']),
        satFat: num(n['saturated-fat_100g']),
        transFat: num(n['trans-fat_100g']),
        polyFat: num(n['polyunsaturated-fat_100g']),
        monoFat: num(n['monounsaturated-fat_100g']),
        isPerServing: false,
      };
    });
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const res = await fetch('/api/food-db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: barcode }),
  });
  if (!res.ok) throw new Error('Could not reach the barcode database.');

  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) return null;

  const n = data.product.nutriments ?? {};
  // sodium is grams in OFF; fall back to salt/2.5 if sodium missing.
  const sodiumG =
    n['sodium_100g'] != null
      ? Number(n['sodium_100g'])
      : n['salt_100g'] != null
        ? Number(n['salt_100g']) / 2.5
        : 0;

  return {
    name: data.product.product_name?.trim() || 'Scanned product',
    brand: data.product.brands?.split(',')[0]?.trim() || null,
    servingSize: data.product.serving_size?.trim() || null,
    per100g: {
      calories: num(n['energy-kcal_100g']),
      protein_g: num(n['proteins_100g']),
      carbs_g: num(n['carbohydrates_100g']),
      fat_g: num(n['fat_100g']),
      fiber_g: num(n['fiber_100g']),
      sodium_mg: Number.isFinite(sodiumG) ? Math.round(sodiumG * 1000) : 0,
      sugar_g: num(n['sugars_100g']),
      sat_fat_g: num(n['saturated-fat_100g']),
      mono_fat_g: num(n['monounsaturated-fat_100g']),
      poly_fat_g: num(n['polyunsaturated-fat_100g']),
      trans_fat_g: num(n['trans-fat_100g']),
    },
  };
}
