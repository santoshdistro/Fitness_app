// Lightweight tap feedback.
//
// Android/Chrome expose the Vibration API. iOS Safari does not — but clicking a
// freshly-created <label> that wraps an <input switch> fires the system switch
// haptic on iOS 17.4+. Creating a new element per call (append → click → remove)
// is the pattern that reliably triggers it. No-ops where neither is available.

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [10, 30, 10],
  warning: [20, 40, 20],
};

function iosHaptic(): void {
  if (typeof document === 'undefined') return;
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', ''); // iOS 17.4+ attribute that carries the haptic

  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
}

/** Fire a short tap. Must be called inside a user gesture to work on iOS. */
export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERNS[kind]);
    return;
  }
  try {
    iosHaptic();
  } catch {
    /* no-op */
  }
}

/** Kept for call-site compatibility; the iOS element is now created per tap. */
export function warmHaptics(): void {
  /* no-op */
}
