// TEMPORARY diagnostic. iOS is leaving a strip below the web view that no CSS
// can reach, and the usual causes (a stale home-screen install, a wrong height
// unit) have all been ruled out on the device. This prints what iOS actually
// reports so the cause can be identified instead of guessed at. Delete once the
// bottom inset is understood.
import { useEffect, useState } from 'react';

type Row = [string, string];

function readEnv(side: 'top' | 'bottom'): string {
  // env() is only readable through a real element, not from JS directly.
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;visibility:hidden;height:env(safe-area-inset-${side})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).height;
  probe.remove();
  return value;
}

export function ViewportReport() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const vv = window.visualViewport;
    setRows([
      ['innerHeight', String(window.innerHeight)],
      ['visualViewport', vv ? `${Math.round(vv.height)} @${vv.scale.toFixed(2)}` : 'n/a'],
      ['documentElement', String(document.documentElement.clientHeight)],
      ['screen', `${window.screen.width}x${window.screen.height}`],
      ['devicePixelRatio', String(window.devicePixelRatio)],
      // The decisive pair: a full-screen web app reports a bottom inset here.
      // Zero bottom + a visible strip means iOS never handed us the space.
      ['safe-area top', readEnv('top')],
      ['safe-area bottom', readEnv('bottom')],
      ['standalone', String((navigator as { standalone?: boolean }).standalone)],
      ['display-mode', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'],
      ['screen - inner', String(window.screen.height - window.innerHeight)],
    ]);
  }, []);

  return (
    <div className="mb-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] p-3">
      <p className={`${'text-[10px] font-bold tracking-wider'} text-[var(--muted)]`}>
        DISPLAY DIAGNOSTIC — TEMPORARY
      </p>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <span className="text-[11px] text-[var(--muted)]">{k}</span>
            <span className="text-[11px] font-bold tabular-nums text-[var(--text)]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
