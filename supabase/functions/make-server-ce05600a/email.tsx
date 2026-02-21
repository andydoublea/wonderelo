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
  // Check if wonderelo.com domain is verified by checking env var
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

/**
 * Generate lead magnet ebook delivery email HTML
 */
/**
 * Generate welcome email for new organizer after registration
 */
export function buildWelcomeEmail(params: {
  firstName: string;
  dashboardUrl: string;
  eventPageUrl?: string;
}): { subject: string; html: string } {
  const { firstName, dashboardUrl, eventPageUrl } = params;

  const subject = 'Welcome to Wonderelo! 🎉 Let\'s set up your first event';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px 0;">Welcome aboard, ${firstName}! 🎉</h1>
    <p style="color: #666; margin: 0 0 24px 0;">Your Wonderelo account is ready. Here's how to get started in 3 simple steps.</p>

    <div style="margin-bottom: 24px;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
        <div style="min-width: 28px; height: 28px; background: #1a1a1a; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-right: 12px;">1</div>
        <div>
          <p style="margin: 0; font-weight: 600;">Create your first networking round</p>
          <p style="margin: 4px 0 0 0; color: #555; font-size: 14px;">Set the date, time, duration, and number of rounds. It takes less than 2 minutes.</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
        <div style="min-width: 28px; height: 28px; background: #1a1a1a; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-right: 12px;">2</div>
        <div>
          <p style="margin: 0; font-weight: 600;">Share your event page</p>
          <p style="margin: 4px 0 0 0; color: #555; font-size: 14px;">Every event gets a unique URL. Share it with your participants or display the QR code at the venue.</p>
        </div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
        <div style="min-width: 28px; height: 28px; background: #1a1a1a; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; margin-right: 12px;">3</div>
        <div>
          <p style="margin: 0; font-weight: 600;">Watch the magic happen</p>
          <p style="margin: 4px 0 0 0; color: #555; font-size: 14px;">Wonderelo matches participants randomly, guides them to meeting points, and handles the entire networking flow.</p>
        </div>
      </div>
    </div>

    <a href="${dashboardUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Go to my dashboard</a>

    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="margin: 0; font-weight: 600; font-size: 14px;">💡 Pro tip</p>
      <p style="margin: 8px 0 0 0; color: #555; font-size: 14px;">
        Test rounds with up to 10 participants are always free. Create one, invite a few colleagues, and see how it works before your real event.
      </p>
    </div>
${eventPageUrl ? `
    <p style="margin: 24px 0 0 0; color: #888; font-size: 13px;">
      Your event page: <a href="${eventPageUrl}" style="color: #666;">${eventPageUrl}</a>
    </p>
` : ''}
  </div>

  <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">
    Sent by Wonderelo · Networking made simple
  </p>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generate lead magnet (ebook) email HTML
 */
export function buildLeadMagnetEmail(params: {
  name: string;
  ebookUrl: string;
}): { subject: string; html: string } {
  const { name, ebookUrl } = params;

  const subject = 'Your free networking guide from Wonderelo';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 24px; margin: 0 0 8px 0;">Your free guide is here! 📘</h1>
    <p style="color: #666; margin: 0 0 24px 0;">Hi ${name}, thanks for your interest in better event networking.</p>

    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600;">The Ultimate Guide to Event Networking</p>
      <p style="margin: 8px 0 0 0; color: #555; font-size: 14px;">
        Learn how to turn networking from an afterthought into the highlight of your event.
      </p>
    </div>

    <a href="${ebookUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Download Your Guide</a>

    <p style="margin: 24px 0 0 0; color: #666; font-size: 14px;">
      Ready to put these ideas into action? <a href="https://wonderelo.com" style="color: #1a1a1a; font-weight: 500;">Try Wonderelo free</a> and set up your first networking session in minutes.
    </p>
  </div>

  <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">
    Sent by Wonderelo · Networking made simple
  </p>
</body>
</html>`;

  return { subject, html };
}

// ============================================================
// Onboarding email sequence templates
// ============================================================

export function buildOnboardingEmail1_CreateRound(params: {
  firstName: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const { firstName, dashboardUrl } = params;
  const subject = `${firstName}, ready to create your first networking round?`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;"><div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><h1 style="font-size: 24px; margin: 0 0 8px 0;">Time to create your first round!</h1><p style="color: #666; margin: 0 0 24px 0;">Hi ${firstName}, we noticed you haven't created a networking round yet. It only takes 2 minutes!</p><div style="margin-bottom: 24px;"><p style="margin: 0 0 12px 0; font-weight: 600;">Here's how simple it is:</p><ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;"><li>Pick a date and time</li><li>Set the round duration (we recommend 15-20 min)</li><li>Choose how many meeting points you need</li><li>Hit publish - done!</li></ol></div><a href="${dashboardUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Create my first round</a><div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px;"><p style="margin: 0; font-weight: 600; font-size: 14px;">Did you know?</p><p style="margin: 8px 0 0 0; color: #555; font-size: 14px;">Test rounds with up to 10 participants are always free. Try it out with your team!</p></div></div><p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">Sent by Wonderelo</p></body></html>`;
  return { subject, html };
}

export function buildOnboardingEmail2_CustomizeUrl(params: {
  firstName: string;
  dashboardUrl: string;
  currentUrl: string;
}): { subject: string; html: string } {
  const { firstName, dashboardUrl, currentUrl } = params;
  const subject = `${firstName}, make your event page easy to share`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;"><div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><h1 style="font-size: 24px; margin: 0 0 8px 0;">Your event page needs a memorable URL</h1><p style="color: #666; margin: 0 0 24px 0;">Hi ${firstName}, right now your event page is at:</p><div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;"><code style="font-size: 14px; color: #555; word-break: break-all;">${currentUrl}</code></div><p style="margin: 0 0 16px 0;">A custom URL like <strong>wonderelo.com/your-company</strong> is easier for participants to remember and more professional on your materials.</p><a href="${dashboardUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Customize my URL</a></div><p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">Sent by Wonderelo</p></body></html>`;
  return { subject, html };
}

export function buildOnboardingEmail3_PublishRound(params: {
  firstName: string;
  dashboardUrl: string;
  sessionName: string;
}): { subject: string; html: string } {
  const { firstName, dashboardUrl, sessionName } = params;
  const subject = `${firstName}, your round "${sessionName}" is ready to publish!`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;"><div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><h1 style="font-size: 24px; margin: 0 0 8px 0;">Almost there!</h1><p style="color: #666; margin: 0 0 24px 0;">Hi ${firstName}, you created <strong>"${sessionName}"</strong> - now let participants join!</p><div style="margin-bottom: 24px;"><p style="margin: 0 0 12px 0; font-weight: 600;">What happens when you publish:</p><ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;"><li>Your round appears on your event page</li><li>Participants can register via the link or QR code</li><li>You can track registrations in real-time</li></ul></div><a href="${dashboardUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Publish my round</a><p style="margin: 24px 0 0 0; color: #888; font-size: 13px;">You can unpublish anytime if you need to make changes.</p></div><p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">Sent by Wonderelo</p></body></html>`;
  return { subject, html };
}

export function buildOnboardingEmail4_FirstParticipant(params: {
  firstName: string;
  dashboardUrl: string;
  participantName: string;
  sessionName: string;
}): { subject: string; html: string } {
  const { firstName, dashboardUrl, participantName, sessionName } = params;
  const subject = `${firstName}, your first participant just registered!`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; background-color: #f9fafb;"><div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><h1 style="font-size: 24px; margin: 0 0 8px 0;">Your first participant is here!</h1><p style="color: #666; margin: 0 0 24px 0;">Hi ${firstName}, <strong>${participantName}</strong> just registered for <strong>"${sessionName}"</strong>. Your networking event is coming to life!</p><div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;"><p style="margin: 0; font-weight: 600; font-size: 14px;">Tips to get more participants:</p><ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.8;"><li>Share the event page link on social media</li><li>Display the QR code on a screen at your venue</li><li>Add it to your event newsletter</li><li>Download our rollup banner from your dashboard</li></ul></div><a href="${dashboardUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View my dashboard</a></div><p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 24px;">Sent by Wonderelo</p></body></html>`;
  return { subject, html };
}
