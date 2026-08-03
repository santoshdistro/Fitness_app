import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTodayLog } from '../../hooks/useTodayLog';
import { todayDateString } from '../../utils/date';
import { ELECTROLYTES, ELECTROLYTE_SOURCES, type ElectrolyteAdd, type ElectrolyteKey } from '../../data/electrolytes';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

type Amounts = Record<ElectrolyteKey, string>;
const EMPTY: Amounts = { sodium: '', potassium: '', magnesium: '', calcium: '' };

export function ElectrolyteForm({ onSaved }: { onSaved: () => void }) {
  const { session } = useAuth();
  const today = todayDateString();
  const { log, loading } = useTodayLog(today);
  const [vals, setVals] = useState<Amounts>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load today's running totals once (never re-sync, so typing survives resume).
  const populated = useRef(false);
  useEffect(() => {
    if (loading || populated.current) return;
    populated.current = true;
    setVals({
      sodium: log?.sodium_mg != null ? String(log.sodium_mg) : '',
      potassium: log?.potassium_mg != null ? String(log.potassium_mg) : '',
      magnesium: log?.magnesium_mg != null ? String(log.magnesium_mg) : '',
      calcium: log?.calcium_mg != null ? String(log.calcium_mg) : '',
    });
  }, [log, loading]);

  function addSource(add: ElectrolyteAdd) {
    setVals(prev => {
      const next = { ...prev };
      (Object.keys(add) as ElectrolyteKey[]).forEach(k => {
        next[k] = String((Number(prev[k]) || 0) + (add[k] ?? 0));
      });
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await supabase.from('daily_logs').upsert(
      {
        user_id: session.user.id,
        log_date: today,
        sodium_mg: vals.sodium ? Math.round(Number(vals.sodium)) : null,
        potassium_mg: vals.potassium ? Math.round(Number(vals.potassium)) : null,
        magnesium_mg: vals.magnesium ? Math.round(Number(vals.magnesium)) : null,
        calcium_mg: vals.calcium ? Math.round(Number(vals.calcium)) : null,
      },
      { onConflict: 'user_id,log_date' },
    );
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  const empty = !vals.sodium && !vals.potassium && !vals.magnesium && !vals.calcium;

  return (
    <form onSubmit={submit}>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Track today's electrolytes — tap a source to add it, or type totals directly. Great for beating
        cramps and bloating, especially on sweaty training days.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-3">
        {ELECTROLYTES.map(e => (
          <div key={e.key}>
            <label className={labelClass} htmlFor={`el-${e.key}`}>
              {e.label} ({e.short}) mg
            </label>
            <input
              id={`el-${e.key}`}
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              value={vals[e.key]}
              onChange={ev => setVals(prev => ({ ...prev, [e.key]: ev.target.value }))}
              placeholder={`target ${e.target}`}
            />
          </div>
        ))}
      </div>

      <label className={labelClass}>Quick add a source</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ELECTROLYTE_SOURCES.map(s => (
          <button
            key={s.name}
            type="button"
            onClick={() => addSource(s.add)}
            className="rounded-full bg-[var(--bg)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)]"
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}
      <button type="submit" disabled={saving || empty} className={submitButtonClass}>
        {saving ? 'Saving…' : 'Save electrolytes'}
      </button>
    </form>
  );
}
