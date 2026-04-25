/**
 * SMS sending module using Twilio API
 * https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource
 */

const SENDER_ID = 'Wonderelo';

function getTwilioCredentials(): { accountSid: string; authToken: string } | null {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!accountSid || !authToken) {
    return null;
  }

  return { accountSid, authToken };
}

interface SendSmsParams {
  to: string;
  body: string;
  /** Optional URL for Twilio to POST delivery status updates. */
  statusCallback?: string;
  /**
   * If true, short-circuit to a fake success (no Twilio call). Used by load
   * tests. The Deno edge runtime is read-only-env so we can't toggle SMS_MOCK
   * via Deno.env.set; callers pass this flag explicitly instead.
   */
  mock?: boolean;
}

interface SendSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
  devMode?: boolean;
}

/**
 * Verify that a webhook request came from Twilio.
 * Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * 1. Concatenate full URL (incl. https://…) + sorted POST params.
 * 2. HMAC-SHA1 with TWILIO_AUTH_TOKEN.
 * 3. Base64 encode; compare to X-Twilio-Signature header.
 */
export async function verifyTwilioSignature(
  signatureHeader: string | null,
  fullUrl: string,
  params: Record<string, string>,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const creds = getTwilioCredentials();
  if (!creds) return false;

  const sortedKeys = Object.keys(params).sort();
  let data = fullUrl;
  for (const k of sortedKeys) data += k + params[k];

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(creds.authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signatureBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuf)));

  // Constant-time compare
  if (b64.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < b64.length; i++) diff |= b64.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  return diff === 0;
}

/**
 * Normalize phone number to E.164 format.
 * Handles common Slovak formats:
 *  - "0903 123 456" → "+421903123456"
 *  - "+421 903 123 456" → "+421903123456"
 *  - "421903123456" → "+421903123456"
 */
function normalizePhoneNumber(phone: string, countryPrefix = '+421'): string {
  // Strip spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // If starts with 0 (local format), prepend country prefix
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = countryPrefix + cleaned.slice(1);
  }

  // If doesn't start with +, prepend +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Send a single SMS via Twilio with retry on 429 (rate limit) and 5xx errors.
 *
 * - SMS_MOCK=1 short-circuits to a fake success (used by load tests so we don't
 *   spend Twilio credits during a 5000-recipient stress run).
 * - Retries up to 3 times with exponential backoff (200ms, 600ms, 1800ms) for
 *   429 / 5xx. 4xx other than 429 are permanent failures and not retried.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  // Test/load-test escape hatch: pretend we sent. Outbox + status callback
  // logic still runs as if it succeeded, so dedup/tracking is exercised.
  // Caller passes `mock: true` (Deno edge runtime is read-only env).
  if (params.mock) {
    return { success: true, sid: `mock-${Math.random().toString(36).slice(2, 12)}`, devMode: true };
  }

  const credentials = getTwilioCredentials();

  if (!credentials) {
    console.log('⚠️ Twilio credentials not set - SMS not sent');
    console.log('  To:', params.to);
    console.log('  Body:', params.body.substring(0, 50) + '...');
    return { success: false, error: 'Twilio credentials not configured', devMode: true };
  }

  const { accountSid, authToken } = credentials;
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const toNumber = normalizePhoneNumber(params.to);

  const MAX_ATTEMPTS = 3;
  let lastError = 'unknown';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: (() => {
          const p: Record<string, string> = { To: toNumber, From: SENDER_ID, Body: params.body };
          if (params.statusCallback) p.StatusCallback = params.statusCallback;
          return new URLSearchParams(p).toString();
        })(),
      });

      const data = await response.json();

      if (response.ok) {
        if (attempt > 1) console.log(`✅ SMS sent via Twilio (after ${attempt} attempts):`, data.sid);
        return { success: true, sid: data.sid };
      }

      const isRetriable = response.status === 429 || response.status >= 500;
      lastError = data.message || `Twilio error ${data.code} (status ${response.status})`;

      if (!isRetriable || attempt === MAX_ATTEMPTS) {
        if (response.status === 429) console.error(`⚠️ Twilio 429 rate limit (gave up after ${attempt} attempts):`, lastError);
        else console.error('❌ Twilio API error:', data);
        return { success: false, error: lastError };
      }

      // Exponential backoff: 200ms, 600ms (capped before 3rd attempt)
      const backoff = 200 * Math.pow(3, attempt - 1);
      console.log(`⏳ Twilio ${response.status} on attempt ${attempt}, retrying in ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === MAX_ATTEMPTS) {
        console.error('💥 SMS sending exception (gave up):', error);
        return { success: false, error: lastError };
      }
      const backoff = 200 * Math.pow(3, attempt - 1);
      await new Promise(r => setTimeout(r, backoff));
    }
  }

  return { success: false, error: lastError };
}

/**
 * Replace template variables in an SMS text.
 * Variables use {variableName} format.
 */
export function renderSmsTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
