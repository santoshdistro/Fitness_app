// Open Food Facts: free, open, no API key, CORS-enabled. Barcode -> product.
// Nutriments are per 100g. Called directly from the browser at runtime.

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

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=product_name,brands,serving_size,nutriments`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
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
    },
  };
}
