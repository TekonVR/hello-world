/** Shared pieces. Plain elements and one stylesheet: no component library. */

import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Dim({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`dim ${className}`}>{children}</p>;
}

export function Button({
  label,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'link' | 'quiet' | 'warn';
  type?: 'button' | 'submit';
}) {
  const className =
    variant === 'primary'
      ? 'btn'
      : variant === 'warn'
        ? 'btn btn--quiet btn--warn'
        : `btn btn--${variant}`;
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="chip" aria-pressed={Boolean(selected)} onClick={onClick}>
      {label}
    </button>
  );
}

export function Tag({ label, accent }: { label: string; accent?: boolean }) {
  return <span className={`tag ${accent ? 'tag--accent' : ''}`}>{label}</span>;
}

export function Track({ fraction, thin }: { fraction: number; thin?: boolean }) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div
      className={`track ${thin ? 'track--thin' : ''}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}
