import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = panelRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button',
    );
    firstField?.focus();

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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center anim-fade-in">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-card relative w-full max-w-md rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] anim-fade-rise"
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
            className="glass flex h-8 w-8 items-center justify-center rounded-full"
            style={{ color: 'var(--muted)' }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
