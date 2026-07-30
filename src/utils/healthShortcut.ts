// Runs an iOS Shortcut from the web app via the shortcuts:// URL scheme.
// The user stores the exact name of the Shortcut they built so the Home
// button and the panel can trigger it on demand (iOS only).

const KEY = 'healthSyncShortcutName';

export function getSyncShortcutName(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function setSyncShortcutName(name: string): void {
  try {
    if (name.trim()) localStorage.setItem(KEY, name.trim());
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function runSyncShortcut(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(trimmed)}`;
}
