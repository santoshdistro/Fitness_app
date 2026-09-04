import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, UtensilsCrossed } from 'lucide-react';
import { Sheet } from './Sheet';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MEAL_CATEGORY_OPTIONS } from '../utils/mealCategory';
import { addDays, endOfDateIso, startOfDateIso, todayDateString } from '../utils/date';
import type { FoodLog, MealCategory } from '../types/database';

type Props = {
  open: boolean;
  onClose: () => void;
  /** The day being copied INTO — the source starts one day before it. */
  targetDate: string;
  onCopy: (meals: FoodLog[], moveTo: MealCategory | null) => Promise<void>;
};

const MEAL_LABELS: Record<string, string> = Object.fromEntries(
  MEAL_CATEGORY_OPTIONS.map(o => [o.value, o.label]),
);

function prettyDay(date: string): string {
  const today = todayDateString();
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function CopyMealsSheet({ open, onClose, targetDate, onCopy }: Props) {
  const { session } = useAuth();
  const [sourceDate, setSourceDate] = useState(() => addDays(targetDate, -1));
  const [meals, setMeals] = useState<FoodLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [moveTo, setMoveTo] = useState<MealCategory | null>(null);
  const [copying, setCopying] = useState(false);

  // Reopening for a different day should start from that day's yesterday, not
  // wherever the last visit left the picker.
  useEffect(() => {
    if (open) {
      setSourceDate(addDays(targetDate, -1));
      setMoveTo(null);
    }
  }, [open, targetDate]);

  const load = useCallback(async (date: string) => {
    const userId = session?.user?.id;
    if (!userId) return;
    setLoading(true);
    // Scoped by user_id as well as by RLS, matching every other food_logs read
    // here — belt and braces on someone else's meals is the right default.
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('meal_timestamp', startOfDateIso(date))
      .lt('meal_timestamp', endOfDateIso(date))
      .order('meal_timestamp', { ascending: true });
    const rows = (data as FoodLog[]) ?? [];
    setMeals(rows);
    // Everything ticked by default: copying the lot is still the common case,
    // and unticking two items is less work than ticking six.
    setPicked(new Set(rows.map(r => r.id)));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (open) void load(sourceDate);
  }, [open, sourceDate, load]);

  const groups = useMemo(() => {
    const list = meals ?? [];
    return MEAL_CATEGORY_OPTIONS.map(o => o.value)
      .map(cat => ({ cat, items: list.filter(m => m.meal_category === cat) }))
      .filter(g => g.items.length > 0);
  }, [meals]);

  const selected = (meals ?? []).filter(m => picked.has(m.id));
  const totalKcal = selected.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const totalProtein = selected.reduce((sum, m) => sum + (m.protein_g ?? 0), 0);

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(items: FoodLog[]) {
    const allOn = items.every(i => picked.has(i.id));
    setPicked(prev => {
      const next = new Set(prev);
      items.forEach(i => (allOn ? next.delete(i.id) : next.add(i.id)));
      return next;
    });
  }

  async function submit() {
    if (!selected.length) return;
    setCopying(true);
    await onCopy(selected, moveTo);
    setCopying(false);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Copy meals">
      <div className="flex flex-col gap-3">
        {/* Source day picker — any day, not just yesterday. */}
        <div
          className="flex items-center justify-between rounded-2xl p-1.5"
          style={{ background: 'var(--input-bg)' }}
        >
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setSourceDate(d => addDays(d, -1))}
            className="tap-44 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">Copy from</p>
            <p className="text-sm font-bold text-[var(--text)]">{prettyDay(sourceDate)}</p>
          </div>
          <button
            type="button"
            aria-label="Next day"
            // Never offer the day being copied into, or anything after it.
            disabled={addDays(sourceDate, 1) >= targetDate}
            onClick={() => setSourceDate(d => addDays(d, 1))}
            className="tap-44 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/10">
              <UtensilsCrossed size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-xs text-[var(--muted)]">Nothing was logged on {prettyDay(sourceDate)}.</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Step back to find a day with meals.</p>
          </div>
        ) : (
          <>
            {groups.map(g => {
              const allOn = g.items.every(i => picked.has(i.id));
              return (
                <div key={g.cat}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.items)}
                    className="mb-1 flex w-full items-center justify-between"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                      {MEAL_LABELS[g.cat] ?? g.cat}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {allOn ? 'Clear' : 'All'}
                    </span>
                  </button>
                  <div className="flex flex-col gap-1.5">
                    {g.items.map(m => {
                      const on = picked.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggle(m.id)}
                          aria-pressed={on}
                          className="flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-colors"
                          style={{
                            background: on
                              ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                              : 'var(--input-bg)',
                            border: `1px solid ${
                              on ? 'color-mix(in srgb, var(--accent) 34%, transparent)' : 'transparent'
                            }`,
                          }}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                            style={{
                              background: on ? 'var(--accent)' : 'transparent',
                              border: on ? 'none' : '1.5px solid var(--card-border)',
                              color: 'var(--on-accent)',
                            }}
                          >
                            {on ? <Check size={13} strokeWidth={3} /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[var(--text)]">
                              {m.meal_name}
                            </span>
                            <span className="block text-[10px] text-[var(--muted)]">
                              {Math.round(m.calories ?? 0)} kcal
                              {m.protein_g ? ` · ${Math.round(m.protein_g)}g protein` : ''}
                              {m.amount ? ` · ${m.amount}${m.unit ?? ''}` : ''}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Copying last night's dinner into today's lunch is a normal thing
                to want, so the destination is selectable rather than fixed. */}
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Add as</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setMoveTo(null)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{
                    background: moveTo === null ? 'var(--accent)' : 'var(--input-bg)',
                    color: moveTo === null ? 'var(--on-accent)' : 'var(--muted)',
                  }}
                >
                  Same meal
                </button>
                {MEAL_CATEGORY_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setMoveTo(o.value)}
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{
                      background: moveTo === o.value ? 'var(--accent)' : 'var(--input-bg)',
                      color: moveTo === o.value ? 'var(--on-accent)' : 'var(--muted)',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!selected.length || copying}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold disabled:opacity-50"
              style={{ background: 'var(--accent-gradient)', color: 'var(--on-accent)' }}
            >
              {copying ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Copy size={15} />
              )}
              {selected.length
                ? `Copy ${selected.length} item${selected.length === 1 ? '' : 's'} · ${Math.round(totalKcal)} kcal`
                : 'Nothing selected'}
            </button>
            {selected.length ? (
              <p className="-mt-1 text-center text-[10px] text-[var(--muted)]">
                {Math.round(totalProtein)}g protein coming across
              </p>
            ) : null}
          </>
        )}
      </div>
    </Sheet>
  );
}
