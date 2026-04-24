/**
 * Toast override runtime.
 *
 * Monkey-patches sonner's `toast.*` methods at import time so that every
 * toast call gets its message text looked up in an override map before
 * being shown. Overrides are keyed by the ORIGINAL message text — this is
 * what the scanner extracts and what gets stored/edited in the admin panel.
 *
 * Why patch at module scope? Because `toast` is imported directly from
 * `sonner@2.0.3` by ~44 files, and Vite dedupes that import to a single
 * module instance. Mutating the methods on that shared instance affects
 * every caller transparently — no refactor of 300+ call sites required.
 *
 * Two storage layers:
 *   - Session overrides: what the server returned on this page load
 *   - Draft overrides: admin edits in-flight (preview without saving)
 *
 * Draft always wins over session.
 */

import { toast } from 'sonner@2.0.3';

let sessionOverrides: Record<string, string> = {};
let draftOverrides: Record<string, string> = {};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

/** Subscribe to override changes. Returns an unsubscribe fn. */
export function subscribeToastOverrides(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Replace the server-backed overrides (called once at app boot and after admin save). */
export function setToastOverrides(overrides: Record<string, string>): void {
  sessionOverrides = overrides || {};
  notify();
}

/** Set a single draft override (admin live preview). Pass '' to clear. */
export function setDraftOverride(originalText: string, overrideText: string): void {
  if (overrideText === '' || overrideText === originalText) {
    delete draftOverrides[originalText];
  } else {
    draftOverrides[originalText] = overrideText;
  }
  notify();
}

/** Clear all in-flight drafts (e.g. after admin saves or cancels). */
export function clearDraftOverrides(): void {
  draftOverrides = {};
  notify();
}

/** Read-only snapshot of active overrides (draft merged over session). */
export function getActiveOverrides(): Record<string, string> {
  return { ...sessionOverrides, ...draftOverrides };
}

/** The text that would actually be displayed right now for a given original. */
export function resolveText(original: string): string {
  return draftOverrides[original] ?? sessionOverrides[original] ?? original;
}

// ---- Monkey-patch sonner's toast methods ----
//
// Each wrapper: if the first arg is a string AND we have an override for it,
// swap in the override; otherwise pass through untouched. Non-string first args
// (React nodes, JSX) are never rewritten.

function applyOverride(arg: unknown): unknown {
  if (typeof arg !== 'string') return arg;
  return resolveText(arg);
}

type AnyFn = (...args: unknown[]) => unknown;

function wrap<F extends AnyFn>(original: F): F {
  return function patched(this: unknown, msg: unknown, ...rest: unknown[]) {
    return (original as AnyFn).call(this, applyOverride(msg), ...rest);
  } as unknown as F;
}

// Preserve originals (idempotent — guards against HMR double-patch)
const patchedMarker = '__wondereloOverridesPatched';
const t = toast as unknown as Record<string, unknown> & { [patchedMarker]?: boolean };

if (!t[patchedMarker]) {
  for (const key of ['success', 'error', 'info', 'warning', 'message', 'loading'] as const) {
    const orig = t[key];
    if (typeof orig === 'function') {
      t[key] = wrap(orig as AnyFn);
    }
  }
  t[patchedMarker] = true;
}
