import { Bell, Droplets } from 'lucide-react';
import { usePushReminders } from '../../hooks/usePushReminders';
import {
  REMINDER_DEFS,
  WATER_INTERVAL_OPTIONS,
  type FixedReminderKey,
  type ReminderPref,
  type WaterReminder,
} from '../../data/reminders';
import { errorTextClass } from './formStyles';

const timeInputClass =
  'rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1 text-xs text-[var(--text)] disabled:opacity-40';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent)' : 'var(--card-border)' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? '1.375rem' : '0.125rem' }}
      />
    </button>
  );
}

export function RemindersForm() {
  const { status, prefs, busy, error, enable, disable, savePrefs, test } = usePushReminders();

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-[var(--muted)]">
        Reminders aren't supported in this browser. On iPhone, open this app from your Home Screen
        (Share → Add to Home Screen) and reminders will work there.
      </p>
    );
  }

  if (status === 'unconfigured') {
    return (
      <p className="text-sm text-[var(--muted)]">
        Reminders need a one-time setup: add your VAPID keys in Vercel (see the README), then
        redeploy. After that this screen lets you switch them on.
      </p>
    );
  }

  function updateItem(key: FixedReminderKey, patch: Partial<ReminderPref>) {
    savePrefs({ ...prefs, items: { ...prefs.items, [key]: { ...prefs.items[key], ...patch } } });
  }
  function updateWater(patch: Partial<WaterReminder>) {
    savePrefs({ ...prefs, water: { ...prefs.water, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Bell size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Daily reminders</p>
            <p className="text-[11px] text-[var(--muted)]">
              {status === 'on' ? 'On for this device' : 'Off'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={status === 'on' ? disable : enable}
          disabled={busy}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: status === 'on' ? '#ef4444' : 'var(--accent)' }}
        >
          {busy ? '…' : status === 'on' ? 'Turn off' : 'Turn on'}
        </button>
      </div>

      {error ? <p className={errorTextClass}>{error}</p> : null}

      {status === 'on' ? (
        <>
          {/* Water — repeats on an interval within a window */}
          <div className="glass-card flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="text-lg">💧</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">Drink water</p>
                <p className="text-[11px] text-[var(--muted)]">Repeats through the day</p>
              </div>
              <Toggle on={prefs.water.enabled} onClick={() => updateWater({ enabled: !prefs.water.enabled })} />
            </div>
            {prefs.water.enabled ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <Droplets size={13} /> Frequency
                  </label>
                  <select
                    value={prefs.water.everyHours}
                    onChange={e => updateWater({ everyHours: Number(e.target.value) })}
                    className={timeInputClass}
                  >
                    {WATER_INTERVAL_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[var(--muted)]">Between</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={prefs.water.startTime}
                      onChange={e => updateWater({ startTime: e.target.value })}
                      className={timeInputClass}
                    />
                    <span className="text-xs text-[var(--muted)]">and</span>
                    <input
                      type="time"
                      value={prefs.water.endTime}
                      onChange={e => updateWater({ endTime: e.target.value })}
                      className={timeInputClass}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Fixed one-time daily reminders */}
          <div className="flex flex-col gap-2">
            {REMINDER_DEFS.map(def => {
              const pref = prefs.items[def.key];
              return (
                <div key={def.key} className="glass-card flex items-center gap-3 p-3">
                  <span className="text-lg">{def.emoji}</span>
                  <p className="flex-1 text-sm font-medium text-[var(--text)]">{def.label}</p>
                  <input
                    type="time"
                    value={pref.time}
                    onChange={e => updateItem(def.key, { time: e.target.value })}
                    disabled={!pref.enabled}
                    className={timeInputClass}
                  />
                  <Toggle on={pref.enabled} onClick={() => updateItem(def.key, { enabled: !pref.enabled })} />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={test}
            className="rounded-2xl border border-[var(--card-border)] py-2.5 text-xs font-semibold text-[var(--text)]"
          >
            Send me a test notification
          </button>
          <p className="text-[11px] text-[var(--muted)]">
            Times use your device's timezone. Reminders only fire if you added this app to your Home
            Screen and left notifications allowed.
          </p>
        </>
      ) : null}
    </div>
  );
}
