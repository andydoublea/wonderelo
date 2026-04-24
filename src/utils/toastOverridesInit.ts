/**
 * One-shot bootstrap that pulls the admin-edited override map from the server
 * and hands it to the toastOverrides runtime. Failures are swallowed — if the
 * backend is unreachable, users simply see the original (source-default) text.
 */

import { apiBaseUrl, publicAnonKey } from './supabase/info';
import { setToastOverrides } from './toastOverrides';

export async function initToastOverrides(): Promise<void> {
  try {
    const res = await fetch(`${apiBaseUrl}/public/toast-overrides`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.overrides && typeof data.overrides === 'object') {
      setToastOverrides(data.overrides);
    }
  } catch {
    /* best-effort; no-op on network / CORS errors */
  }
}
