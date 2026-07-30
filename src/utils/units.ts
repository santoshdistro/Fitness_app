import type { FoodUnit, VolumeUnit, WeightUnit } from '../hooks/useSettings';

const LB_PER_KG = 2.2046226218;
const OZ_PER_G = 0.0352739619;

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/* ---- Weight (stored in kg) ---- */
export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kg * LB_PER_KG : kg;
}
export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / LB_PER_KG : value;
}
/** Weight value as a display string (no unit suffix), rounded for the unit. */
export function weightValue(kg: number | null | undefined, unit: WeightUnit, digits = 1): string {
  if (kg == null) return '--';
  return String(round(kgToUnit(kg, unit), digits));
}

/* ---- Volume (stored in ml) ---- */
/** { value, label } for a volume, e.g. 2500ml -> {"2.50","L"} or {"2500","ml"}. */
export function volumeParts(ml: number, unit: VolumeUnit): { value: string; label: string } {
  return unit === 'l'
    ? { value: (ml / 1000).toFixed(2), label: 'L' }
    : { value: String(Math.round(ml)), label: 'ml' };
}

/* ---- Height (stored in cm) ---- */
export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inches = Math.round(totalIn - ft * 12);
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  return { ft, inches };
}
export function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54 * 10) / 10;
}

/* ---- Food amount (stored in grams) ---- */
export function gToUnit(g: number, unit: FoodUnit): number {
  return unit === 'oz' ? g * OZ_PER_G : g;
}
export function unitToG(value: number, unit: FoodUnit): number {
  return unit === 'oz' ? value / OZ_PER_G : value;
}
