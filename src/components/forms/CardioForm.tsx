import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useCardioLogs } from '../../hooks/useCardioLogs';
import { todayDateString } from '../../utils/date';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './formStyles';

const TYPES = ['run', 'walk', 'cycle', 'swim', 'other'];
const TYPE_LABEL: Record<string, string> = {
  run: '🏃 Run',
  walk: '🚶 Walk',
  cycle: '🚴 Cycle',
  swim: '🏊 Swim',
  other: '⚡ Other',
};

function pace(distanceKm: number, durationMin: number): string {
  if (!distanceKm || !durationMin) return '';
  const secPerKm = (durationMin * 60) / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

type Props = { onSaved: () => void };

export function CardioForm({ onSaved }: Props) {
  const { logs, addCardio, deleteCardio } = useCardioLogs(10);
  const [type, setType] = useState('run');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [logDate, setLogDate] = useState(todayDateString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paceStr = pace(Number(distance), Number(duration));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: saveError } = await addCardio({
      activity_type: type,
      distance_km: distance ? Number(distance) : null,
      duration_min: duration ? Number(duration) : null,
      calories: calories ? Number(calories) : null,
      session_timestamp: new Date(`${logDate}T12:00:00`).toISOString(),
    });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setDistance('');
    setDuration('');
    setCalories('');
    onSaved();
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className={labelClass} htmlFor="cardio-date">Day</label>
          <input
            id="cardio-date"
            className={inputClass}
            type="date"
            value={logDate}
            max={todayDateString()}
            onChange={e => e.target.value && setLogDate(e.target.value)}
          />
          {logDate !== todayDateString() ? (
            <p className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              Logging for a past day.
            </p>
          ) : null}
        </div>
        <div className="mb-3">
          <label className={labelClass} htmlFor="cardio-type">Activity</label>
          <select id="cardio-type" className={inputClass} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(t => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="cardio-distance">Distance (km)</label>
            <input id="cardio-distance" className={inputClass} type="number" inputMode="decimal" step="any" min="0" value={distance} onChange={e => setDistance(e.target.value)} placeholder="5" />
          </div>
          <div>
            <label className={labelClass} htmlFor="cardio-duration">Time (min)</label>
            <input id="cardio-duration" className={inputClass} type="number" inputMode="decimal" step="any" min="0" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
          </div>
        </div>
        <div className="mb-3">
          <label className={labelClass} htmlFor="cardio-cals">Calories burned — optional</label>
          <input id="cardio-cals" className={inputClass} type="number" inputMode="numeric" min="0" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g. 300" />
        </div>
        {paceStr ? <p className="mb-3 text-xs font-semibold" style={{ color: 'var(--accent)' }}>Pace: {paceStr}</p> : null}
        {error ? <p className={errorTextClass}>{error}</p> : null}
        <button type="submit" disabled={saving || (!distance && !duration)} className={submitButtonClass}>
          {saving ? 'Saving…' : 'Log cardio'}
        </button>
      </form>

      {logs.length > 0 ? (
        <div className="mt-5">
          <p className={labelClass}>Recent</p>
          {logs.map(l => (
            <div key={l.id} className="flex items-center justify-between border-b border-[var(--card-border)] py-2 last:border-b-0">
              <div>
                <p className="text-sm text-[var(--text)]">
                  {TYPE_LABEL[l.activity_type] ?? l.activity_type}
                  {l.distance_km ? ` · ${l.distance_km} km` : ''}
                  {l.duration_min ? ` · ${l.duration_min} min` : ''}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {new Date(l.session_timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {l.distance_km && l.duration_min ? ` · ${pace(l.distance_km, l.duration_min)}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => deleteCardio(l.id)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full text-red-500/70">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
