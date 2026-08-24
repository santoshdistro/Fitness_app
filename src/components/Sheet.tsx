import { useEffect, useRef, useState, type ReactNode } from 'react';
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

export function Sheet({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

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

  if (!rendered) return null;

  // Portal to <body> so the sheet is never trapped by a transformed/animated
  // ancestor — it always covers the whole screen, above the FAB and nav bar.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/60 ${closing ? 'anim-backdrop-out' : 'anim-backdrop-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass-card relative max-h-[88dvh] w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
          closing ? 'anim-sheet-down' : 'anim-sheet-up'
        }`}
        style={{ borderBottom: 'none' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: 'var(--card-border)' }} />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-44 glass flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: 'var(--muted)' }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
