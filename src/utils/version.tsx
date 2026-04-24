// App version + build metadata.
// GIT_HASH: short SHA of the commit that produced the build (auto).
// BUILD_TIME: injected at build time via vite.config.ts (see `define`).
// FULL_VERSION: human-readable combined string for admin badges/logs.
//
// APP_VERSION is kept for legacy/tracking; not shown in the badge anymore
// because manual bumping drifted from what was actually deployed.

declare const __APP_BUILD_TIME__: string;
declare const __GIT_HASH__: string;

export const APP_VERSION = '1.19.0';

export const GIT_HASH: string =
  typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';

// BUILD_TIME falls back to empty string in dev/test environments that don't define it
export const BUILD_TIME: string =
  typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : '';

/**
 * Formatted build time: YYMMDD-HHMM (UTC).
 * Example: 260420-1730
 * Short but still sortable chronologically.
 */
export function formatBuildTime(iso: string): string {
  if (!iso) return 'dev';
  try {
    const d = new Date(iso);
    const yy = String(d.getUTCFullYear()).slice(2);
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return `${yy}${mm}${dd}-${hh}${mi}`;
  } catch {
    return 'dev';
  }
}

export const FULL_VERSION = `${GIT_HASH} · ${formatBuildTime(BUILD_TIME)}`;
