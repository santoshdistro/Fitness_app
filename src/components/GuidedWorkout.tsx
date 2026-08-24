import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Dumbbell, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { exerciseImageUrl, exerciseDbImageUrl } from '../data/workoutPrograms';
import { exerciseImagesFor } from '../data/exerciseNames';
import { isCardio, isIntervalCardio, usesInclineSpeed, cardioTargetLabel } from '../data/exerciseKind';
import { cardioGuide } from '../data/cardioGuide';
import { textGuide } from '../data/textGuides';
import { loadGuided, saveGuided, clearGuided, sameSession } from '../lib/guidedSession';
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
  // Resume an in-progress session for this exact workout, if one was saved.
  const resumed = (() => {
    const s = loadGuided();
    return sameSession(s, title, exercises) && s!.logged.length > 0 ? s : null;
  })();
  const [exIndex, setExIndex] = useState(resumed?.exIndex ?? 0);
  const [setNum, setSetNum] = useState(resumed?.setNum ?? 1);
  const [reps, setReps] = useState(firstNumber(exercises[resumed?.exIndex ?? 0]?.reps ?? ''));
  const [weight, setWeight] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distance, setDistance] = useState('');
  const [speed, setSpeed] = useState('');
  const [incline, setIncline] = useState('');
  const [logged, setLogged] = useState<ExerciseSet[]>(resumed?.logged ?? []);
  const [didResume, setDidResume] = useState(Boolean(resumed));
  const [phase, setPhase] = useState<'active' | 'resting' | 'done'>('active');
  const [restDuration, setRestDuration] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  // Absolute start/end times for the rest countdown, so it survives the phone
  // locking or the app being backgrounded (JS timers pause; wall-clock time does
  // not). The start time also lets a mid-rest duration change keep the elapsed
  // seconds and only adjust what's left.
  const restStartRef = useRef(0);
  const restEndRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const current = exercises[exIndex];
  const cardio = current ? isCardio(current.name) : false;
  const inclineSpeed = current ? usesInclineSpeed(current.name) : false;
  // Demonstration photos for the current move (resolved by id or by name).
  const demoImages = current ? exerciseImagesFor(current.exerciseId ?? current.name).slice(0, 2) : [];

  // Countdown while resting — derived from the wall-clock end time so locking
  // the phone or switching apps doesn't pause it; on return it catches up.
  useEffect(() => {
    if (phase !== 'resting') return;
    function tick() {
      const left = Math.max(0, Math.ceil((restEndRef.current - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) {
        setPhase('active');
        try {
          navigator.vibrate?.(200);
        } catch {
          /* ignore */
        }
      }
    }
    tick();
    const id = setInterval(tick, 250);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [phase]);

  // Persist progress so a reload / navigating away doesn't lose logged sets.
  // (Not while on the completion screen — that's cleared when saved.)
  useEffect(() => {
    if (phase === 'done') return;
    if (logged.length === 0 && exIndex === 0 && setNum === 1) return;
    saveGuided({ title, exercises, logged, exIndex, setNum, savedAt: Date.now() });
  }, [logged, exIndex, setNum, phase, title, exercises]);

  function startRest() {
    restStartRef.current = Date.now();
    restEndRef.current = restStartRef.current + restDuration * 1000;
    setRestLeft(restDuration);
    setPhase('resting');
  }

  // Nudge the running rest by a relative amount. The new length also becomes the
  // default for the sets that follow, so "I need a bit longer today" sticks
  // instead of having to be re-tapped every set.
  function adjustRest(delta: number) {
    changeRestDuration(Math.max(5, restDuration + delta));
  }

  // Change the rest length mid-countdown: keep the seconds already elapsed and
  // re-anchor the end time to (start + new length). So 90s with 20s gone → pick
  // 45s → 25s left; 45s with 10s gone → pick 90s → 80s left. If the new length
  // is already past, the rest is over.
  function changeRestDuration(sec: number) {
    setRestDuration(sec);
    const newEnd = restStartRef.current + sec * 1000;
    restEndRef.current = newEnd;
    const left = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
    if (left <= 0) {
      setPhase('active');
    } else {
      setRestLeft(left);
    }
  }

  function restartSession() {
    clearGuided();
    setLogged([]);
    setExIndex(0);
    setSetNum(1);
    setReps(firstNumber(exercises[0]?.reps ?? ''));
    setWeight('');
    setMinutes('');
    setDistance('');
    setSpeed('');
    setIncline('');
    setDidResume(false);
    setPhase('active');
  }

  function goToNextExercise(rest: boolean) {
    if (exIndex < exercises.length - 1) {
      const next = exercises[exIndex + 1];
      setExIndex(i => i + 1);
      setSetNum(1);
      setReps(firstNumber(next.reps));
      setWeight('');
      setMinutes('');
      setDistance('');
      setSpeed('');
      setIncline('');
      setImgFailed(false);
      if (rest) startRest();
    } else {
      setPhase('done');
    }
  }

  function completeSet() {
    if (!current) return;
    // Logging a set means you've chosen to continue — retire the resume banner.
    if (didResume) setDidResume(false);
    const entry: ExerciseSet = cardio
      ? {
          exercise: current.name,
          reps: 0,
          weight: 0,
          durationMin: Number(minutes) || 0,
          ...(distance ? { distanceKm: Number(distance) || 0 } : {}),
          ...(speed ? { speedKph: Number(speed) || 0 } : {}),
          ...(incline ? { inclinePct: Number(incline) || 0 } : {}),
        }
      : { exercise: current.name, reps: Number(reps) || 0, weight: Number(weight) || 0 };
    setLogged(prev => [...prev, entry]);

    // Cardio logs as one block (the timer handles the rounds) → straight to the
    // next exercise, no rest screen. Lifts step through their sets as before.
    if (cardio) {
      goToNextExercise(false);
    } else if (setNum < current.sets) {
      setSetNum(n => n + 1);
      startRest();
    } else {
      goToNextExercise(true);
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
    clearGuided();
    onSaved();
  }

  // Cardio counts as one block for progress (not one per round).
  const totalSets = exercises.reduce((s, e) => s + (isCardio(e.name) ? 1 : e.sets), 0);
  const doneSets = logged.length;
  const lastExercise = exIndex >= exercises.length - 1;

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
          className="tap-44 glass flex h-9 w-9 items-center justify-center rounded-full"
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

      {didResume && phase !== 'done' ? (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-2xl bg-[var(--accent)]/10 px-3 py-2">
          <p className="flex-1 text-[11px] font-medium text-[var(--text)]">
            Resumed from where you left off — {doneSets} logged.
          </p>
          <button
            type="button"
            onClick={restartSession}
            className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-bold text-white"
          >
            Restart
          </button>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6">
       <div className="flex min-h-full flex-col justify-center py-4">
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
              className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 bg-[image:var(--accent-gradient)]"
            >
              {saving ? 'Saving…' : 'Finish & save'}
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
                    loading="lazy"
                    decoding="async"
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
                      ? `${isIntervalCardio(current.name) ? `${current.sets} rounds · ` : ''}${cardioTargetLabel(current.reps)}`
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
                    {inclineSpeed ? (
                      <>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Speed (km/h)</label>
                          <input
                            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={speed}
                            onChange={e => setSpeed(e.target.value)}
                            placeholder="optional"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Incline (%)</label>
                          <input
                            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-center text-lg font-bold text-[var(--text)] outline-none"
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={incline}
                            onChange={e => setIncline(e.target.value)}
                            placeholder="optional"
                          />
                        </div>
                      </>
                    ) : null}
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

            {/* Timer for cardio — interval or stopwatch, fills the minutes */}
            {cardio ? (
              <CardioTimer
                name={current.name}
                totalRounds={current.sets}
                onUseMinutes={mins => setMinutes(String(mins))}
              />
            ) : null}

            {/* Primary action — kept above the how-to so it's always reachable */}
            <button
              type="button"
              onClick={completeSet}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-2xl py-4 text-sm font-bold text-white bg-[image:var(--accent-gradient)]"
            >
              {cardio ? (lastExercise ? 'Log & finish' : 'Log & next exercise') : 'Complete set'}
              <ChevronRight size={18} />
            </button>
            {cardio && !lastExercise ? (
              <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
                Do as many rounds as you like — the timer stops at {current.sets}. Tap above when
                you're done to move on.
              </p>
            ) : null}

            {/* Demonstration photos / how-to for the current move */}
            <DemoPhotos images={demoImages} name={current.name} />
          </div>
        )}
       </div>
      </div>

      {/* Rest docks at the bottom instead of taking over the screen, so the sets
          you just logged and the move coming up stay visible while you wait. */}
      {phase === 'resting' ? (
        <div
          className="anim-sheet-up border-t border-[var(--card-border)] bg-[var(--card)] px-6 pt-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
              <Timer size={13} className="shrink-0 text-[var(--accent)]" />
              <span className="truncate">
                Resting · up next {current.name} · set {setNum}
              </span>
            </p>
            <p className="shrink-0 text-3xl font-black tabular-nums text-[var(--text)]">{restLeft}s</p>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRest(-15)}
              className="tap-44 flex-1 rounded-2xl border border-[var(--card-border)] py-3 text-xs font-bold text-[var(--text)]"
            >
              −15s
            </button>
            <button
              type="button"
              onClick={() => setPhase('active')}
              className="tap-44 flex-[1.4] rounded-2xl py-3 text-xs font-bold text-white bg-[image:var(--accent-gradient)]"
            >
              Skip rest
            </button>
            <button
              type="button"
              onClick={() => adjustRest(15)}
              className="tap-44 flex-1 rounded-2xl border border-[var(--card-border)] py-3 text-xs font-bold text-[var(--text)]"
            >
              +15s
            </button>
          </div>

          <div className="mt-2 flex justify-center gap-2">
            {REST_OPTIONS.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => changeRestDuration(sec)}
                className="tap-44 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={
                  restDuration === sec
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--muted)' }
                }
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Pull a work/rest interval out of a name like "Intervals (30s hard / 90s easy)".
function parseIntervals(name: string): { work: number; rest: number } | null {
  const hard = name.match(/(\d+)\s*s(?:ec(?:onds)?)?\s*(?:hard|work|on|fast|sprint)/i);
  const easy = name.match(/(\d+)\s*s(?:ec(?:onds)?)?\s*(?:easy|rest|off|slow|recover)/i);
  if (hard && easy) return { work: Number(hard[1]), rest: Number(easy[1]) };
  return null;
}

// A live timer for cardio: an interval timer (work/rest countdown + round count,
// buzzes on each switch, auto-stops after the target rounds) when the move
// encodes intervals, otherwise a count-up stopwatch. "Log Nmin" (and the auto-
// stop) drop the elapsed time into the minutes field.
function CardioTimer({
  name,
  totalRounds,
  onUseMinutes,
}: {
  name: string;
  totalRounds?: number;
  onUseMinutes: (mins: number) => void;
}) {
  const intervals = parseIntervals(name);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // total seconds
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [phaseLeft, setPhaseLeft] = useState(intervals?.work ?? 0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);

  // Mirror latest state so the once-a-second tick reads fresh values.
  const st = useRef({ phase, phaseLeft, round, elapsed });
  st.current = { phase, phaseLeft, round, elapsed };
  const onUse = useRef(onUseMinutes);
  onUse.current = onUseMinutes;

  const buzz = (pattern: number | number[]) => {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const cur = st.current;
      const nextElapsed = cur.elapsed + 1;
      setElapsed(nextElapsed);
      if (!intervals) return;
      if (cur.phaseLeft > 1) {
        setPhaseLeft(cur.phaseLeft - 1);
        return;
      }
      // Phase boundary.
      if (cur.phase === 'work') {
        buzz(150);
        setPhase('rest');
        setPhaseLeft(intervals.rest);
        return;
      }
      // A round (work + rest) just finished.
      if (totalRounds && cur.round >= totalRounds) {
        buzz([200, 100, 200]);
        setRunning(false);
        setDone(true);
        onUse.current(Math.max(0, Math.round((nextElapsed / 60) * 10) / 10));
        return;
      }
      buzz(150);
      setPhase('work');
      setRound(cur.round + 1);
      setPhaseLeft(intervals.work);
    }, 1000);
    return () => clearInterval(id);
  }, [running, intervals, totalRounds]);

  function reset() {
    setRunning(false);
    setDone(false);
    setElapsed(0);
    setPhase('work');
    setPhaseLeft(intervals?.work ?? 0);
    setRound(1);
  }

  const mins = Math.max(0, Math.round((elapsed / 60) * 10) / 10);
  const roundLabel = totalRounds ? `${Math.min(round, totalRounds)} / ${totalRounds}` : `${round}`;

  return (
    <div className="glass-card mt-3 flex flex-col items-center gap-2 p-4">
      {done ? (
        <>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#22c55e' }}>
            Done · {totalRounds ?? round} rounds
          </span>
          <span className="text-4xl font-black tabular-nums text-[var(--text)]">{fmtClock(elapsed)}</span>
          <span className="text-[11px] text-[var(--muted)]">Logged {mins} min below</span>
        </>
      ) : intervals ? (
        <>
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: phase === 'work' ? '#ef4444' : 'var(--accent)' }}
          >
            {phase === 'work' ? 'Work' : 'Recover'} · round {roundLabel}
          </span>
          <span className="text-5xl font-black tabular-nums text-[var(--text)]">{phaseLeft}s</span>
          <span className="text-[11px] text-[var(--muted)]">Total {fmtClock(elapsed)}</span>
        </>
      ) : (
        <>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Timer</span>
          <span className="text-5xl font-black tabular-nums text-[var(--text)]">{fmtClock(elapsed)}</span>
        </>
      )}

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (done) reset();
            setRunning(r => !r);
          }}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
          style={{ background: running ? '#ef4444' : 'var(--accent-gradient)' }}
        >
          {running ? <><Pause size={14} /> Pause</> : <><Play size={14} fill="currentColor" /> {done ? 'Restart' : 'Start'}</>}
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Reset timer"
          className="tap-44 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg)] text-[var(--muted)]"
        >
          <RotateCcw size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            onUseMinutes(mins);
          }}
          disabled={elapsed === 0}
          className="rounded-full bg-[var(--bg)] px-3 py-2 text-xs font-bold text-[var(--accent)] disabled:opacity-40"
        >
          Log {mins} min
        </button>
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
  const guide = shown.length === 0 ? cardioGuide(name) ?? textGuide(name) : null;

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
                loading="lazy"
                decoding="async"
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
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
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
