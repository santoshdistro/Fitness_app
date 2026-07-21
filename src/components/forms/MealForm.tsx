import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

export function MealForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: mealName,
      calories: calories ? Number(calories) : null,
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
      <label className={labelClass} htmlFor="meal-name-input">
        Meal name
      </label>
      <input
        id="meal-name-input"
        className={inputClass}
        style={{ marginBottom: '0.75rem' }}
        type="text"
        value={mealName}
        onChange={e => setMealName(e.target.value)}
        placeholder="e.g. Chicken & rice"
        required
      />

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="calories-input">
            Calories
          </label>
          <input
            id="calories-input"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="protein-input">
            Protein (g)
          </label>
          <input
            id="protein-input"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={protein}
            onChange={e => setProtein(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="carbs-input">
            Carbs (g) - optional
          </label>
          <input
            id="carbs-input"
            className={inputClass}
            type="number"
            inputMode="numeric"
            min="0"
            value={carbs}
            onChange={e => setCarbs(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fat-input">
            Fat (g) - optional
          </label>
          <input
            id="fat-input"
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
      <button
        type="submit"
        disabled={saving || !mealName || !calories || !protein}
        className={submitButtonClass}
      >
        {saving ? 'Saving...' : 'Add meal'}
      </button>
    </form>
  );
}
