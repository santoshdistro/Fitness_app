import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAiSpend, type FeatureSpend } from '../hooks/useAiSpend';
import { formatUsd } from '../utils/aiPricing';
import { SkeletonLines } from './Skeleton';

const FEATURE_LABEL: Record<FeatureSpend['feature'], string> = {
  coach: 'Coach insights',
  food_scan: 'Food photo scans',
  body_scan: 'Physique scans',
  workout_plan: 'AI workout plans',
  nutrition_coach: 'Nutrition coach plans',
  diet_plan: '2-week diet plans',
  food_estimate: 'AI food estimates',
  chat: 'AI coach chat',
};

// Readable name for any feature — including retired/legacy ones (e.g. a stray
// "workout_review" logged before that feature was removed) that have no entry
// above. Turns "workout_review" into "Workout review".
function featureLabel(feature: string): string {
  return (
    FEATURE_LABEL[feature as FeatureSpend['feature']] ??
    feature.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
  );
}

type AnthropicState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string }
  | { status: 'ready'; totalUsd: number; month: string };

export function SpendPanel() {
  const { byFeature, totalUsd, loading } = useAiSpend();
  const [anthropic, setAnthropic] = useState<AnthropicState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/usage')
      .then(async res => {
        const data = (await res.json().catch(() => null)) as
          | { configured?: boolean; totalUsd?: number; month?: string; error?: string }
          | null;
        if (cancelled) return;
        if (!data?.configured) {
          setAnthropic({ status: 'unconfigured' });
        } else if (data.error) {
          setAnthropic({ status: 'error', message: data.error });
        } else {
          setAnthropic({ status: 'ready', totalUsd: data.totalUsd ?? 0, month: data.month ?? '' });
        }
      })
      .catch(() => {
        if (!cancelled) setAnthropic({ status: 'error', message: 'Could not reach billing.' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: your spend this month */}
      <div
        className="overflow-hidden p-5 text-center text-[var(--on-accent)]"
        style={{
          borderRadius: 'var(--radius-card)',
          background: 'var(--accent-gradient)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'color-mix(in srgb, var(--on-accent) 80%, transparent)' }}>
          Your AI spend this month
        </p>
        <p className="text-4xl font-black tracking-tight" style={{ color: 'var(--on-accent)' }}>{formatUsd(totalUsd)}</p>
        <p className="mt-1 text-[11px]" style={{ color: 'color-mix(in srgb, var(--on-accent) 70%, transparent)' }}>Adds up every AI call — this is what you've spent.</p>
      </div>

      {/* Per-feature breakdown */}
      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--text)]">Breakdown</p>
        <div className="flex flex-col gap-2">
          {loading ? (
            <SkeletonLines lines={4} label="Loading spend breakdown" />
          ) : byFeature.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              No AI features used yet this month. Use the coach, scans or plan generator and your
              spend shows up here.
            </p>
          ) : (
            byFeature.map(row => (
              <div key={row.feature} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text)]">
                  {featureLabel(row.feature)}
                  <span className="text-[var(--muted)]"> · {row.calls}×</span>
                </span>
                <span className="font-semibold text-[var(--text)]">{formatUsd(row.costUsd)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Optional: official Anthropic total (only if an admin key is configured) */}
      {anthropic.status === 'ready' ? (
        <div className="rounded-2xl bg-[var(--bg)] p-4">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-semibold text-[var(--text)]">Anthropic official total</p>
          </div>
          <p className="text-xs text-[var(--text)]">
            <span className="text-lg font-black">{formatUsd(anthropic.totalUsd)}</span>{' '}
            <span className="text-[var(--muted)]">billed month-to-date ({anthropic.month})</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
