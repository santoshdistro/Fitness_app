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
 * So measure rather than trust: when the viewport is short, the inset does not
 * apply and --safe-bottom collapses to zero. When iOS hands over the whole
 * screen the indicator really is overlapping, and env() is used as normal.
 */
function trackSafeBottom() {
  // Standalone only. In a browser the viewport is short because of the toolbars,
  // and there env() genuinely does describe an overlapping indicator.
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  const short = window.screen.height - window.innerHeight > 1;
  document.documentElement.classList.toggle('viewport-short', standalone && short);
}
trackSafeBottom();
window.addEventListener('resize', trackSafeBottom);
window.addEventListener('orientationchange', trackSafeBottom);

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
