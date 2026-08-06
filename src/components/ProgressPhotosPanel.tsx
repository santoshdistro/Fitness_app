import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check, GitCompare, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import { useProgressPhotos, type ProgressPhotoWithUrl } from '../hooks/useProgressPhotos';
import { todayDateString } from '../utils/date';
import { errorTextClass, inputClass, labelClass, submitButtonClass } from './forms/formStyles';

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProgressPhotosPanel() {
  const { photos, loading, addPhoto, updatePhoto, removePhoto } = useProgressPhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The photo being edited (null = adding a new one). The form is open whenever
  // there's a picked file OR a photo being edited.
  const [editingPhoto, setEditingPhoto] = useState<ProgressPhotoWithUrl | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [takenOn, setTakenOn] = useState(todayDateString());
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  // A photo URL shown full-screen (tap to close).
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  // What the hidden file input is picking for: a brand-new photo or a swap.
  const pickModeRef = useRef<'add' | 'replace'>('add');

  const formOpen = pendingFile != null || editingPhoto != null;
  const previewSrc = pendingPreview ?? editingPhoto?.url ?? null;

  function revokePreview() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
  }

  function onFileChange(file: File | undefined) {
    if (!file) return;
    if (pickModeRef.current === 'replace') {
      // Swap just the image, keeping the metadata already filled in.
      revokePreview();
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      startAdd(file);
    }
  }

  function startAdd(file: File) {
    revokePreview();
    setEditingPhoto(null);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setTakenOn(todayDateString());
    setWeight('');
    setNote('');
    setError(null);
  }

  function startEdit(photo: ProgressPhotoWithUrl) {
    revokePreview();
    setEditingPhoto(photo);
    setPendingFile(null);
    setPendingPreview(null);
    setTakenOn(photo.taken_on);
    setWeight(photo.weight_kg != null ? String(photo.weight_kg) : '');
    setNote(photo.note ?? '');
    setError(null);
  }

  function closeForm() {
    revokePreview();
    setEditingPhoto(null);
    setPendingFile(null);
    setPendingPreview(null);
    setError(null);
  }

  async function saveForm() {
    setSaving(true);
    setError(null);
    const meta = { takenOn, weightKg: weight ? Number(weight) : null, note };
    const { error: saveError } = editingPhoto
      ? await updatePhoto(editingPhoto, { file: pendingFile ?? undefined, ...meta })
      : pendingFile
        ? await addPhoto(pendingFile, meta)
        : { error: new Error('Pick a photo first') };
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    closeForm();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep the two most recent taps
      return [...prev, id];
    });
  }

  const comparePair = compareMode
    ? (selected
        .map(id => photos.find(p => p.id === id))
        .filter(Boolean) as ProgressPhotoWithUrl[])
    : [];

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => onFileChange(e.target.files?.[0])}
      />

      {/* Add / edit form */}
      {formOpen ? (
        <div className="glass-card flex flex-col gap-3 p-4">
          {previewSrc ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomUrl(previewSrc)}
                aria-label="Zoom photo"
                className="relative"
              >
                <img
                  src={previewSrc}
                  alt="Progress photo preview"
                  className="mx-auto max-h-56 rounded-2xl object-contain"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white">
                  tap to zoom
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  pickModeRef.current = 'replace';
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]"
              >
                <RefreshCw size={12} /> Replace photo
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="pp-date">
                Date
              </label>
              <input
                id="pp-date"
                type="date"
                className={inputClass}
                value={takenOn}
                max={todayDateString()}
                onChange={e => setTakenOn(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pp-weight">
                Weight (kg) — optional
              </label>
              <input
                id="pp-weight"
                type="number"
                inputMode="decimal"
                step="any"
                className={inputClass}
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="pp-note">
              Note — optional
            </label>
            <input
              id="pp-note"
              type="text"
              className={inputClass}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. front, week 1"
            />
          </div>
          {error ? <p className={errorTextClass}>{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-2xl border border-[var(--card-border)] py-3 text-sm font-semibold text-[var(--text)]"
            >
              Cancel
            </button>
            <button type="button" onClick={saveForm} disabled={saving} className={`${submitButtonClass} flex-1`}>
              {saving ? 'Saving…' : editingPhoto ? 'Save changes' : 'Save photo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              pickModeRef.current = 'add';
              fileInputRef.current?.click();
            }}
            className={`${submitButtonClass} flex-1`}
          >
            <Camera size={16} className="mr-2" />
            Add photo
          </button>
          {photos.length >= 2 ? (
            <button
              type="button"
              onClick={() => {
                setCompareMode(m => !m);
                setSelected([]);
              }}
              className="flex items-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold"
              style={
                compareMode
                  ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff' }
                  : { borderColor: 'var(--card-border)', color: 'var(--text)' }
              }
            >
              <GitCompare size={16} />
              Compare
            </button>
          ) : null}
        </div>
      )}

      {compareMode ? (
        <p className="text-[11px] text-[var(--muted)]">
          Tap two photos to compare them side by side.
        </p>
      ) : null}

      {/* Compare view */}
      {comparePair.length === 2 ? (
        <div className="glass-card p-3">
          <div className="grid grid-cols-2 gap-2">
            {comparePair.map(p => (
              <div key={p.id}>
                {p.url ? (
                  <img src={p.url} alt={`Progress ${p.taken_on}`} className="w-full rounded-xl object-cover" />
                ) : null}
                <p className="mt-1 text-center text-[11px] font-semibold text-[var(--text)]">
                  {formatDate(p.taken_on)}
                </p>
                {p.weight_kg != null ? (
                  <p className="text-center text-[10px] text-[var(--muted)]">{p.weight_kg} kg</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Timeline grid */}
      {loading ? (
        <p className="text-xs text-[var(--muted)]">Loading…</p>
      ) : photos.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <p className="text-sm font-semibold text-[var(--text)]">No photos yet</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Snap a front/side/back photo today, then again each week — the visual change is the best
            motivation there is.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos
            .slice()
            .reverse()
            .map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => (compareMode ? toggleSelect(p.id) : p.url ? setZoomUrl(p.url) : undefined)}
                  className="relative overflow-hidden rounded-xl"
                  style={{ aspectRatio: '3 / 4', background: 'var(--bg)' }}
                >
                  {p.url ? (
                    <img src={p.url} alt={`Progress ${p.taken_on}`} className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4">
                    <p className="text-[9px] font-bold text-white">{formatDate(p.taken_on)}</p>
                    {p.weight_kg != null ? (
                      <p className="text-[8px] text-white/80">{p.weight_kg} kg</p>
                    ) : null}
                  </div>
                  {compareMode ? (
                    <div
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                      style={
                        isSelected
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.8)' }
                      }
                    >
                      {isSelected ? <Check size={12} strokeWidth={3} /> : null}
                    </div>
                  ) : (
                    <div className="absolute right-1 top-1 flex gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation();
                          startEdit(p);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                        aria-label="Edit photo"
                      >
                        <Pencil size={11} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => {
                          e.stopPropagation();
                          void removePhoto(p);
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                        aria-label="Delete photo"
                      >
                        <Trash2 size={12} />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {compareMode && comparePair.length < 2 ? (
        <button
          type="button"
          onClick={() => {
            setCompareMode(false);
            setSelected([]);
          }}
          className="flex items-center justify-center gap-1 text-xs font-semibold text-[var(--muted)]"
        >
          <X size={13} /> Exit compare
        </button>
      ) : null}

      {/* Full-screen zoom (tap anywhere to close). Portalled to <body> so it
         escapes the animated (transformed) sheet and truly covers the screen. */}
      {zoomUrl
        ? createPortal(
            <button
              type="button"
              onClick={() => setZoomUrl(null)}
              aria-label="Close"
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
              style={{ animation: 'fadeIn 0.15s ease-out' }}
            >
              <img src={zoomUrl} alt="Progress enlarged" className="max-h-full max-w-full rounded-2xl object-contain" />
              <span className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                <X size={18} />
              </span>
            </button>,
            document.body,
          )
        : null}
    </div>
  );
}
