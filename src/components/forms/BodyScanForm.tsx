import { useRef, useState } from 'react';
import { Camera, Dumbbell, Sparkles, Utensils } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useRecentMeasurements } from '../../hooks/useRecentMeasurements';
import { analyzeBody, type BodyResult } from '../../lib/aiClient';
import { fileToDownscaledBase64 } from '../../utils/image';
import { errorTextClass } from './formStyles';

type Stage =
  | { step: 'pick' }
  | { step: 'scanning'; preview: string }
  | { step: 'error'; preview: string; message: string }
  | { step: 'result'; preview: string; result: BodyResult };

const GOAL_LABEL: Record<string, string> = {
  deficit: 'lose fat / get leaner',
  surplus: 'build muscle',
  maintenance: 'maintain and recomposition',
};

export function BodyScanForm() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { measurements } = useRecentMeasurements(1);
  const [stage, setStage] = useState<Stage>({ step: 'pick' });
  const inputRef = useRef<HTMLInputElement>(null);

  const deficit = profile?.calorie_deficit_kcal ?? 500;
  const goal = deficit > 0 ? GOAL_LABEL.deficit : deficit < 0 ? GOAL_LABEL.surplus : GOAL_LABEL.maintenance;
  const bodyFat = measurements[0]?.calculated_body_fat ?? null;

  async function runScan(file: File) {
    if (!session?.user) return;
    const preview = URL.createObjectURL(file);
    setStage({ step: 'scanning', preview });
    try {
      const image = await fileToDownscaledBase64(file);
      const result = await analyzeBody(session.user.id, image, { goal, bodyFatPercent: bodyFat });
      setStage({ step: 'result', preview, result });
    } catch (err) {
      setStage({
        step: 'error',
        preview,
        message: err instanceof Error ? err.message : 'Could not analyse that photo.',
      });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void runScan(file);
  }

  return (
    <div className="flex flex-col gap-4 py-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      {stage.step === 'pick' ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Camera size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-center text-sm text-[var(--muted)]">
            Upload a physique photo and the AI gives you a training and diet focus for your goal.
            It's directional coaching, not a medical assessment — your photo isn't stored.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            Take / choose photo
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img src={stage.preview} alt="Physique" className="h-44 w-44 rounded-2xl object-cover" />

          {stage.step === 'scanning' ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
              Analyzing your physique…
            </div>
          ) : stage.step === 'error' ? (
            <>
              <p className={errorTextClass}>{stage.message}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
              >
                Try another photo
              </button>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center gap-2">
                <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold text-[var(--text)]">Coach's read</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{stage.result.summary}</p>

              {stage.result.focusAreas.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stage.result.focusAreas.map(area => (
                    <span
                      key={area}
                      className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex gap-2.5 rounded-2xl bg-[var(--bg)] p-3">
                  <Dumbbell size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Training</p>
                    <p className="text-xs text-[var(--text)]">{stage.result.trainingFocus}</p>
                  </div>
                </div>
                <div className="flex gap-2.5 rounded-2xl bg-[var(--bg)] p-3">
                  <Utensils size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Nutrition</p>
                    <p className="text-xs text-[var(--text)]">{stage.result.nutritionFocus}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStage({ step: 'pick' })}
                className="mt-4 w-full rounded-2xl border border-[var(--card-border)] py-3 text-xs font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Scan another photo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
