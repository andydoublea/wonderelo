// App version + build metadata.
// APP_VERSION: bump this manually with each meaningful release (semver).
// BUILD_TIME: injected at build time via vite.config.ts (see `define`).
// FULL_VERSION: human-readable combined string for admin badges/logs.

declare const __APP_BUILD_TIME__: string;

export const APP_VERSION = '1.18.1';

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

export const FULL_VERSION = `v${APP_VERSION} · ${formatBuildTime(BUILD_TIME)}`;
