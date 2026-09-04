// Placeholder shapes shown while a panel's data loads. They stand in for the
// real layout rather than announcing "Loading…", so the screen keeps its shape
// and nothing jumps when the numbers arrive.
//
// Each block is aria-hidden and the wrapper carries role="status", so assistive
// tech hears "Loading" once instead of reading a wall of empty boxes.

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

function Busy({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      {children}
    </div>
  );
}

/** A few text lines of decreasing width — for list and prose panels. */
export function SkeletonLines({ lines = 3, label = 'Loading' }: { lines?: number; label?: string }) {
  const widths = ['100%', '92%', '78%', '85%', '70%'];
  return (
    <Busy label={label}>
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className="h-3 rounded-full" style={{ width: widths[i % widths.length] }} />
        ))}
      </div>
    </Busy>
  );
}

/** Rows of icon + two lines — for ranked lists and breakdowns. */
export function SkeletonRows({ rows = 4, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Busy label={label}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-2.5 w-1/2 rounded-full" />
              <Skeleton className="h-2.5 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** A card header plus a chart body — matches the Trends section shape. */
export function SkeletonChart({ label = 'Loading chart' }: { label?: string }) {
  return (
    <Busy label={label}>
      <div className="glass-card flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-2.5 w-2/3 rounded-full" />
      </div>
    </Busy>
  );
}

/** The four-up stat tile block at the top of Trends. */
export function SkeletonTiles({ count = 4, label = 'Loading' }: { count?: number; label?: string }) {
  return (
    <Busy label={label}>
      <div className="glass-card grid grid-cols-2 gap-2 p-3">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl bg-[var(--bg)] px-3 py-2.5">
            <Skeleton className="h-2 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-2 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** A square media grid — for the progress-photo timeline. */
export function SkeletonGrid({ items = 6, label = 'Loading photos' }: { items?: number; label?: string }) {
  return (
    <Busy label={label}>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: items }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </Busy>
  );
}
