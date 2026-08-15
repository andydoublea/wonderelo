/* Wonderelo — shared async-state primitives (Claude Design v07 "System States").

   Ported 1:1 from design/v07/project/pages/System States.html (the canonical
   `.ss-center .glyph` / `.ss-sk` pattern) plus the per-screen panels in
   Participant Dashboard.html (`.pd-statewrap`) and Event Page.html (`.ev-pagestate`).

   Two brand-styled building blocks that every loading / error / empty / 404 /
   offline state composes from — NOT shadcn:

     <StatePlaceholder>  centred error/empty/not-found column
     <Skeleton>          shimmer block (compose screen-shaped skeletons)

   Everything is inline-styled off the brand `C` tokens (same approach as
   organizerAtoms.tsx) so the components are self-contained and don't depend on
   any stylesheet class existing. Keyframes (which can't be inline) are injected
   once into <head>.

   Stable public API (the matching-flow screens import these):
     StatePlaceholder({ variant, glyph, eyebrow, title, body, actions, errorId, glyphSize })
     Skeleton({ width, height, radius, style })
   Helpers: SkeletonRow, Spinner, StateButton, RefreshIcon. */
import React from 'react';
import { C, Italic } from './organizerAtoms';

/* Re-export Italic so callers composing a StatePlaceholder title can reach the
   serif-orange accent from one import. */
export { Italic };

/* ── One-time keyframe + reduced-motion injection ────────────────────────── */
const ANIM_ID = 'wonderelo-state-anim';
const ANIM_CSS = `
@keyframes wStateSheen { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
@keyframes wStateSpin { to { transform: rotate(360deg); } }
@keyframes wBootBob { 0%,100% { transform: rotate(45deg) translateY(0); } 50% { transform: rotate(45deg) translateY(-7px); } }
@keyframes wBootSlide { 0% { transform: translateX(-110%); } 100% { transform: translateX(360%); } }
@keyframes wBootRoute { 0% { width: 6%; } 70% { width: 78%; } 100% { width: 94%; opacity: .4; } }
@media (prefers-reduced-motion: reduce) {
  .w-state-sk, .w-state-spin, .w-boot-bob, .w-boot-slide, .w-boot-route { animation: none !important; }
}`;
if (typeof document !== 'undefined' && !document.getElementById(ANIM_ID)) {
  const el = document.createElement('style');
  el.id = ANIM_ID;
  el.textContent = ANIM_CSS;
  document.head.appendChild(el);
}

/* ── Skeleton primitive ──────────────────────────────────────────────────── */
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

/* Shimmer block — 1.4s sheen, matching `.pd-sk` / `.ev-sk` in the mocks. */
export const Skeleton = ({ width, height = 12, radius = 12, style = {}, className = '' }: SkeletonProps) => (
  <span
    className={`w-state-sk ${className}`.trim()}
    style={{
      display: 'block',
      width: width ?? '100%',
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(76,25,77,.07) 25%, rgba(76,25,77,.13) 37%, rgba(76,25,77,.07) 63%)',
      backgroundSize: '400% 100%',
      animation: 'wStateSheen 1.4s ease infinite',
      ...style,
    }}
  />
);

/* A single skeleton list row — 42px dot + two stacked lines. Mirrors
   `.pd-sk-rowcard` / `.ev-sk-row`; callers stack N of these under a hero. */
export const SkeletonRow = ({ style = {} }: { style?: React.CSSProperties }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 16,
      border: `1px solid ${C.hair}`, borderRadius: 16, background: C.paper,
      ...style,
    }}
  >
    <Skeleton width={42} height={42} radius="50%" style={{ flex: 'none' }} />
    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="64%" height={13} />
      <Skeleton width="42%" height={11} />
    </span>
  </div>
);

/* Small 16px orange-tipped spinner for loading labels (never used alone as a
   full-page fallback — always paired with a skeleton + label). */
export const Spinner = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <span
    className="w-state-spin"
    style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(76,25,77,.16)', borderTopColor: C.orange,
      animation: 'wStateSpin .8s linear infinite', flex: 'none',
      ...style,
    }}
  />
);

/* ── BootSplash — full-page app boot / route-suspense fallback ────────────── */
/* Ported 1:1 from design/v07/project/pages/System States.html panel 08
   ("App boot & route change" → AuthProvider / route suspense fallback):
   three bobbing brand diamonds, the wordmark, a sliding progress bar, and a
   thin route-progress bar pinned to the top edge. This is the branded splash
   that replaces a bare spinner while the app / a lazy route boots.
   NOTE: the consumer (AppRouter's Suspense `RouteLoader`) lives outside this
   file — swap that fallback to <BootSplash /> to adopt the v07 design. */
export interface BootSplashProps {
  /* Caption under the progress bar. */
  caption?: React.ReactNode;
  /* Full-viewport height (default). Set false to fill the parent instead. */
  fullPage?: boolean;
  style?: React.CSSProperties;
}

