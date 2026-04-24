import { FULL_VERSION } from '../utils/version';

interface AdminVersionBadgeProps {
  /** Whether the current user is an admin. When false, nothing is rendered. */
  visible: boolean;
}

/**
 * Fixed-position version badge, shown only when the current user is an admin.
 * Makes it easy to verify that a deployed version is live on every page.
 *
 * Uses inline styles for colors because the pre-compiled Tailwind in this repo
 * doesn't include `bg-foreground/85` / `text-background` utilities.
 */
export function AdminVersionBadge({ visible }: AdminVersionBadgeProps) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        zIndex: 60,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'rgba(13, 43, 26, 0.92)',
          color: '#fffdf7',
          fontSize: '10px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          padding: '3px 8px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.15)',
          letterSpacing: '0.02em',
        }}
      >
        {FULL_VERSION}
      </div>
    </div>
  );
}
