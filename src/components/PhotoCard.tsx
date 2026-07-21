import { useState, type ReactNode } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  children?: ReactNode;
};

export function PhotoCard({ src, alt, className = '', children }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`photo-card ${className}`}
      style={
        failed
          ? { background: 'linear-gradient(160deg, var(--accent), var(--accent-dark))' }
          : undefined
      }
    >
      {!failed && <img src={src} alt={alt} onError={() => setFailed(true)} />}
      {children}
    </div>
  );
}
