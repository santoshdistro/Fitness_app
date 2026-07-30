// Lightweight tap feedback.
//
// Android/Chrome expose the Vibration API. iOS Safari does not — but toggling a
// hidden `<input switch>` through its `<label>` fires the system "switch"
// haptic on iOS 17.4+. We mount that element once and click the label on
// demand. Everything degrades to a silent no-op where neither is available.

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [10, 30, 10],
  warning: [20, 40, 20],
};

let switchLabel: HTMLLabelElement | null = null;

// The iOS haptic only fires when a <label> that WRAPS an <input switch> is
// clicked — the input must be a child of the label, not merely associated by id.
function ensureSwitch(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (switchLabel) return switchLabel;

  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', ''); // iOS 17.4+ attribute that carries the haptic
  input.tabIndex = -1;

  label.appendChild(input);
  document.body.appendChild(label);
  switchLabel = label;
  return label;
}

/** Fire a short tap. Must be called inside a user gesture to work on iOS. */
export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERNS[kind]);
    return;
  }
  try {
    ensureSwitch()?.click();
  } catch {
    /* no-op */
  }
}

/**
 * Prime the iOS haptic element during the first real user gesture. The very
 * first programmatic click sometimes doesn't fire until the switch has been
 * toggled once inside a genuine touch — call this from a one-time listener.
 */
export function warmHaptics(): void {
  ensureSwitch();
}
