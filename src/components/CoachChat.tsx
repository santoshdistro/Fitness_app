import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Send, Sparkles, Target, Trash2, X } from 'lucide-react';
import { useCoachChat } from '../hooks/useCoachChat';
import { splitGoalSuggestion, useCoachGoals, type GoalSuggestion } from '../hooks/useCoachGoals';
import { useProfile } from '../hooks/useProfile';
import { useCalorieTargets } from '../hooks/useCalorieTargets';
import { useTrends } from '../hooks/useTrends';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { useStrengthRecords } from '../hooks/useStrengthRecords';
import { GOAL_OPTIONS } from '../utils/calculations';

const QUICK_PROMPTS = [
  { label: 'Validate my workouts', text: 'Look at my recent workouts. Are they good for my goal, and what should I change?' },
  { label: 'How’s my nutrition?', text: 'Review what I’ve been eating. Are my calories and protein right for my goal?' },
  { label: 'Am I on track?', text: 'Given everything I’ve logged, am I on track toward my goal? What’s helping and what’s hurting?' },
  { label: 'My weight trend', text: 'How is my weight trending, and is that the right direction for my goal?' },
  { label: 'What should I improve?', text: 'What is the single most impactful thing I should change right now?' },
];

// A focus the coach proposed, offered as one tap. Advice that stays as prose is
// advice you have to re-read later; this turns it into something the app holds.
function GoalCard({ goal }: { goal: GoalSuggestion }) {
  const { add, has } = useCoachGoals();
  const already = has(goal.title);

  return (
    <div className="ml-1 max-w-[85%] rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
        <Target size={12} />
        Suggested focus
      </p>
      <p className="mt-1.5 text-sm font-bold text-[var(--text)]">{goal.title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{goal.detail}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-[var(--muted)]">{goal.cadence}</p>
      {already ? (
        <p className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)]/10 py-2.5 text-xs font-bold text-[var(--accent)]">
          <Check size={14} /> Added to your focuses
        </p>
      ) : (
        <button
          type="button"
          onClick={() => add(goal)}
          className="tap-44 mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-[var(--on-accent)] bg-[image:var(--accent-gradient)]"
        >
          <Check size={14} /> Set this focus
        </button>
      )}
    </div>
  );
}

