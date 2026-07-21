import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Row = { exercise: string; reps: string; weight: string };

const BLANK_ROW: Row = { exercise: '', reps: '', weight: '' };

type Props = {
  onSaved: () => void;
};

export function WorkoutForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [routineName, setRoutineName] = useState('');
  const [rows, setRows] = useState<Row[]>([{ ...BLANK_ROW }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, field: keyof Row, value: string) {
    setRows(current =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    setRows(current => [...current, { ...BLANK_ROW }]);
  }

  function removeRow(index: number) {
    setRows(current => current.filter((_, i) => i !== index));
  }

  const validRows = rows.filter(row => row.exercise.trim());

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user || validRows.length === 0) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from('workout_logs').insert({
      user_id: session.user.id,
      routine_name: routineName || null,
      exercise_data: validRows.map(row => ({
        exercise: row.exercise.trim(),
        reps: Number(row.reps) || 0,
        weight: Number(row.weight) || 0,
      })),
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
      <label className={labelClass} htmlFor="routine-name-input">
        Routine name - optional
      </label>
      <input
        id="routine-name-input"
        className={inputClass}
        style={{ marginBottom: '1rem' }}
        type="text"
        value={routineName}
        onChange={e => setRoutineName(e.target.value)}
        placeholder="e.g. Push Day"
      />

      <div className="mb-3 flex flex-col gap-3">
        {rows.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-[2]">
              {index === 0 && <label className={labelClass}>Exercise</label>}
              <input
                className={inputClass}
                type="text"
                value={row.exercise}
                onChange={e => updateRow(index, 'exercise', e.target.value)}
                placeholder="e.g. Bench press"
              />
            </div>
            <div className="flex-1">
              {index === 0 && <label className={labelClass}>Reps</label>}
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min="0"
                value={row.reps}
                onChange={e => updateRow(index, 'reps', e.target.value)}
              />
            </div>
            <div className="flex-1">
              {index === 0 && <label className={labelClass}>Weight (kg)</label>}
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                value={row.weight}
                onChange={e => updateRow(index, 'weight', e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
              aria-label="Remove exercise"
              className="mb-0.5 flex h-[46px] w-9 shrink-0 items-center justify-center text-red-500/70 disabled:opacity-30"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mb-4 w-full rounded-2xl border border-dashed border-[var(--card-border)] py-2.5 text-xs font-semibold"
        style={{ color: 'var(--accent)' }}
      >
        + Add exercise
      </button>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || validRows.length === 0} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save workout'}
      </button>
    </form>
  );
}
