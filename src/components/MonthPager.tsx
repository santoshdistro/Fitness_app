import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameMonth } from '../utils/date';

// Compact ‹ Month Year › control for browsing history lists by calendar month.
// Forward is disabled once you reach the current month.
export function MonthPager({ anchor, onChange }: { anchor: Date; onChange: (d: Date) => void }) {
  const atCurrent = isSameMonth(anchor, new Date());
  const label = anchor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  const step = (dir: -1 | 1) => onChange(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Earlier month"
        className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] active:bg-[var(--bg)]"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="min-w-[62px] text-center text-[10px] font-bold text-[var(--text)]">{label}</span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={atCurrent}
        aria-label="Later month"
        className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] disabled:opacity-30 active:bg-[var(--bg)]"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
