import { useRef, useState, type TouchEvent } from 'react';

// Swipe left/right between tabs, with a slide-in animation on change (from taps
// or swipes). Attach `handlers` to the content container, use `change` for the
// tab buttons, and apply `animClass` to a wrapper keyed by the active tab.
export function useTabSwipe<T extends string>(
  keys: readonly T[],
  active: T,
  setActive: (t: T) => void,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const [dir, setDir] = useState(0);

  function change(next: T) {
    const delta = keys.indexOf(next) - keys.indexOf(active);
    if (delta === 0) return;
    setDir(delta > 0 ? 1 : -1);
    setActive(next);
  }

  function step(delta: number) {
    const j = keys.indexOf(active) + delta;
    if (j < 0 || j >= keys.length) return;
    change(keys[j]);
  }

  const handlers = {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only act on a clear horizontal swipe (so vertical scrolling is unaffected).
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        step(dx < 0 ? 1 : -1);
      }
    },
  };

  const animClass = dir === 1 ? 'anim-slide-next' : dir === -1 ? 'anim-slide-prev' : '';

  return { handlers, change, animClass };
}
