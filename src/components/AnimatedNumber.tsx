import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Smoothly counts from the previous value to the new one when `value` changes,
// so stats (calories, remaining) tween instead of snapping. Interruptible:
// a new value animates from wherever the tween currently is.
export function AnimatedNumber({
  value,
  format,
  durationMs = 450,
}: {
  value: number;
  format?: (v: number) => string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    if (from === to) return;
    if (prefersReducedMotion()) {
      currentRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const v = from + (to - from) * eased;
      currentRef.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        currentRef.current = to;
        setDisplay(to);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{format ? format(display) : Math.round(display)}</>;
}
