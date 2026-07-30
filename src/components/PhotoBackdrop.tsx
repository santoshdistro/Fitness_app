import { useState } from 'react';

type Props = {
  /** Photo URL, layered over the gradient. If it fails, only the gradient shows. */
  src?: string;
  /** CSS gradient string used as the always-visible base + text scrim. */
  gradient: string;
  /** How strongly the photo shows through (0–1). */
  photoOpacity?: number;
  className?: string;
};

/**
 * A decorative backdrop: a solid gradient with an optional stock photo blended
 * on top and a scrim for text legibility. The photo is best-effort — on error
 * it's removed and the gradient stands on its own, so the UI never breaks.
 */
export function PhotoBackdrop({ src, gradient, photoOpacity = 0.55, className }: Props) {
  const [failed, setFailed] = useState(false);
  const showPhoto = src && !failed;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ''}`} aria-hidden="true">
      {/* Base gradient — always present */}
      <div className="absolute inset-0" style={{ background: gradient }} />
      {/* Photo overlay */}
      {showPhoto ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: photoOpacity, mixBlendMode: 'overlay' }}
        />
      ) : null}
      {/* Scrim for readable text at the bottom */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(15,15,35,0.65), rgba(15,15,35,0.05) 60%)' }}
      />
    </div>
  );
}
