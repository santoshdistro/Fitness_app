// The four electrolytes that matter for training, cramps and bloating, with
// sensible daily targets and one-tap food sources. Stored as daily totals on
// daily_logs (columns added in migration 0022).

export type ElectrolyteKey = 'sodium' | 'potassium' | 'magnesium' | 'calcium';

export const ELECTROLYTES: {
  key: ElectrolyteKey;
  label: string;
  short: string;
  target: number; // mg / day
  color: string;
  column: 'sodium_mg' | 'potassium_mg' | 'magnesium_mg' | 'calcium_mg';
  note: string;
}[] = [
  { key: 'sodium', label: 'Sodium', short: 'Na', target: 2000, color: '#0ea5e9', column: 'sodium_mg', note: 'Fluid balance · lost in sweat' },
  { key: 'potassium', label: 'Potassium', short: 'K', target: 3500, color: '#22c55e', column: 'potassium_mg', note: 'Cramps · blood pressure' },
  { key: 'magnesium', label: 'Magnesium', short: 'Mg', target: 400, color: '#a855f7', column: 'magnesium_mg', note: 'Cramps · sleep · energy' },
  { key: 'calcium', label: 'Calcium', short: 'Ca', target: 1000, color: '#f59e0b', column: 'calcium_mg', note: 'Bones · muscle function' },
];

export type ElectrolyteAdd = Partial<Record<ElectrolyteKey, number>>;

// Approximate electrolyte content (mg) of common, easy sources — one tap adds
// the amounts to the day's running total.
export const ELECTROLYTE_SOURCES: { name: string; emoji: string; add: ElectrolyteAdd }[] = [
  { name: 'Pinch of salt', emoji: '🧂', add: { sodium: 580 } },
  { name: 'Coconut water', emoji: '🥥', add: { potassium: 600, sodium: 250 } },
  { name: 'Banana', emoji: '🍌', add: { potassium: 420, magnesium: 32 } },
  { name: 'Cooked spinach', emoji: '🥬', add: { potassium: 840, magnesium: 155, calcium: 245 } },
  { name: 'Almonds (30g)', emoji: '🌰', add: { magnesium: 80, calcium: 75 } },
  { name: 'Milk (250ml)', emoji: '🥛', add: { calcium: 300, potassium: 380, sodium: 120 } },
  { name: 'Greek yogurt', emoji: '🍶', add: { calcium: 190, potassium: 240 } },
  { name: 'Dates (2)', emoji: '🌴', add: { potassium: 250, magnesium: 30 } },
  { name: 'Electrolyte sachet / ORS', emoji: '💧', add: { sodium: 500, potassium: 300, magnesium: 50 } },
];
