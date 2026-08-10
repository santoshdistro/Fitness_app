import { useEffect, useState } from 'react';
import { Check, ChevronRight, Dumbbell, Timer, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { exerciseImageUrl, exerciseDbImageUrl } from '../data/workoutPrograms';
import { exerciseImagesFor } from '../data/exerciseNames';
import { isCardio, cardioTargetLabel } from '../data/exerciseKind';
import { cardioGuide } from '../data/cardioGuide';
import type { ExerciseSet } from '../types/database';

export type GuidedExercise = { name: string; sets: number; reps: string; exerciseId?: string };

type Props = {
  title: string;
  exercises: GuidedExercise[];
  onClose: () => void;
  onSaved: () => void;
  lastByExercise?: Map<string, { weight: number; reps: number }>;
};

const REST_OPTIONS = [45, 60, 90, 120];

function firstNumber(text: string): string {
  const m = text.match(/\d+/);
  return m ? m[0] : '';
}

export function GuidedWorkout({ title, exercises, onClose, onSaved, lastByExercise }: Props) {
  const { session } = useAuth();
  const [exIndex, setExIndex] = useState(0);
  const [setNum, setSetNum] = useState(1);
  const [reps, setReps] = useState(firstNumber(exercises[0]?.reps ?? ''));
  const [weight, setWeight] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');
  const [logged, setLogged] = useState<ExerciseSet[]>([]);
  const [phase, setPhase] = useState<'active' | 'resting' | 'done'>('active');
  const [restDuration, setRestDuration] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const current = exercises[exIndex];
  const cardio = current ? isCardio(current.name) : false;
  // Demonstration photos for the current move (resolved by id or by name).
  const demoImages = current ? exerciseImagesFor(current.exerciseId ?? current.name).slice(0, 2) : [];

  // Countdown while resting.
  useEffect(() => {
    if (phase !== 'resting') return;
    if (restLeft <= 0) {
      setPhase('active');
      try {
        navigator.vibrate?.(200);
      } catch {
        /* ignore */
      }
      return;
    }
    const t = setTimeout(() => setRestLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restLeft]);

  function startRest() {
    setRestLeft(restDuration);
    setPhase('resting');
  }

  function completeSet() {
    if (!current) return;
    const entry: ExerciseSet = cardio
      ? {
          exercise: current.name,
          reps: 0,
          weight: 0,
          durationMin: Number(minutes) || 0,
          ...(distance ? { distanceKm: Number(distance) || 0 } : {}),
        }
      : { exercise: current.name, reps: Number(reps) || 0, weight: Number(weight) || 0 };
    setLogged(prev => [...prev, entry]);

    if (setNum < current.sets) {
      setSetNum(n => n + 1);
      setMinutes('');
      setDistance('');
      startRest();
    } else if (exIndex < exercises.length - 1) {
      const next = exercises[exIndex + 1];
      setExIndex(i => i + 1);
      setSetNum(1);
      setReps(firstNumber(next.reps));
      setWeight('');
      setMinutes('');
      setDistance('');
      setImgFailed(false);
      startRest();
    } else {
      setPhase('done');
    }
  }

  async function finish() {
    if (!session?.user) return;
    setSaving(true);
    await supabase.from('workout_logs').insert({
      user_id: session.user.id,
      routine_name: title,
      exercise_data: logged,
    });
    setSaving(false);
    onSaved();
  }

  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = logged.length;

  return (
    <div className="app-bg fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
            Guided workout
          </p>
          <p className="text-sm font-bold text-[var(--text)]">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="glass flex h-9 w-9 items-center justify-center rounded-full"
        >
          <X size={16} className="text-[var(--text)]" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 px-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(doneSets / totalSets) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          {doneSets} / {totalSets} sets
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6">
        {phase === 'done' ? (
          <div className="anim-fade-rise text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Check size={30} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-[var(--text)]">Workout complete! 💪</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {doneSets} sets across {exercises.length} exercises.
            </p>
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
            >
              {saving ? 'Saving…' : 'Finish & save'}
            </button>
          </div>
        ) : phase === 'resting' ? (
          <div className="anim-fade-rise text-center">
            <Timer size={28} className="mx-auto text-[var(--accent)]" />
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Rest
            </p>
            <p className="text-6xl font-black tabular-nums text-[var(--text)]">{restLeft}s</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Up next: {current.name} · set {setNum}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {REST_OPTIONS.map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setRestDuration(sec);
                    setRestLeft(sec);
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={
                    restDuration === sec
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--card)', color: 'var(--muted)' }
                  }
                >
                  {sec}s
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPhase('active')}
              className="mt-6 w-full rounded-2xl border border-[var(--card-border)] py-3.5 text-sm font-semibold text-[var(--text)]"
            >
              Skip rest
            </button>
          </div>
        ) : (
          <div className="anim-fade-rise">
            <div className="glass-card overflow-hidden p-5">
              <div className="flex items-center gap-3">
                {current.exerciseId && !imgFailed ? (
                  <img
                    src={exerciseImageUrl(current.exerciseId)}
                    alt={current.name}
                    onError={() => setImgFailed(true)}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg)]">
                    <Dumbbell size={22} className="text-[var(--muted)]" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Exercise {exIndex + 1} / {exercises.length}
                  </p>
                  <p className="text-lg font-black leading-tight text-[var(--text)]">{current.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {cardio
                      ? `Round ${setNum} of ${current.sets} · ${cardioTargetLabel(current.reps)}`
                      : `Set ${setNum} of ${current.sets} · target ${current.reps} reps`}
                  </p>
                  {!cardio && lastByExercise?.get(current.name) ? (
                    <p className="text-[11px] font-semibold text-[var(--accent)]">
                      Last time: {lastByExercise.get(current.name)!.weight} kg ×{' '}
                      {lastByExercise.get(current.name)!.reps}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {cardio ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Minutes</label>
                      <input
                        className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={minutes}
                        onChange={e => setMinutes(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Distance (km)</label>
                      <input
                        className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={distance}
                        onChange={e => setDistance(e.target.value)}
                        placeholder="optional"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Reps</label>
                      <input
                        className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                        type="number"
                        inputMode="numeric"
                        value={reps}
                        onChange={e => setReps(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Weight (kg)</label>
                      <input
                        className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Demonstration photos for the current move */}
            <DemoPhotos images={demoImages} name={current.name} />

            <button
              type="button"
              onClick={completeSet}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl py-4 text-sm font-bold text-white bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
            >
              Complete set
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// A same-size card under the input card showing up to two demo photos of the
// current exercise (from the how-to database). When a move has no imagery (e.g.
// cardio), it explains what to do instead of an empty placeholder.
function DemoPhotos({ images, name }: { images: string[]; name: string }) {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const shown = images.filter((_, i) => !failed.has(i));
  const guide = shown.length === 0 ? cardioGuide(name) : null;

  return (
    <div className="glass-card mt-3 p-3">
      {shown.length > 0 ? (
        <div className={`grid gap-2 ${shown.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((path, i) =>
            failed.has(i) ? null : (
              <img
                key={path}
                src={exerciseDbImageUrl(path)}
                alt={`${name} demonstration`}
                onError={() => setFailed(prev => new Set(prev).add(i))}
                className="h-36 w-full rounded-xl object-cover"
              />
            ),
          )}
        </div>
      ) : guide ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">What to do</p>
          <p className="text-xs leading-relaxed text-[var(--text)]">{guide.summary}</p>
          <ol className="flex flex-col gap-1.5">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <span className="text-[11px] leading-relaxed text-[var(--text)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center gap-2 rounded-xl bg-[var(--bg)] text-[var(--muted)]">
          <Dumbbell size={18} />
          <span className="text-xs font-medium">No demo photo for this move</span>
        </div>
      )}
    </div>
  );
}
