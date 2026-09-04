import { useEffect, useRef, useState, type RefObject } from 'react';

const THRESHOLD = 68; // px of pull needed to trigger
const MAX = 104; // clamp so the indicator can't fly off
const RESIST = 0.5; // finger travel → indicator travel

/**
 * Custom pull-to-refresh for the app's scroll container. iOS standalone PWAs
 * have no native pull-to-refresh, so we implement it: when the user drags down
 * from the very top, we show an indicator and, past the threshold, run
 * `onRefresh`. Returns the current pull distance and refreshing state for the UI.
 */
export function usePullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  onRefresh: () => void | Promise<void>,
) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const s = useRef({ startY: 0, pulling: false, dist: 0, busy: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const st = s.current;

    const onStart = (e: TouchEvent) => {
      if (st.busy) return;
      if (el.scrollTop <= 0) {
        st.startY = e.touches[0].clientY;
        st.pulling = true;
        st.dist = 0;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!st.pulling || st.busy) return;
      const dy = e.touches[0].clientY - st.startY;
      if (dy > 0 && el.scrollTop <= 0) {
        st.dist = Math.min(MAX, dy * RESIST);
        setPull(st.dist);
        if (st.dist > 6) e.preventDefault(); // suppress the native rubber-band
      } else {
        st.dist = 0;
        st.pulling = false;
        setPull(0);
      }
    };

    const finish = () => {
      st.busy = false;
      st.dist = 0;
      setRefreshing(false);
      setPull(0);
    };

    const onEnd = () => {
      if (!st.pulling) return;
      st.pulling = false;
      if (st.dist >= THRESHOLD && !st.busy) {
        st.busy = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        const result = onRefresh();
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).finally(() => window.setTimeout(finish, 300));
        } else {
          window.setTimeout(finish, 450);
        }
      } else {
        st.dist = 0;
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [scrollRef, onRefresh]);

  return { pull, refreshing, threshold: THRESHOLD };
}
