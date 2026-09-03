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
 * How much is lost is the top inset, so it is device-specific: ~47pt on a
 * Dynamic Island phone, ~44pt on a notch, ~20pt on a flat-top one, 0 anywhere
 * that hands over the whole screen. Guessing a number fits one phone, so this
 * measures it and publishes it as --edge-lost for the layout to subtract.
 *
 * Two things follow from a short viewport: the bottom inset does not apply
 * (--safe-bottom collapses to zero), and the strip below is unreachable by the
 * page — nothing can be drawn there but the body background. So the nav goes
 * flush to the bottom of what we DO have and the strip is painted to continue
 * it, which is how a native tab bar's indicator area looks anyway.
 */
const MAX_PLAUSIBLE_INSET = 120;

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
  const short = standalone && lost > 1 && lost <= MAX_PLAUSIBLE_INSET;
  const root = document.documentElement;
  root.classList.toggle('viewport-short', short);
  root.style.setProperty('--edge-lost', `${short ? lost : 0}px`);
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
