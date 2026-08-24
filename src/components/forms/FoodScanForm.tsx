import { useRef, useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { scanFood } from '../../lib/aiClient';
import { fileToDownscaledBase64 } from '../../utils/image';
import { defaultMealCategoryForNow } from '../../utils/mealCategory';
import { MealForm, type MealInitial } from './MealForm';
import { errorTextClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

type Stage =
  | { step: 'pick' }
  | { step: 'scanning'; preview: string }
  | { step: 'error'; preview: string; message: string }
  | { step: 'review'; initial: MealInitial };

export function FoodScanForm({ onSaved }: Props) {
  const { session } = useAuth();
  const [stage, setStage] = useState<Stage>({ step: 'pick' });
  const inputRef = useRef<HTMLInputElement>(null);

  async function runScan(file: File) {
    if (!session?.user) return;
    const preview = URL.createObjectURL(file);
    setStage({ step: 'scanning', preview });
    try {
      const image = await fileToDownscaledBase64(file);
      const result = await scanFood(session.user.id, image);
      setStage({
        step: 'review',
        initial: {
          mealName: result.name,
          category: defaultMealCategoryForNow(),
          calories: String(result.calories),
          protein: String(result.protein_g),
          carbs: String(result.carbs_g),
          fat: String(result.fat_g),
          fiber: String(result.fiber_g),
          sodium: String(result.sodium_mg),
          servingNote: `AI estimate (${result.confidence} confidence) · edit anything below`,
        },
      });
    } catch (err) {
      setStage({
        step: 'error',
        preview,
        message: err instanceof Error ? err.message : 'Could not read that photo.',
      });
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void runScan(file);
  }

  if (stage.step === 'review') {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--accent)]/10 px-3 py-2.5">
          <Sparkles size={15} style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-medium text-[var(--text)]">
            Estimated from your photo — tweak and save.
          </p>
        </div>
        <MealForm onSaved={onSaved} initial={stage.initial} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {stage.step === 'pick' ? (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <Camera size={30} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="text-center text-sm text-[var(--muted)]">
            Snap or upload a photo of your meal and the AI will estimate the calories and macros.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[image:var(--accent-gradient)]"
          >
            Take / choose photo
          </button>
        </>
      ) : (
        <>
          <img src={stage.preview} alt="Meal" className="h-40 w-40 rounded-2xl object-cover" />
          {stage.step === 'scanning' ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
              Analyzing your meal…
            </div>
          ) : (
            <>
              <p className={errorTextClass}>{stage.message}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[image:var(--accent-gradient)]"
              >
                Try another photo
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
