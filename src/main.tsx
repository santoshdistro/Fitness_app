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
