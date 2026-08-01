import { useState } from 'react';
import { HERO_IMAGE } from '../data/gymImagery';

// Premium photo hero for Home: a full-bleed gym image under a dark scrim + a
// blue energy glow, with a personal greeting. The image is best-effort — if it
// fails the gradient carries the look on its own.
export function HomeHero({ name }: { name: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  const first = (name?.trim().split(/\s+/)[0] ?? '').trim();

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: 'var(--radius-card)', height: 176 }}
    >
      {/* Base gradient always present */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0b1830, #060912)' }}
      />
      {!failed ? (
        <img
          src={HERO_IMAGE}
          alt=""
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.55 }}
        />
      ) : null}
      {/* Blue energy glow + readability scrim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 80% at 85% 0%, rgba(61,123,255,0.5), transparent 60%), linear-gradient(to top, rgba(4,7,16,0.92), rgba(4,7,16,0.15) 65%)',
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          {first ? `Hi ${first}` : 'Welcome back'}
        </p>
        <p className="mt-1 text-2xl font-black leading-tight text-white">
          A stronger,
          <br />
          healthier you
        </p>
      </div>
    </div>
  );
}
