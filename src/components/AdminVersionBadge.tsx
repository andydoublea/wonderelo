import { FULL_VERSION } from '../utils/version';

interface AdminVersionBadgeProps {
  /** Whether the current user is an admin. When false, nothing is rendered. */
  visible: boolean;
}

/**
 * Fixed-position version badge, shown only when the current user is an admin.
 * Makes it easy to verify that a deployed version is live on every page.
 */
export function AdminVersionBadge({ visible }: AdminVersionBadgeProps) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-2 right-2 z-[60] pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="pointer-events-auto bg-foreground/85 text-background text-[10px] font-mono px-2 py-1 rounded shadow-sm backdrop-blur-sm">
        {FULL_VERSION}
      </div>
    </div>
  );
}
