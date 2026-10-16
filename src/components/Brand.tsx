import type { CSSProperties } from "react";

export function BrandMark({ size = 38, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={style}>
      <path d="M5 5 23 38 42 5 31 10 23 25 16 13 5 5Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="miter" />
      <path d="M21 10 38 18 30 22 41 30 24 43 14 27" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="miter" />
      <path d="m21 10 8 10-7 4" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}