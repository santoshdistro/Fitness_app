import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { WORKOUT_TEMPLATES, type WorkoutTemplate } from '../../data/workoutTemplates';
import { suggestExercises } from '../../data/exerciseNames';
import { LIFT_KG, rangeWarning } from '../../utils/sanity';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';
import { RangeHint } from './RangeHint';

type Row = { exercise: string; sets: string; reps: string; weight: string };

const BLANK_ROW: Row = { exercise: '', sets: '3', reps: '', weight: '' };

type Props = {
  onSaved: () => void;
};

export function WorkoutForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [routineName, setRoutineName] = useState('');
  const [rows, setRows] = useState<Row[]>([{ ...BLANK_ROW }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which exercise field is focused, and the names to suggest for it.
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const suggestions = activeRow != null ? suggestExercises(rows[activeRow]?.exercise ?? '') : [];

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

  function loadTemplate(template: WorkoutTemplate) {
    setRoutineName(template.name);
    setRows(template.exercises.map(e => ({ exercise: e.exercise, sets: '3', reps: String(e.reps), weight: '' })));
  }

  const validRows = rows.filter(row => row.exercise.trim());

  // Warn on the first clearly-off lifted weight (kg) before it lands in charts.
  const offRow = rows.find(r => rangeWarning(r.weight, LIFT_KG.min, LIFT_KG.max, '') !== null);
  const liftWarn = offRow
    ? `${offRow.weight}kg looks off for ${offRow.exercise.trim() || 'a lift'} — double-check.`
    : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user || validRows.length === 0) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from('workout_logs').insert({
      user_id: session.user.id,
      routine_name: routineName || null,
      // Each row is expanded into its number of sets (one entry per set), so
      // volume and set counts add up correctly.
      exercise_data: validRows.flatMap(row => {
        const setCount = Math.max(1, Math.round(Number(row.sets) || 1));
        const entry = {
          exercise: row.exercise.trim(),
          reps: Number(row.reps) || 0,
          weight: Number(row.weight) || 0,
        };
        return Array.from({ length: setCount }, () => ({ ...entry }));
      }),
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
      <label className={labelClass}>Quick start — tap to fill a routine</label>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {WORKOUT_TEMPLATES.map(t => (
          <button
            key={t.name}
            type="button"
            onClick={() => loadTemplate(t)}
            className="shrink-0 rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-[var(--text)]"
          >
            {t.emoji} {t.name}
          </button>
        ))}
      </div>

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
          <div key={index} className="flex items-end gap-1.5">
            <div className="relative flex-[2]">
              {index === 0 && <label className={labelClass}>Exercise</label>}
              <input
                className={inputClass}
                type="text"
                value={row.exercise}
                onChange={e => updateRow(index, 'exercise', e.target.value)}
                onFocus={() => setActiveRow(index)}
                // Delay so a tap on a suggestion registers before the list closes.
                onBlur={() => setTimeout(() => setActiveRow(cur => (cur === index ? null : cur)), 120)}
                placeholder="e.g. Bench press"
                autoComplete="off"
              />
              {activeRow === index && suggestions.length > 0 ? (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-lg">
                  {suggestions.map(name => (
                    <li key={name}>
                      <button
                        type="button"
                        // onMouseDown fires before the input's blur, so the value sticks.
                        onMouseDown={e => {
                          e.preventDefault();
                          updateRow(index, 'exercise', name);
                          setActiveRow(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-xs text-[var(--text)] capitalize active:bg-[var(--bg)]"
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="w-12 shrink-0">
              {index === 0 && <label className={labelClass}>Sets</label>}
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min="1"
                value={row.sets}
                onChange={e => updateRow(index, 'sets', e.target.value)}
              />
            </div>
            <div className="w-12 shrink-0">
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
              {index === 0 && <label className={labelClass}>Wt (kg)</label>}
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
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

      <RangeHint message={liftWarn} />
      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || validRows.length === 0} className={submitButtonClass}>
        {saving ? 'Saving...' : 'Save workout'}
      </button>
    </form>
  );
}
