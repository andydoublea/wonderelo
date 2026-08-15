/* Wonderelo — geometric identity badge (Claude Design `.pm-geoid`).
   Colour + shape are derived DETERMINISTICALLY from the number, so both
   participants render the same visual for the same identification number. */
import type { CSSProperties, ReactElement } from 'react';

const PALETTE: [string, string][] = [
  ['#1f9d57', '#0d9488'], ['#e8541c', '#db2777'], ['#2563d6', '#7c2db5'],
  ['#7c2db5', '#db2777'], ['#0d9488', '#2563d6'], ['#db2777', '#e8541c'],
  ['#ca8a04', '#d62828'], ['#2563d6', '#1f9d57'],
];

const SHAPES: ReactElement[] = [
  <rect x="24" y="24" width="52" height="52" rx="9" fill="rgba(255,255,255,.24)" />,
  <polygon points="50,16 80,33 80,67 50,84 20,67 20,33" fill="rgba(255,255,255,.26)" />,
  <circle cx="50" cy="50" r="28" fill="rgba(255,255,255,.26)" />,
  <polygon points="50,18 82,50 50,82 18,50" fill="rgba(255,255,255,.26)" />,
  <polygon points="50,16 61,40 88,40 66,57 75,84 50,67 25,84 34,57 12,40 39,40" fill="rgba(255,255,255,.26)" />,
  <polygon points="40,20 60,20 60,40 80,40 80,60 60,60 60,80 40,80 40,60 20,60 20,40 40,40" fill="rgba(255,255,255,.26)" />,
  <polygon points="50,16 84,41 71,82 29,82 16,41" fill="rgba(255,255,255,.26)" />,
];

export function Geoid({ num, size = 'lg' }: { num: number | string; size?: 'lg' | 'sm' }) {
  const n = Math.abs(Number(num)) || 0;
  const [c1, c2] = PALETTE[n % PALETTE.length];
  const shape = SHAPES[(n * 3 + 1) % SHAPES.length];
  const style = { ['--gic']: c1, ['--gic2']: c2 } as CSSProperties;
  return (
    <span className={`pm-geoid is-${size}`} style={style}>
      <span className="gloss" />
      <svg className="deco" viewBox="0 0 100 100">{shape}</svg>
      <span className="num">{String(num).padStart(2, '0')}</span>
    </span>
  );
}
