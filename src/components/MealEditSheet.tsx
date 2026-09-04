import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import type { FoodLog, MealCategory } from '../types/database';
import { MEAL_CATEGORY_OPTIONS } from '../utils/mealCategory';

export type MealEditMode = 'edit' | 'today';

const QUICK = [0.5, 1, 1.5, 2] as const;

// Portion adjuster for a logged meal. Scales the stored calories/macros by a
// multiplier (1× = as originally logged) and either updates the existing entry
// ('edit') or logs a fresh copy into today ('today').
export function MealEditSheet({
  meal,
  mode,
  saving,
  onClose,
  onConfirm,
}: {
  meal: FoodLog | null;
  mode: MealEditMode;
  saving: boolean;
  onClose: () => void;
  onConfirm: (multiplier: number, category: MealCategory, amount: number | null) => void;
}) {
  const [mult, setMult] = useState(1);
  const [category, setCategory] = useState<MealCategory>('breakfast');

  // When the entry recorded how much was logged, let the user adjust by that
  // amount (e.g. grams) directly instead of by an abstract multiplier.
  const hasAmount = meal?.amount != null && !!meal?.unit;
  const unitLbl = meal?.unit === 'serving' ? 'serving' : meal?.unit ?? '';
  const curAmount = meal?.amount != null ? Math.round(meal.amount * mult * 100) / 100 : null;

  useEffect(() => {
    if (meal) {
      setMult(1);
      setCategory(meal.meal_category);
    }
  }, [meal]);

  const scale = (v: number | null | undefined) => Math.round((v ?? 0) * mult);
  const macros = meal
    ? [
        { label: 'Protein', value: scale(meal.protein_g), unit: 'g', color: '#22c55e' },
        { label: 'Carbs', value: scale(meal.carbs_g), unit: 'g', color: '#6c63ff' },
        { label: 'Fat', value: scale(meal.fat_g), unit: 'g', color: '#f59e0b' },
      ]
    : [];

  return (
    <Sheet open={meal != null} onClose={onClose} title={mode === 'today' ? 'Add to today' : 'Edit entry'}>
      {meal ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">{meal.meal_name}</p>
            <p className="text-[11px] text-[var(--muted)]">
              {hasAmount
                ? `Originally ${meal.amount} ${unitLbl} — adjust the amount below`
                : '1× = the portion you originally logged'}
            </p>
          </div>

          {/* Scaled calories */}
          <div className="flex items-baseline justify-between rounded-2xl bg-[var(--bg)] p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Calories</span>
            <span className="text-2xl font-black text-[var(--text)]">{scale(meal.calories)} kcal</span>
          </div>

          {/* Macro breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {macros.map(m => (
              <div key={m.label} className="rounded-2xl bg-[var(--bg)] p-3 text-center">
                <p className="text-lg font-black leading-tight" style={{ color: m.color }}>
                  {m.value}
                  {m.unit}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Meal-time picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">Meal</label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_CATEGORY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setCategory(o.value)}
                  className="rounded-xl px-3 py-2 text-xs font-bold"
                  style={
                    category === o.value
                      ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                      : { background: 'var(--bg)', color: 'var(--muted)' }
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount editor (when the logged amount is known) */}
          {hasAmount ? (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">Amount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={curAmount ?? ''}
                  onChange={e => {
                    const v = Number(e.target.value) || 0;
                    setMult(meal.amount ? v / meal.amount : 1);
                  }}
                  className="w-28 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-base font-semibold text-[var(--text)]"
                />
                <span className="text-sm font-semibold text-[var(--muted)]">{unitLbl}</span>
              </div>
            </div>
          ) : null}

          {/* Quantity picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text)]">
              {hasAmount ? 'Or quick multiplier' : 'Quantity'}
            </label>
            <div className="flex gap-1.5">
              {QUICK.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setMult(q)}
                  className="flex-1 rounded-xl py-2 text-xs font-bold"
                  style={
                    Math.abs(mult - q) < 0.001
                      ? { background: 'var(--accent)', color: 'var(--on-accent)' }
                      : { background: 'var(--bg)', color: 'var(--muted)' }
                  }
                >
                  {q}×
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Custom</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={mult}
                onChange={e => setMult(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <span className="text-xs text-[var(--muted)]">×</span>
            </div>
          </div>

          <button
            type="button"
            disabled={saving || mult <= 0}
            onClick={() => onConfirm(mult, category, curAmount)}
            className="rounded-2xl py-3 text-sm font-bold text-[var(--on-accent)] disabled:opacity-50"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {saving ? 'Saving…' : mode === 'today' ? 'Add to today' : 'Save changes'}
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
