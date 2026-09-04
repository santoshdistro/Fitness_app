import { useState } from 'react';
import { Check, Copy, Play, RefreshCw, Smartphone } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { getSyncShortcutName, runSyncShortcut, setSyncShortcutName } from '../utils/healthShortcut';

function makeToken(): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return raw.slice(0, 24);
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="flex w-full items-center gap-2 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-left"
      >
        <span className="flex-1 break-all font-mono text-xs text-[var(--text)]">{value}</span>
        {copied ? (
          <Check size={15} className="shrink-0 text-green-500" />
        ) : (
          <Copy size={15} className="shrink-0 text-[var(--muted)]" />
        )}
      </button>
    </div>
  );
}

export function HealthSyncPanel() {
  const { profile, saveProfile } = useProfile();
  const [working, setWorking] = useState(false);
  const [shortcutName, setShortcutName] = useState(getSyncShortcutName());

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const token = profile?.sync_token ?? null;
  const endpoint =
    typeof window !== 'undefined' ? `${window.location.origin}/api/health-sync` : '/api/health-sync';

  async function regenerate() {
    setWorking(true);
    await saveProfile({ sync_token: makeToken() });
    setWorking(false);
  }

  /**
   * Proves the endpoint is reachable and the token is valid WITHOUT writing
   * anything: a body with a token and no metrics is rejected with a specific
   * 400, so that exact error is the success case here. "Sync doesn't work" is
   * three very different problems — wrong URL, bad token, malformed body — and
   * they are indistinguishable from inside Shortcuts, which reports them all
   * the same way.
   */
  async function testConnection() {
    if (!token) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const text = await res.text();
      let parsed: { error?: string } = {};
      try {
        parsed = JSON.parse(text) as { error?: string };
      } catch {
        // Not JSON at all — almost always a Vercel deployment-protection page,
        // which is what you get when the endpoint points at a preview build.
        setTestResult({
          ok: false,
          message:
            res.status === 401 || text.includes('Authentication')
              ? 'The endpoint is protected — this looks like a preview URL, not the live app. Copy the endpoint from the installed app and update the Shortcut.'
              : `Got ${res.status} and a non-JSON response. The URL is probably not the API.`,
        });
        return;
      }
      if (res.status === 400 && /no health values/i.test(parsed.error ?? '')) {
        setTestResult({ ok: true, message: 'Endpoint reachable and token accepted. Sync is set up correctly.' });
      } else if (res.status === 401) {
        setTestResult({ ok: false, message: 'Token rejected. Regenerate it below and update the Shortcut.' });
      } else {
        setTestResult({ ok: false, message: parsed.error ?? `Unexpected ${res.status}.` });
      }
    } catch {
      setTestResult({ ok: false, message: 'Could not reach the endpoint at all — check the URL and your connection.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card flex items-start gap-3 p-4">
        <Smartphone size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" />
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Push steps, active energy, weight, sleep and water from Apple Health into your daily log with
          an iOS Shortcut — no App Store, no subscription. Set it up once, then run it (or automate it)
          from your phone. If you wear an Apple Watch, add the body signals below too: those are the
          ones that describe your recovery and fitness rather than your behaviour.
        </p>
      </div>

      {token ? (
        <div className="glass-card flex flex-col gap-3 p-4">
          <CopyRow label="Endpoint URL" value={endpoint} />
          <CopyRow label="Your sync token" value={token} />
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="w-full rounded-2xl py-2.5 text-xs font-bold disabled:opacity-50"
            style={{ background: 'var(--input-bg)', color: 'var(--accent)' }}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          {testResult ? (
            <p
              aria-live="polite"
              className="text-[11px] leading-relaxed"
              style={{ color: testResult.ok ? '#22c55e' : '#f97316' }}
            >
              {testResult.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={regenerate}
            disabled={working}
            className="flex items-center justify-center gap-2 text-[11px] font-semibold text-[var(--muted)]"
          >
            <RefreshCw size={12} />
            {working ? 'Working…' : 'Regenerate token (invalidates the old one)'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={regenerate}
          disabled={working}
          className="w-full rounded-2xl py-3 text-sm font-bold text-[var(--on-accent)]"
          style={{ background: 'var(--accent-gradient)' }}
        >
          {working ? 'Generating…' : 'Generate my sync token'}
        </button>
      )}

      {token ? (
        <div className="glass-card flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Sync from inside the app</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
              Type your Shortcut's exact name here to get a one-tap sync button on the Home screen (and
              below). Leave blank if you only use the nightly automation.
            </p>
          </div>
          <input
            className="rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            type="text"
            value={shortcutName}
            onChange={e => {
              setShortcutName(e.target.value);
              setSyncShortcutName(e.target.value);
            }}
            placeholder="e.g. Health Sync"
          />
          {shortcutName.trim() ? (
            <button
              type="button"
              onClick={() => runSyncShortcut(shortcutName)}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-[var(--on-accent)]"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Play size={15} fill="currentColor" />
              Sync now
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="glass-card flex flex-col gap-3 p-4">
        <p className="text-sm font-semibold text-[var(--text)]">Build the Shortcut</p>
        <ol className="flex flex-col gap-2.5 text-xs leading-relaxed text-[var(--muted)]">
          <li>
            <span className="font-semibold text-[var(--text)]">1.</span> Open the{' '}
            <span className="font-semibold text-[var(--text)]">Shortcuts</span> app → <span className="font-semibold text-[var(--text)]">＋</span>{' '}
            to create a new shortcut.
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">2.</span> Add{' '}
            <span className="font-semibold text-[var(--text)]">Find Health Samples</span> actions for the
            metrics you want (Steps, Active Energy, Body Mass, Sleep, Water). Filter each to{' '}
            <span className="font-semibold text-[var(--text)]">Today</span> and calculate the sum (or
            latest, for weight).
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">3.</span> Add{' '}
            <span className="font-semibold text-[var(--text)]">Get Contents of URL</span> and set:
            <ul className="mt-1.5 flex flex-col gap-1 pl-3">
              <li>
                • <span className="font-semibold text-[var(--text)]">URL</span>: the endpoint above
              </li>
              <li>
                • <span className="font-semibold text-[var(--text)]">Method</span>: POST
              </li>
              <li>
                • <span className="font-semibold text-[var(--text)]">Request Body</span>: JSON
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">4.</span> Add these JSON fields (leave out
            any you don't track):
            <div className="mt-1.5 rounded-xl bg-[var(--bg)] px-3 py-2 font-mono text-[10px] leading-relaxed text-[var(--text)]">
              token &nbsp;→ your token
              <br />
              steps &nbsp;→ Steps sum
              <br />
              active_calories → Active Energy (kcal)
              <br />
              weight_kg → Body Mass (kg)
              <br />
              sleep_hours → Sleep (hours)
              <br />
              water_ml → Water (ml)
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[var(--text)]">
              Apple Watch — the ones worth adding
            </p>
            <div className="mt-1 rounded-xl bg-[var(--bg)] px-3 py-2 font-mono text-[10px] leading-relaxed text-[var(--text)]">
              resting_hr → Resting Heart Rate (bpm)
              <br />
              hrv_ms &nbsp;→ Heart Rate Variability (ms)
              <br />
              vo2_max → Cardio Fitness (VO₂ max)
              <br />
              respiratory_rate → Respiratory Rate
              <br />
              wrist_temp_delta → Wrist Temperature (Δ°C)
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
              Use the <span className="font-semibold text-[var(--text)]">latest</span> value for these, not
              a sum — they are measurements, not totals. Wrist temperature is a deviation from your own
              baseline and can be negative, so don't take the absolute value.
            </p>
          </li>
          <li>
            <span className="font-semibold text-[var(--text)]">5.</span> Run it. A green{' '}
            <span className="font-mono">{'{ "ok": true }'}</span> means it saved. Add an{' '}
            <span className="font-semibold text-[var(--text)]">Automation</span> (e.g. daily at 10pm) so
            it syncs itself.
          </li>
        </ol>
        <p className="text-[10px] leading-relaxed text-[var(--muted)]">
          Values overwrite that day's totals (steps, water and active energy are full-day sums from
          Health). Weight is stored in kg — send kilograms even if you view pounds in the app.
        </p>
      </div>
    </div>
  );
}
