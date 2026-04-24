import { useState } from 'react';
import { FULL_VERSION } from '../utils/version';

interface AdminVersionBadgeProps {
  /** Whether the current user is an admin. When false, nothing is rendered. */
  visible: boolean;
}

/**
 * Fixed-position version badge, shown only when the current user is an admin.
 * Makes it easy to verify that a deployed version is live on every page.
 * Click to copy the full version string to the clipboard.
 *
 * Uses inline styles for colors because the pre-compiled Tailwind in this repo
 * doesn't include `bg-foreground/85` / `text-background` utilities.
 */
export function AdminVersionBadge({ visible }: AdminVersionBadgeProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FULL_VERSION);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API can fail on insecure origins or if denied — stay silent.
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <button
        type="button"
        onClick={handleCopy}
        title="Click to copy version"
        aria-label={`Copy version ${FULL_VERSION} to clipboard`}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          border: 'none',
          backgroundColor: 'rgba(13, 43, 26, 0.92)',
          color: '#fffdf7',
          fontSize: '10px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          padding: '3px 8px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.15)',
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}
      >
        {copied ? 'Copied!' : FULL_VERSION}
      </button>
    </div>
  );
}
