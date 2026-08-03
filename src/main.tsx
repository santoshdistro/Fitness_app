import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Apply the saved theme + surface before first paint to avoid a flash.
try {
  const saved = localStorage.getItem('app_settings');
  const parsed = saved ? JSON.parse(saved) : {};
  const isDark = parsed.theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-surface', parsed.surface === 'glass' ? 'glass' : 'normal');
  if (parsed.backdrop) {
    document.documentElement.style.setProperty('--backdrop-image', `url("${parsed.backdrop}")`);
    document.documentElement.setAttribute('data-backdrop', 'image');
  } else {
    document.documentElement.setAttribute('data-backdrop', 'aurora');
  }
  // Match the iOS status-bar tint to the surface before first paint.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', parsed.backdrop ? '#0b0d16' : isDark ? '#101018' : '#f7f7fb');
} catch {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.setAttribute('data-surface', 'normal');
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
