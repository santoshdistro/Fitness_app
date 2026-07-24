import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAiSpend, type FeatureSpend } from '../hooks/useAiSpend';
import { formatUsd } from '../utils/aiPricing';

const FEATURE_LABEL: Record<FeatureSpend['feature'], string> = {
  coach: 'Coach insights',
  food_scan: 'Food photo scans',
  body_scan: 'Physique scans',
  workout_plan: 'AI workout plans',
};

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
      {/* In-app tracked */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">This month, in this app</p>
          <p className="text-lg font-black text-[var(--text)]">{formatUsd(totalUsd)}</p>
        </div>
        <p className="text-[11px] text-[var(--muted)]">Estimated from each AI call's token usage.</p>

        <div className="mt-3 flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-[var(--muted)]">Loading…</p>
          ) : byFeature.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No AI features used yet this month.</p>
          ) : (
            byFeature.map(row => (
              <div key={row.feature} className="flex items-center justify-between text-xs">
                <span className="text-[var(--text)]">
                  {FEATURE_LABEL[row.feature]}
                  <span className="text-[var(--muted)]"> · {row.calls}×</span>
                </span>
                <span className="font-semibold text-[var(--text)]">{formatUsd(row.costUsd)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Anthropic billing */}
      <div className="rounded-2xl bg-[var(--bg)] p-4">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-semibold text-[var(--text)]">Anthropic billing</p>
        </div>
        {anthropic.status === 'loading' ? (
          <p className="text-xs text-[var(--muted)]">Checking…</p>
        ) : anthropic.status === 'ready' ? (
          <p className="text-xs text-[var(--text)]">
            <span className="text-lg font-black">{formatUsd(anthropic.totalUsd)}</span>{' '}
            <span className="text-[var(--muted)]">billed month-to-date ({anthropic.month})</span>
          </p>
        ) : anthropic.status === 'error' ? (
          <p className="text-xs text-[var(--muted)]">{anthropic.message}</p>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            To show your real Anthropic total here, add an org Admin key
            (<span className="font-mono">ANTHROPIC_ADMIN_KEY</span>) in Vercel. Individual accounts
            don't have one — the in-app estimate above is your spend.
          </p>
        )}
      </div>
    </div>
  );
}
