import { AlertTriangle } from 'lucide-react';

// A soft, amber inline warning for an implausible input. Never blocks saving —
// it's a nudge to re-check a likely typo before it lands in the charts.
export function RangeHint({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium" style={{ color: '#f59e0b' }}>
      <AlertTriangle size={11} className="shrink-0" />
      {message}
    </p>
  );
}
