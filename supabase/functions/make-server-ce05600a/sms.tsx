/**
 * SMS sending module using Twilio API
 * https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource
 */

function getTwilioCredentials(): { accountSid: string; authToken: string; messagingServiceSid: string } | null {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

  if (!accountSid || !authToken || !messagingServiceSid) {
    return null;
  }

  return { accountSid, authToken, messagingServiceSid };
}

interface SendSmsParams {
  to: string;
  body: string;
}

interface SendSmsResult {
  success: boolean;
  sid?: string;
  error?: string;
  devMode?: boolean;
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

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const credentials = getTwilioCredentials();

  if (!credentials) {
    console.log('⚠️ Twilio credentials not set - SMS not sent');
    console.log('  To:', params.to);
    console.log('  Body:', params.body.substring(0, 50) + '...');
    return { success: false, error: 'Twilio credentials not configured', devMode: true };
  }

  const { accountSid, authToken, messagingServiceSid } = credentials;
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Normalize the phone number
  const toNumber = normalizePhoneNumber(params.to);

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toNumber,
        MessagingServiceSid: messagingServiceSid,
        Body: params.body,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Twilio API error:', data);
      return { success: false, error: data.message || `Twilio error ${data.code}` };
    }

    console.log('✅ SMS sent via Twilio:', data.sid);
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error('💥 SMS sending exception:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
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
