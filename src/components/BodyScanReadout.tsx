import { CheckCircle2, Dumbbell, ListChecks, Sparkles, TrendingUp, Utensils } from 'lucide-react';
import type { BodyResult } from '../lib/aiClient';

// The AI physique "coach's read" — shared by the scan flow and the saved
// summary on Stats. Text only; the photo is never stored unless you save it.
export function BodyScanReadout({ result }: { result: BodyResult }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: 'var(--accent)' }} />
        <p className="text-sm font-semibold text-[var(--text)]">Coach's honest read</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{result.summary}</p>

      {result.sinceLast ? (
        <div className="mt-3 flex gap-2.5 rounded-2xl bg-[var(--accent)]/10 p-3">
          <TrendingUp size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Since last scan</p>
            <p className="text-xs text-[var(--text)]">{result.sinceLast}</p>
          </div>
        </div>
      ) : null}

      {result.strengths.length > 0 ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Looking good</p>
          </div>
          <ul className="flex flex-col gap-1">
            {result.strengths.map(s => (
              <li key={s} className="text-xs text-[var(--text)]">• {s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.weakPoints.length > 0 ? (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <TrendingUp size={14} style={{ color: '#f59e0b' }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Needs work</p>
          </div>
          <ul className="flex flex-col gap-1">
            {result.weakPoints.map(w => (
              <li key={w} className="text-xs text-[var(--text)]">• {w}</li>
            ))}
          </ul>
        </div>
      ) : null}

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

      {result.actionPlan.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-[var(--bg)] p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <ListChecks size={15} style={{ color: 'var(--accent)' }} />
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Do this next</p>
          </div>
          <ol className="flex flex-col gap-1.5">
            {result.actionPlan.map((step, i) => (
              <li key={step} className="flex gap-2 text-xs text-[var(--text)]">
                <span className="font-bold" style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
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
