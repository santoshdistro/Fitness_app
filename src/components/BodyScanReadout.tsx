import { Dumbbell, Sparkles, Utensils } from 'lucide-react';
import type { BodyResult } from '../lib/aiClient';

// The AI physique "coach's read" — shared by the scan flow and the saved
// summary on Stats. Text only; the photo is never stored.
export function BodyScanReadout({ result }: { result: BodyResult }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold text-[var(--text)]">Coach's read</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{result.summary}</p>

      {result.focusAreas.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.focusAreas.map(area => (
            <span
              key={area}
              className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {area}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex gap-2.5 rounded-2xl bg-[var(--bg)] p-3">
          <Dumbbell size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Training</p>
            <p className="text-xs text-[var(--text)]">{result.trainingFocus}</p>
          </div>
        </div>
        <div className="flex gap-2.5 rounded-2xl bg-[var(--bg)] p-3">
          <Utensils size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Nutrition</p>
            <p className="text-xs text-[var(--text)]">{result.nutritionFocus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
