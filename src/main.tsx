import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { applyTheme, applySurface, applyBackdrop, applyThemeColor } from './hooks/useSettings';

// Apply the saved theme + surface before first paint to avoid a flash. These are
// the same helpers the settings hook runs, rather than a second copy of the
// logic: the copy that used to live here had drifted, and tinted the iOS status
// bar from a backdrop that the normal surface never displays.
try {
  const parsed = JSON.parse(localStorage.getItem('app_settings') ?? '{}');
  const theme = parsed.theme === 'dark' ? 'dark' : 'light';
  const surface = parsed.surface === 'glass' ? 'glass' : 'normal';
  applyTheme(theme);
  applySurface(surface);
  applyBackdrop(parsed.backdrop ?? '');
  applyThemeColor(theme, parsed.backdrop ?? '', surface);
} catch {
  applyTheme('light');
  applySurface('normal');
}

/**
 * iOS legacy full-screen mode hands a home-screen app a viewport SHORTER than
 * the screen (measured: 797 on an 844pt phone) positioned at the top, so the
 * remainder falls off the bottom — and still reports a 34px bottom safe-area
 * inset describing the full screen, not the viewport it actually gave us. The
 * home indicator is then outside the viewport entirely, and padding reserved
 * for it is dead space.
 *
 * This IS the case the app ships in — see the status-bar meta in index.html.
 * The `default` branch below still matters, though: that setting is read when
 * the app is added to the home screen, so an install made under it keeps it
 * until the app is removed and re-added, and the layout has to be right there
 * too.
 *
 * Two things follow from a short viewport: the bottom inset does not apply
 * (--safe-bottom collapses to zero), and the strip below is unreachable by the
 * page — nothing can be drawn there but the body background. So the nav goes
 * flush to the bottom of what we DO have and the strip is painted to continue
 * it, which is how a native tab bar's indicator area looks anyway.
 */
const MAX_PLAUSIBLE_INSET = 120;

/**
 * env(safe-area-inset-top) in pixels. Custom properties are not resolved by
 * getComputedStyle, so the value has to be measured off a real box.
 */
function topInset(): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height;
}

function trackViewportEdge() {
  // Standalone only. In a browser the viewport is short because of the toolbars,
  // and there env() genuinely does describe an overlapping indicator.
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  // Clamped: some browsers report screen.height in the device's fixed
  // orientation, which in landscape makes this difference meaningless. A status
  // bar is never 120pt, so anything larger is a measurement we don't trust.
  const lost = Math.round(window.screen.height - window.innerHeight);
  // The top inset is what separates the two ways of losing height. Under
  // black-translucent the app is UNDER the status bar, so the inset is real and
  // the missing height fell off the bottom. Under `default` the viewport starts
  // BELOW the status bar — inset 0 — so the same subtraction is just the band
  // above us, the viewport does reach the bottom of the screen, and the home
  // indicator really is overlapping it. Reading only the difference cannot tell
  // those apart, and getting it backwards either strands a strip or jams the
  // labels under the indicator.
  const short = standalone && lost > 1 && lost <= MAX_PLAUSIBLE_INSET && topInset() > 0;
  const root = document.documentElement;
  root.classList.toggle('standalone', standalone);
  root.classList.toggle('viewport-short', short);
}
trackViewportEdge();
window.addEventListener('resize', trackViewportEdge);
window.addEventListener('orientationchange', trackViewportEdge);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker that powers push reminders (no-op if unsupported).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore — reminders just won't be available */
    });
  });
}
