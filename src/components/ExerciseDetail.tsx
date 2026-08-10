import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { EXERCISE_DETAILS } from '../data/exerciseDetails';
import { exerciseDbImageUrl } from '../data/workoutPrograms';
import { cardioGuide } from '../data/cardioGuide';

type Props = {
  name: string;
  exerciseId?: string;
  sets?: number;
  reps?: string;
};

export function ExerciseDetail({ name, exerciseId, sets, reps }: Props) {
  const detail = exerciseId ? EXERCISE_DETAILS[exerciseId] : undefined;
  const cardio = !detail ? cardioGuide(name) : null;
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-black tracking-tight text-[var(--text)]">{name}</h2>
        {sets != null && reps ? (
          <p className="text-xs font-semibold text-[var(--accent)]">
            {sets} sets × {reps} reps
          </p>
        ) : null}
      </div>

      {detail && detail.images.length > 0 && !failed ? (
        <div className="flex gap-2 overflow-x-auto">
          {detail.images.map(path => (
            <img
              key={path}
              src={exerciseDbImageUrl(path)}
              alt={name}
              onError={() => setFailed(true)}
              className="h-40 w-56 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl bg-[var(--bg)]">
          <Dumbbell size={28} className="text-[var(--muted)]" />
        </div>
      )}

      {detail ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {detail.primaryMuscles.map(m => (
              <span
                key={m}
                className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-semibold capitalize"
                style={{ color: 'var(--accent)' }}
              >
                {m}
              </span>
            ))}
            {detail.equipment ? (
              <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--muted)]">
                {detail.equipment}
              </span>
            ) : null}
            {detail.level ? (
              <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--muted)]">
                {detail.level}
              </span>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text)]">How to do it</p>
            <ol className="flex flex-col gap-2.5">
              {detail.instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--text)]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : cardio ? (
        <>
          <p className="text-xs leading-relaxed text-[var(--text)]">{cardio.summary}</p>
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text)]">How to do it</p>
            <ol className="flex flex-col gap-2.5">
              {cardio.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--text)]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          No step-by-step guide for this exercise yet.
        </p>
      )}
    </div>
  );
}
