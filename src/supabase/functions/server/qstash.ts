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
  // Destination URL goes in the path, NOT URL-encoded (QStash parses it raw).
  // URL-encoding confuses QStash's scheme detection ('https%3A...' → invalid scheme).
  const url = `${QSTASH_URL}/v2/publish/${opts.destinationUrl}`;

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
 * Verify that an incoming webhook request came from QStash using Upstash's
 * official SDK. This is the reliable, supported path — my original hand-rolled
 * JWT verification was rejecting valid requests and sending every delivery
 * into retry/DLQ.
 *
 * We check against both CURRENT and NEXT signing keys so key rotation doesn't
 * break us.
 */
export async function verifyQStashSignature(
  signatureHeader: string | null,
  body: string,
  url: string,
): Promise<{ valid: boolean; reason?: string }> {
  if (!signatureHeader) return { valid: false, reason: 'missing signature header' };
  const currentKey = Deno.env.get('QSTASH_CURRENT_SIGNING_KEY') || '';
  const nextKey = Deno.env.get('QSTASH_NEXT_SIGNING_KEY') || '';
  if (!currentKey && !nextKey) return { valid: false, reason: 'no signing keys configured' };

  try {
    const { Receiver } = await import('npm:@upstash/qstash@2');
    const receiver = new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey });
    // Receiver.verify throws on mismatch, returns true on valid.
    await receiver.verify({ signature: signatureHeader, body, url });
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
