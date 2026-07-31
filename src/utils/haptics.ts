// Lightweight tap feedback.
//
// Android/Chrome expose the Vibration API, so taps buzz there. iOS Safari and
// installed PWAs have no working web-haptics path (the old <input switch> label
// trick no longer fires on modern iOS), so this is a graceful no-op on iOS.

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  success: [10, 30, 10],
  warning: [20, 40, 20],
};

/** Fire a short tap where the platform supports it (Android). No-op elsewhere. */
export function haptic(kind: HapticKind = 'light'): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(PATTERNS[kind]);
  }
}

/** Kept for call-site compatibility. */
export function warmHaptics(): void {
  /* no-op */
}
