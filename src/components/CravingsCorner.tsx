import { useState } from 'react';
import { ArrowLeft, Check, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useNutritionCoach } from '../hooks/useNutritionCoach';
import { supabase } from '../lib/supabaseClient';
import { defaultMealCategoryForNow } from '../utils/mealCategory';
import { generateCravingSwaps, type CravingSwapResult } from '../lib/aiClient';
import { CRAVINGS, type Craving, type CravingSwap } from '../data/cravings';

function dietLabel(goalType?: string | null): string {
  if (goalType === 'lose') return 'lose weight / fat loss';
  if (goalType === 'gain') return 'build muscle / gain';
  return 'maintain / eat healthier';
}

// "I'm craving…" — pick a craving, get goal-aware swaps that scratch the same
// itch, whether each fits today's calories, extra AI ideas, and a guilt-free
// "log it and move on" path. Self-contained; drop inside any Sheet.
export function CravingsCorner() {
  const [selected, setSelected] = useState<Craving | null>(null);

  if (selected) {
    return <CravingDetail craving={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Craving hit after eating? Pick what you want — we’ll find a way to satisfy it that fits your
        goal, not fights it.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {CRAVINGS.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelected(c)}
            className="flex items-center gap-2.5 rounded-2xl bg-[var(--bg)] p-3 text-left transition active:scale-[0.97]"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
              style={{ background: `${c.tint}1a` }}
            >
              {c.emoji}
            </span>
            <span className="text-[13px] font-semibold leading-tight text-[var(--text)]">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CravingDetail({ craving, onBack }: { craving: Craving; onBack: () => void }) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { prefs } = useNutritionCoach();
  const { calorieTarget } = useCalorieTargets();
  const { totals } = useTodayNutrition();

  const remaining = calorieTarget != null ? Math.round(calorieTarget - totals.calories) : null;

  const [aiSwaps, setAiSwaps] = useState<CravingSwap[] | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [loggedName, setLoggedName] = useState<string | null>(null);

  async function moreIdeas() {
    if (!session?.user || aiState === 'loading') return;
    setAiState('loading');
    try {
      const res: CravingSwapResult = await generateCravingSwaps(session.user.id, {
        craving: craving.label,
        goal: dietLabel(profile?.goal_type),
        diet: prefs?.diet ?? undefined,
        remainingKcal: remaining ?? undefined,
      });
      setAiSwaps(res.swaps ?? []);
      setAiState('idle');
    } catch {
      setAiState('error');
    }
  }

  // Guilt-free: log whatever you actually had (a swap or the real thing) into
  // today's diary as a snack, so the day stays honest — no shame, just tracked.
  async function logIt(name: string, kcal: number) {
    if (!session?.user) return;
    setLoggedName(name);
    const { error } = await supabase.from('food_logs').insert({
      user_id: session.user.id,
      meal_name: name,
      meal_category: defaultMealCategoryForNow(),
      calories: Math.round(kcal),
    });
    if (error) setLoggedName(null);
  }

  const fitsTag = (kcal: number) => {
    if (remaining == null) return null;
    if (kcal <= remaining) return { label: 'fits your day', cls: 'text-green-600 bg-green-500/10' };
    if (kcal <= remaining + 150) return { label: 'a little tight', cls: 'text-amber-600 bg-amber-500/10' };
    return { label: 'over budget', cls: 'text-rose-600 bg-rose-500/10' };
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)]"
      >
        <ArrowLeft size={14} /> All cravings
      </button>

      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ background: `${craving.tint}1a` }}
        >
          {craving.emoji}
        </span>
        <div>
          <p className="text-base font-black text-[var(--text)]">{craving.label}</p>
          {remaining != null ? (
            <p className="text-[11px] text-[var(--muted)]">
              {remaining > 0 ? `~${remaining} kcal left today` : `${Math.abs(remaining)} kcal over target`}
            </p>
          ) : null}
        </div>
      </div>

      {/* Why the craving is happening */}
      <div className="rounded-2xl px-3 py-2.5" style={{ background: `${craving.tint}14` }}>
        <p className="text-[11px] leading-relaxed text-[var(--text)]">
          <span className="font-bold">Why it’s happening: </span>{craving.reason}
        </p>
      </div>

      {/* Curated swaps */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
          Satisfy it with
        </p>
        <div className="flex flex-col gap-1.5">
          {craving.swaps.map(s => (
            <SwapRow
              key={s.name}
              swap={s}
              tint={craving.tint}
              fits={fitsTag(s.kcal)}
              logged={loggedName === s.name}
              onLog={() => logIt(s.name, s.kcal)}
            />
          ))}
        </div>
      </div>

      {/* More ideas (AI) */}
      {aiSwaps ? (
        <div>
          <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <Sparkles size={11} /> More ideas for you
          </p>
          <div className="flex flex-col gap-1.5">
            {aiSwaps.map(s => (
              <SwapRow
                key={s.name}
                swap={s}
                tint={craving.tint}
                fits={fitsTag(s.kcal)}
                logged={loggedName === s.name}
                onLog={() => logIt(s.name, s.kcal)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={moreIdeas}
        disabled={aiState === 'loading'}
        className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--card-border)] py-2.5 text-xs font-bold text-[var(--text)] disabled:opacity-70"
      >
        {aiState === 'loading' ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted)]/40 border-t-[var(--text)]" />
            Finding more…
          </>
        ) : (
          <>
            <Sparkles size={14} /> {aiSwaps ? 'More ideas' : 'More ideas ✨'}
          </>
        )}
      </button>
      {aiState === 'error' ? (
        <p className="-mt-2 text-center text-[11px] text-rose-500">Couldn’t fetch ideas — try again.</p>
      ) : null}

      {/* Guilt-free path */}
      <div className="rounded-2xl bg-[var(--bg)] p-3">
        <p className="text-xs font-semibold text-[var(--text)]">Really want the real thing?</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
          One choice won’t undo your progress — guilt spirals do. Log it, move on, and balance it
          elsewhere.
        </p>
        <button
          type="button"
          onClick={() => logIt(craving.realThing.name, craving.realThing.kcal)}
          disabled={loggedName === craving.realThing.name}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-80"
          style={{
            background: loggedName === craving.realThing.name ? '#16a34a' : 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
          }}
        >
          {loggedName === craving.realThing.name ? (
            <><Check size={14} className="anim-check-pop" /> Logged — no stress</>
          ) : (
            <><Plus size={14} /> Log “{craving.realThing.name}” (~{craving.realThing.kcal} kcal)</>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-[var(--muted)]">
        Calorie figures are rough guides. General wellness guidance — not medical advice.
      </p>
    </div>
  );
}

function SwapRow({
  swap,
  tint,
  fits,
  logged,
  onLog,
}: {
  swap: CravingSwap;
  tint: string;
  fits: { label: string; cls: string } | null;
  logged: boolean;
  onLog: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2.5">
      <span className="text-xl">{swap.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-[var(--text)]">{swap.name}</p>
          {fits ? (
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${fits.cls}`}>
              {fits.label}
            </span>
          ) : null}
        </div>
        <p className="text-[10px] leading-snug text-[var(--muted)]">{swap.why}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[12px] font-black" style={{ color: tint }}>{swap.kcal}</span>
        <button
          type="button"
          onClick={onLog}
          aria-label={`Log ${swap.name}`}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ background: logged ? '#16a34a' : 'var(--accent)' }}
        >
          {logged ? <Check size={13} className="anim-check-pop" /> : <Plus size={13} />}
        </button>
      </div>
    </div>
  );
}
