import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Apply the saved theme before first paint to avoid a light-mode flash.
try {
  const saved = localStorage.getItem('app_settings');
  const theme = saved ? (JSON.parse(saved).theme as string) : 'light';
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
} catch {
  document.documentElement.setAttribute('data-theme', 'light');
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
