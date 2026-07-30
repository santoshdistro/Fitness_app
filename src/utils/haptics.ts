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

function ensureSwitch(): void {
  if (switchLabel || typeof document === 'undefined') return;
  const hidden = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = 'fb-haptic-switch';
  input.setAttribute('switch', ''); // iOS-only attribute that carries the haptic
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  input.style.cssText = hidden;

  const label = document.createElement('label');
  label.htmlFor = 'fb-haptic-switch';
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = hidden;

  document.body.appendChild(input);
  document.body.appendChild(label);
  switchLabel = label;
}

/** Fire a short tap. Must be called inside a user gesture to work on iOS. */
export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERNS[kind]);
    return;
  }
  ensureSwitch();
  try {
    switchLabel?.click();
  } catch {
    /* no-op */
  }
}
