export const labelClass = 'mb-1 block text-xs font-semibold text-[var(--muted)]';
export const inputClass =
  'w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]';
export const submitButtonClass =
  'accent-lift flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-40 bg-[image:var(--accent-gradient)] transition-transform active:scale-[0.98]';
// Quiet, tonal alternative for secondary / "option B" actions, so only the
// primary action on a screen carries the accent gradient.
export const secondaryButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-[var(--accent)] bg-[var(--accent)]/10 disabled:opacity-50 transition-transform active:scale-[0.98]';
export const errorTextClass = 'mb-3 text-xs text-red-500';
