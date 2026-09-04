import { RefreshCw, Sparkles } from 'lucide-react';

type Props = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  insight?: string;
  message?: string;
  onRetry?: () => void;
};

export function CoachCard({ status, insight, message, onRetry }: Props) {
  if (status === 'idle') return null;

  return (
    <div
      className="anim-fade-rise relative overflow-hidden p-4"
      style={{
        animationDelay: '0.24s',
        borderRadius: 'var(--radius-card)',
        background: 'var(--accent-gradient)',
        boxShadow: '0 10px 22px -12px var(--accent-shadow)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--on-accent) 16%, transparent)' }}
        >
          <Sparkles size={14} style={{ color: 'var(--on-accent)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="mb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'color-mix(in srgb, var(--on-accent) 72%, transparent)' }}
          >
            Coach
          </p>
          {status === 'loading' ? (
            <div className="flex flex-col gap-1.5">
              <span className="shimmer h-2.5 w-11/12 rounded-full" />
              <span className="shimmer h-2.5 w-3/4 rounded-full" />
            </div>
          ) : status === 'error' ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium" style={{ color: 'var(--on-accent)' }}>
                {message}
              </p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  aria-label="Retry coaching"
                  className="tap-44 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--on-accent) 16%, transparent)',
                    color: 'var(--on-accent)',
                  }}
                >
                  <RefreshCw size={13} />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--on-accent)' }}>
              {insight}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
