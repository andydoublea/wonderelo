/**
 * QStash client wrapper.
 *
 * QStash is our external scheduler. We publish one message per (round × kind)
 * with a `Upstash-Not-Before` header = target send time. When that time hits,
 * QStash POSTs to our edge function which does the fan-out Twilio call for
 * all eligible participants in that round.
 *
 * Docs: https://upstash.com/docs/qstash
 */

const QSTASH_URL = Deno.env.get('QSTASH_URL') || 'https://qstash-eu-central-1.upstash.io';
const QSTASH_TOKEN = Deno.env.get('QSTASH_TOKEN') || '';

export interface ScheduleOptions {
  /** Destination URL that QStash will POST to when the schedule fires. */
  destinationUrl: string;
  /** JSON body forwarded to the destination. */
  body: Record<string, unknown>;
  /** Absolute time at which the message should be delivered. */
  notBefore: Date;
  /** Stable dedupe ID so re-enqueue of the same (kind,round) is a no-op. */
  deduplicationId: string;
  /** How many times QStash retries our endpoint if it returns 5xx. */
  retries?: number;
}

export interface ScheduleResult {
  ok: boolean;
  messageId?: string;
  status: number;
  error?: string;
}

/**
 * Schedule a QStash delivery. Returns { ok, messageId } on success.
 * Uses Upstash-Deduplication-Id to prevent duplicate schedules.
 */
export async function scheduleQStashDelivery(opts: ScheduleOptions): Promise<ScheduleResult> {
  if (!QSTASH_TOKEN) return { ok: false, status: 0, error: 'QSTASH_TOKEN not configured' };

  const retries = opts.retries ?? 3;
  const notBeforeSec = Math.floor(opts.notBefore.getTime() / 1000);

  // POST https://qstash-eu-central-1.upstash.io/v2/publish/{destination-url}
  // Destination URL goes in the path, URL-encoded.
  const url = `${QSTASH_URL}/v2/publish/${encodeURIComponent(opts.destinationUrl)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Not-Before': String(notBeforeSec),
        'Upstash-Deduplication-Id': opts.deduplicationId,
        'Upstash-Retries': String(retries),
        // Tell QStash to include signature header so we can verify on receipt.
        'Upstash-Forward-X-Wonderelo-Schedule-Id': opts.deduplicationId,
      },
      body: JSON.stringify(opts.body),
    });

    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, error: text.slice(0, 500) };
    }

    // QStash returns { messageId, url } on success.
    let messageId: string | undefined;
    try {
      const parsed = JSON.parse(text);
      messageId = parsed.messageId || parsed.message_id;
    } catch { /* ignore non-JSON */ }

    return { ok: true, status: res.status, messageId };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Cancel a previously-scheduled QStash message. Idempotent — returns ok:true
 * even if the message doesn't exist (already delivered, never existed, etc).
 */
export async function cancelQStashDelivery(messageId: string): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!QSTASH_TOKEN) return { ok: false, status: 0, error: 'QSTASH_TOKEN not configured' };
  if (!messageId) return { ok: true, status: 0 }; // nothing to cancel

  try {
    const res = await fetch(`${QSTASH_URL}/v2/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` },
    });
    // 404 = already delivered / never existed — treat as success for idempotency.
    if (res.ok || res.status === 404) {
      return { ok: true, status: res.status };
    }
    const text = await res.text();
    return { ok: false, status: res.status, error: text.slice(0, 500) };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Verify that an incoming webhook request came from QStash.
 * Prevents an unauthenticated caller from triggering our dispatch endpoint
 * and blasting SMS to everyone.
 *
 * QStash signs requests with JWT (HS256) using the signing key. Header is
 * `Upstash-Signature`. Payload contains the SHA-256 of the body + URL.
 *
 * We check against both CURRENT and NEXT signing keys so key rotation doesn't
 * break us (Upstash recommends this).
 */
export async function verifyQStashSignature(
  signatureHeader: string | null,
  body: string,
  url: string,
): Promise<{ valid: boolean; reason?: string }> {
  if (!signatureHeader) return { valid: false, reason: 'missing signature header' };
  const currentKey = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') || '';
  const nextKey = Deno.env.get('QSTASH_NEXT_SIGNING_KEY') || '';
  if (!currentKey && !nextKey) {
    return { valid: false, reason: 'no signing keys configured' };
  }

  const tryVerify = async (key: string): Promise<boolean> => {
    if (!key) return false;
    try {
      // JWT: base64url(header).base64url(payload).base64url(signature)
      const parts = signatureHeader.split('.');
      if (parts.length !== 3) return false;
      const [headerB64, payloadB64, signatureB64] = parts;
      const signingInput = `${headerB64}.${payloadB64}`;

      // Verify HMAC-SHA256
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      );
      const sigBytes = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const macValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, encoder.encode(signingInput));
      if (!macValid) return false;

      // Decode payload to check url + body hash + exp
      const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);

      // url match
      if (payload.sub && payload.sub !== url) {
        // Allow scheme differences (http vs https) — compare host+path
        try {
          const a = new URL(payload.sub);
          const b = new URL(url);
          if (a.host !== b.host || a.pathname !== b.pathname) return false;
        } catch { return false; }
      }

      // body hash match
      if (payload.body) {
        const bodyHashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(body));
        const bodyHashB64 = btoa(String.fromCharCode(...new Uint8Array(bodyHashBuf)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        if (payload.body !== bodyHashB64) return false;
      }

      // exp check (QStash tokens have short TTL)
      if (payload.exp && typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp + 60) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  if (await tryVerify(currentKey)) return { valid: true };
  if (await tryVerify(nextKey)) return { valid: true };
  return { valid: false, reason: 'signature mismatch (both current and next keys)' };
}
