import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { Insight, InsightTone } from '../utils/insights';

type Props = {
  insights: Insight[];
  /** Days of history the findings were computed from, for the honesty line. */
  days: number;
};

const TONE: Record<InsightTone, { color: string; icon: typeof AlertTriangle; label: string }> = {
  act: { color: '#f97316', icon: AlertTriangle, label: 'Change this' },
  watch: { color: '#eab308', icon: Lightbulb, label: 'Worth watching' },
  good: { color: '#22c55e', icon: CheckCircle2, label: 'Working' },
};

export function InsightsPanel({ insights, days }: Props) {
  if (insights.length === 0) {
    return (
      <div className="glass-card flex flex-col gap-2 p-5">
        <p className="text-sm font-semibold text-[var(--text)]">What to change</p>
        <p className="text-xs text-[var(--muted)]">
          Keep logging — this reads your history against your goal and says what is actually holding it
          up. It needs about a week before it has anything honest to say.
        </p>
      </div>
    );
  }

  // Sorted by priority already; the ones to act on lead.
  return (
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-[var(--text)]">What to change</p>
        <p className="text-[11px] text-[var(--muted)]">from {days} days</p>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map(insight => {
          const tone = TONE[insight.tone];
          const Icon = tone.icon;
          return (
            <div
              key={insight.id}
              className="rounded-2xl p-3"
              style={{
                background: 'var(--input-bg)',
                // A hairline in the tone rather than a filled card: five filled
                // warning cards in a row is a wall, and nothing stands out.
                borderLeft: `3px solid ${tone.color}`,
              }}
            >
              <div className="flex items-start gap-2">
                <Icon size={14} className="mt-0.5 shrink-0" style={{ color: tone.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--text)]">{insight.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{insight.detail}</p>
                  {insight.action ? (
                    <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-[var(--text)]">
                      {insight.action}
                    </p>
                  ) : null}
                  {insight.strength ? (
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      {insight.strength} association · {insight.sample} days · not proof of cause
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Said once, at the bottom, rather than hedging every card. */}
      <p className="text-[10px] leading-relaxed text-[var(--muted)]">
        Read from your own logs, so it is only as good as they are. Patterns over a month of one person's
        data point at things to try, not facts about your body.
      </p>
    </div>
  );
}
