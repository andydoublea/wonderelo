/**
 * Email sending module using Resend API
 * https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

// When domain is not verified, Resend only allows sending from onboarding@resend.dev
// and only delivers to the account owner's email. Good enough for dev.
const FROM_EMAIL_DEV = 'Wonderelo <onboarding@resend.dev>';
const FROM_EMAIL_PROD = 'Wonderelo <noreply@wonderelo.com>';

function getFromEmail(): string {
  // Check if oliwonder.com domain is verified by checking env var
  const useProductionEmail = Deno.env.get('RESEND_USE_PRODUCTION_EMAIL') === 'true';
  return useProductionEmail ? FROM_EMAIL_PROD : FROM_EMAIL_DEV;
}

function getResendApiKey(): string | null {
  return Deno.env.get('RESEND_API_KEY') || null;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  devMode?: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    console.log('⚠️ RESEND_API_KEY not set - email not sent');
    console.log('  To:', params.to);
    console.log('  Subject:', params.subject);
    return { success: false, error: 'RESEND_API_KEY not configured', devMode: true };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('✅ Email sent via Resend:', data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('💥 Email sending exception:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Generate registration confirmation email HTML
 */
export function buildRegistrationEmail(params: {
  firstName: string;
  lastName: string;
  eventName: string;
  myRoundsUrl: string;
  eventUrl: string;
  sessions?: any[];
}): { subject: string; html: string } {
  const { firstName, lastName, eventName, myRoundsUrl, eventUrl, sessions } = params;

  const sessionsList = sessions && sessions.length > 0
    ? sessions.map(s => {
        const rounds = s.rounds?.map((r: any) => `${r.roundName || r.startTime}`).join(', ') || '';
        return `<li><strong>${s.sessionName || 'Round'}</strong>${rounds ? ` – ${rounds}` : ''}</li>`;
      }).join('')
    : '<li>Your selected rounds</li>';

  const subject = `You're registered for ${eventName || 'the networking event'}!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px 0;">You're in! 🎉</h1>
    <p style="color: #666; margin: 0 0 24px 0;">Hi ${firstName}, your registration is confirmed.</p>

    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-weight: 600;">${eventName || 'Networking Event'}</p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555;">
        ${sessionsList}
      </ul>
    </div>

    <p style="margin: 0 0 16px 0;">Access your personal dashboard anytime:</p>

    <a href="${myRoundsUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">My Rounds Dashboard</a>

    <p style="margin: 24px 0 0 0; color: #888; font-size: 13px;">
      Bookmark this link – it's your personal access to the event.<br>
      Event page: <a href="${eventUrl}" style="color: #666;">${eventUrl}</a>
    </p>
  </div>

  <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">
    Sent by Wonderelo · Networking made simple
  </p>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generate magic link email HTML
 */
export function buildMagicLinkEmail(params: {
  firstName?: string;
  magicLink: string;
  eventName?: string;
}): { subject: string; html: string } {
  const { firstName, magicLink, eventName } = params;
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';

  const subject = `Your access link for ${eventName || 'the networking event'}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px 0;">Your access link 🔗</h1>
    <p style="color: #666; margin: 0 0 24px 0;">${greeting}, here's your link to access the event.</p>

    <a href="${magicLink}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Open My Dashboard</a>

    <p style="margin: 24px 0 0 0; color: #888; font-size: 13px;">
      Or copy this link: <a href="${magicLink}" style="color: #666; word-break: break-all;">${magicLink}</a>
    </p>

    <p style="margin: 16px 0 0 0; color: #aaa; font-size: 12px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
  </div>

  <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">
    Sent by Wonderelo · Networking made simple
  </p>
</body>
</html>`;

  return { subject, html };
}
