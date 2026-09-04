import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useSettings } from '../../hooks/useSettings';
import { kgToUnit, unitToKg } from '../../utils/units';
import { useRecentMeasurements } from '../../hooks/useRecentMeasurements';
import { useRecentDailyLogs } from '../../hooks/useRecentDailyLogs';
import { useRecentWorkouts } from '../../hooks/useRecentWorkouts';
import { useBodyScans } from '../../hooks/useBodyScans';
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { analyzeBody, type BodyResult } from '../../lib/aiClient';
import { fileToDownscaledBase64 } from '../../utils/image';
import { todayDateString } from '../../utils/date';
import { BodyScanReadout } from '../BodyScanReadout';
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
  const { logs } = useRecentDailyLogs(30);
  const { workouts } = useRecentWorkouts(12);
  const { scans, addScan } = useBodyScans();
  const { addPhoto } = useProgressPhotos();
  const [stage, setStage] = useState<Stage>({ step: 'pick' });
  const [savePhoto, setSavePhoto] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [zoom, setZoom] = useState(false);
  const { settings } = useSettings();
  const wUnit = settings.weightUnit;
  const [photoWeight, setPhotoWeight] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);

  const deficit = profile?.calorie_deficit_kcal ?? 500;
  const goal = deficit > 0 ? GOAL_LABEL.deficit : deficit < 0 ? GOAL_LABEL.surplus : GOAL_LABEL.maintenance;
  const bodyFat = measurements[0]?.calculated_body_fat ?? null;
  const latestWeight = [...logs].reverse().find(l => l.weight != null)?.weight ?? null;
  const lastScan = scans[0] ?? null;

  // Give the AI the user's tracked history so it can compare, not start blind.
  const m = measurements[0];
  const measurementsSummary = m
    ? [
        m.chest != null ? `chest ${m.chest}in` : '',
        m.waist != null ? `waist ${m.waist}in` : '',
        m.biceps != null ? `biceps ${m.biceps}in` : '',
        m.thighs != null ? `thighs ${m.thighs}in` : '',
        m.hips != null ? `hips ${m.hips}in` : '',
        m.calculated_body_fat != null ? `~${Math.round(m.calculated_body_fat)}% body fat` : '',
      ]
        .filter(Boolean)
        .join(', ') || null
    : null;
  const recentTraining = workouts.length
    ? `${workouts.length} session${workouts.length > 1 ? 's' : ''} logged recently; exercises include ${[
        ...new Set(workouts.flatMap(w => w.exercise_data.map(s => s.exercise))),
      ]
        .slice(0, 6)
        .join(', ')}`
    : null;

  async function runScan(file: File) {
    if (!session?.user) return;
    lastFileRef.current = file;
    setSavePhoto('idle');
    const preview = URL.createObjectURL(file);
    setStage({ step: 'scanning', preview });
    try {
      const image = await fileToDownscaledBase64(file);
      const result = await analyzeBody(session.user.id, image, {
        goal,
        bodyFatPercent: bodyFat,
        weightKg: latestWeight,
        lastScanSummary: lastScan?.summary ?? null,
        lastScanWeakPoints: lastScan?.weak_points ?? lastScan?.focus_areas ?? null,
        measurementsSummary,
        activity: profile?.activity_level ?? null,
        recentTraining,
        scanCount: scans.length,
      });
      void addScan(result);
      setStage({ step: 'result', preview, result });
    } catch (err) {
      setStage({
        step: 'error',
        preview,
        message: err instanceof Error ? err.message : 'Could not analyse that photo.',
      });
    }
  }

  // Prefill the photo weight with the last recorded weigh-in (editable).
  useEffect(() => {
    if (latestWeight != null && photoWeight === '') {
      setPhotoWeight(String(Math.round(kgToUnit(latestWeight, wUnit) * 10) / 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestWeight, wUnit]);

  async function saveToProgress() {
    const file = lastFileRef.current;
    if (!file || savePhoto !== 'idle') return;
    setSavePhoto('saving');
    const weightKg = photoWeight ? Math.round(unitToKg(Number(photoWeight), wUnit) * 100) / 100 : latestWeight;
    const { error } = await addPhoto(file, { takenOn: todayDateString(), weightKg });
    setSavePhoto(error ? 'idle' : 'saved');
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void runScan(file);
  }

  return (
    <div className="flex flex-col gap-4 py-1">
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {stage.step === 'pick' ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Camera size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-center text-sm text-[var(--muted)]">
            Upload a physique photo and the AI coach gives you an honest read — what looks good,
            what's lagging, and exactly what to do next for your goal. It compares against your last
            scan too. Your photo isn't saved unless you choose to add it to Progress photos.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-[var(--on-accent)] bg-[image:var(--accent-gradient)]"
          >
            Take / choose photo
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button type="button" onClick={() => setZoom(true)} aria-label="Zoom photo" className="relative">
            <img src={stage.preview} alt="Physique" className="h-44 w-44 rounded-2xl object-cover" />
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
              tap to zoom
            </span>
          </button>
          {stage.step !== 'scanning' ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="-mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]"
            >
              <RefreshCw size={12} /> Replace photo
            </button>
          ) : null}

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
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-[var(--on-accent)] bg-[image:var(--accent-gradient)]"
              >
                Try another photo
              </button>
            </>
          ) : (
            <div className="w-full">
              <BodyScanReadout result={stage.result} />
              <div className="mt-4 flex items-center gap-2">
                <label className="text-xs font-semibold text-[var(--muted)]" htmlFor="scan-weight">
                  Weight for this photo
                </label>
                <input
                  id="scan-weight"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={photoWeight}
                  onChange={e => setPhotoWeight(e.target.value)}
                  className="w-20 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-2 py-1.5 text-right text-sm text-[var(--text)] outline-none"
                />
                <span className="text-xs font-semibold text-[var(--muted)]">{wUnit}</span>
              </div>
              <button
                type="button"
                onClick={saveToProgress}
                disabled={savePhoto !== 'idle'}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-semibold text-[var(--on-accent)] disabled:opacity-60 bg-[image:var(--accent-gradient)]"
              >
                <ImagePlus size={15} />
                {savePhoto === 'saved'
                  ? 'Saved to Progress photos ✓'
                  : savePhoto === 'saving'
                    ? 'Saving…'
                    : 'Save this photo to Progress'}
              </button>
              <p className="mt-1.5 text-center text-[10px] text-[var(--muted)]">
                Optional — you can delete it anytime from Progress photos.
              </p>
              <button
                type="button"
                onClick={() => setStage({ step: 'pick' })}
                className="mt-3 w-full rounded-2xl border border-[var(--card-border)] py-3 text-xs font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Scan another photo
              </button>
            </div>
          )}
        </div>
      )}

      {zoom && stage.step !== 'pick' ? (
        <button
          type="button"
          onClick={() => setZoom(false)}
          aria-label="Close"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <img
            src={stage.preview}
            alt="Physique enlarged"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
          <span className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
            <X size={18} />
          </span>
        </button>
      ) : null}
    </div>
  );
}
