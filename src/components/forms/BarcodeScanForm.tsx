import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Barcode } from 'lucide-react';
import { lookupBarcode } from '../../lib/openFoodFacts';
import { defaultMealCategoryForNow } from '../../utils/mealCategory';
import { MealForm, type MealInitial } from './MealForm';
import { errorTextClass } from './formStyles';

type Props = {
  onSaved: () => void;
};

// Only look for retail (product) barcode formats. Restricting the format list
// makes decoding far faster and more reliable than ZXing's default "try every
// symbology" mode, which struggles to lock onto a 1D barcode.
const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ],
  ],
  [DecodeHintType.TRY_HARDER, true],
]);

// Prefer the rear camera at a decent resolution so the barcode is sharp enough
// to decode quickly.
const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

type Stage =
  | { step: 'scanning' }
  | { step: 'looking'; code: string }
  | { step: 'error'; message: string }
  | { step: 'notfound'; code: string }
  | { step: 'review'; initial: MealInitial; notFound?: boolean };

export function BarcodeScanForm({ onSaved }: Props) {
  const [stage, setStage] = useState<Stage>({ step: 'scanning' });
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);

  function submitManual() {
    const code = manualCode.replace(/\D/g, '');
    if (code.length < 6) return;
    controlsRef.current?.stop();
    handledRef.current = true;
    void handleCode(code);
  }

  function enterManually(code: string) {
    setStage({
      step: 'review',
      notFound: true,
      initial: {
        mealName: '',
        category: defaultMealCategoryForNow(),
        servingNote: `Barcode ${code} not in the database · enter the details below`,
      },
    });
  }

  // Start / stop the camera scanner while we're on the scanning step.
  useEffect(() => {
    if (stage.step !== 'scanning') return;
    handledRef.current = false;
    const reader = new BrowserMultiFormatReader(SCAN_HINTS);
    let cancelled = false;

    reader
      .decodeFromConstraints(CAMERA_CONSTRAINTS, videoRef.current ?? undefined, (result, _err, controls) => {
        controlsRef.current = controls;
        if (result && !handledRef.current) {
          handledRef.current = true;
          controls.stop();
          void handleCode(result.getText());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStage({
            step: 'error',
            message: 'Could not open the camera. Allow camera access and try again.',
          });
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [stage.step]);

  async function handleCode(code: string) {
    setStage({ step: 'looking', code });
    try {
      const product = await lookupBarcode(code);
      if (!product) {
        // The scan worked — the product just isn't in the database. Say so
        // clearly (rather than looking like a failed scan) and let the user
        // enter the details by hand.
        setStage({ step: 'notfound', code });
        return;
      }
      const p = product.per100g;
      setStage({
        step: 'review',
        initial: {
          mealName: product.brand ? `${product.brand} ${product.name}` : product.name,
          category: defaultMealCategoryForNow(),
          calories: String(p.calories),
          protein: String(p.protein_g),
          carbs: String(p.carbs_g),
          fat: String(p.fat_g),
          fiber: String(p.fiber_g),
          sodium: String(p.sodium_mg),
          servingNote: `Per 100g${product.servingSize ? ` · serving ${product.servingSize}` : ''} · adjust amounts below`,
        },
      });
    } catch (err) {
      setStage({ step: 'error', message: err instanceof Error ? err.message : 'Lookup failed.' });
    }
  }

  if (stage.step === 'review') {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[var(--accent)]/10 px-3 py-2.5">
          <Barcode size={15} style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-medium text-[var(--text)]">
            {stage.notFound
              ? 'Not in the database — enter the details and save.'
              : 'Found it — check the amount and save.'}
          </p>
        </div>
        <MealForm onSaved={onSaved} initial={stage.initial} />
      </div>
    );
  }

  if (stage.step === 'notfound') {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <Barcode size={22} style={{ color: 'var(--muted)' }} />
          <p className="text-sm font-semibold text-[var(--text)]">No data available</p>
          <p className="text-xs text-[var(--muted)]">
            Barcode {stage.code} scanned fine, but it isn’t in the food database yet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => enterManually(stage.code)}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
        >
          Enter details manually
        </button>
        <button
          type="button"
          onClick={() => setStage({ step: 'scanning' })}
          className="w-full rounded-2xl py-3 text-sm font-semibold text-[var(--text)]"
          style={{ border: '1px solid var(--card-border)' }}
        >
          Scan again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-1">
      {stage.step === 'scanning' ? (
        <>
          <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--accent)]/80" />
          </div>
          <p className="text-center text-sm text-[var(--muted)]">
            Point your camera at a barcode to log the product.
          </p>
          <ManualEntry
            value={manualCode}
            onChange={setManualCode}
            onSubmit={submitManual}
            hint="Barcode won’t scan (blurry, curved, damaged)? Type the number under it."
          />
        </>
      ) : stage.step === 'looking' ? (
        <div className="flex items-center gap-2 py-8 text-sm font-medium text-[var(--muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
          Looking up {stage.code}…
        </div>
      ) : (
        <>
          <p className={`${errorTextClass} py-6 text-center`}>{stage.message}</p>
          <button
            type="button"
            onClick={() => setStage({ step: 'scanning' })}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#6c63ff,#4b3fe0)]"
          >
            Scan again
          </button>
          <ManualEntry
            value={manualCode}
            onChange={setManualCode}
            onSubmit={submitManual}
            hint="Or enter the barcode number manually."
          />
        </>
      )}
    </div>
  );
}

function ManualEntry({
  value,
  onChange,
  onSubmit,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  hint: string;
}) {
  return (
    <div className="w-full">
      <p className="mb-2 text-center text-xs text-[var(--muted)]">{hint}</p>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 5000112637922"
          className="flex-1 rounded-2xl px-4 py-3 text-sm text-[var(--text)] outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
        />
        <button
          type="submit"
          disabled={value.replace(/\D/g, '').length < 6}
          className="shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
        >
          Look up
        </button>
      </form>
    </div>
  );
}
