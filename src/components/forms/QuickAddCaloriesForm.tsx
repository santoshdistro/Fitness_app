import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { MEAL_CATEGORY_OPTIONS, defaultMealCategoryForNow } from '../../utils/mealCategory';
import type { MealCategory } from '../../types/database';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function QuickAddCaloriesForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [category, setCategory] = useState<MealCategory>(defaultMealCategoryForNow());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user || !calories) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: 'Quick Add',
      meal_category: category,
      calories: Number(calories),
      protein_g: protein ? Number(protein) : null,
      carbs_g: carbs ? Number(carbs) : null,
      fat_g: fat ? Number(fat) : null,
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className={labelClass} htmlFor="quick-add-category">
          Meal
        </label>
        <select
          id="quick-add-category"
          className={inputClass}
          value={category}
          onChange={e => setCategory(e.target.value as MealCategory)}
        >
          {MEAL_CATEGORY_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="quick-add-calories">
          Calories
        </label>
        <input
          id="quick-add-calories"
          className={inputClass}
          type="number"
          inputMode="numeric"
          min="0"
          value={calories}
          onChange={e => setCalories(e.target.value)}
          required
        />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="quick-add-protein">
            Protein (g)
          </label>
          <input
            id="quick-add-protein"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={protein}
            onChange={e => setProtein(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="quick-add-carbs">
            Carbs (g)
          </label>
          <input
            id="quick-add-carbs"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={carbs}
            onChange={e => setCarbs(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="quick-add-fat">
            Fat (g)
          </label>
          <input
            id="quick-add-fat"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={fat}
            onChange={e => setFat(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || !calories} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Add calories'}
      </button>
    </form>
  );
}
