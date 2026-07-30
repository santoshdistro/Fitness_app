// Per-million-token prices (USD) used to estimate in-app AI spend from the
// token counts each serverless call returns. Keep in sync with the models the
// api/ functions actually use.
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-opus-4-8': { input: 5, output: 25 },
};

const FALLBACK = { input: 1, output: 5 };

export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model] ?? FALLBACK;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

export function formatUsd(amount: number): string {
  if (amount > 0 && amount < 0.01) return '<$0.01';
  return `$${amount.toFixed(2)}`;
}
