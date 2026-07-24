import { Bell } from 'lucide-react';
import { usePushReminders } from '../../hooks/usePushReminders';
import { REMINDER_DEFS, type ReminderPrefs } from '../../data/reminders';
import { errorTextClass } from './formStyles';

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

  function update(key: keyof ReminderPrefs, patch: Partial<ReminderPrefs[keyof ReminderPrefs]>) {
    savePrefs({ ...prefs, [key]: { ...prefs[key], ...patch } });
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
          <div className="flex flex-col gap-2">
            {REMINDER_DEFS.map(def => {
              const pref = prefs[def.key];
              return (
                <div key={def.key} className="glass-card flex items-center gap-3 p-3">
                  <span className="text-lg">{def.emoji}</span>
                  <p className="flex-1 text-sm font-medium text-[var(--text)]">{def.label}</p>
                  <input
                    type="time"
                    value={pref.time}
                    onChange={e => update(def.key, { time: e.target.value })}
                    disabled={!pref.enabled}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1 text-xs text-[var(--text)] disabled:opacity-40"
                  />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={pref.enabled}
                    onClick={() => update(def.key, { enabled: !pref.enabled })}
                    className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                    style={{ background: pref.enabled ? 'var(--accent)' : 'var(--card-border)' }}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                      style={{ left: pref.enabled ? '1.375rem' : '0.125rem' }}
                    />
                  </button>
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
