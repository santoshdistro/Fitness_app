import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send, Sparkles, Trash2, X } from 'lucide-react';
import { useCoachChat } from '../hooks/useCoachChat';
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

  return useMemo(() => {
    const lines: string[] = [];

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
  }, [profile, calorieTarget, proteinTarget, trends, workouts, records]);
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
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
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4 pt-4">
            <div className="text-center">
              <span
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
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
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)', color: '#fff' }
                      : { background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
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
