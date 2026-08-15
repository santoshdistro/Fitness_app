import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

// Roughly the exit animation length (.anim-sheet-down / .anim-backdrop-out in
// index.css). We keep the sheet mounted this long after `open` flips false so it
// animates out instead of popping out of existence.
const EXIT_MS = 230;
// Drag past this many px, or flick faster than this (px/ms), to dismiss.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.5;

export function Sheet({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  // `settled` flips true once the enter animation finishes, after which the
  // panel is driven by inline transform (so drag can move it freely).
  const [settled, setSettled] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ y: number; t: number } | null>(null);

  // Mount immediately on open; on close, play the exit then unmount.
  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
      setSettled(false);
      setDragY(0);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, rendered]);

  // While shown: focus first field (on enter), close on Escape, lock body scroll.
  useEffect(() => {
    if (!rendered) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!closing) {
      const firstField = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, button',
      );
      firstField?.focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [rendered, closing, onClose]);

  function onGrabberDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (closing) return;
    dragStart.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onGrabberMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    // Follow downward; add resistance when pulling up past the top.
    setDragY(dy < 0 ? dy * 0.3 : dy);
  }

  function onGrabberUp() {
    if (!dragStart.current) return;
    const dt = performance.now() - dragStart.current.t;
    const velocity = dragY / Math.max(1, dt);
    dragStart.current = null;
    setDragging(false);
    if (dragY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      onClose(); // parent flips `open` false → exit slides from current dragY
    } else {
      setDragY(0); // snap back
    }
  }

  if (!rendered) return null;

  const panelStyle: React.CSSProperties = { borderBottom: 'none' };
  const backdropStyle: React.CSSProperties = {};
  if (settled) {
    const y = closing ? undefined : Math.max(0, dragY);
    panelStyle.transform = closing ? 'translateY(100%)' : `translateY(${y}px)`;
    panelStyle.transition = dragging ? 'none' : 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1)';
    backdropStyle.opacity = closing ? 0 : 1 - Math.min(0.85, Math.max(0, dragY) / 400);
    backdropStyle.transition = dragging ? 'none' : 'opacity 0.24s ease';
  }

  // Portal to <body> so the sheet is never trapped by a transformed/animated
  // ancestor — it always covers the whole screen, above the FAB and nav bar.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/60 ${settled ? '' : closing ? 'anim-backdrop-out' : 'anim-backdrop-in'}`}
        style={backdropStyle}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={e => {
          // Only the panel's own enter animation should settle it — not child
          // animations (e.g. a checkmark pop) whose animationend also bubbles.
          if (e.target === e.currentTarget && !closing) setSettled(true);
        }}
        className={`glass-card relative max-h-[88dvh] w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
          settled ? '' : closing ? 'anim-sheet-down' : 'anim-sheet-up'
        }`}
        style={panelStyle}
      >
        {/* Grab zone: the handle + header. Dragging it down dismisses the sheet;
            the scrollable body below is untouched so content still scrolls. */}
        <div
          onPointerDown={onGrabberDown}
          onPointerMove={onGrabberMove}
          onPointerUp={onGrabberUp}
          onPointerCancel={onGrabberUp}
          style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--card-border)' }} />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={e => e.stopPropagation()}
              aria-label="Close"
              className="glass flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: 'var(--muted)' }}
            >
              &times;
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
