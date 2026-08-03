// Soft plausibility checks — used to WARN (never block) on clearly-off entries,
// so a fat-fingered value doesn't skew the long-term trend charts.

/** Returns a short warning if a value is outside a plausible range, else null. */
export function rangeWarning(
  raw: string | number,
  min: number,
  max: number,
  noun: string,
): string | null {
  const v = typeof raw === 'number' ? raw : parseFloat(raw);
  if (raw === '' || raw == null || Number.isNaN(v)) return null;
  if (v < min) return `That seems low for ${noun} — double-check the number.`;
  if (v > max) return `That seems high for ${noun} — double-check the number.`;
  return null;
}

// Plausible body-weight range by unit (generous, only catches typos).
export const WEIGHT_RANGE = { kg: { min: 20, max: 400 }, lb: { min: 44, max: 880 } };

// Plausible girth range for any body-measurement site, in inches / cm.
export const GIRTH_RANGE = { in: { min: 2, max: 80 }, cm: { min: 5, max: 200 } };

// Plausible single-set lifted weight (kg).
export const LIFT_KG = { min: 0, max: 600 };