export const BootSplash = ({ caption = 'Getting your rounds ready…', fullPage = true, style = {} }: BootSplashProps) => {
  const diamond: React.CSSProperties = {
    width: 13, height: 13, transform: 'rotate(45deg)',
    animation: 'wBootBob 1.1s ease-in-out infinite',
  };
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.cream, minHeight: fullPage ? '100vh' : '100%', padding: 40,
        ...style,
      }}
    >
      {/* thin route-progress bar pinned to the top edge */}
      <span
        className="w-boot-route"
        style={{
          position: 'absolute', left: 0, top: 0, height: 3, width: '46%',
          background: C.orange, animation: 'wBootRoute 1.6s ease-in-out infinite',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 26 }}>
          <span className="w-boot-bob" style={{ ...diamond, background: C.orange }} />
          <span className="w-boot-bob" style={{ ...diamond, background: C.purpleDeep, animationDelay: '.13s' }} />
          <span className="w-boot-bob" style={{ ...diamond, background: C.orange, animationDelay: '.26s', opacity: 0.6 }} />
        </span>
        <div style={{ marginTop: 20, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: C.purpleDeep }}>
          wonderelo
        </div>
        <div style={{ margin: '20px auto 0', width: 200, height: 3, borderRadius: 3, background: 'rgba(76,25,77,.10)', overflow: 'hidden' }}>
          <span className="w-boot-slide" style={{ display: 'block', height: '100%', width: '40%', borderRadius: 3, background: C.orange, animation: 'wBootSlide 1.3s ease-in-out infinite' }} />
        </div>
        {caption != null && (
          <div style={{ marginTop: 14, fontFamily: C.fontMono, fontSize: 11.5, letterSpacing: '.04em', color: C.ink, opacity: 0.55 }}>
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

/* Refresh (retry) icon used by the default primary "Try again" action. */
export const RefreshIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

/* ── State action button (primary / ghost), full-width stacked ───────────── */
export interface StateButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'ghost';
  leadingIcon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export const StateButton = ({ children, variant = 'primary', leadingIcon, onClick, href, type = 'button', style = {} }: StateButtonProps) => {
  const base: React.CSSProperties = {
    width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    padding: '15px 20px', borderRadius: 14, cursor: 'pointer', textDecoration: 'none',
    fontFamily: C.fontBody, fontSize: 15, fontWeight: 700, border: '1.5px solid transparent',
    boxSizing: 'border-box',
    transition: 'background .15s, color .15s, border-color .15s',
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: C.orange, color: '#fff', boxShadow: '0 8px 20px rgba(221,83,28,.26)' },
    ghost: { background: 'transparent', color: C.purpleDeep, borderColor: C.hairStrong },
  };
  const css = { ...base, ...variants[variant], ...style };
  const inner = <>{leadingIcon}{children}</>;
  return href
    ? <a href={href} style={css} onClick={onClick}>{inner}</a>
    : <button type={type} style={css} onClick={onClick}>{inner}</button>;
};

/* ── StatePlaceholder — centred error / empty / not-found column ──────────── */
export interface StatePlaceholderProps {
  variant?: 'default' | 'error';
  glyph?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  body?: React.ReactNode;
  actions?: React.ReactNode;
  errorId?: string;
  glyphSize?: number;
  style?: React.CSSProperties;
}

export const StatePlaceholder = ({
  variant = 'default',
  glyph,
  eyebrow,
  title,
  body,
  actions,
  errorId,
  glyphSize = 76,
  style = {},
}: StatePlaceholderProps) => {
  const isError = variant === 'error';
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '30px 20px 20px', ...style,
      }}
    >
      {glyph != null && (
        <span
          style={{
            width: glyphSize, height: glyphSize, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 22,
            background: isError ? 'rgba(192,57,43,.08)' : C.cream,
            border: `1px solid ${isError ? 'rgba(192,57,43,.25)' : C.hairStrong}`,
            color: isError ? '#c0392b' : C.purpleDeep,
          }}
        >
          {glyph}
        </span>
      )}
      {eyebrow != null && (
        <span
          style={{
            fontFamily: C.fontMono, fontSize: 11, fontWeight: 700,
            letterSpacing: '.18em', textTransform: 'uppercase', color: C.purple, opacity: 0.75,
          }}
        >
          {eyebrow}
        </span>
      )}
      {title != null && (
        <h2
          style={{
            margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800,
            fontSize: 28, lineHeight: 1.1, letterSpacing: '-.03em', color: C.purpleDeep,
          }}
        >
          {title}
        </h2>
      )}
      {body != null && (
        <p
          style={{
            margin: '12px 0 0', maxWidth: 320, fontSize: 14.5, lineHeight: 1.55,
            color: C.ink, opacity: 0.72, textWrap: 'pretty',
          } as React.CSSProperties}
        >
          {body}
        </p>
      )}
      {actions != null && (
        <div
          style={{
            marginTop: 26, display: 'flex', flexDirection: 'column', gap: 10,
            width: '100%', maxWidth: 320,
          }}
        >
          {actions}
        </div>
      )}
      {errorId != null && (
        <div
          style={{
            marginTop: 20, fontFamily: C.fontMono, fontSize: 10.5,
            letterSpacing: '.08em', color: C.ink, opacity: 0.4,
          }}
        >
          {errorId}
        </div>
      )}
    </div>
  );
};
