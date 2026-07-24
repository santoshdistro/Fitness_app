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
      className="anim-fade-rise relative overflow-hidden p-5"
      style={{
        animationDelay: '0.24s',
        borderRadius: 'var(--radius-card)',
        background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
        boxShadow: '0 12px 28px -10px rgba(108,99,255,0.6)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Sparkles size={14} className="text-white" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Coach</p>
      </div>

      {status === 'loading' ? (
        <div className="flex flex-col gap-2">
          <span className="shimmer h-3 w-11/12 rounded-full" />
          <span className="shimmer h-3 w-4/5 rounded-full" />
          <span className="shimmer h-3 w-2/3 rounded-full" />
        </div>
      ) : status === 'error' ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white/90">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry coaching"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <RefreshCw size={14} />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm font-semibold leading-relaxed text-white">{insight}</p>
      )}
    </div>
  );
}