// The focuses you've accepted, so they outlive the conversation that produced
// them. Kept compact — this is a reminder strip, not a to-do app.
function ActiveFocuses() {
  const { goals, remove } = useCoachGoals();
  if (goals.length === 0) return null;

  return (
    <div className="mb-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
        <Target size={12} />
        Your focuses
      </p>
      <div className="flex flex-col gap-2">
        {goals.map(g => (
          <div key={g.id} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text)]">{g.title}</p>
              <p className="text-[11px] leading-snug text-[var(--muted)]">
                {g.cadence} · {g.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(g.id)}
              aria-label={`Remove focus: ${g.title}`}
              className="tap-44 shrink-0 rounded-full p-1 text-[var(--muted)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function goalLabel(goal: string | null | undefined): string {
  return GOAL_OPTIONS.find(g => g.value === goal)?.label ?? 'General fitness';
}

// Builds a compact snapshot of the user's logged data for the coach to reason
// over. Kept short so it fits comfortably in the system prompt.
function useCoachContext(): string {
  const { profile } = useProfile();
  const { calorieTarget, proteinTarget } = useCalorieTargets();
  const { trends } = useTrends();
  const { workouts } = useRecentWorkouts(12);
  const { records } = useStrengthRecords();
  const { goals } = useCoachGoals();

  return useMemo(() => {
    const lines: string[] = [];

    // Focuses already committed to, so the coach builds on them instead of
    // proposing the same thing again.
    if (goals.length > 0) {
      lines.push(
        `Focuses they have already committed to (do not propose these again):\n- ${goals
          .map(g => `${g.title} (${g.cadence}): ${g.detail}`)
          .join('\n- ')}`,
      );
    }

    // Goal & targets
    lines.push(`Goal: ${goalLabel(profile?.goal_type)}`);
    if (profile?.target_weight_kg) lines.push(`Target weight: ${profile.target_weight_kg} kg`);
    if (profile?.calorie_deficit_kcal)
      lines.push(`Daily calorie deficit/surplus setting: ${profile.calorie_deficit_kcal} kcal`);
    lines.push(`Daily targets: ${calorieTarget} kcal, ${proteinTarget} g protein`);

    // Weight trend
    const weight = trends?.weight ?? [];
    if (weight.length) {
      const latest = weight[weight.length - 1];
      const first = weight[0];
      const delta = Math.round((latest.value - first.value) * 10) / 10;
      const dir = delta === 0 ? 'flat' : delta > 0 ? `up ${delta} kg` : `down ${Math.abs(delta)} kg`;
      lines.push(
        `Weight: latest ${latest.value} kg (${latest.label}); ${dir} over the last ${weight.length} weigh-ins.`,
      );
    } else {
      lines.push('Weight: no recent weigh-ins logged.');
    }

    // Nutrition averages (last 7 days)
    const nut: string[] = [];
    if (trends?.avgCalories != null) nut.push(`~${trends.avgCalories} kcal/day`);
    if (trends?.avgProtein != null) nut.push(`~${trends.avgProtein} g protein/day`);
    lines.push(nut.length ? `Nutrition (7-day avg): ${nut.join(', ')}.` : 'Nutrition: little logged in the last 7 days.');

    // Activity
    if (trends?.avgSteps != null) lines.push(`Steps (7-day avg): ~${trends.avgSteps}/day.`);
    if (trends?.totalKm) lines.push(`Cardio: ${trends.totalKm} km logged recently.`);

    // Recent workouts
    if (workouts.length) {
      const summary = workouts.slice(0, 8).map(w => {
        const date = w.session_timestamp.slice(0, 10);
        const exercises = (w.exercise_data ?? []).map(s => s.exercise).filter(Boolean);
        const unique = [...new Set(exercises)];
        const sets = (w.exercise_data ?? []).length;
        return `${date}: ${w.routine_name || 'Workout'} — ${unique.slice(0, 5).join(', ') || '—'} (${sets} sets)`;
      });
      lines.push(`Recent workouts (${workouts.length} in last sessions):\n- ${summary.join('\n- ')}`);
    } else {
      lines.push('Workouts: none logged recently.');
    }

    // Strength PRs
    if (records.length) {
      const prs = records
        .slice()
        .sort((a, b) => b.best1RM - a.best1RM)
        .slice(0, 6)
        .map(r => `${r.exercise}: best ~${r.best1RM} kg 1RM (last ${r.lastWeight}kg×${r.lastReps})`);
      lines.push(`Top lifts:\n- ${prs.join('\n- ')}`);
    }

    return lines.join('\n');
  }, [profile, calorieTarget, proteinTarget, trends, workouts, records, goals]);
}

export function CoachChat({ onClose }: { onClose: () => void }) {
  const { messages, sending, send, clear } = useCoachChat();
  const context = useCoachContext();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || sending) return;
    setInput('');
    void send(value, context);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--card-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-accent)]"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--text)]">AI Coach</p>
            <p className="text-[10px] text-[var(--muted)]">Knows what you’ve logged</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => clear()}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)]"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <Trash2 size={13} />
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-44 flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)]"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="hide-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <ActiveFocuses />
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4 pt-4">
            <div className="text-center">
              <span
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-[var(--on-accent)]"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <Sparkles size={26} />
              </span>
              <p className="text-base font-bold text-[var(--text)]">Ask your coach anything</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--muted)]">
                I can see your goal, weight trend, nutrition, workouts and PRs. Ask a question or tap
                one of these to start.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => submit(p.text)}
                  className="glass-card px-4 py-3 text-left text-sm font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => {
              // Assistant replies may carry a proposed focus; it renders as a
              // card rather than as raw text in the bubble.
              const { text, goal } =
                m.role === 'assistant' ? splitGoalSuggestion(m.content) : { text: m.content, goal: null };
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                      style={
                        m.role === 'user'
                          ? { background: 'var(--accent-gradient)', color: '#fff' }
                          : { background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }
                      }
                    >
                      {text}
                    </div>
                  </div>
                  {goal ? <GoalCard goal={goal} /> : null}
                </div>
              );
            })}
            {sending ? (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
                >
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className="px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ borderTop: '1px solid var(--card-border)' }}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Ask your coach…"
            className="hide-scrollbar max-h-28 flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm text-[var(--text)] outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--on-accent)] disabled:opacity-40"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)]"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
