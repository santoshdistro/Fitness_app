import { useRef, useState, type TouchEvent } from 'react';

// Swipe between tabs Instagram-style: the content follows your finger as you
// drag and snaps to the next/previous tab on release (taps animate too). The
// live drag is applied imperatively via a ref so the heavy content doesn't
// re-render on every touch move.
export function useTabSwipe<T extends string>(
  keys: readonly T[],
  active: T,
  setActive: (t: T) => void,
) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizontal = useRef<boolean | null>(null);
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
    ref: wrapRef,
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      horizontal.current = null;
    },
    onTouchMove: (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (horizontal.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        horizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      if (horizontal.current && wrapRef.current) {
        const i = keys.indexOf(active);
        const atEdge = (i === 0 && dx > 0) || (i === keys.length - 1 && dx < 0);
        const d = Math.max(-110, Math.min(110, dx * (atEdge ? 0.3 : 0.9)));
        wrapRef.current.style.transition = 'none';
        wrapRef.current.style.transform = `translateX(${d}px)`;
      }
    },
    onTouchEnd: (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (wrapRef.current) {
        wrapRef.current.style.transition = 'transform 0.22s ease-out';
        wrapRef.current.style.transform = '';
      }
      if (horizontal.current && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        step(dx < 0 ? 1 : -1);
      }
    },
    // Clear the slide class once it finishes so it can't override the live drag transform.
    onAnimationEnd: () => {
      if (dir !== 0) setDir(0);
    },
  };

  const animClass = dir === 1 ? 'anim-slide-next' : dir === -1 ? 'anim-slide-prev' : '';

  return { handlers, change, animClass };
}
