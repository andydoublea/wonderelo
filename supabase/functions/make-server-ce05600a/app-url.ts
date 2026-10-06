// Resolves the frontend base URL used in links we email or redirect to.
//
// A client-supplied URL (request body, Origin/Referer header) is only trusted
// when its origin is on the allowlist. Otherwise anyone could request a magic
// link for a victim's email and have the real Wonderelo email point to their
// own site, capturing the victim's access token when they click it.

const ALLOWED_HOSTS = new Set([
  'wonderelo.com',
  'www.wonderelo.com',
  'staging.wonderelo.com',
]);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function defaultAppUrl(): string {
  return (Deno.env.get('APP_URL') || 'https://wonderelo.com').replace(/\/$/, '');
}

export function resolveAppUrl(candidate?: string | null): string {
  const fallback = defaultAppUrl();
  if (!candidate) return fallback;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return fallback;
  }

  if (url.origin === new URL(fallback).origin) return url.origin;
  if (url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname)) return url.origin;
  if (LOCAL_HOSTS.has(url.hostname)) return url.origin;

  console.warn('⚠️ Ignoring untrusted app URL:', url.origin);
  return fallback;
}
